const API_URL = 'http://localhost:3000';
const SSE_URL = 'http://localhost:3001/events';
let sseConnection = null;

const fetchJSON = async (url, options) => await (await fetch(url, options)).json();
const local = {
    get: (key) => localStorage.getItem(key),
    set: (key, val) => localStorage.setItem(key, val),
    clearGame: () => ['currentRound', 'currentRoundId', 'totalRounds', 'currentPartyId', 'myUserId'].forEach(k => localStorage.removeItem(k)),
    clearAll: () => ['roomCode', 'roomId', 'token'].forEach(k => localStorage.removeItem(k))
};

function getSSEConnection() {
    if (!sseConnection || sseConnection.readyState === EventSource.CLOSED) {
        sseConnection = new EventSource(SSE_URL);
        sseConnection.onopen = () => console.log('SSE connected');
        sseConnection.onerror = () => console.warn('SSE error');
    }
    return sseConnection;
}

async function assegurarMyUserId() {
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

async function abandonarSala() {
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

const path = window.location.pathname;

async function startGame() {
    local.clearGame();
    const roomCode = local.get('roomCode');
    await fetch('http://localhost:3001/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'start', data: { roomId: local.get('roomId'), roomCode } })
    });
}

if (path === '/' || path === '/index.html') {
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        local.set('username', document.querySelector('#username').value.trim());
        window.location.replace('/createOrJoinRoom/');
    });
}

if (path.includes('/createOrJoinRoom')) {
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
}

if (path.includes('/configureRoom')) {
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
}

if (path.includes('/room')) {
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
}

if (path.includes('/round')) {
    let currentRound = parseInt(local.get('currentRound')) || 1;
    let totalRounds, roundTime, currentPartyId, currentRoundId, myUserId, myAnswer = null;

    async function start() {
        myUserId = await assegurarMyUserId();
        const roomId = local.get('roomId');
        const party = await fetchJSON(`${API_URL}/parties?room_id=eq.${roomId}`);

        totalRounds = party[0].num_rounds;
        roundTime = party[0].round_time;
        currentPartyId = party[0].id;

        local.set('currentRound', currentRound);
        local.set('totalRounds', totalRounds);
        local.set('currentPartyId', currentPartyId);

        initCountdown();
    }

    function initCountdown() {
        let seconds = 3;
        const contador = document.getElementById('pantalla-comptador');
        const game = document.getElementById('contingut-joc');
        const span = document.getElementById('segons');

        const tick = () => {
            span.textContent = seconds;
            if (seconds === 0) {
                contador.classList.add('hidden');
                game.classList.remove('hidden');
                loadRound();
            } else { seconds--; setTimeout(tick, 1000); }
        };
        tick();
    }

    async function loadRound() {
        const rounds = await fetchJSON(`${API_URL}/rounds?party_id=eq.${currentPartyId}&order=id.asc`);
        if (rounds.length >= currentRound) {
            const round = rounds[currentRound - 1];
            currentRoundId = round.id;
            local.set('currentRoundId', currentRoundId);
            showRoundContent(round);
        } else {
            const res = await fetchJSON(`${API_URL}/rpc/ensure_round`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_party_id: currentPartyId, p_round_number: currentRound })
            });
            const round = await fetchJSON(`${API_URL}/rounds?id=eq.${res}`);
            currentRoundId = res;
            local.set('currentRoundId', currentRoundId);
            showRoundContent(round[0]);
        }
    }

    function showRoundContent(round) {
        const content = round.content;
        const isImg = content.includes('data:image') || content.includes('http') || content.includes('.png');
        document.getElementById('round-content').innerHTML = isImg ? `<img src="${content}" class="max-w-full h-auto max-h-96 rounded-2xl shadow-lg">` : `<div class="text-5xl font-bold text-white text-center">${content}</div>`;
        document.getElementById('round-title').textContent = `Ronda ${currentRound} de ${totalRounds}`;

        const input = document.getElementById('answer-input');
        const btn = document.getElementById('submit-btn');

        const submitCurrentAnswer = async () => {
            if (myAnswer || !input.value.trim()) return;
            myAnswer = input.value.trim();
            await fetch('http://localhost:3001/answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: myAnswer, round_id: currentRoundId, user_id: myUserId })
            });
            input.disabled = btn.disabled = true;
            btn.textContent = '✓ Resposta enviada';
        };

        btn.onclick = submitCurrentAnswer;

        let time = roundTime;
        const timer = document.getElementById('timer');
        const interval = setInterval(async () => {
            timer.textContent = --time;
            if (time <= 0) {
                clearInterval(interval);
                await submitCurrentAnswer();
                window.location.replace('/answersVotes/');
            }
        }, 1000);
    }

    document.getElementById('leave-round-btn').onclick = abandonarSala;
    start();
}

