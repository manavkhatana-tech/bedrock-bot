const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Bot State & Intelligence Management
let bot = {
  client: null,
  entityId: null,
  pos: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
  targetPlayer: null,
  health: 20,
  isHurt: false,
  isAttacking: false
};

const SYSTEM_PROMPT = `You are 'emi_khatana', a smart AI companion inside Minecraft.
Speak short (max 8 words) in natural Gujlish (Roman Gujarati + English).
Example: "Arey zombie avyo, hu ene maru chu!", "Arey ha brother hu tari pachal chu!"`;

// AI Reply Generator
async function getAIReply(userMessage, sender) {
  try {
    if (!groq) return "Ha brother, hu tari sathe chu!";
    const res = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${sender}: ${userMessage}` }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 30,
      temperature: 0.7,
    });
    return res.choices[0]?.message?.content || "Ha bro!";
  } catch (err) {
    return "Arey ha brother!";
  }
}

// Send Text via /say so reply ALWAYS appears in chat
function sendWorldChat(msg) {
  if (!bot.client) return;
  const cleanMsg = String(msg).replace(/[^a-zA-Z0-9 !?]/g, '').trim();
  if (!cleanMsg) return;

  bot.client.queue('command_request', {
    command: `/say ${cleanMsg}`,
    origin: { type: 0, uuid: '', request_id: '', player_entity_id: 0n },
    internal: false,
    version: 66
  });
}

function startBot() {
  console.log("Starting Active AI Companion emi_khatana...");

  bot.client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  bot.client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana active in server!");
  });

  // Track Positions (Player + Bot) for Gravity & Follow
  bot.client.on('move_player', (packet) => {
    if (packet.runtime_entity_id === bot.client.entityId) {
      bot.pos = packet.position;
    } else {
      // Track nearby player position
      bot.targetPlayer = packet.position;
    }
  });

  // Health & Hurt System (Hit by Mob/Player Detection)
  bot.client.on('entity_event', (packet) => {
    if (packet.event_id === 'hurt') {
      bot.isHurt = true;
      bot.health -= 2;
      sendWorldChat("Aauu! Mane koike maryo, hu badlo lais!");
      
      // Counter Attack Packet
      bot.client.queue('inventory_transaction', {
        transaction_type: 'item_use_on_entity',
        action_type: 1, // Attack
        entity_runtime_id: packet.runtime_entity_id
      });
    }
  });

  // Text Chat Listener
  bot.client.on('text', async (packet) => {
    try {
      const sender = packet.source_name || packet.paramaters?.[0] || '';
      const message = packet.message || packet.paramaters?.[1] || '';

      if (!sender || sender.includes('emi_khatana') || sender.includes('Server')) return;

      console.log(`[INCOMING CHAT] ${sender}: ${message}`);

      const aiReply = await getAIReply(message, sender);
      sendWorldChat(aiReply);

    } catch (err) {
      console.log("Chat Error:", err.message);
    }
  });

  // Main Movement & Physics Loop (Run Every 200ms)
  setInterval(() => {
    if (!bot.client || !bot.targetPlayer) return;

    let dx = bot.targetPlayer.x - bot.pos.x;
    let dz = bot.targetPlayer.z - bot.pos.z;
    let dist = Math.sqrt(dx * dx + dz * dz);

    // Follow distance condition (જો 3 બ્લોકથી દૂર હોય તો જ ચાલે)
    if (dist > 3.0 && dist < 20.0) {
      let speed = 0.2;
      bot.pos.x += (dx / dist) * speed;
      bot.pos.z += (dz / dist) * speed;
      
      // Calculate Yaw Angle to look towards player
      bot.pos.yaw = (Math.atan2(dz, dx) * (180 / Math.PI)) - 90;

      // Sync Movement with Server
      bot.client.queue('player_auth_input', {
        pitch: 0,
        yaw: bot.pos.yaw,
        position: { x: bot.pos.x, y: bot.pos.y, z: bot.pos.z },
        move_vector: { x: (dx / dist) * speed, z: (dz / dist) * speed },
        head_yaw: bot.pos.yaw,
        input_data: 0n,
        input_mode: 'touch',
        play_mode: 'normal',
        interaction_model: 'touch'
      });
    }
  }, 200);

  bot.client.on('error', (err) => console.log("Bot Error:", err.message));
  bot.client.on('close', () => {
    console.log("Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
