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

    socket.on('CHECKBOX_CHANGE', (checkbox, room_name, callback) => {
        handle_checkbox_change(socket, checkbox, room_name, callback);
    });

    socket.on('NEW_CHECKBOX', (checkbox, room_name, callback) => {
        handle_new_checkbox(socket, checkbox, room_name, callback);
    });

    socket.on('CHAT_MESSAGE', (username, message, callback) => {
        handle_chat_message( socket, username, message, callback );
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

    const user = rooms.get_user_by_socket_id_in_room( socket.id, room_name );
    rooms.disconnect_user( socket.id );
    io.to(room_name).emit('LEFT_ROOM', user, rooms.get_room_by_name(room_name));
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

    const room_obj = rooms.create_room_with_user(room_name, user);
    socket.join(room_name);

    const msg = `CREATE_ROOM: user ${user.name} joins room ${room_name} as host`;
    callback(true, msg, room_obj);
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

        const msg = `ENTER_ROOM: user ${user.name} enters room ${room_name}`;
        const room = rooms.get_room_by_name(room_name);
        socket.to(room_name).emit('ENTER_ROOM', msg, room, username);
        callback(true, msg, room);
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
            callback(false, msg);
            console.log(msg);
            return;
        }

        socket.join(room_name);
        const room = rooms.get_room_by_name(room_name);
        socket.to(room_name).emit('ENTER_ROOM', msg, room, username);
        callback(true, msg, room);
        console.log(msg);
    });
}
function handle_checkbox_change( socket, checkbox, room_name, callback ) {
    const host = rooms.get_room_host(room_name);
    if(host.id != socket.id) {
        callback(`checkbox_change FAIL: only the host has permission`);
        return;
    }

    rooms.change_checkbox( checkbox, room_name, (did_succeed, msg) => {
        if( !did_succeed ) {
            callback(msg);
            return;
        }
        socket.to(room_name).emit('CHECKBOX_CHANGE', rooms.get_room_checkboxes(room_name) );
        callback(msg);
    });
}
function handle_new_checkbox( socket, checkbox, room_name, callback ) {
    const host = rooms.get_room_host(room_name);
    const checkboxes = rooms.get_room_checkboxes( rooms.get_room_name_by_socket_id(socket.id) );
    if(!host) {
        if(!checkboxes) {
            callback(`new_checkbox FAIL: room not found`);
            return;
        }
        callback(`new_checkbox FAIL: room not found`, checkboxes);
        return;
    }
    if(host.id != socket.id) {
        if(!checkboxes) {
            callback(`new_checkbox FAIL: only the host has permission`);
            return;
        }
        callback(`new_checkbox FAIL: only the host has permission`, checkboxes);
        return;
    }
    if(!checkboxes) {
        callback(`new_checkbox FAIL: make sure you are in the right room and that you are the host`);
        return;
    }

    rooms.create_checkbox( checkbox, room_name, (did_succeed, msg) => {
        if( !did_succeed ) {
            callback(msg, checkboxes);
            return;
        }
        socket.to(room_name).emit('NEW_CHECKBOX', checkboxes );
        callback(msg);
        console.log(msg);
    });
}
function handle_chat_message( socket, username, message, callback ) {
    const room_name = rooms.get_room_name_by_socket_id( socket.id );
    const message_li = rooms.get_message_li(
        username, 
        message, 
        room_name, 
        (did_succeed, msg) => {
            if( !did_succeed ) {
                callback(msg);   
                return;
            }
    });
    if(!message_li) return;
    socket.to(room_name).emit('CHAT_MESSAGE', message_li);
    const msg = `CHAT MESSAGE: ${message_li}`;
    callback(msg);
    console.log(msg);
}
// #endregion