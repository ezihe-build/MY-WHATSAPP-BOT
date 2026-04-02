const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion, // Added this
  DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');

async function startPairing(ctx, phoneNumber) {
  const userId = ctx.from.id;
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  try {
    const sessionDir = path.join(process.cwd(), 'data', 'whatsapp_sessions', `user_${userId}`);
    await fs.emptyDir(sessionDir); // Clear old broken session data

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // THE FIX: Fetching the latest version dynamically
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WA version: ${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
      version, // Use the dynamic version here
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ["Ubuntu", "Chrome", "20.0.04"], // Stable browser ID
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
    });

    if (!sock.authState.creds.registered) {
      // Give it a few seconds to initialize before requesting code
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(cleanNumber);
          const displayCode = code?.match(/.{1,4}/g)?.join('-') || code;
          await ctx.reply(`🔐 *YOUR PAIRING CODE:* \n\n\`${displayCode}\`\n\nEnter this in WhatsApp now!`, { parse_mode: 'Markdown' });
        } catch (err) {
          console.error("Pairing Request Error:", err);
          ctx.reply("❌ WhatsApp rejected the request. Please wait 2 minutes and try again.");
        }
      }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'open') {
        ctx.reply('🎉 *WhatsApp Linked Successfully!* Your bot is now active.');
      }
    });

  } catch (error) {
    console.error("StartPairing Error:", error);
    ctx.reply('⚠️ An error occurred during pairing.');
  }
}

module.exports = { startPairing };
