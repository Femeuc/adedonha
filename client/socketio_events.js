socket.on('ENTER_ROOM', (msg, room_obj, username) => {
    console.log(msg, room_obj, username);
    update_left_bar(room_obj.users);
    update_chat_bar(`${username} está conectado`);
})

socket.on('LEFT_ROOM', (user, room_obj) => {
    console.log(`LEFT_ROOM: user ${user.name} has left`);
    update_host(room_obj.users);
    update_chat_on_left_room(user.name, room_obj.users);
    update_left_bar(room_obj.users);
    update_chat_bar(`${user.name} desconectou-se`);;
});

socket.on('CHECKBOX_CHANGE', checkboxes => {
    update_checkboxes(checkboxes);
    console.log('CHECKBOX_CHANGE');
});

socket.on('NEW_CHECKBOX', checkboxes => {
    update_checkboxes(checkboxes);
    console.log('NEW_CHECKBOX');
});

socket.on('CHAT_MESSAGE', message_li => {
    update_chat_message(message_li);
});

socket.on('START', (delay) => {
    handle_start();
    console.log(`START: waiting ${delay / 1000} seconds for chosen letter`);
});

socket.on('CHOSEN_LETTER', chosen_letter => {
    handle_chosen_letter(chosen_letter);
});