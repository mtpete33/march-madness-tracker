$(document).ready(function () {
    // Sample data (replace with actual data loading from draft.json)
    let teamOwners = {};

    // Load draft data
    $.getJSON('draft.json', function(data) {
        data.family_members.forEach(member => {
            member.teams.forEach(team => {
                teamOwners[team] = member.name;
            });
        });
    });

    function findTeamOwner(teamName) {
        // Try exact match first
        if (teamOwners[teamName]) {
            return teamOwners[teamName];
        }

        // Normalize the team name for comparison
        const normalizeTeam = (name) => {
            console.log('Normalizing team name:', name);
            if (!name) return '';
            let normalized = name.toUpperCase()
                      .replace('UNIVERSITY OF ', '')
                      .replace(' UNIVERSITY', '')
                      .replace('STATE', 'ST')
                      .replace('NORTH CAROLINA', 'UNC')
                      .replace(/[^A-Z]/g, '')
                      .trim();
            console.log('Normalized to:', normalized);
            return normalized;
        };

        const normalizedSearch = normalizeTeam(teamName);
        console.log('Looking for team:', teamName);
        console.log('Normalized search term:', normalizedSearch);
        console.log('Available teams:', Object.keys(teamOwners));

        // Look for a match in normalized team names
        for (const [team, owner] of Object.entries(teamOwners)) {
            const normalizedTeam = normalizeTeam(team);
            console.log(`Comparing '${normalizedSearch}' with '${normalizedTeam}'`);
            if (normalizedTeam === normalizedSearch) {
                return owner;
            }
        }

        return "Unknown";
    }

    function fetchGames() {
        console.log("Fetching games...");
        $("#games-container").html("<p>Loading games...</p>");
        const selectedRound = $("#roundSelector").val();
        console.log("Selected round:", selectedRound);

        $.get("/scoreboard", { round: selectedRound }, function (data) {
            console.log("Received data:", data);
            $("#games-container").empty();

            let allGames = data.games || [];

            //Keep the filtered games from the NCAA API for the selected round
            allGames = allGames.filter(game => game.game.bracketRound === selectedRound);

            //If no games found, show TBD placeholder
            if (allGames.length === 0 && selectedRound !== "First Four") {
                allGames = [{
                    game: {
                        bracketRound: selectedRound,
                        home: { names: { char6: "TBD" }, seed: "--", score: "" },
                        away: { names: { char6: "TBD" }, seed: "--", score: "" },
                        startTime: "TBD"
                    }
                }];
            } else if (selectedRound === "First Four") {
                //Handle First Four separately if needed (e.g., different API endpoint)
                // ... (Existing First Four logic if any) ...
            }


            if (allGames && allGames.length > 0) {
                allGames.forEach(game => {
                    const gameData = game.game;
                    const homeTeam = gameData.home;
                    const awayTeam = gameData.away;

                    const awayScore = parseInt(awayTeam.score) || 0;
                    const homeScore = parseInt(homeTeam.score) || 0;
                    const hasScores = awayTeam.score !== "" && homeTeam.score !== "";

                    // Format date from MM-DD-YYYY to MM/DD/YY
                    const dateStr = gameData.startDate ? 
                        gameData.startDate.split('-').slice(0, 2).join('/') + '/' + 
                        gameData.startDate.split('-')[2].substring(2) : '';

                    const gameCard = `
                        <div class="game-card${gameData.gameState === "live" ? " live-game" : ""}">
                            <h3>${gameData.bracketRound || "March Madness"} - ${dateStr}</h3>
                            <div class="team ${hasScores ? (awayScore > homeScore ? 'winning' : 'losing') : ''}">
                                <p>${awayTeam.names.char6} <span class="seeds">(#${awayTeam.seed})</span></p>
                                <p><strong>${awayTeam.score}</strong></p>
                                <p class="owner-info">${findTeamOwner(awayTeam.names.short)}</p>
                            </div>
                            <div class="team ${hasScores ? (homeScore > awayScore ? 'winning' : 'losing') : ''}">
                                <p>${homeTeam.names.char6} <span class="seeds">(#${homeTeam.seed})</span></p>
                                <p><strong>${homeTeam.score}</strong></p>
                                <p class="owner-info">${findTeamOwner(homeTeam.names.short)}</p>
                            </div>
                            <p><strong>${
                                gameData.finalMessage === "FINAL" ? "FINAL" : 
                                (gameData.gameState === "live" && gameData.contestClock === ":00" ? "HALFTIME" :
                                (gameData.contestClock ? `${gameData.currentPeriod} - ${gameData.contestClock}` : 
                                gameData.finalMessage || gameData.startTime))
                            }</strong></p>
                        </div>
                    `;

                    $("#games-container").append(gameCard);
                });
            } else {
                $("#games-container").html("<p>No games available.</p>");
            }
        }).fail(function () {
            $("#games-container").html("<p>Error fetching data. Try again later.</p>");
        });
    }

    // Initial load
    fetchGames();

    // Refresh button and round selector
    $("#refresh, #roundSelector").on("click change", function () {
        fetchGames();
    });
});