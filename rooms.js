// VARIABLE
const rooms = {
    /* Structure
    room1: {
        users: [
            {
                id: '123',
                name: 'femeuc',
                user_id: 500,
                is_host: true,
                is_connected: true
            }
        ],
        game_state: 0,
        checkboxes: {
            letters: {A: true, B: true, etc.},
            default: {Animal: true, CEP: true, etc.},
            custom: {jogo: false, rimas: true, etc...}
        }
        history: {}
    } */
}

// #region Rooms functions
function create_room( name ) {
    if( rooms.hasOwnProperty(name) ) { console.log(`create_room(${name}) says "room name already in use"`); return; }
    rooms[name] = {
        users: [],
        game_state: 0,
        checkboxes: {
            letters: { A: true, B: true, C: true, D: true, E: true, F: true, G: true, H: false, I: true, J: true, K: false, L: true, M: true, N: true, O: true, P: true, Q: false, R: true, S: true, T: true, U: true, V: true, X: false, W: false, Y: false, Z: false },
            default: { Animal: true, Fruta: true, Nome: true, FVL: true, CEP: true, Objeto: true },
            custom:  { Time_futebol: true, Rima_com_ÃO: true, Rima_com_ADE: true, Rima_com_EZA: true, Cor: false }
        },
        history: {}
    }
    return rooms[name];
}
function create_room_with_user( room, user ) {
    const room_obj = create_room(room);
    add_user(room, user);
    return room_obj;
}
function get_room_by_name( name ) {
    return rooms[name];
}
function get_room_name_by_socket_id( id ) {
    for (const room in rooms) {
        for (let i = 0; i < rooms[room].users.length; i++) {
            if( id == rooms[room].users[i].id ) {
                return room;
            }
        }
    }
}
function get_room_by_socket_id( id ) {
    for (const room in rooms) {
        for (let i = 0; i < rooms[room].users.length; i++) {
            if( id == rooms[room].users[i].id ) {
                return rooms[room];
            }
        }
    }
}
function does_exist( name ) {
    return Boolean(get_room_by_name(name));
}
function does_room_have_username( room, username ) {
    const users = get_users_from_room( room );

    for (let i = 0; i < users.length; i++) {
        if( users[i].name == username) {
            return true;
        }
    }
    return false;
}
function destroy_room( name ) {
    delete rooms[name];
}
// #endregion

// #region Users functions
function add_user( room, user ) {
    if( !rooms.hasOwnProperty(room) ) { console.log(`add_user(${room}, user) says "can't add user to inexistent room"`); return; }
    rooms[room]['users'].push({
        id: user.id,
        name: user.name,
        user_id: user.user_id,
        is_host: !Boolean( get_room_host(room) ),
        is_connected: user.is_connected
    });
}
function get_user_by_socket_id_in_room( socket_id, room_name ) {
    for (let i = 0; i < rooms[room_name].users.length; i++) {
        if( socket_id == rooms[room_name].users[i].id ) {
            return rooms[room_name].users[i];
        }
    }
}
function get_user_by_user_id_in_room( user_id, room_name ) {
    for (let i = 0; i < rooms[room_name].users.length; i++) {
        if( user_id == rooms[room_name].users[i].user_id ) {
            return rooms[room_name].users[i];
        }
    }
}
function get_user_by_username_in_room( username, room_name ) {
    for (let i = 0; i < rooms[room_name].users.length; i++) {
        if( username == rooms[room_name].users[i].name ) {
            return rooms[room_name].users[i];
        }
    }
}
function get_user_by_id( socket_id ) {
    for (const room in rooms) {
        const user = get_user_by_socket_id_in_room( socket_id, room );
        if(user) return user;
    }
}
function get_user_by_user_id( user_id ) {
    for (const room in rooms) {
        const user = get_user_by_user_id_in_room( user_id, room );
        if(user) return user;
    }
}
function get_users_from_room( room ) {
    return rooms[room].users;
}
function get_room_host( room ) {
    const users = get_users_from_room( room );
    for (let i = 0; i < users.length; i++) {
        if(users[i].is_host) {
            return users[i];
        }
    }
}
function set_new_host( room_name ) {
    const room = get_room_by_name( room_name );
    for (let i = 0; i < room.users.length; i++) {
        if( room.users[i].is_connected ) {
            room.users[i].is_host = true;
            return room;
        }
    }
}
function disconnect_user( id ) {
    const user = get_user_by_id( id );
    user.is_connected = false;
    if( !user.is_host ) return;
    user.is_host = false;
    const room_name = get_room_name_by_socket_id( id );
    if( !set_new_host( room_name ) ) { // nobody is connected in the room
        destroy_room( room_name );
    }    
}
function reconnect_user( user_obj, callback ) {
    const user = get_user_by_user_id( user_obj.user_id );

    if(user.name != user_obj.name) {
        callback( false, `user ${user_obj.name} must use the same name in order to reconnect`);
        return;
    }

    user.is_connected = true;
    user.id = user_obj.id;
    callback( true, `user ${user_obj.name} has reconnected`);
}
function can_user_join_room( user_id, room ) {
    const users = get_users_from_room( room );
    for (let i = 0; i < users.length; i++) {
        if( users[i].user_id == user_id) {
            return true;
        }
    }
    return false;
}
// #endregion

