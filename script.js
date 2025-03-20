
function formatGameTime(startTime) {
    if (!startTime) return '';
    
    const date = new Date(startTime);
    const estOptions = { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' };
    const mstOptions = { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit' };
    
    const estTime = date.toLocaleTimeString('en-US', estOptions);
    const mstTime = date.toLocaleTimeString('en-US', mstOptions);
    
    return `${estTime} ET / ${mstTime} MT`;
}

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
                            <h3>${gameData.bracketRound || "March Madness"}</h3>
                            <div class="team">
                                <p>${awayTeam.names.full} (#${awayTeam.seed})</p>
                                <p><strong>${awayTeam.score}</strong></p>
                            </div>
                            <div class="team">
                                <p>${homeTeam.names.full} (#${homeTeam.seed})</p>
                                <p><strong>${homeTeam.score}</strong></p>
                            </div>
                            <p><strong>${gameData.finalMessage || formatGameTime(gameData.startTime)}</strong></p>
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
