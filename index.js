#!/usr/bin/env node
/**
 * EZIHE SUPER BOT - Main Entry Point
 */
require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const http = require('http');

// Import your modules from the src folder
const config = require('./src/config/config');
const database = require('./src/utils/database');
const whatsappHandler = require('./src/handlers/whatsappHandler');
const authHandler = require('./src/handlers/authHandler');
const authMiddleware = require('./src/middleware/authMiddleware');

const app = express();
const bot = new Telegraf(config.botToken);

// GLOBAL SESSIONS
global.userSessions = new Map();

async function initialize() {
  // 1. RENDER HEALTH CHECK (Fixes "No open ports detected")
  app.get('/', (req, res) => res.send('Bot is running!'));
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => {
    console.log(`Keep-alive server listening on port ${PORT}`);
  });

  // 2. Ensure Folders exist
  await fs.ensureDir(path.join(process.cwd(), 'data/whatsapp_sessions'));

  // 3. Initialize Database
  await database.initialize();

  // 4. Session Middleware
  bot.use((ctx, next) => {
    const userId = ctx.from?.id;
    if (userId && !global.userSessions.has(userId)) {
      global.userSessions.set(userId, { authenticated: false, waitingFor: null });
    }
    return next();
  });

  // 5. Bot Commands
  bot.command('start', authHandler.startCommand);
  bot.command('pair', authMiddleware, whatsappHandler.pairCommand);

  // 6. Handling Phone Number Input for WhatsApp
  bot.on('text', authMiddleware, async (ctx, next) => {
    const session = global.userSessions.get(ctx.from?.id);
    if (session?.waitingFor === 'whatsapp_phone') {
      session.waitingFor = null;
      return whatsappHandler.startPairing(ctx, ctx.message.text);
    }
    return next();
  });

  // 7. CLEAR WEBHOOKS (Fixes "409: Conflict")
  await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  
  // 8. Launch Bot
  bot.launch();
  console.log('✅ Bot started successfully from Root!');
}

initialize().catch(err => console.error('Start Error:', err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
