import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("March Madness API Test");
});

// Endpoint to get live NCAA scoreboard
app.get("/scoreboard", async (req, res) => {
    try {
        const response = await fetch(
            "https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/19/scoreboard.json"
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch scoreboard" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
