#!/usr/bin/env node

/**
 * EZIHE SUPER BOT - All-in-One Telegram & WhatsApp Bot
 * Version: 2.0.0
 * Features: AI, Media Downloads, Admin Panel, WhatsApp Integration
 */

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Import configurations and utilities
const config = require('./config/config');
const logger = require('./utils/logger');
const database = require('./utils/database');

// Import command handlers
const authHandler = require('./handlers/authHandler');
const menuHandler = require('./handlers/menuHandler');
//const mediaHandler = require('./handlers/mediaHandler');
const aiHandler = require('./handlers/aiHandler');
const adminHandler = require('./handlers/adminHandler');
const downloadHandler = require('./handlers/downloadHandler');
const utilityHandler = require('./handlers/utilityHandler');
const musicHandler = require('./handlers/musicHandler');
const movieHandler = require('./handlers/movieHandler');

// Import WhatsApp handler
const whatsappHandler = require('./handlers/whatsappHandler');

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');
const lockMiddleware = require('./middleware/lockMiddleware');

// Initialize bot
const bot = new Telegraf(config.botToken, {
  handlerTimeout: 90000,
});

// Store for user sessions
global.userSessions = new Map();
global.botLocked = false;
global.whatsAppSessions = new Map();

// Banner ASCII Art
const banner = `
${chalk.cyan('╔══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                                                              ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.yellow('███████╗███████╗██╗██╗  ██╗███████╗')}   ${chalk.magenta('SUPER BOT v2.0')}      ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.yellow('██╔════╝╚══███╔╝██║██║  ██║██╔════╝')}                        ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.yellow('█████╗    ███╔╝ ██║███████║█████╗  ')}   ${chalk.green('● Telegram')}          ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.yellow('██╔══╝   ███╔╝  ██║██╔══██║██╔══╝  ')}   ${chalk.green('● WhatsApp')}          ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.yellow('███████╗███████╗██║██║  ██║███████╗')}   ${chalk.green('● AI Powered')}        ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.yellow('╚══════╝╚══════╝╚═╝╚═╝  ╚═╝╚══════╝')}                        ${chalk.cyan('║')}
${chalk.cyan('║')}                                                              ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════════════════════╝')}
`;

// Initialize function
async function initialize() {
  console.log(banner);
  logger.info('Starting EZIHE Super Bot...');

  // Ensure directories exist
  await fs.ensureDir(config.paths.downloads);
  await fs.ensureDir(config.paths.temp);
  await fs.ensureDir(config.paths.logs);
  await fs.ensureDir(config.paths.data);

  // Initialize database
  await database.initialize();
  logger.info('Database initialized');

  // Set up bot middleware
  setupMiddleware();
  
  // Set up bot commands
  setupCommands();
  
  // Set up action handlers
  setupActions();

  // Initialize WhatsApp handler
  if (config.whatsapp.enabled) {
    await whatsappHandler.initialize();
  }

  // Start bot
  await bot.launch();
  
  logger.info('Bot started successfully!');
  logger.info(`Bot username: @${bot.botInfo?.username || 'unknown'}`);
  logger.info(`Owner ID: ${config.ownerId}`);
  
  console.log(chalk.green('\n✅ Bot is running!'));
  console.log(chalk.cyan(`📱 Bot Link: https://t.me/${bot.botInfo?.username || 'your_bot'}`));
  console.log(chalk.yellow('\nPress Ctrl+C to stop the bot\n'));
}

// Setup middleware
function setupMiddleware() {
  // Session middleware
  bot.use((ctx, next) => {
    const userId = ctx.from?.id;
    if (userId) {
      if (!global.userSessions.has(userId)) {
        global.userSessions.set(userId, {
          authenticated: false,
          lastActivity: Date.now(),
          commandCount: 0,
          preferences: {}
        });
      }
      ctx.session = global.userSessions.get(userId);
    }
    return next();
  });

  // Logging middleware
  bot.use((ctx, next) => {
    if (ctx.message || ctx.callbackQuery) {
      const user = ctx.from;
      const chat = ctx.chat;
      logger.info(`[${chat?.type || 'private'}] User ${user?.id} (${user?.username || 'no_username'}): ${ctx.message?.text || ctx.callbackQuery?.data || 'callback'}`);
    }
    return next();
  });

  // Lock middleware for bot lock feature
  bot.use(lockMiddleware);
}

