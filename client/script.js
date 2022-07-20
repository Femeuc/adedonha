var socket = io();
let is_connected = false;
let choosing_letter_interval;
let choosing_topics_interval;

socket.on('connect', () => {
    if(!is_connected) {
        is_connected = true;
        if( !localStorage.getItem('user_id') ) {
            localStorage.setItem('user_id', socket.id);
        }
        localStorage.setItem('room_name', '');
        return;
    }

    const user_obj = {
        username: localStorage.getItem('username'),
        room_name: localStorage.getItem('room_name'),
        user_id: localStorage.getItem('user_id')
    }
    socket.emit('RECONNECT', user_obj, (did_succeed, msg) => {
        if(!did_succeed) {
            alert(`Falha ao reconectar, tente voltar na mesma sala com o mesmo nome para recuperar seu progresso`);
            window.location.reload();
            return;
        }
        console.log(msg);
        document.body.style.pointerEvents = 'auto';
        hide_reconnection_UI();
    });  
});

socket.on('connect_error', (error) => {
    console.log(`connect_error: ${error}`);
    document.body.style.pointerEvents = 'none';
    display_trying_to_reconnect_UI();
})

on_page_load();
function on_page_load() {
    const username = localStorage.getItem('username');
    const room_name = localStorage.getItem('room_name');
    if(username) {
        document.querySelector('#username_input').value = username;
    }
    if(room_name) {
        document.querySelector('#room_name_input').value = room_name;
    }
}

// On chat message
document.querySelector("#send_message").addEventListener("keydown", function(event) {
    //let ul_chat = document.querySelector('ul#chat');
    if(event.target.value.length < 1) return;
    if (event.key === "Enter") {
        const message = event.target.value.trim();
        const username = localStorage.getItem('username');
        update_chat_message(`<li><span class="sender">${username}</span>: ${message}</li>`);
        console.log(`MESSAGE SENT: ${message}`);
        socket.emit('CHAT_MESSAGE', username, message, msg => {
            console.log(msg);
        });
        event.target.value = '';
    }
});

function get_server_state() {
    socket.emit('SERVER_STATE', state => {
        console.log(state);
    });
}

function create_room() {
    const inputs = document.querySelectorAll("#enter_room input");
    const username = inputs[0].value.toLowerCase();
    const room_name = inputs[1].value.toLowerCase();
    if( !(username && room_name) ) {
        alert('Você deixou algum campo vazio');
        return;
    }
    const user_obj = {
        username,
        room_name,
        user_id: localStorage.getItem('user_id')
    }
    socket.emit('CREATE_ROOM', user_obj, ( did_succeed, message, room_obj ) => {
        if(!did_succeed) {
            alert(message);
            return;
        }
        localStorage.setItem('username', username);
        localStorage.setItem('room_name', room_name);
        console.log(`did succeed? ${did_succeed} -> ${message}`);
        handle_enter_room(room_obj);
    });
}

function enter_room() {
    const inputs = document.querySelectorAll("#enter_room input");
    const username = inputs[0].value;
    const room_name = inputs[1].value;
    if( !(username && room_name) ) {
        alert('Você deixou algum campo vazio');
        return;
    }
    const user_obj = {
        username,
        room_name,
        user_id: localStorage.getItem('user_id')
    }
    socket.emit('ENTER_ROOM', user_obj, ( did_succeed, message, room_obj ) => {
        if(!did_succeed) {
            alert(message);
            return;
        }
        localStorage.setItem('username', username);
        localStorage.setItem('room_name', room_name);
        handle_enter_room(room_obj);
        console.log(`did succeed? ${did_succeed} -> ${message}`);
    });
}

function get_host( users ) {
    for (let i = 0; i < users.length; i++) {
        if( users[i].is_host ) {
            return users[i];
        }
    }
}

function get_random_avatar_name() {
    const max = 11;
    const min = 0;
    const n = Math.floor(Math.random() * (max + 1)) + min;
    return `among_${ n }.PNG`;
}

function toggle_checkbox( span ) {
    const input_span = span.querySelectorAll('span')[0];
    const name = span.querySelectorAll('span')[1];
    const input = input_span.querySelector('input');
    const type = span.parentNode.id;
    console.log(input_span, name, input, type);
    input_span.classList.toggle("checked");
    input.checked = input_span.classList.contains("checked");
    socket.emit('CHECKBOX_CHANGE', {
        name: name.innerText, 
        checked: input.checked, 
        type: type
    }, localStorage.getItem('room_name'), msg => {
        console.log(`CHECKBOX_CHANGE: ${name.innerText} is ${input.checked}`);
    });
}

