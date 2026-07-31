const mineflayer = require('mineflayer');
const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const SYSTEM_PROMPT = `You are 'emi_khatana', a friendly AI companion inside Minecraft. Reply in short, casual Gujlish (Roman Gujarati + English, max 8 words). No special characters or emojis. Examples: "Arey ha brother hu ahi chu", "Kem cho badha", "Ha bhai bolo bolo".`;

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
    console.error("Groq Error:", err.message);
    return "Arey ha brother!";
  }
}

function startBot() {
  console.log("Starting Mineflayer Bot for Orca Host...");

  const bot = mineflayer.createBot({
    host: 'Orca-seal-65.orc.host',
    port: 25565,
    username: 'emi_khatana',
    version: false // ViaVersion વડે ઓટો-ડિટેક્ટ કરશે
  });

  bot.on('spawn', () => {
    console.log("SUCCESS: emi_khatana connected to Orca Server! Ready to chat!");
  });

  bot.on('chat', async (username, message) => {
    if (username === bot.username || username === 'Server') return;

    console.log(`[CHAT] ${username}: ${message}`);

    const aiReply = await getAIReply(message, username);
    const cleanReply = String(aiReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

    if (cleanReply) {
      console.log(`[BOT REPLY]: ${cleanReply}`);
      bot.chat(cleanReply);
    }
  });

  bot.on('error', (err) => console.log("Bot Error:", err.message));
  bot.on('kicked', (reason) => console.log("Bot Kicked:", reason));
  
  bot.on('end', () => {
    console.log("Connection lost. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
