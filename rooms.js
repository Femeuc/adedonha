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
            letters: {},
            default: {},
            custom: {}
        },
        history: {}
    }
}
function create_room_with_user( room, user ) {
    create_room(room);
    add_user(room, user);
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
function get_user_by_id( socket_id ) {
    for (const room in rooms) {
        for (let i = 0; i < rooms[room].users.length; i++) {
            if( socket_id == rooms[room].users[i].id ) {
                return rooms[room].users[i];
            }
        }
    }
}
function get_user_by_user_id( user_id ) {
    for (const room in rooms) {
        for (let i = 0; i < rooms[room].users.length; i++) {
            if( user_id == rooms[room].users[i].user_id ) {
                return rooms[room].users[i];
            }
        }
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
    get_user_by_id,
    get_users_from_room,
    get_room_host,
    disconnect_user,
    reconnect_user,
    can_user_join_room
    // #endregion
}