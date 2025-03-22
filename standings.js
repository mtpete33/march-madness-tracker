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
        const processedGames = new Set();
        
        // Reset game tracking
        eliminatedTeams.clear();
        teamWins.clear();

        // Only fetch First Round games for now since that's what we're tracking
        $.get("/scoreboard", { round: "First Round" }).then(data => {
            if (!data || !data.games) return;

            data.games.forEach(gameData => {
                if (!gameData.game) return;
                const game = gameData.game;

                if (game.finalMessage === "FINAL" && game.bracketRound === "First Round" && game.home && game.away) {
                    const homeScore = parseInt(game.home.score);
                    const awayScore = parseInt(game.away.score);
                    const homeSeed = parseInt(game.home.seed);
                    const awaySeed = parseInt(game.away.seed);

                    console.log(`Processing First Round game:`, {
                        homeTeam: game.home.names.short,
                        homeScore,
                        awayTeam: game.away.names.short,
                        awayScore
                    });

                    if (homeScore > awayScore) {
                        // Home team won
                        eliminatedTeams.add(game.away.names.short);
                        let upsetPoints = homeSeed > awaySeed ? homeSeed - awaySeed : 0;
                        
                        teamWins.set(game.home.names.short, {
                            round: "First Round",
                            points: 5 + upsetPoints // Base points (5) + upset bonus
                        });
                        
                        console.log(`${game.home.names.short} won, earned ${5 + upsetPoints} points`);
                    } else if (awayScore > homeScore) {
                        // Away team won
                        eliminatedTeams.add(game.home.names.short);
                        let upsetPoints = awaySeed > homeSeed ? awaySeed - homeSeed : 0;
                        
                        teamWins.set(game.away.names.short, {
                            round: "First Round",
                            points: 5 + upsetPoints // Base points (5) + upset bonus
                        });
                        
                        console.log(`${game.away.names.short} won, earned ${5 + upsetPoints} points`);
                    }
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
                const winData = teamWins.get(team);
                const points = winData.points;
                total += points;
                console.log(`Adding ${points} points for ${team} (${winData.round})`);
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