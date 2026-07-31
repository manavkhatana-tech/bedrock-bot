const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

// Environment Variable માંથી API Key લેશે (GitHub માં અટકશે નહીં)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let botState = {
  name: 'emi_khatana',
  mood: 'Happy'
};

// System Prompt for Llama 3 Model
const SYSTEM_PROMPT = `
You are 'emi_khatana', a cute and curious living AI child inside a Minecraft Bedrock server.
Your core instructions:
1. Speak exclusively in natural Gujlish (a mixture of Gujarati and English using Roman script).
2. Keep responses very short (maximum 10 to 12 words) so it fits in Minecraft chat.
3. Show cute, childlike emotion based on mood: ${botState.mood}.
4. Examples of how you talk: "Arey ha bhai, hu ahi j chu!", "Mane tamari sathe ramvu gami rahyu chhe!", "Su chale chhe bro?".
`;

async function getLlamaResponse(userMessage, sender) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `${sender} says: "${userMessage}"` }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 50,
      temperature: 0.7,
    });

    return chatCompletion.choices[0]?.message?.content || "Ha, hu tamari vaat sambhlu chu!";
  } catch (error) {
    console.error("Llama AI Error:", error.message);
    return "Mane thodu samaj na padyu...";
  }
}

function startBot() {
  console.log("Connecting emi_khatana (Llama 3 AI) to Aternos...");

  const client = bedrock.createClient({
    host: 'Poboi6-wLtc.aternos.me',
    port: 55978,
    username: 'emi_khatana',
    offline: true,
    skipPing: true
  });

  client.on('spawn', () => {
    console.log("SUCCESS: emi_khatana with Llama 3 Brain joined the world!");
  });

  // Game Chat Handler
  client.on('text', async (packet) => {
    const sender = packet.source_name;
    const message = packet.message;

    if (!sender || sender === botState.name) return;

    console.log(`[CHAT] ${sender}: ${message}`);

    const aiReply = await getLlamaResponse(message, sender);
    console.log(`[AI REPLY]: ${aiReply}`);

    client.queue('text', {
      type: 'chat',
      needs_translation: false,
      source_name: client.username,
      xuid: '',
      platform_chat_id: '',
      message: aiReply
    });
  });

  client.on('error', (err) => console.log("Bot Error:", err.message));
  client.on('close', () => {
    console.log("Connection lost. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
