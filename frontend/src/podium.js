import './input.css';
import { API_URL, fetchJSON, local, getSSEConnection, abandonarSala, startGame } from './utils.js';

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
        const parties = await fetchJSON(`${API_URL}/parties?room_id=eq.${roomId}&order=id.desc&limit=1`);
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
                    await fetch(`${API_URL}/rounds?party_id=eq.${currentPartyId}`, { method: 'DELETE' });

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
