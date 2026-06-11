import './input.css';
import { API_URL, fetchJSON, local } from './utils.js';

document.querySelector('#welcome').textContent = `Hola, ${local.get('username')}! Escull una sala per continuar.`;
document.querySelector('#create-room-btn').addEventListener('click', () => window.location.replace('/configureRoom/'));
document.querySelector('#show-join-btn').addEventListener('click', () => document.querySelector('#join-section').classList.toggle('hidden'));

document.querySelector('#join-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomCode = document.querySelector('#room-code').value.trim().toUpperCase();
    const rooms = await fetchJSON(`${API_URL}/rooms?code=eq.${roomCode}`);

    if (rooms.length === 0) return alert('Aquest codi de sala no existeix.');
    const roomId = rooms[0].id;

    const users = await fetchJSON(`${API_URL}/users?room_id=eq.${roomId}`);
    const party = await fetchJSON(`${API_URL}/parties?room_id=eq.${roomId}`);

    if (party.length > 0 && users.length >= party[0].max_players) return alert('La sala està plena.');
    if (users.some(u => u.username.toLowerCase() === local.get('username').toLowerCase())) return alert('Nom d’usuari ja agafat.');

    const token = Math.random().toString(36).substring(2);
    await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: local.get('username'), token, is_host: false, room_id: roomId })
    });

    local.clearGame();
    local.set('roomCode', roomCode);
    local.set('roomId', roomId);
    local.set('token', token);
    window.location.replace(`/room/?code=${roomCode}`);
});
