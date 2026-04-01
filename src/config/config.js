/**
 * EZIHE SUPER BOT - Configuration
 */

require('dotenv').config();
const path = require('path');

module.exports = {
  // Bot Configuration
  botToken: process.env.BOT_TOKEN,
  ownerId: process.env.OWNER_ID,
  botPassword: process.env.BOT_PASSWORD || 'ezihe',
  sessionName: process.env.SESSION_NAME || 'ezihe-bot-session',

  // API Keys
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    stability: process.env.STABILITY_API_KEY,
    runway: process.env.RUNWAY_API_KEY,
  },

  // Database
  database: {
    path: process.env.DB_PATH || './data/ezihe_bot.db',
  },

  // Webhook Settings
  webhook: {
    url: process.env.WEBHOOK_URL,
    port: parseInt(process.env.WEBHOOK_PORT) || 3000,
  },

  // Paths
  paths: {
    root: path.join(__dirname, '../..'),
    downloads: path.join(__dirname, '../../downloads'),
    temp: path.join(__dirname, '../../temp'),
    logs: path.join(__dirname, '../../logs'),
    data: path.join(__dirname, '../../data'),
    assets: path.join(__dirname, '../../assets'),
  },

  // WhatsApp Configuration
  whatsapp: {
    enabled: true,
    sessionPath: path.join(__dirname, '../../data/whatsapp_sessions'),
  },

  // Bot Settings
  settings: {
    maxDownloadSize: 2000 * 1024 * 1024, // 2GB
    maxVideoDuration: 600, // 10 minutes
    commandCooldown: 1000, // 1 second
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxConcurrentDownloads: 3,
  },

  // Feature Flags
  features: {
    aiImageGen: true,
    aiVideoGen: true,
    youtubeDownload: true,
    tiktokDownload: true,
    instagramDownload: true,
    pinterestDownload: true,
    musicDownload: true,
    movieSearch: true,
    whatsappIntegration: true,
  },

  // Admin Settings
  admin: {
    allowedGroups: [],
    bannedUsers: [],
    premiumUsers: [],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/bot.log',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
};
