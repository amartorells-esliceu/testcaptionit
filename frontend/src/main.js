const pathname = window.location.pathname;
const isLoginPage = pathname === '/' || pathname === '/index.html';
const isCreateJoinPage = pathname.includes('/createOrJoinRoom');

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
