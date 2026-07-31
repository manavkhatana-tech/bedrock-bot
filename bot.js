const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const SYSTEM_PROMPT = `You are 'emi_khatana', a cute AI inside Minecraft. Respond in short Gujlish (Roman Gujarati + English, max 8 words). No symbols. Example: "Arey ha brother hu maja ma chu!"`;

async function getAIReply(userMessage, sender) {
  try {
    if (!groq) return "Ha hu ahi chu!";

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
  console.log("Connecting emi_khatana (Universal Chat Protocol)...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana spawned successfully!");
  });

  // Universal Packet Sniffer (Catching all message types)
  client.on('packet', async (deserialized) => {
    try {
      const name = deserialized.data?.name;

      if (name === 'text') {
        const p = deserialized.data.params;
        console.log("[PACKET DETECTED]:", JSON.stringify(p));

        let sender = p.source_name || (p.parameters ? p.parameters[0] : '');
        let message = p.message || (p.parameters ? p.parameters[1] : '');

        // If message is in raw format
        if (!message && p.message) message = p.message;

        if (!message || sender.includes('emi_khatana') || sender.includes('Server')) return;

        console.log(`[USER CHAT]: ${sender} -> ${message}`);

        const aiReply = await getAIReply(message, sender);
        const cleanReply = String(aiReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

        if (!cleanReply) return;

        console.log(`[BOT REPLYING]: ${cleanReply}`);

        // Send response back using command_request
        client.queue('command_request', {
          command: `/say ${cleanReply}`,
          origin: { type: 0, uuid: '', request_id: '', player_entity_id: 0n },
          internal: false,
          version: 66
        });
      }
    } catch (err) {
      console.log("Packet Read Error:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Error:", err.message));
  client.on('close', () => {
    console.log("Disconnected. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
