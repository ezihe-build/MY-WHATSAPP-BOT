const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');

async function pairCommand(ctx) {
  const userId = ctx.from.id;
  
  // Mark that we are waiting for a number
  if (global.userSessions.has(userId)) {
    global.userSessions.get(userId).waitingFor = 'whatsapp_phone';
  }

  await ctx.reply("🔗 *WHATSAPP PAIRING*\n\nReply with your phone number (with country code).\nExample: `2349035659542`", {
    parse_mode: 'Markdown',
    reply_markup: { force_reply: true }
  });
}

async function startPairing(ctx, phoneNumber) {
  const userId = ctx.from.id;
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const statusMsg = await ctx.reply('⏳ *Initializing connection...*');

  try {
    // FIX: Wipe existing broken session files to prevent linking errors
    const sessionDir = path.join(process.cwd(), 'data', 'whatsapp_sessions', `user_${userId}`);
    await fs.emptyDir(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

            const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ["Mac OS", "Chrome", "121.0.6167.85"],
      // ADD THIS LINE BELOW:
      connectTimeoutMs: 60000 
    });
  
    
    if (!sock.authState.creds.registered) {
      // 5-second delay to allow socket to stabilize
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(cleanNumber);
          const displayCode = code?.match(/.{1,4}/g)?.join('-') || code;

          await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 
            `🔐 *YOUR PAIRING CODE:* \`${displayCode}\`\n\n1. WhatsApp Settings > Linked Devices\n2. Link with phone number\n3. Enter this code.`, 
            { parse_mode: 'Markdown' });
        } catch (err) {
          ctx.reply("❌ WhatsApp rejected the request. Please try again in 1 minute.");
        }
      }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection } = update;
      if (connection === 'open') {
        await ctx.reply('🎉 *WhatsApp account linked successfully!*');
      }
    });

  } catch (error) {
    ctx.reply('⚠️ *Error:* Connection failed. Please try again.');
  }
}

module.exports = { pairCommand, startPairing, whatsappCommand: (ctx) => ctx.reply("WA Status: Check /pair") };
