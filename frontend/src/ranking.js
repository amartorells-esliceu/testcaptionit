import './input.css';
import { API_URL, fetchJSON, local } from './utils.js';

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
