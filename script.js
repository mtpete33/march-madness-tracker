
$(document).ready(function () {
    function fetchGames() {
        $("#games-container").html("<p>Loading games...</p>");

        $.get("/scoreboard", function (data) {
            $("#games-container").empty();

            if (data.games && data.games.length > 0) {
                data.games.forEach(game => {
                    const gameData = game.game;
                    const homeTeam = gameData.home;
                    const awayTeam = gameData.away;

                    const gameCard = `
                        <div class="game-card">
                            <h3>${gameData.title}</h3>
                            <p><strong>Round:</strong> ${gameData.bracketRound || "N/A"}</p>
                            <div class="team">
                                <p>${awayTeam.names.full} (${awayTeam.seed})</p>
                                <p>Score: ${awayTeam.score}</p>
                            </div>
                            <div class="team">
                                <p>${homeTeam.names.full} (${homeTeam.seed})</p>
                                <p>Score: ${homeTeam.score}</p>
                            </div>
                            <p><strong>Status:</strong> ${gameData.finalMessage}</p>
                            <p><strong>Start Time:</strong> ${gameData.startTime}</p>
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

    // Refresh button
    $("#refresh").click(function () {
        fetchGames();
    });
});
