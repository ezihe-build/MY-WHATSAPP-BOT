/**
 * EZIHE-BOT - Main Entry Point
 * WhatsApp Bot with Telegram Pairing System
 */

const express = require('express');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

// Import modules
const config = require('./config');
const WhatsAppBot = require('./whatsapp');
const TelegramPairing = require('./telegram');
const MessageHandler = require('./handlers/messageHandler');

// Express app for Render
const app = express();
const PORT = config.port;

// Global bot instance
let whatsappBot = null;
let telegramBot = null;
let messageHandler = null;

// Start time for uptime calculation
const startTime = Date.now();

// Express routes for health check
app.get('/', (req, res) => {
    const status = whatsappBot ? whatsappBot.getStatus() : { connected: false, state: 'not_initialized' };
    
    res.json({
        status: 'online',
        bot: config.botName,
        version: config.version,
        whatsapp: status,
        uptime: getUptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/status', (req, res) => {
    const status = whatsappBot ? whatsappBot.getStatus() : { connected: false, state: 'not_initialized' };
    
    res.json({
        bot: config.botName,
        whatsapp: status,
        uptime: getUptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Uptime calculation
function getUptime() {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Initialize bots
async function initializeBots() {
    try {
        console.log(chalk.cyan('╔════════════════════════════════════════╗'));
        console.log(chalk.cyan('║         EZIHE-BOT v1.0.0               ║'));
        console.log(chalk.cyan('║   WhatsApp Bot + Telegram Pairing      ║'));
        console.log(chalk.cyan('╚════════════════════════════════════════╝'));
        console.log('');

        // Initialize WhatsApp bot
        console.log(chalk.blue('📱 Initializing WhatsApp Bot...'));
        whatsappBot = new WhatsAppBot(config);
        
        // Initialize message handler
        messageHandler = new MessageHandler(whatsappBot, config);
        whatsappBot.setMessageHandler((m, sock) => messageHandler.handle(m, sock));
        
        // Start WhatsApp
        await whatsappBot.initialize();
        
        // Initialize Telegram bot for pairing
        console.log(chalk.blue('🤖 Initializing Telegram Pairing Bot...'));
        telegramBot = new TelegramPairing(config, (phoneNumber, code, userId) => {
            console.log(chalk.green(`🔑 Pairing code generated for ${phoneNumber}: ${code}`));
        });
        
        console.log('');
        console.log(chalk.green('✅ All systems initialized successfully!'));
        console.log(chalk.cyan(`🌐 Server running on port ${PORT}`));
        console.log('');
        
    } catch (error) {
        console.error(chalk.red('❌ Error initializing bots:'), error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Shutting down gracefully...'));
    
    if (telegramBot) {
        telegramBot.stop();
    }
    
    if (whatsappBot) {
        await whatsappBot.disconnect();
    }
    
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n🛑 Shutting down gracefully...'));
    
    if (telegramBot) {
        telegramBot.stop();
    }
    
    if (whatsappBot) {
        await whatsappBot.disconnect();
    }
    
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ Uncaught Exception:'), error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('❌ Unhandled Rejection:'), reason);
});

// Start server
app.listen(PORT, () => {
    console.log(chalk.cyan(`🌐 Express server started on port ${PORT}`));
    initializeBots();
});

module.exports = { whatsappBot, telegramBot, getUptime };
