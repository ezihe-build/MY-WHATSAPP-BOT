/**
 * EZIHE SUPER BOT - WhatsApp Handler
 * Handles WhatsApp integration and pairing
 */

const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const database = require('../utils/database');
const config = require('../config/config');

// Store active WhatsApp sessions
const whatsappSessions = new Map();

/**
 * Initialize WhatsApp handler
 */
async function initialize() {
  logger.info('WhatsApp handler initialized');
  
  // Load existing sessions
  try {
    const sessions = await database.all('SELECT * FROM whatsapp_sessions WHERE is_active = 1');
    for (const session of sessions) {
      // Reconnect existing sessions
      // This would require storing session credentials securely
    }
  } catch (err) {
    logger.error('Failed to load WhatsApp sessions:', err);
  }
}

/**
 * WhatsApp menu command
 */
async function whatsappCommand(ctx) {
  const userId = ctx.from.id;
  
  // Check if user has paired device
  const session = await database.get(
    'SELECT * FROM whatsapp_sessions WHERE user_id = ? AND is_active = 1',
    [userId]
  );

  if (session) {
    await ctx.reply(`
📱 <b>WhatsApp Integration</b>

✅ <b>Status:</b> Connected
📞 <b>Phone:</b> ${session.phone_number || 'Unknown'}

<b>Available Actions:</b>
• Send messages from Telegram
• Receive notifications
• Cross-platform sync

<b>Commands:</b>
/pair - Pair new device
/whatsapp - This menu
`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💬 Send Message', callback_data: 'wa_send' },
            { text: '⚙️ Settings', callback_data: 'wa_settings' }
          ],
          [
            { text: '🔗 Re-pair Device', callback_data: 'wa_pair' },
            { text: '❌ Disconnect', callback_data: 'wa_disconnect' }
          ]
        ]
      }
    });
  } else {
    await ctx.reply(`
📱 <b>WhatsApp Integration</b>

❌ <b>Status:</b> Not Connected

Connect your WhatsApp account to:
• Send messages from Telegram
• Receive WhatsApp notifications
• Use bot features on both platforms

<b>To connect:</b>
Use /pair command to start pairing
`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Pair Device', callback_data: 'wa_pair' }]
        ]
      }
    });
  }
}

/**
 * Pair device command
 */
async function pairCommand(ctx) {
  const userId = ctx.from.id;

  await ctx.reply(`
🔗 <b>WhatsApp Pairing</b>

To pair your WhatsApp account:

<b>Method 1: Pairing Code</b>
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Select "Link with phone number instead"
5. Enter your phone number

<b>Method 2: QR Code</b>
A QR code will be generated for you to scan.

<b>Enter your phone number with country code:</b>
Example: +1234567890

<i>Reply with your phone number to continue...</i>
`, {
    parse_mode: 'HTML',
    reply_markup: {
      force_reply: true,
      input_field_placeholder: '+1234567890'
    }
  });

  // Store that we're waiting for phone number
  const userSession = global.userSessions.get(userId);
  if (userSession) {
    userSession.waitingFor = 'whatsapp_phone';
  }
}

/**
 * Start WhatsApp connection with pairing code
 */
async function startPairing(ctx, phoneNumber) {
  const userId = ctx.from.id;
  
  const processingMsg = await ctx.reply('🔍 Initiating WhatsApp connection...');

  try {
    // Create session directory
    const sessionDir = path.join(config.paths.data, 'whatsapp_sessions', `user_${userId}`);
    await fs.ensureDir(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['EZIHE Bot', 'Chrome', '1.0.0']
    });

    // Store session
    whatsappSessions.set(userId, {
      socket: sock,
      phoneNumber: phoneNumber,
      status: 'connecting'
    });

    // Handle connection events
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Generate QR code image
        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          null,
          `📱 <b>Scan QR Code</b>

Scan this QR code with WhatsApp:
1. Open WhatsApp
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Scan the QR code

<i>QR code will expire in 60 seconds...</i>
`,
          { parse_mode: 'HTML' }
        );

        // Generate QR code as image and send
        try {
          const QRCode = require('qrcode');
          const qrBuffer = await QRCode.toBuffer(qr);
          
          await ctx.replyWithPhoto(
            { source: qrBuffer },
            {
              caption: '📱 Scan this QR code with WhatsApp'
            }
          );
        } catch (err) {
          // Fallback to terminal QR
          qrcode.generate(qr, { small: true });
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          logger.info(`WhatsApp disconnected for user ${userId}, reconnecting...`);
        } else {
          logger.info(`WhatsApp logged out for user ${userId}`);
          whatsappSessions.delete(userId);
          await database.run(
            'UPDATE whatsapp_sessions SET is_active = 0 WHERE user_id = ?',
            [userId]
          );
        }
      }

      if (connection === 'open') {
        await ctx.telegram.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          null,
          '✅ <b>WhatsApp Connected!</b>\n\nYour WhatsApp is now linked to the bot.'
        );

        // Save session to database
        await database.run(
          `INSERT OR REPLACE INTO whatsapp_sessions 
           (user_id, phone_number, session_data, is_active, created_at) 
           VALUES (?, ?, ?, 1, strftime('%s', 'now'))`,
          [userId, phoneNumber, JSON.stringify({})]
        );

        const session = whatsappSessions.get(userId);
        if (session) {
          session.status = 'connected';
        }

        logger.info(`WhatsApp connected for user ${userId}`);
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe) {
            // Forward received messages to Telegram
            const messageText = msg.message?.conversation || 
                               msg.message?.extendedTextMessage?.text || 
                               '[Media Message]';
            
            const sender = msg.key.remoteJid;
            
            await ctx.reply(`
📱 <b>New WhatsApp Message</b>

👤 From: ${sender}
💬 Message: ${messageText}

<i>Reply to send a message back</i>
`);
          }
        }
      }
    });

  } catch (error) {
    logger.error('WhatsApp pairing error:', error);
    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      null,
      `❌ <b>Connection Failed</b>\n\nError: ${error.message}\n\nPlease try again.`
    );
  }
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(ctx, phoneNumber, message) {
  const userId = ctx.from.id;
  const session = whatsappSessions.get(userId);

  if (!session || session.status !== 'connected') {
    return ctx.reply('❌ WhatsApp not connected. Use /pair to connect.');
  }

  try {
    const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    
    await session.socket.sendMessage(jid, { text: message });
    
    await ctx.reply(`✅ Message sent to ${phoneNumber}`);
  } catch (error) {
    logger.error('Send WhatsApp message error:', error);
    ctx.reply('❌ Failed to send message.');
  }
}

/**
 * Disconnect WhatsApp
 */
async function disconnectWhatsApp(ctx) {
  const userId = ctx.from.id;
  const session = whatsappSessions.get(userId);

  if (session && session.socket) {
    await session.socket.logout();
    whatsappSessions.delete(userId);
  }

  await database.run(
    'UPDATE whatsapp_sessions SET is_active = 0 WHERE user_id = ?',
    [userId]
  );

  await ctx.reply('✅ WhatsApp disconnected successfully.');
}

/**
 * Get user devices
 */
async function getUserDevices(userId) {
  return await database.all(
    'SELECT * FROM whatsapp_sessions WHERE user_id = ?',
    [userId]
  );
}

module.exports = {
  initialize,
  whatsappCommand,
  pairCommand,
  startPairing,
  sendWhatsAppMessage,
  disconnectWhatsApp,
  getUserDevices,
  whatsappSessions
};