if (path.includes('/answersVotes')) {
    let selectedAnswerId = null, voteTime = 30, myUserId = null, voteSubmitted = false;
    const currentRoundId = local.get('currentRoundId');

    getSSEConnection().addEventListener('answers', async (e) => {
        if (String(JSON.parse(e.data).data?.round_id) === String(currentRoundId)) await loadAnswers();
    });

    async function loadAnswers() {
        myUserId = await assegurarMyUserId();
        const answers = await fetchJSON(`${API_URL}/answers?round_id=eq.${currentRoundId}`);
        const container = document.getElementById('answers-container');
        container.innerHTML = '';

        const voteable = answers.filter(a => a.user_id !== myUserId);
        if (voteable.length === 0) {
            container.innerHTML = `<div class="text-white text-center py-10">Esperant que els altres jugadors enviïn la seva frase...</div>`;
            return;
        }

        voteable.forEach(ans => {
            const div = document.createElement('div');
            div.className = 'bg-white/20 rounded-2xl p-6 border-2 border-white/30 cursor-pointer text-white';
            div.innerHTML = `<p>${ans.content}</p>`;
            div.onclick = () => {
                document.querySelectorAll('#answers-container > div').forEach(d => d.classList.remove('bg-white/40', 'border-white/80'));
                div.classList.add('bg-white/40', 'border-white/80');
                selectedAnswerId = ans.id;
                document.getElementById('submit-vote-btn').disabled = false;
            };
            container.appendChild(div);
        });
    }

    async function init() {
        myUserId = await assegurarMyUserId();

        await loadAnswers();

        let remaining = voteTime;
        const timer = document.getElementById('vote-timer');
        timer.textContent = remaining;
        const interval = setInterval(async () => {
            remaining -= 1;
            timer.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(interval);
                if (!voteSubmitted && selectedAnswerId) {
                    voteSubmitted = true;
                    await fetch('http://localhost:3001/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer_id: selectedAnswerId, user_id: myUserId }) });
                }
                window.location.replace('/ranking/');
            }
        }, 1000);

        document.getElementById('submit-vote-btn').onclick = async () => {
            if (voteSubmitted) return;
            voteSubmitted = true;
            document.getElementById('submit-vote-btn').disabled = true;
            document.getElementById('submit-vote-btn').textContent = 'Vot enviat, esperant...';
            await fetch('http://localhost:3001/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer_id: selectedAnswerId, user_id: myUserId }) });
        };
    }

    document.getElementById('leave-vote-btn').onclick = abandonarSala;
    init();
}

if (path.includes('/ranking')) {
    let countdown = 5;
    const currentRound = parseInt(local.get('currentRound'), 10);
    const totalRounds = parseInt(local.get('totalRounds'), 10);

    async function init() {
        const users = await fetchJSON(`${API_URL}/users?room_id=eq.${local.get('roomId')}`);
        const answers = await fetchJSON(`${API_URL}/answers?round_id=eq.${local.get('currentRoundId')}`);
        const votes = await fetchJSON(`${API_URL}/votes`);

        const scores = {};
        answers.forEach(a => { scores[a.user_id] = 0; });

        votes.forEach(v => {
            const answer = answers.find(a => a.id === v.answer_id);
            if (answer && scores[answer.user_id] !== undefined) {
                scores[answer.user_id] += 1000;
            }
        });

        const voteCounts = {};
        votes.forEach(v => { voteCounts[v.answer_id] = (voteCounts[v.answer_id] || 0) + 1; });

        const totalAnswers = answers.length;
        Object.entries(voteCounts).forEach(([answerId, count]) => {
            if (count === totalAnswers) {
                const answer = answers.find(a => a.id === parseInt(answerId, 10));
                if (answer) {
                    scores[answer.user_id] += Math.floor(scores[answer.user_id] * 0.1);
                }
            }
        });

        const sortedUsers = [...users].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0) || a.username.localeCompare(b.username));

        document.getElementById('round-counter').textContent = `Ronda ${currentRound} de ${totalRounds}`;

        const ranking = document.getElementById('ranking-list');
        ranking.innerHTML = sortedUsers.map(user => {
            const points = scores[user.id] || 0;
            return `
                <div class="bg-white/20 rounded-2xl p-4 border border-white/30 backdrop-blur flex items-center justify-between">
                    <span class="text-xl font-bold text-white">${user.username}</span>
                    <span class="text-2xl font-bold text-yellow-300">+${points}</span>
                </div>
            `;
        }).join('');

        const timer = setInterval(() => {
            document.querySelector('#countdown span').textContent = --countdown;
            if (countdown <= 0) {
                clearInterval(timer);
                if (currentRound + 1 <= totalRounds) {
                    local.set('currentRound', (currentRound + 1).toString());
                    window.location.replace('/round/');
                } else {
                    window.location.replace('/podium/');
                }
            }
        }, 1000);
    }
    init();
}

