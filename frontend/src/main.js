const pathname = window.location.pathname;
const isLoginPage = pathname === '/' || pathname === '/index.html';
const isCreateJoinPage = pathname.includes('/createOrJoinRoom');
const isConfigureRoomPage = pathname.includes('/configureRoom');

if (isLoginPage) {
    const form = document.querySelector('form');
    const messageEl = document.querySelector('#message');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = event.target.querySelector('#username').value.trim();

        if (!username) {
            messageEl.textContent = 'Introdueix un nom d\'usuari vàlid.';
            return;
        }

        localStorage.setItem('username', username);
        window.location.replace('/createOrJoinRoom/');
    });
}

if (isCreateJoinPage) {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.replace('/');
    }

    const welcomeEl = document.querySelector('#welcome');
    if (welcomeEl) {
        welcomeEl.textContent = username ? `Hola, ${username}! Escull una sala per continuar.` : '';
    }

    const createRoomBtn = document.querySelector('#create-room-btn');
    const showJoinBtn = document.querySelector('#show-join-btn');
    const joinSection = document.querySelector('#join-section');
    const joinForm = document.querySelector('#join-form');
    const joinMessage = document.querySelector('#join-message');

    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            window.location.replace('/configureRoom/');
        });
    }

    if (showJoinBtn && joinSection) {
        showJoinBtn.addEventListener('click', () => {
            joinSection.classList.toggle('hidden');
        });
    }

    if (joinForm) {
        joinForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const codeInput = document.querySelector('#room-code');
            const roomCode = codeInput?.value.trim();

            if (!roomCode) {
                if (joinMessage) {
                    joinMessage.textContent = 'Introdueix un codi de sala vàlid.';
                }
                return;
            }

            localStorage.setItem('roomCode', roomCode);
            window.location.replace(`/room/?code=${encodeURIComponent(roomCode)}`);
        });
    }
}

if (isConfigureRoomPage) {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.replace('/');
    }

    const API_URL = 'http://localhost:3000';

    function generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    const configForm = document.querySelector('#config-form');
    const messageEl = document.querySelector('#message');

    configForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const modality = document.querySelector('#modality').value;
        const numRounds = parseInt(document.querySelector('#num-rounds').value);
        const maxPlayers = parseInt(document.querySelector('#max-players').value);
        const roundTime = parseInt(document.querySelector('#round-time').value);

        if (!modality || !numRounds || !maxPlayers || !roundTime) {
            messageEl.textContent = 'Completa tots els camps.';
            return;
        }

        try {
            messageEl.textContent = 'Creant sala...';
            
            const roomCode = generateRoomCode();

            const roomResponse = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: roomCode })
            });

            if (!roomResponse.ok) {
                throw new Error('Error creating room');
            }

            let roomId = null;
            const contentType = roomResponse.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const responseText = await roomResponse.text();
                if (responseText) {
                    const room = JSON.parse(responseText);
                    roomId = room[0].id;
                }
            }

            if (!roomId) {
                const roomFetch = await fetch(`${API_URL}/rooms?code=eq.${roomCode}`);
                const rooms = await roomFetch.json();
                roomId = rooms[0].id;
            }

            const partyResponse = await fetch(`${API_URL}/parties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    num_rounds: numRounds,
                    max_players: maxPlayers,
                    round_time: roundTime,
                    room_id: roomId,
                    modality_id: parseInt(modality)
                })
            });

            if (!partyResponse.ok) {
                throw new Error('Error creating party');
            }

            const partyText = await partyResponse.text();
            const party = partyText ? JSON.parse(partyText) : null;
            const partyId = party ? party[0].id : null;
            localStorage.setItem('roomCode', roomCode);
            if (partyId) localStorage.setItem('partyId', partyId);
            localStorage.setItem('roomId', roomId);

            window.location.replace(`/room/?code=${encodeURIComponent(roomCode)}`);
        } catch (error) {
            console.error('Error creating room:', error);
            messageEl.textContent = 'Error al crear la sala. Intenta de nou.';
        }
    });
}
