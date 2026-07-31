const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const SYSTEM_PROMPT = `You are 'emi_khatana', a cute AI child in Minecraft Bedrock. Speak short (max 8 words) in natural Gujlish (Roman Gujarati + English). Do not use special symbols. Example: "Arey ha brother hu ahi chu"`;

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

    return res.choices[0]?.message?.content || "Ha kem cho!";
  } catch (err) {
    console.error("Groq AI Error:", err.message);
    return "Arey ha brother!";
  }
}

function startBot() {
  console.log("Starting Stable emi_khatana Bot...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana fully connected!");
  });

  // Dedicated Chat Event
  client.on('text', async (packet) => {
    try {
      // Ignore system join/left messages
      if (packet.needs_translation || packet.type === 'translation') return;

      const sender = packet.source_name || (packet.parameters ? packet.parameters[0] : '');
      const message = packet.message || (packet.parameters ? packet.parameters[1] : '');

      // Ignore self and server messages
      if (!sender || sender.includes('emi_khatana') || sender === 'Server') return;

      console.log(`[USER CHAT DETECTED] ${sender}: ${message}`);

      const aiReply = await getAIReply(message, sender);
      
      // Clean special characters to prevent packet crash
      const cleanReply = String(aiReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

      if (!cleanReply) return;

      console.log(`[SENDING REPLY]: ${cleanReply}`);

      // Native Text Packet (Server disconnected kick nai kare)
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
      console.log("Text Event Error:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Network Error:", err.message));
  client.on('close', () => {
    console.log("Connection closed. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
