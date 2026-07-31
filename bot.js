const bedrock = require('bedrock-protocol');

// Direct auto-connect function
function startBot() {
  console.log("Connecting bot to Aternos...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana server ma join thai gayo!");
  });

  client.on('error', (err) => {
    console.log("Bot Error:", err.message);
  });

  client.on('close', () => {
    console.log("Connection closed. Reconnecting in 10s...");
    setTimeout(startBot, 10000); // 10 second ma automatic reconnect thase
  });
}

startBot();
