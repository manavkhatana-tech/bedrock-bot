const express = require('express');
const { createMinecraftBot } = require('./bot');

const app = express();
app.use(express.json());

let activeBot = null;

app.get('/', (req, res) => {
  res.send('Bedrock Bot Server Online');
});

// App mathi aa endpoint par hit karso etle bot Aternos server ma join thase
app.post('/connect', (req, res) => {
  console.log('Received connection request:', req.body);
  
  const { host, port, username } = req.body;

  try {
    activeBot = createMinecraftBot(
      host || 'Poboi6-wLtc.aternos.me', 
      port || 55978, 
      username || 'emi_khatana'
    );

    res.json({
      success: true,
      message: 'Bot spawn process started!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
