const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let botState = {
  name: 'emi_khatana',
  mood: 'Happy'
};

const SYSTEM_PROMPT = `You are 'emi_khatana', a cute AI child inside Minecraft. Speak short (max 8 words) in Gujlish (Roman Gujarati + English). No special characters.`;

async function getLlamaResponse(userMessage, sender) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log("Warning: GROQ_API_KEY not found in environment!");
      return "Ha hu sambhlu chu!";
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${sender}: ${userMessage}` }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 30,
      temperature: 0.7,
    });

    return chatCompletion.choices[0]?.message?.content || "Arey ha bro!";
  } catch (error) {
    console.error("Llama AI Error:", error.message);
    return "Ha, kem cho bro!";
  }
}

function startBot() {
  console.log("Starting emi_khatana AI Bot...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana connected!");
  });

  client.on('text', async (packet) => {
    try {
      // Ignore self messages & system messages without source
      const sender = packet.source_name;
      const message = packet.message;

      if (!sender || sender === client.username || sender === 'emi_khatana') return;

      console.log(`[CHAT] ${sender}: ${message}`);

      // Get AI Reply
      const rawReply = await getLlamaResponse(message, sender);
      
      // Sanitize output for Bedrock packet safety
      const cleanReply = String(rawReply).replace(/[^a-zA-Z0-9 ?!,.]/g, '').trim();

      if (!cleanReply) return;

      console.log(`[REPLY] ${cleanReply}`);

      // Send text safely
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
      console.log("Ignored packet crash:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Network Error:", err.message));
  client.on('close', () => {
    console.log("Reconnecting in 8s...");
    setTimeout(startBot, 8000);
  });
}

startBot();
