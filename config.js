/**
 * EZIHE-BOT Configuration
 * WhatsApp Bot with Telegram Pairing System
 */

require('dotenv').config();

module.exports = {
    // Bot Info
    botName: process.env.BOT_NAME || 'EZIHE-BOT',
    version: '1.0.0',
    prefix: process.env.PREFIX || '.',
    ownerNumber: process.env.OWNER_NUMBER || '09035659542',
    ownerName: process.env.OWNER_NAME || 'EZIHE',
    ownerTelegramId: process.env.OWNER_ID || '8045084951',
    
    // Telegram Config
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    
    // Session Config
    sessionName: process.env.SESSION_NAME || 'ezihe-session',
    
    // Server Config
    port: process.env.PORT || 3000,
    
    // Bot Mode
    publicMode: true,
    
    // Messages
    messages: {
        wait: '⏳ Please wait...',
        success: '✅ Success!',
        error: '❌ Error occurred!',
        ownerOnly: '❌ This command is for owner only!',
        adminOnly: '❌ This command is for admins only!',
        groupOnly: '❌ This command can only be used in groups!',
        privateOnly: '❌ This command can only be used in private chat!'
    },
    
    // Menu Categories
    categories: {
        general: '📜 General',
        user: '👤 User',
        owner: '⚙️ Owner',
        fun: '🎮 Fun',
        bug: '🐞 Bug',
        ai: '🤖 AI',
        search: '🔍 Search'
    },
    
    // API Endpoints
    apis: {
        ai: 'https://api.openai.com/v1',
        weather: 'https://api.openweathermap.org/data/2.5',
        news: 'https://newsapi.org/v2'
    },
    
    // Feature Toggles
    features: {
        welcomeMessage: true,
        antiLink: false,
        autoRead: true,
        typingIndicator: true
    }
};

// Global configuration object
global.config = module.exports;
global.prefix = module.exports.prefix;
global.botName = module.exports.botName;
global.ownerNumber = module.exports.ownerNumber;
