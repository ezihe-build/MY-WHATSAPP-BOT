/**
 * EZIHE SUPER BOT - WhatsApp Handler
 * Handles WhatsApp integration and pairing code generation
 */

const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const database = require('../utils/database');
const config = require('../config/config');

const whatsappSessions = new Map();

async function initialize() {
  logger.info('WhatsApp handler initialized');
}

/**
 * Check Connection Status
 */
async function whatsappCommand(ctx) {
  const userId = ctx.from.id;
  const session = await database.get('SELECT * FROM whatsapp_sessions WHERE user_id = ? AND is_active = 1', [userId]);

  if (session) {
    const statusMsg = `
✨ *WHATSAPP CONNECTION* ✨
━━━━━━━━━━━━━━━━━━━━
✅ *Status:* Connected
📞 *Phone:* \`${session.phone_number}\`
📡 *Signal:* Active

_Your bot is now synced with WhatsApp!_
━━━━━━━━━━━━━━━━━━━━`;
    
    await ctx.reply(statusMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🔴 Disconnect Account', callback_data: 'wa_disconnect' }]]
      }
    });
  } else {
    await ctx.reply(`❌ *WhatsApp Not Linked*\n\nPlease use /pair to start the connection process.`, { parse_mode: 'Markdown' });
  }
}

/**
 * Request Phone Number
 */
async function pairCommand(ctx) {
  const userId = ctx.from.id;
  const pairMsg = `
🔗 *WHATSAPP PAIRING* 🔗
━━━━━━━━━━━━━━━━━━━━
Please enter your phone number with country code.
Example: \`2349035659542\`

⚠️ *Note:* You must *REPLY* directly to this message.
━━━━━━━━━━━━━━━━━━━━`;

  await ctx.reply(pairMsg, {
    parse_mode: 'Markdown',
    reply_markup: { 
      force_reply: true,
      input_field_placeholder: '+234...'
    }
  });

  if (global.userSessions.has(userId)) {
    global.userSessions.get(userId).waitingFor = 'whatsapp_phone';
  }
}

/**
 * Start the Pairing Process
 */
async function startPairing(ctx, phoneNumber) {
  const userId = ctx.from.id;
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  const processingMsg = await ctx.reply('⏳ *Initializing Secure Connection...*', { parse_mode: 'Markdown' });

  try {
    const sessionDir = path.join(config.paths.data, 'whatsapp_sessions', `user_${userId}`);
    
    // --- CRITICAL FIX: Wipe old broken session data ---
    await fs.emptyDir(sessionDir);
    await fs.ensureDir(sessionDir);
    // -------------------------------------------------

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      // Using Chrome on Linux browser string for maximum compatibility
      browser: ["EZIHE-BOT", "Chrome", "110.0.5481.177"] 
    });

    // Request the Pairing Code
    if (!sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          let code = await sock.requestPairingCode(cleanNumber);
          
          // Split code into two parts for easier reading (e.g., K3GV-AQ3C)
          const displayCode = code?.match(/.{1,4}/g)?.join('-') || code;

          const codeMsg = `
🔐 *PAIRING CODE GENERATED* 🔐
━━━━━━━━━━━━━━━━━━━━
Your 8-Digit Code is:
👉 \`${displayCode}\` 👈

*How to Link:*
1️⃣ Open *WhatsApp* on your phone.
2️⃣ Tap *Settings* > *Linked Devices*.
3️⃣ Tap *Link a Device* > *Link with phone number instead*.
4️⃣ Type the code shown above.

⌛ _This code expires in 2 minutes!_
━━━━━━━━━━━━━━━━━━━━`;

          await ctx.telegram.editMessageText(
            processingMsg.chat.id,
            processingMsg.message_id,
            null,
            codeMsg,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          logger.error('Pairing Code Error:', err);
          ctx.reply("❌ *Failed to generate code.*\nMake sure the phone number is correct and try again.");
        }
      }, 4000); // 4 second delay to ensure socket is ready
    }

    // Save credentials when updated
    sock.ev.on('creds.update', saveCreds);
    
    // Monitor Connection Status
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'open') {
        const successMsg = `
🎉 *SUCCESS!* 🎉
━━━━━━━━━━━━━━━━━━━━
Your WhatsApp account has been linked to *EZIHE SUPER BOT*.

You can now use WhatsApp features directly from Telegram!
━━━━━━━━━━━━━━━━━━━━`;
        await ctx.reply(successMsg, { parse_mode: 'Markdown' });
        
        await database.run(
          'INSERT OR REPLACE INTO whatsapp_sessions (user_id, phone_number, is_active) VALUES (?, ?, 1)',
          [userId, cleanNumber]
        );
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          // Silent auto-reconnect if it wasn't a manual logout
          startPairing(ctx, cleanNumber);
        }
      }
    });

    whatsappSessions.set(userId, { socket: sock });

  } catch (error) {
    logger.error('WhatsApp Handler Error:', error);
    ctx.reply('⚠️ *Connection Error:* Could not reach WhatsApp servers. Please try again later.');
  }
}

async function sendWhatsAppMessage(ctx, jid, message) {
  const session = whatsappSessions.get(ctx.from.id);
  if (session && session.socket) {
    await session.socket.sendMessage(jid, { text: message });
  }
}

async function disconnectWhatsApp(ctx) {
  const userId = ctx.from.id;
  const session = whatsappSessions.get(userId);
  
  if (session?.socket) {
    await session.socket.logout();
    whatsappSessions.delete(userId);
  }
  
  await database.run('UPDATE whatsapp_sessions SET is_active = 0 WHERE user_id = ?', [userId]);
  
  const sessionDir = path.join(config.paths.data, 'whatsapp_sessions', `user_${userId}`);
  await fs.remove(sessionDir).catch(() => {}); // Clean up files
  
  ctx.reply('✅ *WhatsApp Disconnected.* \nAll session data has been wiped.', { parse_mode: 'Markdown' });
}

module.exports = {
  initialize, 
  whatsappCommand, 
  pairCommand, 
  startPairing,
  sendWhatsAppMessage, 
  disconnectWhatsApp, 
  whatsappSessions
};