if (path.includes('/podium')) {
    const roomCode = local.get('roomCode');

    getSSEConnection().addEventListener('start', (e) => {
        const payload = JSON.parse(e.data);
        const tRoomId = payload.roomId || payload.data?.room_id;
        if (String(tRoomId) === String(local.get('roomId'))) {
            local.clearGame();
            window.location.replace(`/round/?code=${roomCode}`);
        }
    });

    (async function init() {
        const roomId = local.get('roomId');
        let currentPartyId = local.get('currentPartyId');

        if (!currentPartyId) {
            const parties = await fetchJSON(`${API_URL}/parties?room_id=eq.${roomId}`);
            currentPartyId = parties[0]?.id;
        }

        const [users, rounds] = await Promise.all([
            fetchJSON(`${API_URL}/users?room_id=eq.${roomId}`),
            currentPartyId ? fetchJSON(`${API_URL}/rounds?party_id=eq.${currentPartyId}`) : []
        ]);

        const roundIds = rounds.map(r => r.id).filter(Boolean);
        const answers = roundIds.length ? await fetchJSON(`${API_URL}/answers?round_id=in.(${roundIds.join(',')})`) : [];

        const answerIds = answers.map(a => a.id).filter(Boolean);
        const votes = answerIds.length ? await fetchJSON(`${API_URL}/votes?answer_id=in.(${answerIds.join(',')})`) : [];

        const scores = Object.fromEntries(users.map(u => [u.id, 0]));
        const answerMap = new Map(answers.map(a => [a.id, a]));
        const votesByAnswer = {};

        votes.forEach(vote => {
            votesByAnswer[vote.answer_id] = (votesByAnswer[vote.answer_id] || 0) + 1;
            const ans = answerMap.get(vote.answer_id);
            if (ans && scores[ans.user_id] !== undefined) scores[ans.user_id] += 1000;
        });

        const answersByRound = Object.groupBy ? Object.groupBy(answers, a => a.round_id) :
            answers.reduce((acc, a) => ((acc[a.round_id] ??= []).push(a), acc), {});

        Object.values(answersByRound).forEach(roundAnswers => {
            const totalRoundVotes = roundAnswers.reduce((sum, a) => sum + (votesByAnswer[a.id] || 0), 0);

            roundAnswers.forEach(ans => {
                if (votesByAnswer[ans.id] === totalRoundVotes && totalRoundVotes > 0 && scores[ans.user_id] !== undefined) {
                    scores[ans.user_id] += Math.floor(scores[ans.user_id] * 0.1);
                }
            });
        });

        const sortedUsers = [...users].sort((a, b) =>
            (scores[b.id] - scores[a.id]) || a.username.localeCompare(b.username)
        );

        const updatePodiumPos = (pos, user, fallback) => {
            document.getElementById(`${pos}-name`).textContent = user ? user.username : fallback;
            document.getElementById(`${pos}-score`).textContent = `${scores[user?.id] || 0} punts`;
        };
        updatePodiumPos('first', sortedUsers[0], 'Esperant...');
        updatePodiumPos('second', sortedUsers[1], '---');
        updatePodiumPos('third', sortedUsers[2], '---');

        document.getElementById('podium-list').innerHTML = sortedUsers.map((user, index) => `
            <div class="bg-white/10 rounded-3xl p-4 border border-white/15 backdrop-blur flex items-center justify-between">
                <div>
                    <p class="text-sm uppercase text-white/60">${index + 1}r lloc</p>
                    <p class="text-lg font-semibold text-white">${user.username}</p>
                </div>
                <span class="text-2xl font-bold text-amber-200">${scores[user.id] || 0}</span>
            </div>
        `).join('');

        const me = users.find(u => u.token === local.get('token'));
        const newGameBtn = document.querySelector('#new-game-btn');
        if (newGameBtn) {
            newGameBtn.classList.toggle('hidden', !me?.is_host);
            newGameBtn.style.display = me?.is_host ? '' : 'none';
            if (me?.is_host) {
                newGameBtn.addEventListener('click', async () => {
                    const oldParty = await fetchJSON(`${API_URL}/parties?id=eq.${currentPartyId}`);
                    if (oldParty.length > 0) {
                        try {
                            await fetch(`${API_URL}/rounds?party_id=eq.${currentPartyId}`, { method: 'DELETE' });
                        } catch (e) {
                            console.error("Error eliminant rondes anteriors:", e);
                        }

                        await fetch(`${API_URL}/parties`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                num_rounds: oldParty[0].num_rounds,
                                max_players: oldParty[0].max_players,
                                round_time: oldParty[0].round_time,
                                room_id: roomId,
                                modality_id: oldParty[0].modality_id
                            })
                        });
                        const newParties = await fetchJSON(`${API_URL}/parties?room_id=eq.${roomId}&order=id.desc&limit=1`);
                        if (newParties.length > 0) {
                            local.set('currentPartyId', newParties[0].id);
                            await startGame();
                        }
                    }
                });
            }
        }

        document.getElementById('leave-podium-btn').onclick = abandonarSala;
    })();
}