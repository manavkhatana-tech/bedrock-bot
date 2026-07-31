const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const SYSTEM_PROMPT = `You are 'emi_khatana', a cute AI child in Minecraft. Speak short (max 8 words) in natural Gujlish (Roman Gujarati + English). Do not use special symbols. Example: "Arey ha brother hu ahi chu"`;

async function getLlamaResponse(userMessage, sender) {
  try {
    if (!groq) return "Ha hu ahi j chu!";

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
    return "Ha brother, kem cho!";
  }
}

function startBot() {
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
      const sender = packet.source_name || packet.paramaters?.[0] || '';
      const message = packet.message || packet.paramaters?.[1] || '';

      if (!sender || sender.includes('emi_khatana')) return;

      const rawReply = await getLlamaResponse(message, sender);
      const cleanReply = String(rawReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

      if (!cleanReply) return;

      // Normal Chat Command (સર્વર ચેટમાં લાવવા માટે)
      client.queue('command_request', {
        command: `/say ${cleanReply}`,
        origin: { type: 0, uuid: '', request_id: '', player_entity_id: 0n },
        internal: false,
        version: 66
      });

    } catch (err) {
      console.log("Chat error:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Error:", err.message));
  client.on('close', () => setTimeout(startBot, 10000));
}

startBot();