// #region checkboxes functions
function get_room_checkboxes( room_name ) {
    return rooms[room_name].checkboxes; 
}
function change_checkbox( checkbox, room_name, callback ) {
    const type = checkbox.type;
    const name = checkbox.name;
    const checked = Boolean(checkbox.checked);

    if( !['letters', 'default', 'custom'].includes( type ) ) {
        callback(false, `checkbox_change FAIL: type must be "letters" or "default" or "custom"`);
        return;
    }
    if(!name) {
        callback(false, `checkbox_change FAIL: name of checkbox not specified`);
        return;
    }

    const checkboxes = get_room_checkboxes(room_name);
    checkboxes[type][name] = checked;
    callback(true, `CHECKBOX_CHANGE: "${name}" is ${checked} in room ${room_name}`);
}
function create_checkbox( checkbox, room_name, callback ) {
    const type = checkbox.type;
    const name = checkbox.name;
    const checked = Boolean(checkbox.checked);

    if(name.length < 0) {
        callback(false, `new_checkbox FAIL: name of checkbox not specified`);
        return;
    }

    const checkboxes = get_room_checkboxes(room_name);
    checkboxes[type][name] = checked;
    callback(true, `NEW_CHECKBOX: "${name}" is ${checked} in room ${room_name}`);
}
// #endregion

// #region Chat functions 
function get_message_li( username, message, room_name, callback ) {
    const user = get_user_by_username_in_room( username, room_name );
    if(!user) {
        callback(false, `chat_message FAIL: User ${username} not found`);
        return;
    }
    return `<li> <span class="sender">${username}</span>: ${message}</li>`;
}
// #endregion

// #region Game functions
function choose_random_letter(room_name, callback) {
    const letters_list = [];
    const letters = rooms[room_name].checkboxes.letters;
    if(!letters) {
        callback(false, `Could not found letters for room ${room_name}`);
        return;
    }

    for (const letter in letters) {
        if(letters[letter]) {
            letters_list.push(letter);
        }
    }
    const random_int = Math.floor(Math.random() * letters_list.length);
    const chosen_letter = letters_list[random_int];

    const checkbox = {
        type: 'letters',
        name: chosen_letter,
        checked: false
    }
    change_checkbox( checkbox, room_name, (did_succeed, msg) => {
        if(!did_succeed) {
            callback(false, '213432432432143243214324');
            return;
        }
        console.log(`SUCCESS: choose_random_letter() to change_checkbox() -> ${msg}`);
    });
    callback(true, `"START SUCCESS: random letter already chosen`);
    return chosen_letter;
}
//

module.exports = { 
    // VARIABLE
    rooms, 
    
    // #region Rooms functions
    create_room,
    create_room_with_user,
    get_room_by_name,
    get_room_name_by_socket_id,
    does_exist,
    does_room_have_username,
    get_room_by_socket_id,
    destroy_room,
    // #endregion

    // #region Users functions
    add_user,
    get_user_by_socket_id_in_room,
    get_user_by_user_id_in_room,
    get_user_by_id,
    get_users_from_room,
    get_room_host,
    disconnect_user,
    reconnect_user,
    can_user_join_room,
    // #endregion

    // #region Checkboxes functions
    change_checkbox,
    get_room_checkboxes,
    create_checkbox,
    // #endregion

    // #region Chat functions
    get_message_li,
    //#endregion

    // #region Game functions
    choose_random_letter
    //#endregion
}