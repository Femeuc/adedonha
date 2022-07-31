socket.on('ENTER_ROOM', (msg, room_obj, username) => {
    console.log(msg, room_obj, username);
    update_left_bar(room_obj.users);
    update_chat_bar(`${username} está conectado`);
    play_audio('among_us_venting');
})

socket.on('LEFT_ROOM', (user, room_obj) => {
    console.log(`LEFT_ROOM: user ${user.name} has left`);
    play_audio('among_us_kill');
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
    play_audio('discord_notification');
});

socket.on('START', (room_obj, delay) => {
    handle_start(room_obj, delay);
    play_audio('Roda_roda');

    console.log(`START: waiting ${delay / 1000} seconds for chosen letter`);
});

socket.on('CHOSEN_DATA', chosen_data => {
    handle_chosen_data(chosen_data);
});

socket.on('TIME_IS_UP', () => {
    handle_users_who_havent_finished_answers();
});

socket.on('UNFINISHED_ANSWERS', (username, validation_data) => {
    clearInterval(answering_time_interval);
    document.querySelector('#time_bar').style.width = "0%";
    update_chat_bar(`TEMPO ESGOTADO!!!`);
    document.querySelector('#answers').style.display = 'none';
    document.querySelector('#validation').style.display = 'flex';
    among_us_emergency_animation();
    display_user_to_be_validated_data(username, validation_data);
});

socket.on('ANSWERS_SUBMIT', (username, validation_data) => {
    handle_users_who_havent_finished_answers();
    update_chat_bar(`<b>${username}</b> já terminou!`);
    document.querySelector('#answers').style.display = 'none';
    document.querySelector('#validation').style.display = 'flex';
    among_us_emergency_animation();
    clearInterval(answering_time_interval);
    document.querySelector('#time_bar').style.width = "0%";
    display_user_to_be_validated_data(username, validation_data);
});

socket.on('VALIDATION_CHANGE', (index, checked) => {
    handle_validation_change(index, checked);
});

socket.on('VALIDATE_NEXT', (username, validation_data) => {
    display_user_to_be_validated_data(username, validation_data, true);
});

socket.on('MATCH_SUMMARY', (room_obj) => {
    play_audio('among_us_start');
    handle_match_summary(room_obj);
})

socket.on('PLAYER_BANNED', () => {
    alert('Você foi expulso!');
    window.location.reload();
})

socket.on('PLAYER_BAN', (player_name, room_obj) => {
    play_audio(`among_us_kill`);
    update_left_bar(room_obj.users);
    update_chat_bar(`<b>${player_name}</b> foi expulso!`);
})

socket.on('GIVE_HOST', (new_host_name, room_obj) => {
    console.log(`HOST CHANGE: ${new_host_name} is the new host`);
    play_audio(`discord_notification`);
    update_host(room_obj.users);
    update_left_bar(room_obj.users);
});