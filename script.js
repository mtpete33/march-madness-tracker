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
        
        // Try to match abbreviated versions
        const shortTeamName = teamName.replace('University of ', '')
                                    .replace(' University', '')
                                    .replace('State', 'St.')
                                    .trim();
                                    
        return teamOwners[shortTeamName] || "Unknown";
    }

    function fetchGames() {
        console.log("Fetching games...");
        $("#games-container").html("<p>Loading games...</p>");
        const selectedRound = $("#roundSelector").val();
        console.log("Selected round:", selectedRound);

        $.get("/scoreboard", { round: selectedRound }, function (data) {
            console.log("Received data:", data);
            $("#games-container").empty();

            if (data.games && data.games.length > 0) {
                data.games.forEach(game => {
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