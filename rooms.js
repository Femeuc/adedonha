// VARIABLE
structure_and_room_test = [
    /*structure_____________: {
         Structure
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
} 
},
room_test_____________: {
    users: [
        {
            id: '0',
            name: 'femeuc',
            user_id: 0,
            is_host: true,
            is_connected: true
        },
        {
            id: '1',
            name: 'cibitto',
            user_id: 1,
            is_host: false,
            is_connected: true
        },
        {
            id: '2',
            name: 'brave',
            user_id: 2,
            is_host: false,
            is_connected: true
        },
        {
            id: '3',
            name: 'fox',
            user_id: 3,
            is_host: false,
            is_connected: false
        },
    ],
    history: [
        {
            chosen_letter: 'A',
            chosen_topics: ['topic1', 'topic2', 'topic3'],
            answers: {
                femeuc: ['answer1', 'answer2', 'answer3'],
                cibitto: ['answ1', 'answ2', 'answe'],
                brave: ['answer1', 'answer2', 'answer3']
            }, 
            validated_users: [
                {
                    validated: true,
                    username: 'femeuc',
                    validations: [true, true, true]
                },
                {
                    validated: true,
                    username: 'cibitto',
                    validations: [true, true, true]
                },
                {
                    validated: true,
                    username: 'brave',
                    validations: [true, true, true]
                }
            ]
        }
    ]
}*/
];
const rooms = {}

