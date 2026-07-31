const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const SYSTEM_PROMPT = `You are 'emi_khatana', a cute AI child inside Minecraft Bedrock. Speak short (max 8 words) in natural Gujlish (Roman Gujarati + English). No special symbols. Example: "Arey ha brother hu ahi chu!"`;

async function getAIReply(userMessage, sender) {
  try {
    if (!groq) return "Ha hu ahi j chu!";

    const res = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${sender}: ${userMessage}` }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 30,
      temperature: 0.7,
    });

    return res.choices[0]?.message?.content || "Ha kem cho bro!";
  } catch (err) {
    console.error("Groq Error:", err.message);
    return "Ha brother!";
  }
}

function startBot() {
  console.log("Starting Safe-Protocol Bot emi_khatana...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: false
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana fully connected to world!");
  });

  // Dedicated Safe Chat Listener
  client.on('text', async (packet) => {
    try {
      // System left/join messages ignore કરવા
      if (packet.needs_translation || packet.type === 'translation') return;

      const sender = packet.source_name;
      const message = packet.message;

      // Filter self messages & system bots
      if (!sender || sender.includes('emi_khatana') || sender === 'Server') return;

      console.log(`[REAL CHAT] ${sender}: ${message}`);

      const aiReply = await getAIReply(message, sender);
      const cleanReply = String(aiReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

      if (!cleanReply) return;

      console.log(`[BOT REPLYING]: ${cleanReply}`);

      // Safe Text Packet Format (No command_request to prevent Kick)
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
      console.log("Chat Process Error:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Network Error:", err.message));
  client.on('close', () => {
    console.log("Connection closed. Reconnecting in 12s...");
    setTimeout(startBot, 12000);
  });
}

startBot();
