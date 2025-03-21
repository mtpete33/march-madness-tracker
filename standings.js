$(document).ready(function() {
    let eliminatedTeams = new Set();
    let teamWins = new Map();
    let roundPoints = {
        "First Round": 5,
        "Second Round": 10,
        "Sweet 16": 15,
        "Elite Eight": 20,
        "Final Four": 25,
        "National Championship": 30
    };

    // Fetch all completed games to build eliminated teams list and track wins
    function fetchAllCompletedGames() {
        const rounds = ["First Four", "First Round", "Second Round", "Sweet 16", "Elite Eight", "Final Four", "National Championship"];
        let promises = rounds.map(round => 
            $.get("/scoreboard", { round })
        );

        Promise.all(promises).then(results => {
            eliminatedTeams.clear();
            teamWins.clear();

            results.forEach(data => {
                if (data.games) {
                    data.games.forEach(gameData => {
                        const game = gameData.game;
                        if (game.finalMessage === "FINAL") {
                            const homeScore = parseInt(game.home.score);
                            const awayScore = parseInt(game.away.score);
                            const homeSeed = parseInt(game.home.seed);
                            const awaySeed = parseInt(game.away.seed);

                            if (homeScore > awayScore) {
                                // Home team won
                                eliminatedTeams.add(game.away.names.short);
                                let upsetPoints = homeSeed > awaySeed ? homeSeed - awaySeed : 0;
                                let totalPoints = roundPoints[game.bracketRound] || 0;
                                teamWins.set(game.home.names.short, {
                                    round: game.bracketRound,
                                    points: totalPoints + upsetPoints
                                });
                            } else if (awayScore > homeScore) {
                                // Away team won
                                eliminatedTeams.add(game.home.names.short);
                                let upsetPoints = awaySeed > homeSeed ? awaySeed - homeSeed : 0;
                                let totalPoints = roundPoints[game.bracketRound] || 0;
                                teamWins.set(game.away.names.short, {
                                    round: game.bracketRound,
                                    points: totalPoints + upsetPoints
                                });
                            }
                        }
                    });
                }
            });
            loadStandings();
        });
    }

    function calculatePlayerPoints(teams) {
        let total = 0;
        teams.forEach(team => {
            if (teamWins.has(team)) {
                total += teamWins.get(team).points;
            }
        });
        return total;
    }

    function loadStandings() {
        $.getJSON('draft.json', function(data) {
            const container = $('#standings-container');
            container.empty();

            // Calculate points for each member
            data.family_members.forEach(member => {
                member.points = calculatePlayerPoints(member.teams);
            });

            // Sort by points (highest first)
            data.family_members.sort((a, b) => b.points - a.points);

            data.family_members.forEach(member => {
                const playerCard = $(`
                    <div class="player-card">
                        <h2>${member.name}</h2>
                        <div class="points">Points: ${member.points}</div>
                        <ul class="team-list">
                            ${member.teams.map(team => {
                                const isEliminated = eliminatedTeams.has(team);
                                const winInfo = teamWins.get(team);
                                const winStatus = winInfo && winInfo.round !== "First Four" ? `<span class="win-status">(${winInfo.round}: +${winInfo.points}pts)</span>` : '';
                                return `<li class="${isEliminated ? 'eliminated' : ''}">${team} ${winStatus}</li>`;
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