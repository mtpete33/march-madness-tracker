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
        
        // Get dates for the past 3 days
        const dates = [];
        for (let i = -2; i <= 0; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dates.push(`${month}-${day}`);
        }
        
        let promises = [];
        rounds.forEach(round => {
            dates.forEach(date => {
                promises.push($.get("/scoreboard", { round, date }));
            });
        });

        Promise.all(promises).then(results => {
            eliminatedTeams.clear();
            teamWins.clear();

            console.log("Processing game results. Number of results:", results.length);
            results.forEach((data, idx) => {
                console.log(`Processing result set ${idx + 1}:`, data);
                if (data.games) {
                    console.log(`Found ${data.games.length} games in result set ${idx + 1}`);
                    data.games.forEach(gameData => {
                        if (!gameData.game) {
                            console.log("Invalid game data, missing game object");
                            return;
                        }
                        const game = gameData.game;
                        console.log("Processing game:", game.title, "Round:", game.bracketRound, "Status:", game.finalMessage);
                        
                        if (game.finalMessage === "FINAL") {
                            const homeScore = parseInt(game.home.score);
                            const awayScore = parseInt(game.away.score);
                            const homeSeed = parseInt(game.home.seed);
                            const awaySeed = parseInt(game.away.seed);
                            
                            console.log("Final game found:", {
                                homeTeam: game.home.names.short,
                                homeScore,
                                homeSeed,
                                awayTeam: game.away.names.short,
                                awayScore,
                                awaySeed,
                                round: game.bracketRound,
                                basePoints: roundPoints[game.bracketRound]
                            });

                            if (game.home.winner) {
                                // Home team won
                                eliminatedTeams.add(game.away.names.short);
                                let upsetPoints = homeSeed > awaySeed ? homeSeed - awaySeed : 0;
                                let totalPoints = roundPoints[game.bracketRound] || 0;
                                
                                // Get existing points if any
                                const existingWin = teamWins.get(game.home.names.short);
                                const existingPoints = existingWin ? existingWin.points : 0;
                                
                                const newTotalPoints = existingPoints + totalPoints + upsetPoints;
                                teamWins.set(game.home.names.short, {
                                    round: game.bracketRound,
                                    points: newTotalPoints
                                });
                                console.log(`${game.home.names.short} won in ${game.bracketRound}:`, {
                                    basePoints: totalPoints,
                                    upsetPoints,
                                    existingPoints,
                                    newTotalPoints
                                });
                            } else if (game.away.winner) {
                                // Away team won
                                eliminatedTeams.add(game.home.names.short);
                                let upsetPoints = awaySeed > homeSeed ? awaySeed - homeSeed : 0;
                                let totalPoints = roundPoints[game.bracketRound] || 0;
                                
                                // Get existing points if any
                                const existingWin = teamWins.get(game.away.names.short);
                                const existingPoints = existingWin ? existingWin.points : 0;
                                
                                teamWins.set(game.away.names.short, {
                                    round: game.bracketRound,
                                    points: existingPoints + totalPoints + upsetPoints
                                });
                                console.log(`${game.away.names.short} won in ${game.bracketRound}, total points: ${existingPoints + totalPoints + upsetPoints}`);
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
        console.log("Calculating points for teams:", teams);
        teams.forEach(team => {
            console.log(`Checking team ${team}:`, {
                hasWins: teamWins.has(team),
                winData: teamWins.get(team)
            });
            if (teamWins.has(team)) {
                const points = teamWins.get(team).points;
                total += points;
                console.log(`Adding ${points} points for ${team}`);
            }
        });
        console.log("Total points calculated:", total);
        return total;
    }

    function loadStandings() {
        $.getJSON('draft.json', function(data) {
            console.log("Loading draft.json data:", data);
            console.log("Current teamWins map:", Array.from(teamWins.entries()));
            console.log("Current eliminatedTeams:", Array.from(eliminatedTeams));
            
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