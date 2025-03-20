
$(document).ready(function() {
    let eliminatedTeams = new Set();

    // Fetch all completed games to build eliminated teams list
    function fetchAllCompletedGames() {
        const rounds = ["First Four", "First Round", "Second Round", "Sweet 16", "Elite Eight", "Final Four", "National Championship"];
        let promises = rounds.map(round => 
            $.get("/scoreboard", { round })
        );

        Promise.all(promises).then(results => {
            results.forEach(data => {
                if (data.games) {
                    data.games.forEach(gameData => {
                        const game = gameData.game;
                        if (game.finalMessage === "FINAL") {
                            // Add losing team to eliminated set
                            const homeScore = parseInt(game.home.score);
                            const awayScore = parseInt(game.away.score);
                            
                            if (homeScore < awayScore) {
                                eliminatedTeams.add(game.home.names.short);
                            } else if (awayScore < homeScore) {
                                eliminatedTeams.add(game.away.names.short);
                            }
                        }
                    });
                }
            });
            loadStandings();
        });
    }

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
                            ${member.teams.map(team => {
                                const isEliminated = eliminatedTeams.has(team);
                                return `<li class="${isEliminated ? 'eliminated' : ''}">${team}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                `);
                container.append(playerCard);
            });
        });
    }

    // Initial load
    fetchAllCompletedGames();

    // Refresh every 5 minutes
    setInterval(fetchAllCompletedGames, 300000);
});
