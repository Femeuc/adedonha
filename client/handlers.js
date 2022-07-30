function handle_enter_room(room_obj) {
    document.querySelector('#home_page').style.display = 'none';
    document.querySelector('#main_page').style.display = 'grid';
    update_room(room_obj);
}
function update_room(room_obj) {
    if(room_obj.game_state == 0.5) { load_game_state_0_5(room_obj); }
    if(room_obj.game_state == 1) { load_game_state_1(room_obj); }
    if(room_obj.game_state == 2) { load_game_state_2(room_obj); }
    if(room_obj.game_state == 3) {load_game_state_3(room_obj);}
    update_host(room_obj.users);
    update_left_bar(room_obj.users);
    //update_chat_bar(room_obj.users);
    update_checkboxes(room_obj.checkboxes);
}
function load_game_state_0_5(room_obj) {
    handle_start(room_obj);
}
function load_game_state_1(room_obj) {
    document.querySelector('#preferences').style.display = 'none';
    document.querySelector('#answers').style.display = 'flex';
    const history = room_obj.history[ room_obj.history.length - 1 ];
    handle_chosen_data(history);
}
function load_game_state_2(room_obj) {
    document.querySelector('#preferences').style.display = 'none';
    document.querySelector('#answers').style.display = 'none';
    document.querySelector('#validation').style.display = 'flex';

    const history = room_obj.history[ room_obj.history.length - 1];
    let data = [];
    const answers_obj = history.answers;
    const topics = history.chosen_topics;
    const validated_users = history.validated_users;
    let validations;
    let user_to_be_validated;
    for (let i = 0; i < validated_users.length; i++) {
        if( validated_users[i].validated ) continue;
        validations = validated_users[i].validations;
        user_to_be_validated = validated_users[i].username;
        break;
    }
    for (const user in answers_obj) {
        if(user != user_to_be_validated) continue;

        for (let i = 0; i < topics.length; i++) {
            data.push({
                topic: topics[i],
                answer: answers_obj[user][i],
                checked: validations[i]
            });
        }
        break;
    }


    display_user_to_be_validated_data(user_to_be_validated, data);
}
function load_game_state_3(room_obj) {
    document.querySelector('#preferences').style.display = 'none';
    document.querySelector('#match_summary').style.display = 'block'; 
    handle_match_summary(room_obj);
}

function update_host(users) {
    const host = get_host(users);
    if( localStorage.getItem('user_id') != host.user_id ) {
        document.querySelector('#preferences').style.pointerEvents = 'none';
        document.querySelector('#validation').style.pointerEvents = 'none';
        document.querySelector('#left_sidebar').style.pointerEvents = 'none';
        users.forEach(user => {
            if(!user.is_connected) return;
            if(!user.is_host) {
                //update_chat_bar(`${user.name} está conectado`);
                return;
            }
            //update_chat_bar(`${user.name} está conectado`);
            update_chat_bar(`${user.name} é o HOST`);
        });
        return;
    }
    //update_chat_bar(`${host.name} está conectado`);
    update_chat_bar(`${host.name} é o HOST`);
    const host_only = document.querySelectorAll('.host_only');
    host_only.forEach( e => {
        e.classList.remove("host_only");
    });
    /*document.querySelectorAll('#preferences div').forEach( div => {
        div.style.pointerEvents = 'auto';
    });*/
    document.querySelector('#preferences').style.pointerEvents = 'auto';
    document.querySelector('#validation').style.pointerEvents = 'auto';
    document.querySelector('#left_sidebar').style.pointerEvents = 'auto';
}
function update_left_bar(users) {
    const players_ul = document.querySelector('#left_sidebar ul');
    players_ul.innerHTML = '';

    const users_sorted_by_score = users.sort( function(a, b) {
        return b.score - a.score;
    })

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

    const li = document.createElement('LI');
    li.className = 'chat_message';
    li.innerHTML = message_li;

    ul.appendChild(li);
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
function handle_start(room_obj, delay) {
    document.querySelector('#match_summary').style.display = 'none';
    document.querySelector('#preferences').style.display = 'none';
    document.querySelector('#answers').style.display = 'flex';
    document.querySelector("#answers").style.pointerEvents = 'none';
    start_choosing_letter_animation(room_obj.checkboxes);
    start_choosing_topics_animation(room_obj.checkboxes);
}
function handle_chosen_data(chosen_data) {
    clearInterval(choosing_letter_interval);
    clearInterval(choosing_topics_interval);

    document.querySelector("#answers").style.pointerEvents = 'auto';
    document.querySelector('#answers .chosen_letter').innerText = chosen_data.chosen_letter;
    handle_chosen_topics(chosen_data.chosen_topics);

    const bot_message = `Letra ${chosen_data.chosen_letter} `;
    update_chat_bar(bot_message);
    update_chat_bar(`${chosen_data.chosen_topics.join(' | ')}`);
    animate_time_bar();
}

function handle_chosen_topics(chosen_topics) {
    const topic_fields = document.querySelectorAll('#answers .input-div div');

    for (let i = 0; i < chosen_topics.length; i++) {
        topic_fields[i].innerText = chosen_topics[i];
    }
}

function display_user_to_be_validated_data( username, validation_data, audio = false) {
    const topics = document.querySelectorAll('#validation .input-div>div');
    const inputs = document.querySelectorAll('#validation .input-div>input');
    const checkboxes = document.querySelectorAll('#validation .input-div span');
    document.querySelector('#user_span').innerText = username;

    for (let i = 0; i < validation_data.length; i++) {
        topics[i].innerText = validation_data[i].topic;
        inputs[i].value = validation_data[i].answer;
        inputs[i].readOnly = true;
        validation_data[i].checked ? checkboxes[i].classList.add('input_checked') : checkboxes[i].classList.remove('input_checked');
    }
    if(audio) { play_audio('next'); }
    update_chat_bar(`Validando ${username}`);
}

function handle_users_who_havent_finished_answers() {
    const answer_inputs = document.querySelectorAll('#answers .input-div input');
    const answers = [];
    answer_inputs.forEach(input => {
        answers.push( input.value.trim() );
        input.value = '';
    });
    socket.emit('UNFINISHED_ANSWERS', answers);
}

function handle_validation_change(index, checked) {
    const inputs = document.querySelectorAll('#validation span>input');
    inputs[index].checked = checked;
    checked ? inputs[index].parentNode.classList.add('input_checked') : inputs[index].parentNode.classList.remove('input_checked');
}

function handle_match_summary( room_obj ) {
    document.querySelector('#validation').style.display = 'none';
    document.querySelector('#match_summary').style.display = 'block';
    update_left_bar(room_obj.users)

    const list = document.querySelector('#match_summary ul');
    const summary = room_obj.history[ room_obj.history.length - 1 ].summary;
    summary.sort(function(a, b){return b.total_score - a.total_score});
    list.innerHTML = '';
    summary.forEach( el => {
        list.innerHTML += get_summary_item_html(el);
    });
}