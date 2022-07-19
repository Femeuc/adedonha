// IMPORTS
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const cors = require('cors');
require('dotenv').config()

// #region CORS config
app.use(cors({
    origin: '*'
}));
// #endregion 

// #region Server setup
app.use(express.static(path.join(__dirname, 'client')))
app.get('/', (req, res) => {
    res.render('index.html');
});
server.listen( process.env.PORT || "0.0.0.0" || "localhost", () => {
    console.log('listening on port ' + process.env.PORT);
});  
// #endregion

// Rooms library
const rooms = require('./rooms');

// #region Socket IO library
io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);

    socket.on('SERVER_STATE', callback => {
        callback( get_server_state() );
    });

    socket.on('CREATE_ROOM', (user_obj, callback) => {
        handle_room_creation(socket, user_obj, callback);
    });

    socket.on('ENTER_ROOM', (user_obj, callback) => {
        handle_enter_room(socket, user_obj, callback);
    });

    socket.on('RECONNECT', (user_obj, callback) => {
        handle_enter_room(socket, user_obj, callback);
    });

    socket.on("disconnecting", () => {
        handle_disconnection( socket );
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} has disconnected`);
    });
});
// #endregion

// Server state function
function get_server_state() {
    const state = {
        sockets_connected: get_all_sockets_ids(),
        rooms: rooms.rooms,
    }
    return state.rooms;
}

// #region General functions 
function get_all_sockets_ids() {
    return sockets_ids = Array.from(io.sockets.sockets).map(socket => socket[0]);
}
function handle_disconnection(socket) {
    const room_name = rooms.get_room_name_by_socket_id( socket.id );
    if( !room_name ) { return; }

    rooms.disconnect_user( socket.id );
    io.to(room_name).emit('LEFT_ROOM');
    socket.leave(room_name);
    console.log(`Disconnected ${socket.id} from room ${room_name}`);
}
function handle_room_creation(socket, user_obj, callback) {
    const username = user_obj.username;
    const room_name = user_obj.room_name;
    const user_id = user_obj.user_id;

    if( !(username && room_name && user_id) ) {
        callback(false, `algum campo vazio`);
        return;
    }
    if( rooms.does_exist(room_name) ) {
        callback(false, `${room_name} já existe`);
        return;
    }

    const user = {
        id: socket.id,
        name: username,
        user_id,
        is_host: true,
        is_connected: true
    }

    rooms.create_room_with_user(room_name, user);
    socket.join(room_name);

    const msg = `CREATE_ROOM: user ${user.name} joins room ${room_name} as host`;
    callback(true, msg);
    console.log(msg);
}
function handle_enter_room( socket, user_obj, callback ) {
    const username = user_obj.username;
    const room_name = user_obj.room_name;
    const user_id = user_obj.user_id;

    if( !(username && room_name && user_id) ) {
        callback(false, `algum campo vazio`);
        return;
    }
    if( !rooms.does_exist(room_name) ) {
        callback(false, `${room_name} não existe`);
        return;
    }

    if( !rooms.does_room_have_username(room_name, username) ) {
        const user = {
            id: socket.id,
            name: username,
            user_id,
            is_host: false,
            is_connected: true
        }
        rooms.add_user(room_name, user);
        socket.join(room_name);
        io.to(room_name).emit('ENTER_ROOM');
    
        const msg = `ENTER_ROOM: user ${user.name} enters room ${room_name}`;
        callback(true, msg);
        console.log(msg);
        return;
    }

    // Maybe user lost connection and is trying to reconnect
    if( !rooms.can_user_join_room( user_id, room_name )) {
        callback(false, `${username} não está disponível na sala ${room_name}`);
        return;
    }

    const user = {
        id: socket.id,
        name: username,
        user_id,
        is_host: false,
        is_connected: true
    }

    // reconnects user
    rooms.reconnect_user( user, (did_succeed, msg) => {
        if( !did_succeed ) {
            console.log(msg);
            return;
        }

        socket.join(room_name);
        io.to(room_name).emit('ENTER_ROOM');
        callback(true, msg);
        console.log(msg);
    });
}
// #endregion