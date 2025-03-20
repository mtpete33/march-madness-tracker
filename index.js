
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
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        
        const response = await fetch(
            `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${year}/${month}/${day}/scoreboard.json`
        );
        const data = await response.json();

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
            data.games = data.games.filter(game => 
                game.game.bracketRound === selectedRound
            );
        }
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch scoreboard" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
