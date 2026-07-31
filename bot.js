const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let botState = {
  name: 'emi_khatana',
  mood: 'Happy'
};

const SYSTEM_PROMPT = `
You are 'emi_khatana', a cute and curious living AI child inside a Minecraft Bedrock server.
Core instructions:
1. Speak exclusively in natural Gujlish (Roman script Gujarati + English).
2. Keep responses very short (maximum 8 to 10 words).
3. Do not use special characters or emojis.
4. Example: "Arey ha bhai, hu ahi j chu!", "Su chale chhe bro?", "Hu maja ma chu!".
`;

async function getLlamaResponse(userMessage, sender) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${sender} says: "${userMessage}"` }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 40,
      temperature: 0.7,
    });

    return chatCompletion.choices[0]?.message?.content || "Ha hu ahi j chu!";
  } catch (error) {
    console.error("Llama AI Error:", error.message);
    return "Kem cho brother!";
  }
}

function startBot() {
  console.log("Connecting emi_khatana (Crash-Proof Llama 3) to Aternos...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana joined and ready to chat!");
  });

  // Safe Chat Event
  client.on('text', async (packet) => {
    try {
      // Type 1 & 7 are player messages in bedrock-protocol
      const sender = packet.source_name;
      const message = packet.message;

      if (!sender || sender === botState.name) return;

      console.log(`[CHAT] ${sender}: ${message}`);

      const aiReply = await getLlamaResponse(message, sender);
      
      // Clean string to prevent protocol errors
      const cleanReply = aiReply.replace(/[\r\n"']/g, '').trim();
      console.log(`[AI REPLY]: ${cleanReply}`);

      // Safe Chat Packet
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

  client.on('error', (err) => console.log("Bot Error:", err.message));
  client.on('close', () => {
    console.log("Connection closed. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
