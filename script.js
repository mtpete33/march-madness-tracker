$(document).ready(function () {
    function fetchGames() {
        $("#games-container").html("<p>Loading games...</p>");

        $.get("/scoreboard", function (data) {
            $("#games-container").empty(); // Clear previous results

            if (data.games && data.games.length > 0) {
                data.games.forEach(game => {
                    const gameData = game.game;
                    const homeTeam = gameData.home;
                    const awayTeam = gameData.away;

                    // Determine winner and loser
                    const homeClass = homeTeam.winner ? "winner" : "loser";
                    const awayClass = awayTeam.winner ? "winner" : "loser";

                    // Game card HTML
                    const gameCard = `
                        <div class="game-card">
                            <h3>${gameData.title}</h3>
                            <p><strong>Round:</strong> ${gameData.bracketRound || "N/A"}</p>
                            <p class="${awayClass}">${awayTeam.full}: ${awayTeam.score}</p>
                            <p class="${homeClass}">${homeTeam.full}: ${homeTeam.score}</p>
                            <p><strong>Final:</strong> ${gameData.finalMessage}</p>
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
