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
app.get(["/scoreboard", "/test-ncaa"], async (req, res) => {
    try {
        const selectedRound = req.query.round || "First Round";
        const startDate = new Date(2025, 2, 19); // March 19th, 2025
        const endDate = new Date(2025, 2, 30);   // March 30th, 2025
        
        // Add Final Four and Championship dates
        const finalFourDates = [new Date(2025, 3, 5)]; // April 5th - Final Four
        const championshipDate = new Date(2025, 3, 7);  // April 7th - Championship
        const dates = [];

        // Generate array of dates for early rounds
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }

        let allGames = [];

        // If First Four is selected, fetch games from March 19 and 20
        if (selectedRound === "First Four") {
            // console.log("Fetching First Four games...");
            const firstFourDates = ['19', '20'];
            for (const day of firstFourDates) {
                try {
                    const url = `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/${day}/scoreboard.json`;
                    // console.log(`Fetching from URL: ${url}`);
                    const response = await fetch(url);
                    const data = await response.json();
                    // console.log(`Data received for March ${day}:`, data);
                    if (data.games) {
                        // console.log(`Found ${data.games.length} games for March ${day}`);
                        allGames = [...allGames, ...data.games];
                    }
                } catch (error) {
                    console.error(`Error fetching First Four games for March ${day}:`, error);
                }
            }
            // console.log("Total First Four games found:", allGames.length);
        } else {
            // For other rounds, use our date range
            allGames = [];

            const datesToCheck = selectedRound === "Final Four" ? finalFourDates : dates;
            
            for (const date of datesToCheck) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');

                try {
                    const response = await fetch(
                        `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${year}/${month}/${day}/scoreboard.json`
                    );
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    if (data.games) {
                        // Only include games from the selected round
                        const roundGames = data.games.filter(g => 
                            g.game.bracketRound === selectedRound
                        );
                        allGames = [...allGames, ...roundGames];
                    }
                } catch (error) {
                    console.error(`Error fetching games for ${year}-${month}-${day}:`, error);
                    res.status(503).json({ error: "NCAA API is currently unavailable" });
                    return;
                }
            }
        }

        const firstFourGames = [
            {
                game: {
                    gameID: "2427528",
                    bracketRound: "First Four",
                    away: {
                        names: {
                            char6: "ALST",
                            short: "Alabama St.",
                            seo: "alabama-st",
                            full: "Alabama State University"
                        },
                        score: "70",
                        seed: "16",
                        description: "(15-17)",
                        conferences: [{ conferenceName: "SWAC", conferenceSeo: "swac" }]
                    },
                    home: {
                        names: {
                            char6: "SFTRPA",
                            short: "SF Austin",
                            seo: "sf-austin",
                            full: "Stephen F. Austin State University"
                        },
                        score: "68",
                        seed: "16",
                        description: "(19-11)",
                        conferences: [{ conferenceName: "WAC", conferenceSeo: "wac" }]
                    },
                    finalMessage: "FINAL",
                    title: "Alabama St. vs SF Austin",
                    network: "truTV",
                    bracketRegion: "East"
                }
            },
            {
                game: {
                    gameID: "2427529",
                    bracketRound: "First Four",
                    away: {
                        names: {
                            char6: "SDGST",
                            short: "San Diego St.",
                            seo: "san-diego-st",
                            full: "San Diego State University"
                        },
                        score: "68",
                        seed: "11",
                        description: "(21-10)",
                        conferences: [{ conferenceName: "Mountain West", conferenceSeo: "mwc" }]
                    },
                    home: {
                        names: {
                            char6: "UNC",
                            short: "UNC",
                            seo: "unc",
                            full: "University of North Carolina"
                        },
                        score: "95",
                        seed: "11",
                        description: "(20-12)",
                        conferences: [{ conferenceName: "ACC", conferenceSeo: "acc" }]
                    },
                    finalMessage: "FINAL",
                    title: "San Diego St. vs UNC",
                    network: "truTV",
                    bracketRegion: "South"
                }
            },
            {
                game: {
                    gameID: "2427530",
                    bracketRound: "First Four",
                    away: {
                        names: {
                            char6: "AMER",
                            short: "American",
                            seo: "american",
                            full: "American University"
                        },
                        score: "72",
                        seed: "16",
                        description: "(18-14)",
                        conferences: [{ conferenceName: "Patriot", conferenceSeo: "patriot" }]
                    },
                    home: {
                        names: {
                            char6: "MOUNT",
                            short: "Mount St. Mary's",
                            seo: "mount-st-marys",
                            full: "Mount St. Mary's University"
                        },
                        score: "83",
                        seed: "16",
                        description: "(19-13)",
                        conferences: [{ conferenceName: "MAAC", conferenceSeo: "maac" }]
                    },
                    finalMessage: "FINAL",
                    title: "American vs Mount St. Mary's",
                    network: "truTV",
                    bracketRegion: "West"
                }
            },
            {
                game: {
                    gameID: "2427531",
                    bracketRound: "First Four",
                    away: {
                        names: {
                            char6: "TEXAS",
                            short: "Texas A&M-CC",
                            seo: "texas-am-cc",
                            full: "Texas A&M University-Corpus Christi"
                        },
                        score: "80",
                        seed: "11",
                        description: "(23-10)",
                        conferences: [{ conferenceName: "Southland", conferenceSeo: "southland" }]
                    },
                    home: {
                        names: {
                            char6: "XAVIER",
                            short: "Xavier",
                            seo: "xavier",
                            full: "Xavier University"
                        },
                        score: "86",
                        seed: "11",
                        description: "(22-9)",
                        conferences: [{ conferenceName: "Big East", conferenceSeo: "big-east" }]
                    },
                    finalMessage: "FINAL",
                    title: "Texas A&M-CC vs Xavier",
                    network: "truTV",
                    bracketRegion: "Midwest"
                }
            }
        ];

        // Filter games based on selected round
        if (selectedRound === "First Four") {
            allGames = firstFourGames;
        } else if (selectedRound === "Second Round" || selectedRound === "Sweet 16") {
            // Keep the filtered games from the NCAA API
            allGames = allGames.filter(game => game.game.bracketRound === selectedRound);
            if (allGames.length === 0) {
                allGames = [{
                    game: {
                        bracketRound: selectedRound,
                        home: { names: { char6: "TBD" }, seed: "--", score: "" },
                        away: { names: { char6: "TBD" }, seed: "--", score: "" },
                        startTime: "TBD"
                    }
                }];
            }
        } else if (selectedRound === "Elite Eight") {
                console.log("Raw games data:", JSON.stringify(allGames, null, 2));

                allGames = allGames.filter(game => {
                    if (!game.game || !game.game.bracketRound) return false;
                    const round = game.game.bracketRound.toLowerCase().replace('®', '').trim();
                    console.log("Checking round:", round);
                    return round.includes('elite') || 
                           round.includes('8') ||
                           round.includes('regional') || 
                           round.includes('region');
                });
        } else if (selectedRound === "Final Four") {
                // For Final Four, specifically check April 5th
                for (const date of finalFourDates) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    try {
                        const response = await fetch(
                            `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/${month}/${day}/scoreboard.json`
                        );
                        if (!response.ok) continue;
                        const data = await response.json();
                        if (data.games) {
                            const finalFourGames = data.games.filter(game => {
                                const round = game.game.bracketRound.toUpperCase().replace('®', '').trim();
                                return round.includes('FINAL FOUR') ||
                                       round.includes('FINAL 4') ||
                                       round.includes('SEMIFINAL');
                            });
                            allGames = [...allGames, ...finalFourGames];
                        }
                    } catch (error) {
                        console.error(`Error fetching Final Four games for ${month}/${day}:`, error);
                    }
                }
            } else if (selectedRound === "National Championship") {
                // For Championship game, check April 7th
                allGames = [{
                    game: {
                        gameID: "2640601",
                        bracketRound: "National Championship",
                        startTime: "6:50PM MT",
                        startDate: "04-07-2025",
                        network: "CBS",
                        finalMessage: "FINAL",
                        home: {
                            names: { char6: "HOU", short: "Houston", full: "University of Houston" },
                            seed: "1",
                            score: "63",
                            description: "(35-4)"
                        },
                        away: {
                            names: { char6: "FLA", short: "Florida", full: "University of Florida" },
                            seed: "1",
                            score: "65",
                            description: "(34-4)"
                        }
                    }
                }];
                
                for (const date of dates) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    try {
                        const response = await fetch(
                            `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/${month}/${day}/scoreboard.json`
                        );
                        if (!response.ok) continue;
                        const data = await response.json();
                        if (data.games) {
                            const finalFourGames = data.games.filter(game => {
                                if (!game.game || !game.game.bracketRound) return false;
                                const round = game.game.bracketRound.toLowerCase().replace('®', '').trim();
                                return round.includes('final four') ||
                                       round.includes('final 4') ||
                                       round.includes('semifinal');
                            });
                            allGames = [...allGames, ...finalFourGames];
                        }
                    } catch (error) {
                        console.error(`Error fetching Final Four games for ${month}/${day}:`, error);
                    }
                }
                
                // If no Final Four games found, show placeholder with correct date
                if (allGames.length === 0) {
                    allGames = [{
                        game: {
                            bracketRound: "Final Four",
                            home: { names: { char6: "TBD" }, seed: "--", score: "" },
                            away: { names: { char6: "TBD" }, seed: "--", score: "" },
                            startTime: "April 5, 2025 6:09 PM ET",
                            network: "CBS/TBS",
                            startDate: "04-05-2025"
                        }
                    }];
                }
        } else if (selectedRound !== "First Round") {
            allGames = [{
                game: {
                    bracketRound: selectedRound,
                    home: { names: { char6: "TBD" }, seed: "--", score: "" },
                    away: { names: { char6: "TBD" }, seed: "--", score: "" },
                    startTime: "TBD"
                }
            }];
        }

        res.json({ games: allGames });
    } catch (error) {
        console.error("Error fetching scoreboard:", error);
        res.status(500).json({ error: "Failed to fetch scoreboard", details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});