const mineflayer = require('mineflayer');
const Groq = require('groq-sdk');

// Groq API Key initialize કરો
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Bot Prompt સેટઅપ
const SYSTEM_PROMPT = `You are 'emi_khatana', a friendly companion in Minecraft. Respond in short, casual Gujlish (Roman Gujarati + English, max 8 words). No special characters, symbols, or emojis. Examples: "Arey ha brother hu ahi chu", "Kem cho badha", "Ha bhai bolo bolo".`;

// AI માંથી જવાબ મેળવવાનું ફંક્શન
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

// Bot કનેક્ટ કરવાનું ફંક્શન
function startBot() {
  console.log("Starting Mineflayer Java Bot for Aternos...");

  const bot = mineflayer.createBot({
    host: 'Poboi6-nc8J.aternos.me',
    port: 43249,
    username: 'emi_khatana',
    version: false // GeyserMC/ViaVersion ઓટો-ડિટેક્ટ કરશે
  });

  // સર્વરમાં જોઈન થવા પર
  bot.on('spawn', () => {
    console.log("SUCCESS: emi_khatana connected to Aternos! No more kicks!");
  });

  // ચેટ રીડ કરીને જવાબ આપવા માટે
  bot.on('chat', async (username, message) => {
    // પોતાના અથવા સર્વરના પોતાના સિસ્ટમ મેસેજ ઇગ્નોર કરવા
    if (username === bot.username || username === 'Server') return;

    console.log(`[CHAT] ${username}: ${message}`);

    const aiReply = await getAIReply(message, username);
    
    // માઇનક્રાફ્ટ ચેટ માટે ટેક્સ્ટ કલીન કરવા
    const cleanReply = String(aiReply).replace(/[^a-zA-Z0-9 ]/g, '').trim();

    if (cleanReply) {
      console.log(`[BOT REPLY]: ${cleanReply}`);
      bot.chat(cleanReply);
    }
  });

  // એરર હેન્ડલિંગ
  bot.on('error', (err) => console.log("Bot Error:", err.message));
  bot.on('kicked', (reason) => console.log("Bot Kicked:", reason));
  
  // ડિસ્કનેક્ટ થાય તો 10 સેકન્ડમાં ઓટો-રીકનેક્ટ થશે
  bot.on('end', () => {
    console.log("Connection lost. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
