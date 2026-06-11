import './input.css';
import { API_URL, fetchJSON, local, getSSEConnection, abandonarSala, startGame } from './utils.js';

const roomCode = local.get('roomCode');
document.querySelector('#coderoom').textContent = roomCode;
document.querySelector('#copycoderoom').addEventListener('click', () => navigator.clipboard.writeText(roomCode));

const leaveBtn = document.querySelector('#leave-room-btn');
if (leaveBtn) leaveBtn.addEventListener('click', abandonarSala);

async function updatePlayerCount() {
    const rooms = await fetchJSON(`${API_URL}/rooms?code=eq.${roomCode}`);
    if (rooms.length === 0) {
        alert('Aquesta sala ha estat eliminada.');
        local.clearAll();
        window.location.replace('/createOrJoinRoom/');
        return;
    }

    const roomId = rooms[0].id;
    const users = await fetchJSON(`${API_URL}/users?room_id=eq.${roomId}`);
    const party = await fetchJSON(`${API_URL}/parties?room_id=eq.${roomId}`);

    if (party.length > 0) document.querySelector('#number-of-players').textContent = `${users.length}/${party[0].max_players}`;

    const me = users.find(u => u.token === local.get('token'));
    const playBtn = document.querySelector('#play-game-btn');
    if (playBtn) {
        playBtn.classList.toggle('hidden', !(me && me.is_host));
        playBtn.style.display = me && me.is_host ? '' : 'none';
    }

    document.getElementById('player-list').innerHTML = users.map(u => `
        <div class="flex items-center justify-between bg-white/20 px-4 py-3 rounded-xl text-white font-medium shadow-sm border border-white/10">
            <span>${u.username}</span>
            ${u.is_host ? '<i class="fa-solid fa-crown text-yellow-400 text-lg"></i>' : ''}
        </div>
    `).join('');
}

updatePlayerCount();

const eventSource = getSSEConnection();
eventSource.addEventListener('users', updatePlayerCount);
eventSource.addEventListener('rooms', (e) => { if (JSON.parse(e.data).action === 'DELETE') updatePlayerCount(); });
eventSource.addEventListener('start', (e) => {
    const payload = JSON.parse(e.data);
    const tRoomId = payload.roomId || payload.data?.room_id;
    if (String(tRoomId) === String(local.get('roomId'))) window.location.replace(`/round/?code=${roomCode}`);
});

const playBtnGlobal = document.querySelector('#play-game-btn');
if (playBtnGlobal) {
    playBtnGlobal.addEventListener('click', startGame);
}