// #region Rooms functions
function create_room( name ) {
    if( rooms.hasOwnProperty(name) ) { console.log(`create_room(${name}) says "room name already in use"`); return; }
    rooms[name] = {
        users: [],
        game_state: 0,
        checkboxes: {
            letters: { 
                A: true, B: true, C: true, D: true, E: true, 
                F: true, G: true, H: false, I: true, J: true, 
                K: false, L: true, M: true, N: true, O: true, 
                P: true, Q: false, R: true, S: true, T: true, 
                U: true, V: true, X: false, W: false, Y: false, Z: false },
            default: { 
                "Minha sogra é": true, Alimento: true, 
                Animal: true, CEP: true, 
                'FVL': true,
                'Nome de Pessoa': true,  Objeto: true,
                'Profissão': true
            },
            custom:  { 
                Abstrato: true, Cor: false, 
                Carro: false, "Doeança ou Sintoma": true, 
                "Disciplina": false, "Esporte": false,
                "Famosos": true, "FSDA": true,
                "Líquido": true, Marca: false, 
                "Objeto > 5m": false, "Objeto < 50cm": false,
                "Pal. em inglês": true, "Pal. em espanhol": true,
                "PCH": true, "Personagem": true,
                'Rima com ÃO': false, 'Rima com ADE': true, "Rima com ENTE": true,
                'Rima com EZA': false, "Tem no supermercado": true, 
                "Tem na escola": true,'Time de futebol': false, 
                "Transporte": true, Verbo: true 
            }
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
        is_connected: user.is_connected,
        score: user.score,
        was_banned: user.was_banned
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
    if(!get_room_by_name(room)) {// room does not exist, prevent bugs
        return false;
    }
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
function ban_user(room_name, username) {
    const user = get_user_by_username_in_room(username, room_name);
    if(!user) {
        console.log(`user not found`);
        return;
    }
    user.was_banned = true;
}
function reconnect_user( user_obj, callback ) {
    const user = get_user_by_user_id( user_obj.user_id ); 
    if(!user) {
        callback(false, `Nome de usuário indisponível`);
        return;
    }
    if(user.name != user_obj.name) {
        callback( false, `Utilize o nome antigo "${user.name}" para poder se reconectar`);
        return;
    }

    user.is_connected = true;
    user.id = user_obj.id;
    callback( true, `user ${user_obj.name} has reconnected`);
}
// #endregion

// #region checkboxes functions
function get_room_checkboxes( room_name ) {
    const room = rooms[room_name];
    if(room) {
        return room.checkboxes;
    }
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
    if(!checkboxes) {
        callback(false, `Não foi possível obter as checkboxes da sala. Certifique-se de estar conectado a uma sala.`);
        return;
    }

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
        break;
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
    return `<span class="sender">${username}</span>: ${message}`;
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
        const topic_repetition_permission_probability = 0; // percentage
        const allow_repeat = Math.random() < topic_repetition_permission_probability;
        const random_int = Math.floor( Math.random() * both.length );
        const random_topic = both[random_int];

        if( chosen_topics.includes(random_topic) && !allow_repeat ) {
            chosen_topics.push(both[ Math.floor( Math.random() * both.length ) ]);
            continue;
        }
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
    history.validated_users.forEach(element => {
        if(username == element.username ) {
            element.validated = state;
        }
    });
}
function get_current_username_being_validated(room_name) {
    const history = rooms[room_name].history[ rooms[room_name].history.length - 1];
    for (let i = 0; i < history.validated_users.length; i++) {
        if(!history.validated_users[i].validated ) {
            return history.validated_users[i].username;
        }
    }
}
function get_validations_initial_state(room_name, answers) {
    const length = rooms[room_name].history.length;

    const chosen_letter = rooms[room_name].history[length-1].chosen_letter;
    const validations = [];

    answers.forEach(answer => {
        validations.push( answer.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()[0] == chosen_letter && answer.length > 1 );
    });
    return validations;
}
function set_game_state(room_name, state) {
    rooms[room_name].game_state = state;
}
function get_match_summary(room_name) {
    const users = get_users_from_room(room_name);
    const summary = [];
    const array = [];

    const topics = get_match_chosen_topics(room_name);
    users.forEach(user => {
        if(user.is_connected) {
            let answers = get_user_answers(room_name, user.name);
            let validations = get_user_validations(room_name, user.name);
            if(!answers) { answers = ['', '', '', '', '', '', '', '', '']; }
            if(!validations) { validations = [false, false, false, false, false, false, false, false, false]}
            array.push({
                username: user.name,
                answers,
                validations
            });
        }
    });

    // summary generation
    for (let i = 0; i < array.length; i++) {
        let user_info = {};
        let answers_info = [];
        let total_score = 0;
        for (let j = 0; j < array[i].answers.length; j++) {
            let score = 0;
            let reason = '';
            let decrements = 0;
            const answer = array[i].answers[j];

            let answer_info = {};

            if( array[i].validations[j] ) {
                score = 10;
                reason = 'resposta única';

                for (let k = 0; k < array.length; k++) {
                    if( k == i ) continue;

                    if( array[k].answers[j].toLowerCase() == answer.toLowerCase() ) {
                        if( decrements < 10 ) { decrements++; }
                        reason = `respostas repetidas: ${decrements}`;
                    }
                }
            } else {
                score = 0;
                reason = 'resposta anulada';
            }

            answer_info.topic = topics[j],
            answer_info.answer = answer;
            answer_info.score = score - decrements;
            answer_info.reason = reason;
            answer_info.decrements = decrements;
            total_score += answer_info.score;

            answers_info.push(answer_info);
        }

        user_info.username = array[i].username;
        user_info.total_score = total_score;
        user_info.answers = answers_info;
        summary.push(user_info);
    }
    return summary;
}
function add_match_summary(room_name, match_summary) {
    const history = rooms[room_name].history[ rooms[room_name].history.length - 1 ];
    history.summary = match_summary;
}
function get_user_answers(room_name, username) {
    const history = rooms[room_name].history[ rooms[room_name].history.length - 1 ];
    return history.answers[username];
}
function get_user_validations(room_name, username) {
    const history = rooms[room_name].history[ rooms[room_name].history.length - 1 ];
    for (let i = 0; i < history.validated_users.length; i++) {
        if(history.validated_users[i].username == username) {
            return history.validated_users[i].validations;
        }
    }
}
function get_match_chosen_topics(room_name) {
    const history = rooms[room_name].history[ rooms[room_name].history.length - 1 ];
    return history.chosen_topics;
}
function update_users_scores(room_name, match_summary) {
    const users = get_users_from_room(room_name);
    
    users.forEach( user => {
        match_summary.forEach( item => {
            if(item.username == user.name) {
                let score = 0;
                item.answers.forEach( answr => {
                    score += answr.score;
                });
                user.score += score;
            }
        });
    });
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
    get_user_by_username_in_room,
    get_user_by_id,
    get_users_from_room,
    get_room_host,
    disconnect_user,
    reconnect_user,
    ban_user,
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
    set_user_validation_state,
    get_current_username_being_validated,
    set_game_state,
    get_match_summary,
    add_match_summary,
    update_users_scores
    //#endregion
}