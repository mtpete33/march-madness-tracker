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

        // Fetch First Round through Elite Eight games
        Promise.all([
            $.get("/scoreboard", { round: "First Round" }),
            $.get("/scoreboard", { round: "Second Round" }),
            $.get("/scoreboard", { round: "Sweet 16" }),
            $.get("/scoreboard", { round: "Elite Eight" })
        ]).then(data => {
            data.forEach(roundData => {
                if (!roundData || !roundData.games) return;

                roundData.games.forEach(gameData => {
                    if (!gameData.game) return;
                    const game = gameData.game;

                    if ((game.finalMessage === "FINAL" || game.finalMessage === "FINAL (OT)") && game.home && game.away) {
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
                            
                        }
                    }
                });
            });
            loadStandings();
        });
    }

    function calculatePlayerPoints(teams) {
        let total = 0;
        teams.forEach(team => {
            if (teamWins.has(team)) {
                const winData = teamWins.get(team);
                let points = 0;
                if (Array.isArray(winData)) {
                    winData.forEach(w => points += w.points);
                } else {
                    points = winData.points;
                }
                total += points;
                
            }
        });
        
        return total;
    }

    function loadStandings() {
        Promise.all([
            $.getJSON('draft.json'),
            $.getJSON('draft_order.json')
        ]).then(([draftData, orderData]) => {
            const container = $('#standings-container');
            container.empty();

            // Create a map of draft positions by name
            const draftMap = new Map();
            if (orderData && orderData.draft_order && Array.isArray(orderData.draft_order)) {
                // Only use the first round's picks to determine draft position
                const firstRound = orderData.draft_order.find(r => r.round === 1);
                if (firstRound && Array.isArray(firstRound.picks)) {
                    firstRound.picks.forEach(pick => {
                        draftMap.set(pick.drafter, pick.pick_number);
                    });
                }

            }

            // Calculate points for each member
            draftData.family_members.forEach(member => {
                member.points = calculatePlayerPoints(member.teams);
                member.draft_position = draftMap.get(member.name) || "N/A";
            });

            // Sort by points
            draftData.family_members.sort((a, b) => b.points - a.points);

            draftData.family_members.forEach(member => {
                const teamsLeft = member.teams.filter(team => !eliminatedTeams.has(team)).length;
                const playerCard = $(`
                    <div class="player-card">
                        <h2>${member.name}</h2>

                        <div class="points">Total Points: ${member.points}</div>
                        <div class="teams-left">Teams Left: ${teamsLeft}</div>
                        <div class="draft-position">Draft Position: ${member.draft_position}</div>
                        <ul class="team-list">
                            ${member.teams.map(team => {
                                const isEliminated = eliminatedTeams.has(team);
                                const winInfo = teamWins.get(team);
                                let winStatus = '';
                                if (winInfo) {
                                    if (Array.isArray(winInfo)) {
                                        winStatus = winInfo.map(w => `<div>(${w.round}: +${w.points}pts)</div>`).join('');
                                    } else {
                                        winStatus = `<div>(${winInfo.round}: +${winInfo.points}pts)</div>`;
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