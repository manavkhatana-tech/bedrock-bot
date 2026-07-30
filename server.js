const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Bedrock Bot Online");
});

app.post("/connect", (req, res) => {
    console.log(req.body);

    res.json({
        success: true
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Running...");
});