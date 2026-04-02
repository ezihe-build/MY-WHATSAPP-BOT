require('dotenv').config();
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion, 
  DisconnectReason 
} = require('@whiskeysockets/baileys');
const { Telegraf } = require('telegraf');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');
const express = require('express');

// --- 1. SETTINGS & CONFIG ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

// --- 2. KEEP-ALIVE SERVER (For Render) ---
app.get('/', (req, res) => res.send('Ezihe Super Bot is Running!'));
app.listen(PORT, () => console.log(`✅ Keep-alive server on port ${PORT}`));

// --- 3. WHATSAPP PAIRING HANDLER ---
async function startPairing(ctx, phoneNumber) {
  const userId = ctx.from.id;
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const statusMsg = await ctx.reply('⏳ *Connecting to WhatsApp Servers...*');

  try {
    // Setup unique session directory
    const sessionDir = path.join(process.cwd(), 'data', 'whatsapp_sessions', `user_${userId}`);
    await fs.ensureDir(sessionDir);
    await fs.emptyDir(sessionDir); // Ensure fresh start

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // FETCH LATEST VERSION FIX
    const { version } = await fetchLatestBaileysVersion();
    console.log(`[WA] Using Version: ${version.join('.')}`);

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
    });

    if (!sock.authState.creds.registered) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(cleanNumber);
          const displayCode = code?.match(/.{1,4}/g)?.join('-') || code;
          
          await ctx.telegram.editMessageText(
            ctx.chat.id, 
            statusMsg.message_id, 
            null, 
            `🔐 *YOUR PAIRING CODE:* \n\n\`${displayCode}\`\n\n1. Open WhatsApp > Linked Devices\n2. Link with phone number\n3. Enter this code.`, 
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          ctx.reply("❌ WhatsApp rejected the request. Wait 2 mins.");
        }
      }, 5000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
      if (update.connection === 'open') {
        ctx.reply('🎉 *WhatsApp Linked Successfully!*');
      }
    });

  } catch (error) {
    console.error(error);
    ctx.reply('⚠️ Pairing failed.');
  }
}

// --- 4. TELEGRAM COMMANDS ---
bot.start((ctx) => ctx.reply('Welcome! Use /pair 234xxxxxxxx to link WhatsApp.'));

bot.command('pair', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('Usage: /pair 234xxxxxxxx');
  await startPairing(ctx, args[1]);
});

// Placeholder for your other commands (/ai, /menu, etc.)
bot.command('ping', (ctx) => ctx.reply('Pong! Bot is alive.'));

// --- 5. LAUNCH ---
bot.launch().then(() => console.log('🚀 Telegram Bot Started!'));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
