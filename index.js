
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static("."));

// Endpoint to get live NCAA scoreboard
app.get("/scoreboard", async (req, res) => {
    try {
        const selectedRound = req.query.round || "First Round";
        const currentDate = new Date();
        
        let allGames = [];
        
        // If First Four is selected, fetch games from March 19 and 20
        if (selectedRound === "First Four") {
            const firstFourDates = ['19', '20'];
            for (const day of firstFourDates) {
                try {
                    const response = await fetch(
                        `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/${day}/scoreboard.json`
                    );
                    const data = await response.json();
                    if (data.games) {
                        allGames = [...allGames, ...data.games];
                    }
                } catch (error) {
                    console.error(`Error fetching First Four games for March ${day}:`, error);
                }
            }
        } else {
            // For other rounds, fetch current day's games
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            
            const response = await fetch(
                `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${year}/${month}/${day}/scoreboard.json`
            );
            const data = await response.json();
            allGames = data.games || [];
        }

        // Filter games by round and add placeholder games for future rounds
        if (selectedRound !== "First Round" && selectedRound !== "First Four") {
            data.games = [{
                game: {
                    bracketRound: selectedRound,
                    home: { names: { char6: "TBD" }, seed: "--", score: "" },
                    away: { names: { char6: "TBD" }, seed: "--", score: "" },
                    startTime: "TBD"
                }
            }];
        } else {
            allGames = allGames.filter(game => 
                game.game.bracketRound === selectedRound
            );
        }
        
        res.json({ games: allGames });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch scoreboard" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
