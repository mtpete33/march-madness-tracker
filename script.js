
$(document).ready(function () {
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
                    
                    const gameCard = `
                        <div class="game-card">
                            <h3>${gameData.bracketRound || "March Madness"}</h3>
                            <div class="team ${hasScores ? (awayScore > homeScore ? 'winning' : 'losing') : ''}">
                                <p>${awayTeam.names.char6} <span class="seeds">(#${awayTeam.seed})</span></p>
                                <p><strong>${awayTeam.score}</strong></p>
                            </div>
                            <div class="team ${hasScores ? (homeScore > awayScore ? 'winning' : 'losing') : ''}">
                                <p>${homeTeam.names.char6} <span class="seeds">(#${homeTeam.seed})</span></p>
                                <p><strong>${homeTeam.score}</strong></p>
                            </div>
                            <p><strong>${gameData.finalMessage || gameData.startTime}</strong></p>
                            ${gameData.contestClock ? `<p class="contest-clock">${gameData.currentPeriod} - ${gameData.contestClock}</p>` : ''}
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
