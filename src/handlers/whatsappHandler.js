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

async function whatsappCommand(ctx) {
  const userId = ctx.from.id;
  const session = await database.get('SELECT * FROM whatsapp_sessions WHERE user_id = ? AND is_active = 1', [userId]);

  if (session) {
    await ctx.reply(`📱 *WhatsApp Status*\n\n✅ Connected\n📞 Phone: ${session.phone_number}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Disconnect', callback_data: 'wa_disconnect' }]]
      }
    });
  } else {
    await ctx.reply(`📱 *WhatsApp Status*\n\n❌ Not Connected\n\nUse /pair to link your account.`, { parse_mode: 'Markdown' });
  }
}

async function pairCommand(ctx) {
  const userId = ctx.from.id;
  await ctx.reply(`🔗 *WhatsApp Pairing*\n\nEnter your phone number with country code (e.g., 2349035659542).\n\n*Note:* Reply directly to this message.`, {
    parse_mode: 'Markdown',
    reply_markup: { force_reply: true }
  });

  if (global.userSessions.has(userId)) {
    global.userSessions.get(userId).waitingFor = 'whatsapp_phone';
  }
}

async function startPairing(ctx, phoneNumber) {
  const userId = ctx.from.id;
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const processingMsg = await ctx.reply('⏳ Requesting 8-digit Pairing Code...');

  try {
    const sessionDir = path.join(config.paths.data, 'whatsapp_sessions', `user_${userId}`);
    await fs.ensureDir(sessionDir);
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      // Browser must be set like this for pairing codes to work
      browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    if (!sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          let code = await sock.requestPairingCode(cleanNumber);
          await ctx.telegram.editMessageText(
            processingMsg.chat.id,
            processingMsg.message_id,
            null,
            `✅ *WhatsApp Pairing Code*\n\nYour Code: \`${code}\`\n\n1. Open WhatsApp > Linked Devices\n2. Link with phone number\n3. Enter this code on your phone.`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          ctx.reply("❌ Error requesting code. Try again later.");
        }
      }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
      const { connection } = update;
      if (connection === 'open') {
        await ctx.reply('🎉 WhatsApp Linked Successfully!');
        await database.run(
          'INSERT OR REPLACE INTO whatsapp_sessions (user_id, phone_number, is_active) VALUES (?, ?, 1)',
          [userId, cleanNumber]
        );
      }
    });

    whatsappSessions.set(userId, { socket: sock });
  } catch (error) {
    logger.error('WA Error:', error);
    ctx.reply('❌ Connection failed.');
  }
}

async function sendWhatsAppMessage(ctx, jid, message) {
  const session = whatsappSessions.get(ctx.from.id);
  if (session) await session.socket.sendMessage(jid, { text: message });
}

async function disconnectWhatsApp(ctx) {
  const userId = ctx.from.id;
  const session = whatsappSessions.get(userId);
  if (session?.socket) await session.socket.logout();
  await database.run('UPDATE whatsapp_sessions SET is_active = 0 WHERE user_id = ?', [userId]);
  ctx.reply('Disconnected.');
}

module.exports = {
  initialize, whatsappCommand, pairCommand, startPairing,
  sendWhatsAppMessage, disconnectWhatsApp, whatsappSessions
};
