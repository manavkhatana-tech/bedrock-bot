const bedrock = require('bedrock-protocol');

function createMinecraftBot(host, port, username) {
  console.log(`[START] Trying to join ${host}:${port} as ${username}...`);

  const client = bedrock.createClient({
    host: host || 'Poboi6-wLtc.aternos.me',
    port: parseInt(port) || 55978,
    username: username || 'emi_khatana',
    offline: true,
    // Tamaro Aternos Minecraft Bedrock Version (e.g. '1.21.0' કે '1.20.80')
    version: '1.21.0', 
    skipPing: true
  });

  client.on('spawn', () => {
    console.log(`[SUCCESS] Bot ${username} is inside the world!`);
  });

  client.on('error', (err) => {
    console.log(`[ERROR] Connection failed:`, err.message);
  });

  client.on('close', (reason) => {
    console.log(`[DISCONNECT] Reason:`, reason);
  });

  return client;
}

module.exports = { createMinecraftBot };
