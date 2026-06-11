import './input.css';
import { API_URL, fetchJSON, local, getSSEConnection, assegurarMyUserId, abandonarSala } from './utils.js';

let selectedAnswerId = null, voteTime = 30, myUserId = null, voteSubmitted = false;
const currentRoundId = local.get('currentRoundId');
let voteInterval = null;
let totalUsers = 0;

async function loadAnswers() {
    const answers = await fetchJSON(`${API_URL}/answers?round_id=eq.${currentRoundId}`);
    const container = document.getElementById('answers-container');
    container.innerHTML = '';

    const voteable = answers.filter(a => a.user_id !== myUserId);
    if (voteable.length === 0) {
        container.innerHTML = `<div class="text-white text-center py-10">No hi ha respostes per votar.</div>`;
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

async function checkIfAllVoted() {
    const answers = await fetchJSON(`${API_URL}/answers?round_id=eq.${currentRoundId}`);
    const answerIds = answers.map(a => a.id);

    if (answerIds.length === 0) return;

    const votes = await fetchJSON(`${API_URL}/votes?answer_id=in.(${answerIds.join(',')})`);
    if (votes.length > 0 && totalUsers > 0 && votes.length === totalUsers) {
        clearInterval(voteInterval);
        window.location.replace('/ranking/');
    }
}

async function init() {
    myUserId = await assegurarMyUserId();
    const roomId = local.get('roomId');
    const users = await fetchJSON(`${API_URL}/users?room_id=eq.${roomId}`);
    totalUsers = users.length;

    getSSEConnection().addEventListener('answers', async (e) => {
        if (String(JSON.parse(e.data).data?.round_id) === String(currentRoundId)) await loadAnswers();
    });

    getSSEConnection().addEventListener('votes', async () => {
        await checkIfAllVoted();
    });

    await loadAnswers();

    let remaining = voteTime;
    const timer = document.getElementById('vote-timer');
    timer.textContent = remaining;
    voteInterval = setInterval(async () => {
        remaining -= 1;
        timer.textContent = remaining;
        await checkIfAllVoted();

        if (remaining <= 0) {
            clearInterval(voteInterval);
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
