export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const SSE_BASE_URL = import.meta.env.VITE_SSE_URL 
    ? import.meta.env.VITE_SSE_URL.replace('/events', '') 
    : 'http://localhost:3001';
export const SSE_URL = `${SSE_BASE_URL}/events`;

let sseConnection = null;

export const fetchJSON = async (url, options) => await (await fetch(url, options)).json();

export const local = {
    get: (key) => localStorage.getItem(key),
    set: (key, val) => localStorage.setItem(key, val),
    clearGame: () => ['currentRound', 'currentRoundId', 'totalRounds', 'currentPartyId', 'myUserId'].forEach(k => localStorage.removeItem(k)),
    clearAll: () => ['roomCode', 'roomId', 'token'].forEach(k => localStorage.removeItem(k))
};

export function getSSEConnection() {
    if (!sseConnection || sseConnection.readyState === EventSource.CLOSED) {
        sseConnection = new EventSource(SSE_URL);
        sseConnection.onopen = () => console.log('SSE connected');
        sseConnection.onerror = () => console.warn('SSE error');
    }
    return sseConnection;
}

export async function assegurarMyUserId() {
    let myId = parseInt(local.get('myUserId'), 10);
    if (!myId || Number.isNaN(myId)) {
        const token = local.get('token');
        if (token) {
            const users = await fetchJSON(`${API_URL}/users?token=eq.${token}`);
            if (users[0]) {
                myId = users[0].id;
                local.set('myUserId', myId);
            }
        }
    }
    return myId;
}

export async function abandonarSala() {
    const roomId = local.get('roomId');
    try {
        const users = await fetchJSON(`${API_URL}/users?room_id=eq.${roomId}`);
        const me = users.find(u => u.token === local.get('token'));

        if (me) {
            if (users.length === 1) {
                await fetch(`${API_URL}/users?id=eq.${me.id}`, { method: 'DELETE' });
                await fetch(`${API_URL}/parties?room_id=eq.${roomId}`, { method: 'DELETE' });
                await fetch(`${API_URL}/rooms?id=eq.${roomId}`, { method: 'DELETE' });
            } else {
                if (me.is_host) {
                    const nextHost = users.find(u => u.id !== me.id);
                    if (nextHost) await fetch(`${API_URL}/users?id=eq.${nextHost.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_host: true }) });
                }
                await fetch(`${API_URL}/users?id=eq.${me.id}`, { method: 'DELETE' });
            }
        }
    } catch (e) { console.error("Error abandonant:", e); }
    local.clearAll();
    window.location.replace('/createOrJoinRoom/');
}

export async function startGame() {
    local.clearGame();
    const roomCode = local.get('roomCode');
    await fetch(`${SSE_BASE_URL}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'start', data: { roomId: local.get('roomId'), roomCode } })
    });
}