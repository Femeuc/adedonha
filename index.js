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
const answer_time = {};

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

    socket.on('START', (callback) => {
        handle_start(socket, callback);
    });

    socket.on('ANSWERS_SUBMIT', (answers, callback) => {
        handle_answers_submit(socket, answers, callback);
    });

    socket.on('UNFINISHED_ANSWERS', (answers) => {
        handle_unfinished_answers(socket, answers);
    })

    socket.on('VALIDATION_CHANGE', (index, checked, callback) => {
        handle_validation_change(socket, index, checked, callback);
    });

    socket.on('VALIDATE_NEXT', callback => {
        handle_validate_next(socket, callback);
    });

    socket.on('MATCH_SUMMARY', callback => {
        handle_match_summary(socket, callback);
    })

    socket.on('KICK_PLAYER_OUT', (player_name, callback) => {
        handle_kick_player_out(socket, player_name, callback);
    });

    socket.on('GIVE_HOST', (player_name, callback) => {
        handle_give_host(socket, player_name, callback);
    })

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
    console.log(state.rooms.a);
    return state;
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
    const room_name = user_obj.room_name.toLowerCase();
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
        is_connected: true,
        score: 0,
        was_banned: false
    }

    const room_obj = rooms.create_room_with_user(room_name, user);
    socket.join(room_name);

    const msg = `CREATE_ROOM: user ${user.name} joins room ${room_name} as host`;
    callback(true, msg, room_obj);
    console.log(msg);
}
function handle_enter_room( socket, user_obj, callback ) {
    const username = user_obj.username;
    const room_name = user_obj.room_name.toLowerCase();
    const user_id = user_obj.user_id;

    if( !(username && room_name && user_id) ) {
        callback(false, `algum campo vazio`);
        return;
    }
    if( !rooms.does_exist(room_name) ) {
        callback(false, `${room_name} não existe`);
        return;
    }

    if(rooms.does_room_have_user_id_connected(room_name, user_id)) {
        callback(false, `Você já está conectado em outra aba`);
        return;
    }

    if( !rooms.does_room_have_username(room_name, username) ) {
        if(rooms.does_room_have_user_id(room_name, user_id)) {
            callback(false, `Você precisa utilizar o mesmo nome para reconectar`);
            return;
        }

        const user = {
            id: socket.id,
            name: username,
            user_id,
            is_host: false,
            is_connected: true,
            score: 0,
            was_banned: false
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

    //reconnection
    const user = {
        id: socket.id,
        name: username,
        user_id,
        is_host: false,
        is_connected: true
    }

    const player = rooms.get_user_by_user_id_in_room(user_id, room_name);
    if(!player) {
        callback(false, "Nome de usuário indisponível!");
        return;
    }

    if(player.was_banned) {
        callback(false, `Você foi banido dessa sala`);
        return;
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
    if(!host) {
        callback(`Não foi possível, tente de novo!`);
    }
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
    if( !rooms.get_user_by_socket_id_in_room(socket.id, room_name).is_connected ) {
        callback(`Você precisa entrar em uma sala para poder mandar mensagens`);
        return;
    }
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
function handle_start(socket, callback, delay = 4000, time = 80000) {
    const room_name = rooms.get_room_name_by_socket_id( socket.id );
    if(!room_name) {
        callback(`User must be in the room in order to start game`);
        return;
    }

    const chosen_letter = rooms.choose_random_letter(room_name, (did_succeed, msg) => {
        if(!did_succeed) {
            callback(msg);
            return;
        }
        console.log(msg);
    });
    if(!chosen_letter) {
        callback(`You need to choose at least one letter`);
        return;
    }

    const chosen_topics = rooms.choose_random_topics(room_name, (did_succeed, msg) => {
        if(!did_succeed) {
            callback(msg);
            return;
        }
        console.log(msg);
    });
    if(!chosen_topics) {
        callback(`You need to choose at least one topic`);
        return;
    }

    const history = { 
        chosen_letter, 
        chosen_topics, 
        answers: {}, 
        validated_users: []
    };
    const chosen_data = rooms.add_to_history(room_name, history);

    io.to(room_name).emit('START', rooms.get_room_by_name(room_name), delay);
    rooms.set_game_state(room_name, 0.5); // random data animation
    setTimeout(() => {  
        const checkbox = {
            type: 'letters',
            name: chosen_letter,
            checked: false
        }
        rooms.change_checkbox( checkbox, room_name, (did_succeed, msg) => {
            if(!did_succeed) {
                callback(false, msg);
                return;
            }
            console.log(`chosen letter ${chosen_letter} set to false`);

            rooms.set_game_state(room_name, 1);
            io.to(room_name).emit('CHOSEN_DATA', chosen_data);
            answer_time[room_name] = setTimeout(() => {
                io.to(room_name).emit('TIME_IS_UP',);
            }, time)
        });
    }, delay);
}
function handle_answers_submit(socket, answers, callback) {
    const room_name = rooms.get_room_name_by_socket_id( socket.id );
    if(!room_name) {
        callback(`User must be in the room`);
        return;
    }
    const user = rooms.get_user_by_socket_id_in_room( socket.id, room_name );
    if(!user) {
        callback(`user não encontrado`);
        return;
    }

    for (let i = 0; i < answers.length; i++) {
        if(answers[i].length < 1) {
            callback(`Nenhum campo pode ficar vazio`);
            return;
        }
    }
    clearTimeout(answer_time[room_name]);
    answer_time[room_name] = -1;
    rooms.add_user_answers_to_history(room_name, user.name, answers);
    const validation_data = rooms.get_history_last_item_validation_data(room_name);
    rooms.set_game_state(room_name, 2);
    socket.to(room_name).emit('ANSWERS_SUBMIT', validation_data[0], validation_data[1]);
    callback(validation_data[1], validation_data[0]);
    console.log(`user ${user.name} has stopped`);
}

function handle_unfinished_answers(socket, answers) {
    const room_name = rooms.get_room_name_by_socket_id(socket.id);
    const username = rooms.get_user_by_id(socket.id).name;
    if(!room_name) { console.log(`Precisa estar em uma sala.`); return; }
    if(!username) { console.log('precisa ter um nome'); return; }

    rooms.add_user_answers_to_history(room_name, username, answers);
    if(answer_time[room_name] != -1) {
        const validation_data = rooms.get_history_last_item_validation_data(room_name);
        rooms.set_game_state(room_name, 2);
        io.to(room_name).emit('UNFINISHED_ANSWERS', validation_data[0], validation_data[1]);
        answer_time[room_name] = -1;
    }
}

function handle_validation_change(socket, index, checked, callback) {
    const room_name = rooms.get_room_name_by_socket_id(socket.id);
    if(!room_name) { callback(`Precisa estar em uma sala.`); return; }

    const host = rooms.get_room_host(room_name);
    if(host.id != socket.id) { callback(`only the host has permission`); return; }

    const validations = rooms.change_validation_state(room_name, index, checked);
    if(!validations) { callback('Validações não encontradas.'); return; }

    socket.to(room_name).emit('VALIDATION_CHANGE', index, checked);
}
function handle_validate_next(socket, callback) {
    const room_name = rooms.get_room_name_by_socket_id(socket.id);
    if(!room_name) { callback(false, `Precisa estar em uma sala.`); return; }

    const host = rooms.get_room_host(room_name);
    if(host.id != socket.id) { callback(false, `only the host has permission`); return; }

    const current_username = rooms.get_current_username_being_validated(room_name);
    rooms.set_user_validation_state(room_name, current_username, true);

    const validation_data =  rooms.get_history_last_item_validation_data(room_name);
    if(!validation_data) { // all users were validated
        callback(true, false);
        return;
    }

    const user = rooms.get_user_by_socket_id_in_room(socket.id, room_name);
    socket.to(room_name).emit('VALIDATE_NEXT', validation_data[0], validation_data[1]);
    callback(true, validation_data);
    console.log(`VALIDATE_NEXT: "${user.name}"`);
}
function handle_match_summary(socket, callback) {
    const room_name = rooms.get_room_name_by_socket_id(socket.id);
    if(!room_name) { callback(`Precisa estar em uma sala.`); return; }

    const host = rooms.get_room_host(room_name);
    if(host.id != socket.id) { callback(`only the host has permission`); return; }

    const match_summary = rooms.get_match_summary(room_name);
    rooms.add_match_summary(room_name, match_summary);
    rooms.update_users_scores(room_name, match_summary);
    rooms.set_game_state(room_name, 3);
    io.to(room_name).emit('MATCH_SUMMARY', rooms.get_room_by_name(room_name) );
}
function handle_kick_player_out(socket, player_name, callback) {
    const room_name = rooms.get_room_name_by_socket_id( socket.id );
    if( !room_name ) { callback(`Você precisa estar em uma sala`) }

    const host = rooms.get_room_host(room_name);
    if(host.id != socket.id) { callback(`only the host has permission`); return; }

    const player = rooms.get_user_by_username_in_room(player_name, room_name);
    rooms.disconnect_user(player.id);
    rooms.ban_user(room_name, player_name);
    io.sockets.sockets.get(player.id).leave(room_name);
    io.to(player.id).emit('PLAYER_BANNED');
    io.to(room_name).emit('PLAYER_BAN', player_name, rooms.get_room_by_name(room_name));
    console.log(`Disconnected ${player.id} from room ${room_name}`);
}

function handle_give_host(socket, player_name, callback) {
    const room_name = rooms.get_room_name_by_socket_id( socket.id );
    if( !room_name ) { callback(`Você precisa estar em uma sala`); return; }

    const host = rooms.get_room_host(room_name);
    if(host.id != socket.id) { callback(`only the host has permission`); return; }

    const new_host = rooms.get_user_by_username_in_room(player_name, room_name);
    new_host.is_host = true;
    rooms.get_user_by_socket_id_in_room(socket.id, room_name).is_host = false;

    io.to(room_name).emit('GIVE_HOST', player_name, rooms.get_room_by_name(room_name));
}
// #endregion