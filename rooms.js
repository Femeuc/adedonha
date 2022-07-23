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
        history: [
            {
                chosen_letter: 'A',
                chosen_topics: [],
                answers: {
                    user: [],
                    user2: []
                }, 
                validated_users: [
                    {
                        validated: false,
                        username,
                        validations: get_validations_initial_state(room_name, answers)
                    }
                ]
            }
        ]
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
            custom:  { 'Time de futebol': true, 'Rima com ÃO': true, 'Rima com ADE': true, 'Rima com EZA': true, Cor: false }
        },
        history: []
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
function does_room_have_user_id( room, user_id ) {
    const users = get_users_from_room( room );

    for (let i = 0; i < users.length; i++) {
        if( users[i].user_id == user_id) {
            return true;
        }
    }
    return false;
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
function does_room_have_user_id_connected( room, user_id ) {
    const users = get_users_from_room( room );

    for (let i = 0; i < users.length; i++) {
        if(!users[i].is_connected) continue;
        if( users[i].user_id == user_id ) {
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
        callback(false, `checkbox_change FAIL: name of checkbox is not valid`);
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
function get_validation_state(room_name) {
    const length = rooms[room_name].history.length;
    const validated_users = rooms[room_name].history[length - 1].validated_users;

    for (let i = 0; i < validated_users.length; i++) {
        if( validated_users[i].validated ) continue;
        return validated_users[i].validations;
    }
}
function change_validation_state( room_name, index, checked ) {
    const length = rooms[room_name].history.length;
    const validated_users = rooms[room_name].history[length - 1].validated_users;

    let validations;
    for (let i = 0; i < validated_users.length; i++) {
        if( validated_users[i].validated ) continue;

        validated_users[i].validations[index] = checked;
        validations = validated_users[i].validations;
    }
    return validations;
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

    if(!chosen_letter) {
        callback(false, `Escolha pelo menos uma letra`);
        return;
    }
    callback(true, `"START SUCCESS: random letter already chosen`);

    return chosen_letter;
}
function choose_random_topics(room_name, callback) {
    const checkboxes = rooms[room_name].checkboxes;
    const deflt = [];
    const custom = [];

    if(!checkboxes) {
        callback(false, `Did not find checkboxes for room ${room_name}`);
        return;
    }

    for (const topic in checkboxes.default) { 
        if(!checkboxes.default[topic]) continue;
        deflt.push(topic); 
    }
    for (const topic in checkboxes.custom) { 
        if(!checkboxes.custom[topic]) continue;
        custom.push(topic); 
    }

    const both = deflt.concat(custom);
    if(both.length < 1) {
        callback(false, `Escolha pelo menos 1 assunto`);
        return;
    }

    const chosen_topics = [];

    for (let i = 0; i < 9; i++) {    
        const random_int = Math.floor( Math.random() * both.length );
        chosen_topics.push(both[random_int]);
    }
    
    callback(true, `chosen topics ${chosen_topics}`);
    return chosen_topics;
}
function get_history_last_item_chosen_topics(room_name) {
    const length = rooms[room_name].history.length;
    return rooms[room_name].history[length-1].chosen_topics;  
}
function get_history_last_item_answers_obj(room_name) {
    const length = rooms[room_name].history.length;
    return rooms[room_name].history[length-1].answers;
}
function get_history_last_item_validated_users_array(room_name) {
    const length = rooms[room_name].history.length;
    return rooms[room_name].history[length-1].validated_users;
}
function get_history_last_item_validated_users_list(room_name) {
    const users_array = get_history_last_item_validated_users_array(room_name);
    const users_list = [];
    users_array.forEach(user => {
        if(user.validated) {
            users_list.push(user.username);
        }
    });
    return users_list;
}
function get_history_last_item_validation_data(room_name) {
    const data = [];
    const validation_data = [];
    const answers_obj = get_history_last_item_answers_obj(room_name);
    const topics = get_history_last_item_chosen_topics(room_name);
    const validated_users = get_history_last_item_validated_users_list(room_name);
    const validations = get_validation_state(room_name);

    for (const user in answers_obj) {
        if(!validated_users.includes(user)) {
            for (let i = 0; i < topics.length; i++) {
                data.push({
                    topic: topics[i],
                    answer: answers_obj[user][i],
                    checked: validations[i]
                });
            }
            set_user_validation_state(room_name, user, true);
            validation_data.push(user);
            validation_data.push(data);
            return validation_data;
        }
    }
    return false;
}
function add_to_history( room_name, history ) {
    const length = rooms[room_name].history.push(history);
    return rooms[room_name].history[ length - 1 ];
}
function add_user_answers_to_history( room_name, username, answers) {
    const length = rooms[room_name].history.length;
    rooms[room_name].history[ length - 1 ].answers[username] = answers;

    set_validation_initial_state(room_name, username, answers);
}
function set_validation_initial_state(room_name, username, answers) {
    const length = rooms[room_name].history.length;
    rooms[room_name].history[ length - 1 ].validated_users.push({
        validated: false,
        username,
        validations: get_validations_initial_state(room_name, answers)
    });
}
function set_user_validation_state(room_name, username, state) {
    const history = rooms[room_name].history[ rooms[room_name].history.length - 1];
    
    for (let i = 0; i < history.validated_users.length; i++) {
        if(username == history.validated_users[i].username ) {
            history.validated_users[i].validated = state;
        }
    }
    history.validated_users.forEach(element => {
        if(username == element.username ) {
            element.validated = state;
        }
    });
}
function get_validations_initial_state(room_name, answers) {
    const length = rooms[room_name].history.length;

    const chosen_letter = rooms[room_name].history[length-1].chosen_letter;
    const validations = [];

    answers.forEach(answer => {
        validations.push( answer.toUpperCase()[0] == chosen_letter && answer.length > 1 );
    });
    return validations;
}
function set_game_state(room_name, state) {
    rooms[room_name].game_state = state;
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
    does_room_have_user_id,
    does_room_have_username,
    does_room_have_user_id_connected,
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
    // #endregion

    // #region Checkboxes functions
    change_checkbox,
    get_room_checkboxes,
    create_checkbox,
    change_validation_state,
    // #endregion

    // #region Chat functions
    get_message_li,
    //#endregion

    // #region Game functions
    choose_random_letter,
    choose_random_topics,
    get_history_last_item_answers_obj,
    get_history_last_item_validated_users_array,
    get_history_last_item_validated_users_list,
    get_history_last_item_validation_data,
    add_to_history,
    add_user_answers_to_history,
    set_game_state
    //#endregion
}