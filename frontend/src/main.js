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
        const roomCode = document.querySelector('#room-code').value.trim().toUpperCase();
        const rooms = await (await fetch(`${API_URL}/rooms?code=eq.${roomCode}`)).json();
        
        if (rooms.length > 0) {
            const roomId = rooms[0].id;

            const users = await (await fetch(`${API_URL}/users?room_id=eq.${roomId}`)).json();
            const party = await (await fetch(`${API_URL}/parties?room_id=eq.${roomId}`)).json();

            if (party.length > 0 && users.length >= party[0].max_players) {
                alert('La sala està plena. No hi pots entrant.');
                return;
            }

            const currentUsername = localStorage.getItem('username');
            const isNameTaken = users.some(u => u.username.toLowerCase() === currentUsername.toLowerCase());
            
            if (isNameTaken) {
                alert('Aquest nom d’usuari ja està agafat en aquesta sala. Tria’n un altre.');
                return;
            }

            const token = Math.random().toString(36).substring(2);
            await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: localStorage.getItem('username'),
                    token: token,
                    is_host: false,
                    room_id: roomId
                })
            });
            localStorage.setItem('roomCode', roomCode);
            localStorage.setItem('roomId', roomId);
            window.location.replace(`/room/?code=${roomCode}`);
        } else {
            alert('Aquest codi de sala no existeix. Revisa que estigui ben escrit.');
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

    const leaveBtn = document.querySelector('#leave-room-btn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', async (event) => {
            event.preventDefault(); 
            
            try {
                const rooms = await (await fetch(`${API_URL}/rooms?code=eq.${roomCode}`)).json();
                if (!rooms || rooms.length === 0) {
                    window.location.replace('/createOrJoinRoom/');
                    return;
                }
                const roomId = rooms[0].id;

                const users = await (await fetch(`${API_URL}/users?room_id=eq.${roomId}`)).json();
                const me = users.find(u => u.username === localStorage.getItem('username'));

                if (me) {
                    if (users.length === 1) {
                        await fetch(`${API_URL}/users?id=eq.${me.id}`, { method: 'DELETE' });
                        await fetch(`${API_URL}/parties?room_id=eq.${roomId}`, { method: 'DELETE' });
                        await fetch(`${API_URL}/rooms?id=eq.${roomId}`, { method: 'DELETE' });
                    } 
                    else if (me.is_host) {
                        const nextHost = users.find(u => u.id !== me.id);
                        if (nextHost) {
                            await fetch(`${API_URL}/users?id=eq.${nextHost.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ is_host: true })
                            });
                        }
                        await fetch(`${API_URL}/users?id=eq.${me.id}`, { method: 'DELETE' });
                    } 
                    else {
                        await fetch(`${API_URL}/users?id=eq.${me.id}`, { method: 'DELETE' });
                    }
                }
            } catch (error) {
                console.error("Error al provar d'abandonar la sala:", error);
            }

            localStorage.removeItem('roomCode');
            localStorage.removeItem('roomId');
            window.location.replace('/createOrJoinRoom/');
        });
    }

    async function updatePlayerCount() {
        const rooms = await (await fetch(`${API_URL}/rooms?code=eq.${roomCode}`)).json();
        
        if (!rooms || rooms.length === 0) {
            alert('Aquesta sala ha estat eliminada pel host.');
            localStorage.removeItem('roomCode');
            localStorage.removeItem('roomId');
            window.location.replace('/createOrJoinRoom/');
            return;
        }
        
        const roomId = rooms[0].id;
        const users = await (await fetch(`${API_URL}/users?room_id=eq.${roomId}`)).json();
        const party = await (await fetch(`${API_URL}/parties?room_id=eq.${roomId}`)).json();

        if (party && party.length > 0) {
            document.querySelector('#number-of-players').textContent = `${users.length}/${party[0].max_players}`;
        }

        const me = users.find(u => u.username === localStorage.getItem('username'));
            const playBtn = document.querySelector('#play-game-btn');

        if (me && me.is_host) {
            playBtn.classList.remove('hidden');
        } else {
            playBtn.classList.add('hidden');
        }

        const playerList = document.querySelector('#player-list');
        playerList.innerHTML = '';

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between bg-white/20 px-4 py-3 rounded-xl text-white font-medium shadow-sm border border-white/10';
            
            div.innerHTML = `
                <span>${user.username}</span>
                ${user.is_host ? '<i class="fa-solid fa-crown text-yellow-400 text-lg drop-shadow-[0_2px_4px_rgba(234,179,8,0.3)]"></i>' : ''}
            `;
            
            playerList.appendChild(div);
        });
    }

    updatePlayerCount();

    const eventSource = new EventSource('http://localhost:3001/events');

    eventSource.addEventListener('users', (event) => {
        updatePlayerCount();
    });

    eventSource.addEventListener('start', (event) => {
        let payload;
        try {
            payload = JSON.parse(event.data);
        } catch (err) {
            payload = event.data;
        }

        const targetRoomId = payload && (payload.roomId || (payload.data && payload.data.room_id));
        const targetRoomCode = payload && (payload.roomCode || (payload.data && payload.data.room_code));

        const currentRoomId = localStorage.getItem('roomId');
        const currentRoomCode = localStorage.getItem('roomCode');

        if (String(targetRoomId) === String(currentRoomId) || String(targetRoomCode) === String(currentRoomCode)) {
            window.location.replace(`/round/?code=${currentRoomCode}`);
        }
    });

    eventSource.addEventListener('rooms', (event) => {
        const payload = JSON.parse(event.data);
        if (payload.action === 'DELETE') {
            updatePlayerCount();
        }
    });

    eventSource.onerror = () => {
        console.warn('Connexió SSE perduda. Reconnectant...');
    };
}

if (isRoomPage) {
    const playBtnGlobal = document.querySelector('#play-game-btn');
    if (playBtnGlobal) {
        playBtnGlobal.addEventListener('click', async (e) => {
            e.preventDefault();
            const roomCode = localStorage.getItem('roomCode');
            const roomId = localStorage.getItem('roomId');
            try {
                await fetch('http://localhost:3001/broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'start', data: { roomId: roomId, roomCode: roomCode } })
                });
            } catch (err) {
                console.error('Error broadcasting start event:', err);
            }
        });
    }
}