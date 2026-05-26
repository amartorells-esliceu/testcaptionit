const pathname = window.location.pathname;
const isLoginPage = pathname === '/' || pathname === '/index.html';
const isCreateJoinPage = pathname.includes('/createOrJoinRoom');
const isConfigureRoomPage = pathname.includes('/configureRoom');
const isRoomPage = pathname.includes('/room') || pathname.includes('espera');
const API_URL = 'http://localhost:3000';

if (isLoginPage) {
    document.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.querySelector('#username').value.trim();
        localStorage.setItem('username', username);
        window.location.replace('/createOrJoinRoom/');
    });
}

if (isCreateJoinPage) {
    document.querySelector('#welcome').textContent = `Hola, ${localStorage.getItem('username')}! Escull una sala per continuar.`;

    document.querySelector('#create-room-btn').addEventListener('click', () => {
        window.location.replace('/configureRoom/');
    });

    document.querySelector('#show-join-btn').addEventListener('click', () => {
        document.querySelector('#join-section').classList.toggle('hidden');
    });

    document.querySelector('#join-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const roomCode = document.querySelector('#room-code').value.trim();
        const rooms = await (await fetch(`${API_URL}/rooms?code=eq.${roomCode}`)).json();
        
        if (rooms.length > 0) {
            const token = Math.random().toString(36).substring(2);
            await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: localStorage.getItem('username'),
                    token: token,
                    is_host: false,
                    room_id: rooms[0].id
                })
            });
            localStorage.setItem('roomCode', roomCode);
            localStorage.setItem('roomId', rooms[0].id);
            window.location.replace(`/room/?code=${roomCode}`);
        }
    });
}

if (isConfigureRoomPage) {
    document.querySelector('#config-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const modality = document.querySelector('#modality').value;
        const numRounds = document.querySelector('#num-rounds').value;
        const maxPlayers = document.querySelector('#max-players').value;
        const roundTime = document.querySelector('#round-time').value;

        const roomCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: roomCode })
        });

        const rooms = await (await fetch(`${API_URL}/rooms?code=eq.${roomCode}`)).json();
        const roomId = rooms[0].id;

        await fetch(`${API_URL}/parties`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                num_rounds: parseInt(numRounds),
                max_players: parseInt(maxPlayers),
                round_time: parseInt(roundTime),
                room_id: roomId,
                modality_id: parseInt(modality)
            })
        });

        const token = Math.random().toString(36).substring(2);
        await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: localStorage.getItem('username'),
                token: token,
                is_host: true,
                room_id: roomId
            })
        });

        localStorage.setItem('roomCode', roomCode);
        localStorage.setItem('roomId', roomId);
        window.location.replace(`/room/?code=${roomCode}`);
    });
}

if (isRoomPage) {
    const roomCode = localStorage.getItem('roomCode');
    document.querySelector('#coderoom').textContent = roomCode;
    
    document.querySelector('#copycoderoom').addEventListener('click', () => {
        navigator.clipboard.writeText(roomCode);
    });

    async function updatePlayerCount() {
        const rooms = await (await fetch(`${API_URL}/rooms?code=eq.${roomCode}`)).json();
        if (!rooms || rooms.length === 0) return;
        const roomId = rooms[0].id;

        const users = await (await fetch(`${API_URL}/users?room_id=eq.${roomId}`)).json();
        const party = await (await fetch(`${API_URL}/parties?room_id=eq.${roomId}`)).json();

        if (party && party.length > 0) {
            document.querySelector('#number-of-players').textContent = `${users.length}/${party[0].max_players}`;
        }

        const playerList = document.querySelector('#player-list');
        playerList.innerHTML = '';

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'bg-white/20 px-4 py-3 rounded-xl text-white font-medium shadow-sm border border-white/10';
            div.textContent = user.username;
            playerList.appendChild(div);
        });
    }

    updatePlayerCount();
    setInterval(updatePlayerCount, 5000);
}