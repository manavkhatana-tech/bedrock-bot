const bedrock = require('bedrock-protocol');

function createMinecraftBot(host, port, username) {
  console.log(`Connecting bot ${username} to ${host}:${port}...`);

  const client = bedrock.createClient({
    host: host || 'Poboi6-wLtc.aternos.me',
    port: parseInt(port) || 55978, // Tamaro Aternos UDP Port (Bedrock/Geyser port)
    username: username || 'emi_khatana',
    offline: true
  });

  client.on('spawn', () => {
    console.log(`SUCCESS: ${username} joined the Minecraft world!`);
  });

  client.on('close', () => {
    console.log('Bot connection closed.');
  });

  client.on('error', (err) => {
    console.error('Bot Error:', err.message);
  });

  return client;
}

module.exports = { createMinecraftBot };