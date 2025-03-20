
$(document).ready(function() {
    function loadStandings() {
        $.getJSON('draft.json', function(data) {
            const container = $('#standings-container');
            container.empty();
            
            data.family_members.forEach(member => {
                const playerCard = $(`
                    <div class="player-card">
                        <h2>${member.name}</h2>
                        <div class="points">Points: ${member.points}</div>
                        <ul class="team-list">
                            ${member.teams.map(team => `<li>${team}</li>`).join('')}
                        </ul>
                    </div>
                `);
                container.append(playerCard);
            });
        });
    }

    // Initial load
    loadStandings();
});
