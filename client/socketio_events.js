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

socket.on('START', (room_obj, delay) => {
    handle_start(room_obj, delay);
    console.log(`START: waiting ${delay / 1000} seconds for chosen letter`);
});

socket.on('CHOSEN_DATA', chosen_data => {
    handle_chosen_data(chosen_data);
});

socket.on('ANSWERS_SUBMIT', (username, validation_data) => {
    handle_users_who_havent_finished_answers();
    update_chat_bar(`<b>${username}</b> já terminou!`);
    document.querySelector('#answers').style.display = 'none';
    document.querySelector('#validation').style.display = 'flex';
    display_user_to_be_validated_data(username, validation_data);
});

socket.on('VALIDATION_CHANGE', (index, checked) => {
    handle_validation_change(index, checked);
});

socket.on('VALIDATE_NEXT', (username, validation_data) => {
    display_user_to_be_validated_data(username, validation_data);
});

socket.on('MATCH_SUMMARY', (room_obj) => {
    handle_match_summary(room_obj);
})