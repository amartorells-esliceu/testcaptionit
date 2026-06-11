import './input.css';
import { API_URL, fetchJSON, local, getSSEConnection, assegurarMyUserId, abandonarSala } from './utils.js';

let currentRound = parseInt(local.get('currentRound')) || 1;
let totalRounds, roundTime, currentPartyId, currentRoundId, myUserId, myAnswer = null;
let roundInterval = null;
let totalUsers = 0;

async function start() {
    myUserId = await assegurarMyUserId();
    const roomId = local.get('roomId');
    const party = await fetchJSON(`${API_URL}/parties?room_id=eq.${roomId}&order=id.desc&limit=1`);
    const users = await fetchJSON(`${API_URL}/users?room_id=eq.${roomId}`);

    totalRounds = party[0].num_rounds;
    roundTime = party[0].round_time;
    currentPartyId = party[0].id;
    totalUsers = users.length;

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

async function checkIfAllAnswered() {
    const answers = await fetchJSON(`${API_URL}/answers?round_id=eq.${currentRoundId}`);
    if (answers.length > 0 && totalUsers > 0 && answers.length === totalUsers) {
        clearInterval(roundInterval);
        window.location.replace('/answersVotes/');
    }
}

function showRoundContent(round) {
    const content = round.content;
    const isImg = content.includes('data:image') || content.includes('http') || content.includes('.png');
    document.getElementById('round-content').innerHTML = isImg ? `<img src="${content}" class="max-w-full h-auto max-h-96 rounded-2xl shadow-lg">` : `<div class="text-5xl font-bold text-white text-center">${content}</div>`;
    document.getElementById('round-title').textContent = `Ronda ${currentRound} de ${totalRounds}`;

    const input = document.getElementById('answer-input');
    const btn = document.getElementById('submit-btn');

    getSSEConnection().addEventListener('answers', async (e) => {
        if (String(JSON.parse(e.data).data?.round_id) === String(currentRoundId)) {
            await checkIfAllAnswered();
        }
    });

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
    roundInterval = setInterval(async () => {
        timer.textContent = --time;
        await checkIfAllAnswered();

        if (time <= 0) {
            clearInterval(roundInterval);
            await submitCurrentAnswer();
            window.location.replace('/answersVotes/');
        }
    }, 1000);
}

document.getElementById('leave-round-btn').onclick = abandonarSala;
start();
