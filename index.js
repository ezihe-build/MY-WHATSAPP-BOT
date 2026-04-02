#!/usr/bin/env node

/**
 * EZIHE SUPER BOT - Main Entry Point (Root)
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const http = require('http');

// --- PATH CORRECTION: Pointing into the src folder ---
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const database = require('./src/utils/database');

const authHandler = require('./src/handlers/authHandler');
const menuHandler = require('./src/handlers/menuHandler');
const aiHandler = require('./src/handlers/aiHandler');
const adminHandler = require('./src/handlers/adminHandler');
const downloadHandler = require('./src/handlers/downloadHandler');
const utilityHandler = require('./src/handlers/utilityHandler');
const musicHandler = require('./src/handlers/musicHandler');
const movieHandler = require('./src/handlers/movieHandler');
const whatsappHandler = require('./src/handlers/whatsappHandler');

const authMiddleware = require('./src/middleware/authMiddleware');
const lockMiddleware = require('./src/middleware/lockMiddleware');

const bot = new Telegraf(config.botToken, { handlerTimeout: 90000 });

global.userSessions = new Map();
global.botLocked = false;

async function initialize() {
  // 1. RENDER KEEP-ALIVE (Fixes Port Timeout)
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('EZIHE BOT IS ALIVE');
  }).listen(process.env.PORT || 10000);
  console.log(chalk.green('✅ Keep-alive server active on port ' + (process.env.PORT || 10000)));

  // 2. Ensure Folders exist
  await fs.ensureDir(path.join(__dirname, 'data'));
  await fs.ensureDir(path.join(__dirname, 'downloads'));

  // 3. Init Database
  await database.initialize();

  // 4. Session Middleware
  bot.use((ctx, next) => {
    const userId = ctx.from?.id;
    if (userId && !global.userSessions.has(userId)) {
      global.userSessions.set(userId, { authenticated: false, waitingFor: null });
    }
    return next();
  });

  bot.use(lockMiddleware);

  // 5. Commands
  bot.command('start', authHandler.startCommand);
  bot.command('menu', authMiddleware, menuHandler.menuCommand);
  bot.command('pair', authMiddleware, whatsappHandler.pairCommand);
  bot.command('whatsapp', authMiddleware, whatsappHandler.whatsappCommand);

  // 6. Text Listener (The "Brain" for pairing)
  bot.on('text', authMiddleware, async (ctx, next) => {
    const userId = ctx.from?.id;
    const session = global.userSessions.get(userId);

    if (session?.waitingFor === 'whatsapp_phone') {
      console.log(`[SYSTEM] Received number ${ctx.message.text} from ${userId}`);
      session.waitingFor = null;
      return whatsappHandler.startPairing(ctx, ctx.message.text);
    }
    
    // Auto-link detection for social media
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(ctx.message.text)) {
      return downloadHandler.handleLinkDetection(ctx, ctx.message.text.match(urlRegex));
    }

    return next();
  });

  // 7. Cleanup & Launch (Fixes 409 Conflict)
  await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  await bot.launch();
  console.log(chalk.blue('🤖 Ezihe Bot is now fully online!'));
}

initialize().catch(err => console.error('Initialization failed:', err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
         