function add_custom_topic() {
    const div = document.querySelector('#custom');
    const input = document.querySelector('#custom_topic');
    if(input.value.length < 1 ) return;
    div.innerHTML += `
        <span class="checkbox_container" onclick="toggle_checkbox(this)">
            <span class="checkbox checked"> <input type="checkbox" checked> </span>
            <span>${input.value}</span>
        </span>
    `;

    const checkbox = {
        name: input.value, 
        checked: true, 
        type: 'custom'
    }
    const room_name = localStorage.getItem('room_name');

    socket.emit('NEW_CHECKBOX', checkbox, room_name, (msg, checkboxes) => {
        console.log(msg);
        if(checkboxes) {
            update_checkboxes(checkboxes);
        }
    });
    input.value = '';
}

function start() {
    socket.emit('START', msg => {
        alert(msg);
    });
}

function submit_answers() {
    const answer_inputs = document.querySelectorAll('#answers .input-div input');
    const answers = [];
    answer_inputs.forEach(input => {
        answers.push( input.value );
        input.value = '';
    });
    socket.emit('ANSWERS_SUBMIT', msg => {
        alert(msg);
    });
}

/* #region Animations */
function start_choosing_letter_animation(checkboxes) {
    const letter_span = document.querySelector('#answers .chosen_letter');
    const letters = [];
    for (const letter in checkboxes.letters) {
        if(!checkboxes.letters[letter]) continue;
        letters.push(letter);
    }

    choosing_letter_interval = setInterval(function () {
        const random_int = Math.floor( Math.random() * letters.length );
        letter_span.innerText = letters[random_int];
    }, 50);
}
function start_choosing_topics_animation(checkboxes) {
    const deflt = [];
    const custom = [];

    for (const topic in checkboxes.default) { 
        if(!checkboxes.default[topic]) continue;
        deflt.push(topic); 
    }
    for (const topic in checkboxes.custom) { 
        if(!checkboxes.custom[topic]) continue;
        custom.push(topic); 
    }

    const both = deflt.concat(custom);
    const topic_fields = document.querySelectorAll('#answers .input-div div');

    choosing_topics_interval = setInterval(function () {
        topic_fields.forEach( field => {
            const random_int = Math.floor( Math.random() * both.length );
            field.innerText = both[random_int];
        });  
    }, 50);
}
/* #endregion */

/* #region HTML by javascript */
function display_trying_to_reconnect_UI() {
    if( document.querySelector('#reconnection') ) {
        return;
    }
    const reconnection_div = get_reconnection_html();
    document.body.insertBefore(reconnection_div, document.body.firstChild);
}

function get_reconnection_html() {
    const div = document.createElement('DIV');
    //#region DIV styling 
    div.id = 'reconnection';
    div.style.position = 'absolute';
    div.style.zIndex = 2;
    div.style.width = 'fit-content';
    div.style.margin = '0px auto';
    div.style.right = '0';
    div.style.left = '0';
    div.style.top = '0';
    div.style.padding = '10px 32px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.borderRadius = '100px';
    div.style.marginTop = '1em';
    div.style.backgroundColor = 'var(--Outline)';
    div.innerHTML = `
        <div class="loader" style="
                                border: 5px solid #7babb2;
                                border-top: 5px solid #ffffff;
                                border-radius: 50%;
                                width: 30px;
                                height: 30px;
                                animation: spin 1s linear infinite;
                                margin-right: 5px;">
        </div>
        <div style="margin-left: 5px; font-size: 22px;">
            Reconectando...
        </div>
    `
    //#endregion
    return div;
}
function hide_reconnection_UI() {
    const div = document.querySelector('#reconnection');
    if(!div) {
        return;
    }   
    div.style.display = 'none';
}

function get_player_element( i, users ) {
    const user_id = localStorage.getItem('user_id');
    let html_string = '<div class="player" style="';
    if( user_id == users[i].user_id ) {
        html_string += `box-shadow: 0px 0px 5px 5px #0e593e;`;
    } 
    html_string += `">`;
    if( users[i].is_host ) {
        html_string += `<div style="
            background-image: url(./images/crown.png);
            aspect-ratio: 1 / 1;  
            width: 30px;
            background-size: contain;
            position: absolute;
            top: -7px;
            left: -7px;
            z-index: 2;
        "></div>`;
    }
    html_string += `
        <img src="./images/${get_random_avatar_name()}" alt="">
        <div>
          <div>0pts.</div>
         <span>${users[i].name}</span>
        </div>
    </div>`;
    return html_string;
}
function get_checkbox_span_html(name, checkboxes) {
    let checked = '';
    if (checkboxes[name]) {
        checked = 'checked';
    }

    return `
    <span class="checkbox_container" onclick="toggle_checkbox(this)">
        <span class="checkbox ${checked}"> <input type="checkbox" ${checked}> </span>
        <span>${name}</span>
    </span>`;
}
// #endregion 