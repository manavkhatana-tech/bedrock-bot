const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Bot Position & State Management
let botState = {
  name: 'emi_khatana',
  mood: 'Happy', // Happy, Scared, Hurt, Angry
  health: 20,
  pos: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
  targetPlayerPos: null,
  targetPlayerName: null,
  isGrounded: true
};

const SYSTEM_PROMPT = `
You are 'emi_khatana', a cute AI child in Minecraft Bedrock.
Current Mood: ${botState.mood}
Instructions:
1. Speak exclusively in short Gujlish (Roman Gujarati + English, max 8 words).
2. React according to your mood (e.g., if hurt/scared, scream or cry in Gujlish).
3. Do not use special symbols.
Example: "Arey marna mat bro!", "Hu mari gayo!", "Ha hu tari pachal chu!"
`;

async function getLlamaResponse(userMessage, sender) {
  try {
    if (!process.env.GROQ_API_KEY) return "Ha hu sambhlu chu!";

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${sender}: ${userMessage}` }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 30,
      temperature: 0.7,
    });

    return chatCompletion.choices[0]?.message?.content || "Ha kem cho!";
  } catch (error) {
    console.error("Llama AI Error:", error.message);
    return "Arey ha brother!";
  }
}

function startBot() {
  console.log("Starting emi_khatana AI Bot with Physics & Follow System...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana spawned in world!");
    
    // Physics Loop (Gravity & Follow Player every 100ms)
    setInterval(() => {
      if (!botState.targetPlayerPos) return;

      let dx = botState.targetPlayerPos.x - botState.pos.x;
      let dz = botState.targetPlayerPos.z - botState.pos.z;
      let distance = Math.sqrt(dx * dx + dz * dz);

      // 1. Gravity Logic (જમીન પર રહેવું)
      if (!botState.isGrounded) {
        botState.pos.y -= 0.2; // Move down
      }

      // 2. Follow Player Logic (જો પ્લેયર 2 બ્લોકથી દૂર હોય તો જ ચાલવું)
      if (distance > 2.5) {
        let speed = 0.15;
        botState.pos.x += (dx / distance) * speed;
        botState.pos.z += (dz / distance) * speed;

        // Calculate Yaw Angle to look at player
        botState.pos.yaw = (Math.atan2(dz, dx) * (180 / Math.PI)) - 90;
      }

      // Send Position Update Packet to Server
      client.queue('player_auth_input', {
        pitch: botState.pos.pitch,
        yaw: botState.pos.yaw,
        position: { x: botState.pos.x, y: botState.pos.y, z: botState.pos.z },
        move_vector: { x: 0, z: 0 },
        head_yaw: botState.pos.yaw,
        input_data: 0n,
        input_mode: 'mouse',
        play_mode: 'normal',
        interaction_model: 'touch'
      });
    }, 100);
  });

  // Player Position Update Listener (તમારી પોઝિશન ટ્રેક કરવા માટે)
  client.on('move_player', (packet) => {
    if (packet.runtime_entity_id !== client.entityId) {
      botState.targetPlayerPos = packet.position;
    } else {
      botState.pos = packet.position;
      botState.isGrounded = packet.on_ground;
    }
  });

  // Health / Hit / Hurt Logic (જ્યારે બોટને ડેમેજ થાય)
  client.on('entity_event', (packet) => {
    if (packet.runtime_entity_id === client.entityId && packet.event_id === 'hurt') {
      botState.health -= 2;
      botState.mood = 'Scared';
      
      console.log(`[EVENT] Bot was hurt! Health: ${botState.health}`);

      // Auto react in chat when hurt
      client.queue('text', {
        type: 'chat',
        needs_translation: false,
        source_name: client.username,
        xuid: '',
        platform_chat_id: '',
        filtered_message: '',
        message: "Auchi! Marna mat bhai mane bijaye chhe!"
      });
    }
  });

  // Safe Text Chat Handler
  client.on('text', async (packet) => {
    try {
      const sender = packet.source_name;
      const message = packet.message;

      if (!sender || sender.includes('emi_khatana')) return;

      console.log(`[CHAT] ${sender}: ${message}`);

      const rawReply = await getLlamaResponse(message, sender);
      const cleanReply = String(rawReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

      if (!cleanReply) return;

      client.queue('text', {
        type: 'chat',
        needs_translation: false,
        source_name: client.username,
        xuid: '',
        platform_chat_id: '',
        filtered_message: '',
        message: cleanReply
      });

    } catch (err) {
      console.log("Packet Process Error:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Error:", err.message));
  client.on('close', () => {
    console.log("Connection closed. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
