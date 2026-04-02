/**
 * EZIHE SUPER BOT - WhatsApp Handler
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

async function whatsappCommand(ctx) {
  const userId = ctx.from.id;
  const session = await database.get('SELECT * FROM whatsapp_sessions WHERE user_id = ? AND is_active = 1', [userId]);

  if (session) {
    await ctx.reply(`✅ *WhatsApp Connected*\nPhone: \`${session.phone_number}\``, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply(`❌ *WhatsApp Not Linked*\nUse /pair to connect.`, { parse_mode: 'Markdown' });
  }
}

async function pairCommand(ctx) {
  const userId = ctx.from.id;
  
  // Set the state in the global map
  if (global.userSessions.has(userId)) {
    global.userSessions.get(userId).waitingFor = 'whatsapp_phone';
  }

  await ctx.reply("🔗 *WHATSAPP PAIRING*\n\nReply to this message with your phone number.\nExample: `2349035659542`", {
    parse_mode: 'Markdown',
    reply_markup: { force_reply: true }
  });
}

async function startPairing(ctx, phoneNumber) {
  const userId = ctx.from.id;
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const msg = await ctx.reply('⏳ *Connecting to WhatsApp Servers...*');

  try {
    // 1. Wipe old session data to prevent "Device already linked" error
    const sessionDir = path.join(process.cwd(), 'data', 'whatsapp_sessions', `user_${userId}`);
    await fs.emptyDir(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      // Modern browser string to avoid being blocked
      browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    if (!sock.authState.creds.registered) {
      // 2. Wait 5 seconds to let the connection stabilize
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(cleanNumber);
          const displayCode = code?.match(/.{1,4}/g)?.join('-') || code;

          await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, 
            `🔐 *PAIRING CODE:*\n\n👉 \`${displayCode}\` 👈\n\n1. WhatsApp > Linked Devices\n2. Link with phone number\n3. Enter this code.`, 
            { parse_mode: 'Markdown' });
        } catch (err) {
          ctx.reply("❌ *Error:* WhatsApp rejected the request. Please try again in 2 minutes.");
        }
      }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection } = update;
      if (connection === 'open') {
        await ctx.reply('🎉 *WhatsApp linked successfully!*');
        await database.run(
          'INSERT OR REPLACE INTO whatsapp_sessions (user_id, phone_number, is_active) VALUES (?, ?, 1)',
          [userId, cleanNumber]
        );
      }
    });

  } catch (error) {
    logger.error('WA Error:', error);
    ctx.reply('❌ Connection failed. Try again.');
  }
}

module.exports = { pairCommand, startPairing, whatsappCommand };