// Setup commands
function setupCommands() {
  // Start command
  bot.command('start', authHandler.startCommand);

  // Password command
  bot.command('password', authHandler.passwordCommand);

  // Menu command
  bot.command('menu', authMiddleware, menuHandler.menuCommand);

  // Help command
  bot.command('help', authMiddleware, menuHandler.helpCommand);

  // Admin commands
  bot.command('admin', authMiddleware, adminHandler.adminCommand);
  bot.command('lock', authMiddleware, adminHandler.lockCommand);
  bot.command('unlock', authMiddleware, adminHandler.unlockCommand);
  bot.command('tagall', authMiddleware, adminHandler.tagallCommand);
  bot.command('ban', authMiddleware, adminHandler.banCommand);
  bot.command('unban', authMiddleware, adminHandler.unbanCommand);
  bot.command('settings', authMiddleware, adminHandler.settingsCommand);

  // Media download commands
  bot.command('yt', authMiddleware, downloadHandler.youtubeCommand);
  bot.command('tiktok', authMiddleware, downloadHandler.tiktokCommand);
  bot.command('ig', authMiddleware, downloadHandler.instagramCommand);
  bot.command('pinterest', authMiddleware, downloadHandler.pinterestCommand);

  // AI commands
  bot.command('aiimg', authMiddleware, aiHandler.imageCommand);
  bot.command('aivid', authMiddleware, aiHandler.videoCommand);
  bot.command('ai', authMiddleware, aiHandler.chatCommand);

  // Music commands
  bot.command('music', authMiddleware, musicHandler.musicCommand);
  bot.command('play', authMiddleware, musicHandler.playCommand);

  // Movie commands
  bot.command('movie', authMiddleware, movieHandler.movieCommand);
  bot.command('searchmovie', authMiddleware, movieHandler.searchCommand);

  // Utility commands
  bot.command('stats', authMiddleware, utilityHandler.statsCommand);
  bot.command('ping', authMiddleware, utilityHandler.pingCommand);
  bot.command('info', authMiddleware, utilityHandler.infoCommand);

  // WhatsApp commands
  bot.command('whatsapp', authMiddleware, whatsappHandler.whatsappCommand);
  bot.command('pair', authMiddleware, whatsappHandler.pairCommand);

  // Owner commands
  bot.command('broadcast', authMiddleware, adminHandler.broadcastCommand);
  bot.command('addpremium', authMiddleware, adminHandler.addPremiumCommand);
  bot.command('removepremium', authMiddleware, adminHandler.removePremiumCommand);

  // Handle text messages (for WhatsApp pairing AND link detection)
  bot.on('text', authMiddleware, async (ctx, next) => {
    const userId = ctx.from?.id;
    const userSession = global.userSessions.get(userId);

    // FIX: Catch the phone number for WhatsApp pairing
    if (userSession && userSession.waitingFor === 'whatsapp_phone') {
      const phoneNumber = ctx.message.text;
      // Clear the waiting state so it doesn't get stuck in a loop
      userSession.waitingFor = null;
      // Send the number to the WhatsApp handler!
      return whatsappHandler.startPairing(ctx, phoneNumber);
    }

    const text = ctx.message.text;
    
    // Check for URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    
    if (urls) {
      await downloadHandler.handleLinkDetection(ctx, urls);
    } else {
      await next();
    }
  });

  // Handle inline queries
  bot.on('inline_query', authMiddleware, menuHandler.inlineQueryHandler);
}

// Setup action handlers (button callbacks)
function setupActions() {
  // Menu actions
  bot.action('menu_main', authMiddleware, menuHandler.mainMenuAction);
  //bot.action('menu_media', authMiddleware, menuHandler.mediaMenuAction);
  bot.action('menu_ai', authMiddleware, menuHandler.aiMenuAction);
  bot.action('menu_admin', authMiddleware, menuHandler.adminMenuAction);
  bot.action('menu_download', authMiddleware, menuHandler.downloadMenuAction);
  bot.action('menu_utility', authMiddleware, menuHandler.utilityMenuAction);
  bot.action('menu_music', authMiddleware, menuHandler.musicMenuAction);
  bot.action('menu_movie', authMiddleware, menuHandler.movieMenuAction);
  bot.action('menu_whatsapp', authMiddleware, menuHandler.whatsappMenuAction);

  // Download quality selection
  bot.action(/quality_(.+)/, authMiddleware, downloadHandler.qualityAction);
  
  // Admin actions
  bot.action(/admin_(.+)/, authMiddleware, adminHandler.adminAction);
  
  // AI actions
  bot.action(/ai_(.+)/, authMiddleware, aiHandler.aiAction);

  // Handle back buttons
  bot.action('back_main', authMiddleware, menuHandler.mainMenuAction);
}

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again later.').catch(() => {});
});

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// Run initialization
initialize().catch(err => {
  logger.error('Failed to initialize bot:', err);
  console.error(chalk.red('Failed to start bot:'), err.message);
  process.exit(1);
});

module.exports = bot;
  
