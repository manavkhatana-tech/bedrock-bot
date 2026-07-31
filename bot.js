const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are 'emi_khatana', a cute AI child in Minecraft. Speak short (max 8 words) in natural Gujlish (Roman Gujarati + English). Do not use special symbols. Example: "Arey ha brother hu ahi chu"`;

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
  console.log("Starting emi_khatana Bot...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana joined!");
  });

  // Chat Handling (Crash Safe)
  client.on('text', async (packet) => {
    try {
      const sender = packet.source_name;
      const message = packet.message;

      if (!sender || sender.includes('emi_khatana')) return;

      console.log(`[CHAT] ${sender}: ${message}`);

      const rawReply = await getLlamaResponse(message, sender);
      const cleanReply = String(rawReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

      if (!cleanReply) return;

      console.log(`[REPLY] ${cleanReply}`);

      // Command Request Method (Most stable for Aternos)
      client.queue('command_request', {
        command: `/me ${cleanReply}`,
        origin: { type: 0, uuid: '', request_id: '', player_entity_id: 0n },
        internal: false,
        version: 66
      });

    } catch (err) {
      console.log("Text Event Error:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Error:", err.message));
  client.on('close', () => {
    console.log("Disconnected! Reconnecting in 15 seconds...");
    setTimeout(startBot, 15000); // 15 seconds delay to prevent duplicate connection spam
  });
}

startBot();
