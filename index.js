
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static("."));
app.use(express.json());

// Endpoint to update draft data
app.post('/updateDraft', async (req, res) => {
    const fs = await import('fs');
    fs.default.writeFile('draft.json', JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            res.status(500).send('Error saving data');
            return;
        }
        res.send('Success');
    });
});

// Endpoint to get live NCAA scoreboard
app.get("/scoreboard", async (req, res) => {
    try {
        const selectedRound = req.query.round || "First Round";
        const currentDate = new Date();
        
        let allGames = [];
        
        // If First Four is selected, fetch games from March 19 and 20
        if (selectedRound === "First Four") {
            console.log("Fetching First Four games...");
            const firstFourDates = ['19', '20'];
            for (const day of firstFourDates) {
                try {
                    const url = `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/${day}/scoreboard.json`;
                    console.log(`Fetching from URL: ${url}`);
                    const response = await fetch(url);
                    const data = await response.json();
                    console.log(`Data received for March ${day}:`, data);
                    if (data.games) {
                        console.log(`Found ${data.games.length} games for March ${day}`);
                        allGames = [...allGames, ...data.games];
                    }
                } catch (error) {
                    console.error(`Error fetching First Four games for March ${day}:`, error);
                }
            }
            console.log("Total First Four games found:", allGames.length);
        } else {
            
            
            //For other rounds, fetch current day's games UNCOMMENT THIS
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');




            
            // Temporarily show tomorrow's data --comment this out
            // const tomorrow = new Date(currentDate);
            // tomorrow.setDate(tomorrow.getDate() + 1);
            // const year = tomorrow.getFullYear();
            // const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            // const day = String(tomorrow.getDate()).padStart(2, '0');
            // End comment this out



            
            const response = await fetch(
                `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${year}/${month}/${day}/scoreboard.json`
            );
            const data = await response.json();
            allGames = data.games || [];
        }

        // Filter games by round and add placeholder games for future rounds
        if (selectedRound !== "First Round" && selectedRound !== "First Four") {
            allGames = [{
                game: {
                    bracketRound: selectedRound,
                    home: { names: { char6: "TBD" }, seed: "--", score: "" },
                    away: { names: { char6: "TBD" }, seed: "--", score: "" },
                    startTime: "TBD"
                }
            }];
        } else {
            // Filter First Four games specifically
            if (selectedRound === "First Four") {
                // Manually set the First Four games that have already been played
                allGames = [
                    {
                        game: {
                            bracketRound: "First Four",
                            away: { names: { char6: "ALST" }, score: "70", seed: "16" },
                            home: { names: { char6: "SFTRPA" }, score: "68", seed: "16" },
                            finalMessage: "FINAL"
                        }
                    },
                    {
                        game: {
                            bracketRound: "First Four",
                            away: { names: { char6: "SDGST" }, score: "68", seed: "11" },
                            home: { names: { char6: "UNC" }, score: "95", seed: "11" },
                            finalMessage: "FINAL"
                        }
                    },
                    {
                        game: {
                            bracketRound: "First Four",
                            away: { names: { char6: "AMER" }, score: "72", seed: "16" },
                            home: { names: { char6: "MOUNT" }, score: "83", seed: "16" },
                            finalMessage: "FINAL"
                        }
                    },
                    {
                        game: {
                            bracketRound: "First Four",
                            away: { names: { char6: "TEXAS" }, score: "80", seed: "11" },
                            home: { names: { char6: "XAVIER" }, score: "86", seed: "11" },
                            finalMessage: "FINAL"
                        }
                    }
                ];
            } else {
                allGames = allGames.filter(game => 
                    game.game && game.game.bracketRound && 
                    game.game.bracketRound === selectedRound
                );
            }
            console.log(`Filtered ${allGames.length} games for ${selectedRound}`);
        }
        
        res.json({ games: allGames });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch scoreboard" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
