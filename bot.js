const bedrock = require('bedrock-protocol');

function createMinecraftBot(host, port, username) {
  console.log(`[CONNECTING] IP: ${host}:${port} as ${username}`);

  try {
    const client = bedrock.createClient({
      host: host || 'Poboi6-wLtc.aternos.me',
      port: parseInt(port) || 55978,
      username: username || 'emi_khatana',
      offline: true,
      // Bedrock protocol mate skip ping option add karyo
      skipPing: true
    });

    client.on('spawn', () => {
      console.log(`[SUCCESS] ${username} successfully spawned in Aternos!`);
    });

    client.on('join', () => {
      console.log(`[JOINED] Handshake success! Joining world...`);
    });

    client.on('close', (reason) => {
      console.log(`[DISCONNECTED] Reason:`, reason);
    });

    client.on('error', (err) => {
      console.error(`[BOT ERROR]`, err.message || err);
    });

    return client;
  } catch (err) {
    console.error(`[CREATION ERROR]`, err);
  }
}

module.exports = { createMinecraftBot };
