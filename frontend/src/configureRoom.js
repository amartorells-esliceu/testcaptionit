import './input.css';
import { API_URL, fetchJSON, local } from './utils.js';

document.querySelector('#config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    await fetch(`${API_URL}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: roomCode }) });
    const rooms = await fetchJSON(`${API_URL}/rooms?code=eq.${roomCode}`);
    const roomId = rooms[0].id;

    await fetch(`${API_URL}/parties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            num_rounds: parseInt(document.querySelector('#num-rounds').value),
            max_players: parseInt(document.querySelector('#max-players').value),
            round_time: parseInt(document.querySelector('#round-time').value),
            room_id: roomId,
            modality_id: parseInt(document.querySelector('#modality').value)
        })
    });

    const token = Math.random().toString(36).substring(2);
    await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: local.get('username'), token, is_host: true, room_id: roomId })
    });

    local.clearGame();
    local.set('roomCode', roomCode);
    local.set('roomId', roomId);
    local.set('token', token);
    window.location.replace(`/room/?code=${roomCode}`);
});
