const bedrock = require('bedrock-protocol');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let botState = {
  name: 'emi_khatana',
  mood: 'Happy'
};

const SYSTEM_PROMPT = `You are 'emi_khatana', a cute AI child in Minecraft. Speak short (max 8 words) in natural Gujlish (Roman Gujarati + English). Do not use quotes or special symbols. Example: "Arey ha brother hu ahi chu"`;

// --- CUSTOM WORLD / CHAT SEND MESSAGE FUNCTION ---
function sendMessage(client, messageText) {
  try {
    // Special characters કે ન્યુ-લાઇન્સ સાફ કરવી જેથી સર્વર ક્રેશ ના થાય
    const cleanText = String(messageText).replace(/[^a-zA-Z0-9 ]/g, '').trim();

    if (!cleanText) return;

    // Command request મારફતે સુરક્ષિત ચેટ મેસેજ મોકલવો
    client.queue('command_request', {
      command: `/me ${cleanText}`,
      origin: {
        type: 0,
        uuid: '',
        request_id: '',
        player_entity_id: 0n
      },
      internal: false,
      version: 66
    });

    console.log(`[SENT TO WORLD]: ${cleanText}`);
  } catch (err) {
    console.error("SendMessage Error:", err.message);
  }
}

async function getLlamaResponse(userMessage, sender) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.log("Warning: GROQ_API_KEY missing!");
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

    return chatCompletion.choices[0]?.message?.content || "Ha kem cho!";
  } catch (error) {
    console.error("Llama AI Error:", error.message);
    return "Arey ha brother!";
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
    console.log("SUCCESS: emi_khatana joined the world!");
    
    // પ્લેયર જોઈન થાય ત્યારે સ્વાગતનો મેસેજ
    sendMessage(client, "Hello world hu emi chu");
  });

  // Chat Event Listener
  client.on('text', async (packet) => {
    try {
      const sender = packet.source_name;
      const message = packet.message;

      // પોતે જ મોકલેલા કે સિસ્ટમ મેસેજ ઇગ્નોર કરવા
      if (!sender || sender === client.username || sender === 'emi_khatana') return;

      console.log(`[WORLD CHAT] ${sender}: ${message}`);

      // Llama 3 AI મોડેલ પાસેથી રિસ્પોન્સ લેવો
      const aiResponse = await getLlamaResponse(message, sender);

      // પ્લેયરને રિસ્પોન્સ મોકલવા માટે આપણું sendMessage ફંક્શન
      sendMessage(client, aiResponse);

    } catch (err) {
      console.log("Chat Handle Error:", err.message);
    }
  });

  client.on('error', (err) => console.log("Bot Network Error:", err.message));
  client.on('close', () => {
    console.log("Connection closed. Reconnecting in 10s...");
    setTimeout(startBot, 10000);
  });
}

startBot();
