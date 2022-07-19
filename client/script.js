var socket = io();
let is_connected = false;

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
    });  
});

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
    socket.emit('CREATE_ROOM', user_obj, ( did_succeed, message ) => {
        if(!did_succeed) {
            alert(message);
        }
        localStorage.setItem('username', username);
        localStorage.setItem('room_name', room_name);
        console.log(`did succeed? ${did_succeed} -> ${message}`);
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
    socket.emit('ENTER_ROOM', user_obj, ( did_succeed, message ) => {
        if(!did_succeed) {
            alert(message);
        }
        localStorage.setItem('username', username);
        localStorage.setItem('room_name', room_name);
        console.log(`did succeed? ${did_succeed} -> ${message}`);
    });
}