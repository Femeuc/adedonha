// mobile device rotation
if(screen.availHeight > screen.availWidth){
    alert("Recomendo girar o aparelho para o modo landscape!");
}
window.addEventListener('orientationchange', function(event) {
    if(screen.availHeight > screen.availWidth){
        alert("Recomendo girar o aparelho para o modo landscape!");
    }
});

var socket = io();
let is_connected = false;
let choosing_letter_interval;
let choosing_topics_interval;
let answering_time_interval;

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
        update_chat_message(`<span class="sender">${username}</span>: ${message}`);
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
        play_audio('among_us_venting');
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
        play_audio('among_us_venting');
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
    const max = 13;
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

function deal_with_long_strings(value) {
    let words = value.split(' ');
    let new_words = [];
    words.forEach( word => {
        let w = '';
        if(word.length > 10) {
            for (let i = 0; i < word.length; i++) {
                w += word[i];
                if(i != 0) {
                    if( i % 10 == 0 ) w += '- ';
                }
            }
            new_words.push(w);
        } else {
            for (let i = 0; i < word.length; i++) {
                w += word[i];
            }
            new_words.push(w);
        }
    });
    return new_words.toString().replaceAll(',', ' ');
}

function add_custom_topic() {
    const div = document.querySelector('#custom');
    const input = document.querySelector('#custom_topic');
    if(input.value.length < 1 ) return;
    
    const value = deal_with_long_strings(input.value);
    

    div.innerHTML += `
        <span class="checkbox_container" onclick="toggle_checkbox(this)">
            <span class="checkbox checked"> <input type="checkbox" checked> </span>
            <span>${value}</span>
        </span>
    `;

    const checkbox = {
        name: value, 
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
    localStorage.setItem('answers_stream_mode', '');
}

function submit_answers() {
    const answer_inputs = document.querySelectorAll('#answers .input-div input');
    const answers = [];
    answer_inputs.forEach(input => {
        answers.push( input.value.trim() );
    });
    socket.emit('ANSWERS_SUBMIT', answers, (data, username) => {
        if(typeof(data) == 'string') {
            alert(data);
            return;
        }
        document.querySelector('#answers').style.display = 'none';
        document.querySelector('#validation').style.display = 'flex';
        answer_inputs.forEach(input => { input.value = '';});

        clearInterval(answering_time_interval);
        document.querySelector('#time_bar').style.width = "0%";
        among_us_emergency_animation();
        display_user_to_be_validated_data(username, data);
    });
}

function on_validation_change(index) {
    const input = document.querySelectorAll('#validation span>input')[index];
    input.checked = !input.checked;
    input.checked ? input.parentNode.classList.add('input_checked') : input.parentNode.classList.remove('input_checked');
    socket.emit('VALIDATION_CHANGE', index, input.checked, msg => {
        if(msg) {
            alert(msg);
            input.checked = !input.checked;
            input.checked ? input.parentNode.classList.add('input_checked') : input.parentNode.classList.remove('input_checked');
        }
    });
}

function validate_next() {
    socket.emit('VALIDATE_NEXT', (did_succeed, result) => {
        if(!did_succeed) {
            alert(result);
            return;
        }
        if(result) {
            display_user_to_be_validated_data(result[0], result[1], true);
            return;
        }
        socket.emit('MATCH_SUMMARY', error => {
            console.log(error);
        });
    });
}
function choose_new_match_preferences() {
    document.querySelector('#match_summary').style.display = 'none';
    document.querySelector('#preferences').style.display = 'flex';
}

function toggle_li_summary_display(li) {
    const block = li.lastElementChild;
    if(block.style.display == 'none') {
        block.style.display = 'grid';
        return;
    }
    block.style.display = 'none';
}

function on_player_clicked(player_name) {
    if( localStorage.getItem('username') == player_name ) {
        console.log('Host clicando em si mesmo');
        return;
    }
    const div = document.createElement('DIV');
    div.innerHTML = `
        <button onclick="kick_player_out('${player_name}')">
            Expulsar ${player_name}
        </button>
        <button onclick="give_host_to('${player_name}')">
            Dar host a ${player_name}
        </button>
        <button onclick="remove_player_click_div()">
            Cancelar
        </button>
    `;
    div.id = 'player_click';
    document.body.appendChild(div);
}
function remove_player_click_div() {
    document.body.removeChild(document.querySelector('#player_click'));
}
function kick_player_out(player_name) {
    socket.emit('KICK_PLAYER_OUT', player_name, msg => {
        console.log(msg);
    });
    
    const players_spans = document.querySelectorAll('.player>div>span');
    players_spans.forEach(element => {
        if(element.innerText == player_name) {
            const players = document.querySelector('#left_sidebar ul');
            const player = element.parentElement.parentElement;
            players.removeChild(player);
        }
    });
    remove_player_click_div();
}
function give_host_to(player_name) {
    socket.emit('GIVE_HOST', player_name, msg => {
        console.log(msg);
    });
    remove_player_click_div();
}

const streamer_mode = function() {
    let is_active = false;
    const divs = document.querySelectorAll('#answers .input-div div');
    const inputs = document.querySelectorAll('#answers .input-div input');
    return function(type) {
        if(type == 'is_active') return is_active;
        if(type == 'switch') {
            is_active = !is_active;
            document.querySelector('#streamer_mode').checked = is_active;
            if(is_active) {
                hide_characters();
                update_local_storage();
                window.open('test.html', '_blank', 'popup');
                return;
            }
            show_characters();
            return;
        }
        if(type == 'update') {
            update_local_storage();
        }
    };

    function hide_characters() {
        inputs.forEach( input => {
            input.type = 'password';
        });
    }
    function show_characters() {
        inputs.forEach( input => {
            input.type = 'text';
        });
    }
    function update_local_storage() {
        const fields = [];
        for (let i = 0; i < divs.length; i++) {
            fields.push({
                topic: divs[i].innerText,
                answer: inputs[i].value
            })
        }
        localStorage.setItem('answers_stream_mode', JSON.stringify(fields));
    }
  }();

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
function among_us_emergency_animation() {
    play_audio('among_us_emergency');
    const section = document.querySelector('#validation');
    section.innerHTML += `
        <img src="./images/among_us_emergency.gif" 
            alt="Among us Emergency" style="
            aspect-ratio: 16/9;
            width: 50%;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);"
        />
    `;
    setTimeout(function() {
        section.removeChild(section.lastElementChild);
    }, 2000);
}
function animate_time_bar(time = 0) {
    const time_bar = document.querySelector('#time_bar');
    let width = 0;
    answering_time_interval = setInterval(() => {
        time_bar.style.width = `${width}%`;
        width += 1.25;
        if(width > 100) {
            clearInterval(answering_time_interval);
            time_bar.style.width = "0%";
        }
    }, 1000);
}
/* #endregion */

/* #region Audio */
var play_audio = function() {
    var lastTime = new Date();
    return function(file_name) {
      var now = new Date();
      if ((now - lastTime) < 2000) return;
      lastTime = now; 
  
      /* do stuff */
      const audio = new Audio(`./audio/${file_name}.mp3`);
      audio.play();
    };
  }();
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
    let html_string = `<div class="player" onclick="on_player_clicked(this.querySelector('span').innerText)" style="cursor:pointer;`;
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
          <div>${users[i].score}_pts.</div>
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

function get_summary_item_html( item ) {
    let html_string = `
        <li onclick="toggle_li_summary_display(this)">
            <span style="
                    position: absolute;
                    right: 10px;
                    top: 0;
                    font-size: 22px;
                    font-weight: bold;
                   ">
                +
            </span>
            <div style="
                    background: #36935b;
                    padding: 5px;
                    border-radius: 5px;
                    cursor: pointer;
                    word-spacing: 5px;
                  ">
                ${item.username} (${item.total_score}pts.)
            </div>
            <div class="player_info" style="display: none">`;
            item.answers.forEach(answer => {
                html_string += `
                    <div>${answer.topic}: <span>${answer.answer}</span> </div>
                    <div> Pontos: ${answer.score}</div>  
                    <div> Motivo: "${answer.reason}"</div>
                `;
            });
            html_string +=`
            </div>
        </li>`;
    return html_string;
}
// #endregion 