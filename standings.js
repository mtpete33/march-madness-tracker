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

        // Fetch First Round and Second Round games
        Promise.all([
            $.get("/scoreboard", { round: "First Round" }),
            $.get("/scoreboard", { round: "Second Round" })
        ]).then(data => {
            data.forEach(roundData => {
                if (!roundData || !roundData.games) return;

                roundData.games.forEach(gameData => {
                    if (!gameData.game) return;
                    const game = gameData.game;

                    if (game.finalMessage === "FINAL" && game.home && game.away) {
                        const homeScore = parseInt(game.home.score);
                        const awayScore = parseInt(game.away.score);
                        const homeSeed = parseInt(game.home.seed);
                        const awaySeed = parseInt(game.away.seed);
                        const round = game.bracketRound;

                        // Normalize team names to handle variations
                        const normalizeTeamName = (team) => {
                            const name = team.names.short;
                            // Add special cases here
                            if (name === "North Carolina") return "UNC";
                            return name;
                        };

                        let winningTeam, losingTeam, upsetPoints = 0;
                        if (homeScore > awayScore) {
                            winningTeam = normalizeTeamName(game.home);
                            losingTeam = normalizeTeamName(game.away);
                            upsetPoints = homeSeed > awaySeed ? homeSeed - awaySeed : 0;
                        } else if (awayScore > homeScore) {
                            winningTeam = normalizeTeamName(game.away);
                            losingTeam = normalizeTeamName(game.home);
                            upsetPoints = awaySeed > homeSeed ? awaySeed - homeSeed : 0;
                        }

                        if (winningTeam) {
                            eliminatedTeams.add(losingTeam);
                            let points = roundPoints[round] + upsetPoints;
                            let existingWins = teamWins.get(winningTeam) || [];
                            existingWins.push({ round, points });
                            teamWins.set(winningTeam, existingWins);
                            console.log(`${winningTeam} won, earned ${points} points in ${round}`);
                        }
                    }
                });
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
                let points = 0;
                if (Array.isArray(winData)) {
                    winData.forEach(w => points += w.points);
                } else {
                    points = winData.points;
                }
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
                        <div class="points">Total Points: ${member.points}</div>
                        <ul class="team-list">
                            ${member.teams.map(team => {
                                const isEliminated = eliminatedTeams.has(team);
                                const winInfo = teamWins.get(team);
                                let winStatus = '';
                                if (winInfo) {
                                    // Show all rounds the team has won
                                    if (Array.isArray(winInfo)) {
                                        winStatus = winInfo.map(w => `(${w.round}: +${w.points}pts)`).join(' ');
                                    } else {
                                        winStatus = `(${winInfo.round}: +${winInfo.points}pts)`;
                                    }
                                }
                                return `<li class="${isEliminated ? 'eliminated' : ''}">${team} <span class="win-status">${winStatus}</span></li>`;
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