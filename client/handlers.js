function handle_enter_room(room_obj) {
    document.querySelector('#home_page').style.display = 'none';
    document.querySelector('#main_page').style.display = 'grid';
    update_room(room_obj);
}
function update_room(room_obj) {
    update_host(room_obj.users);
    update_left_bar(room_obj.users);
    //update_chat_bar(room_obj.users);
    update_checkboxes(room_obj.checkboxes);
}
function update_host(users) {
    const host = get_host(users);
    if( localStorage.getItem('user_id') != host.user_id ) {
        document.querySelector('#preferences').style.pointerEvents = 'none';
        users.forEach(user => {
            if(!user.is_connected) return;
            if(!user.is_host) {
                update_chat_bar(`${user.name} está conectado`);
                return;
            }
            update_chat_bar(`${user.name} está conectado`);
            update_chat_bar(`${user.name} é o HOST`);
        });
        return;
    }
    update_chat_bar(`${host.name} está conectado`);
    update_chat_bar(`${host.name} é o HOST`);
    const host_only = document.querySelectorAll('.host_only');
    host_only.forEach( e => {
        e.classList.remove("host_only");
    });
    document.querySelector('#preferences').style.pointerEvents = 'auto';
}
function update_left_bar(users) {
    const players_ul = document.querySelector('#left_sidebar ul');
    players_ul.innerHTML = '';

    for (let i = 0; i < users.length; i++) {
        if( !users[i].is_connected ) continue;
        players_ul.innerHTML += get_player_element(i, users);
    }
}
function update_chat_bar(message) {
    const chat_ul = document.querySelector('#right_sidebar ul');
    const bot_name = "<span class='sender'>Ad_Bot</span>";
    update_chat_message(`<li class="bot">${bot_name}: ${message}</li>`);
}
function update_chat_message(message_li) {
    const ul = document.querySelector('ul#chat');
    ul.innerHTML += message_li;
    ul.scrollTo(0,ul.scrollHeight);
}
function update_checkboxes(checkboxes) {
    const default_c = document.querySelector('#default');
    const custom = document.querySelector('#custom');
    const letters = document.querySelector('#letters');
    default_c.innerHTML = '';
    custom.innerHTML = '';
    letters.innerHTML = '';

    for (const item in checkboxes['letters']) {
        letters.innerHTML += get_checkbox_span_html(item, checkboxes['letters']);
    }
    for (const item in checkboxes['default']) {
        default_c.innerHTML += get_checkbox_span_html(item, checkboxes['default']);
    }
    for (const item in checkboxes['custom']) {
        custom.innerHTML += get_checkbox_span_html(item, checkboxes['custom']);
    }
}
function update_chat_on_left_room( username, users ) {
    const host = get_host(users);
    if( username != host.username ) return;
    update_chat_bar(`${host.name} é o novo HOST`);
}