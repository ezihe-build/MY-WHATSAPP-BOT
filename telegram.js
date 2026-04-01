/**
 * Telegram Bot - Pairing System
 * Handles WhatsApp pairing via Telegram
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class TelegramPairing {
    constructor(config, onPairingCode) {
        this.config = config;
        this.onPairingCode = onPairingCode;
        this.pairingSessions = new Map();
        this.bot = null;
        this.init();
    }

    init() {
        if (!this.config.telegramToken || this.config.telegramToken === 'YOUR_TELEGRAM_BOT_TOKEN') {
            console.log(chalk.yellow('⚠️  Telegram bot token not configured. Pairing via Telegram disabled.'));
            return;
        }

        this.bot = new TelegramBot(this.config.telegramToken, { polling: true });
        this.setupHandlers();
        console.log(chalk.green('✅ Telegram bot initialized for pairing'));
    }

    setupHandlers() {
        // Start command
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const username = msg.from.username || msg.from.first_name;
            
            const welcomeText = `
🤖 *Welcome to ${this.config.botName} Pairing System*

Hello @${username}!

This bot helps you pair your WhatsApp number with ${this.config.botName}.

📱 *Available Commands:*
/pair - Start WhatsApp pairing process
/help - Show help information
/status - Check bot status

👨‍💻 *Owner:* @${this.config.ownerName}
            `;
            
            this.bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
        });

        // Pair command
        this.bot.onText(/\/pair/, (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            // Check if user already has an active pairing session
            if (this.pairingSessions.has(userId)) {
                this.bot.sendMessage(chatId, '⚠️ You already have an active pairing session. Please complete it or wait for it to expire.');
                return;
            }
            
            this.pairingSessions.set(userId, { step: 'waiting_number', timestamp: Date.now() });
            
            const pairText = `
📱 *WhatsApp Pairing*

Please send your WhatsApp number with country code.

*Format:* 
• 2348012345678 (for Nigeria)
• 919012345678 (for India)
• 14155552671 (for USA)

*Example:* 2348012345678

⏳ *Session expires in 5 minutes*
            `;
            
            this.bot.sendMessage(chatId, pairText, { parse_mode: 'Markdown' });
        });

        // Help command
        this.bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            
            const helpText = `
📖 *${this.config.botName} - Help*

*Pairing Commands:*
/pair - Start WhatsApp pairing
/status - Check bot status

*How to Pair:*
1. Send /pair command
2. Enter your WhatsApp number with country code
3. You will receive an 8-digit pairing code
4. Enter the code in WhatsApp when prompted
5. Your session will be saved automatically

*Note:* 
• Do not share your pairing code with anyone
• Codes expire after 5 minutes
• Each code can only be used once

For support, contact: @${this.config.ownerName}
            `;
            
            this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
        });

        // Status command
        this.bot.onText(/\/status/, (msg) => {
            const chatId = msg.chat.id;
            const activeSessions = this.pairingSessions.size;
            
            const statusText = `
📊 *${this.config.botName} Status*

🤖 Bot Name: ${this.config.botName}
👨‍💻 Owner: ${this.config.ownerName}
📱 Active Pairing Sessions: ${activeSessions}
⏰ Uptime: ${this.getUptime()}

✅ Bot is running normally
            `;
            
            this.bot.sendMessage(chatId, statusText, { parse_mode: 'Markdown' });
        });

        // Handle phone number input
        this.bot.on('message', async (msg) => {
            if (!msg.text || msg.text.startsWith('/')) return;
            
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const text = msg.text.trim();
            
            const session = this.pairingSessions.get(userId);
            if (!session) return;
            
            if (session.step === 'waiting_number') {
                // Validate phone number
                const phoneRegex = /^\d{10,15}$/;
                if (!phoneRegex.test(text)) {
                    this.bot.sendMessage(chatId, '❌ Invalid phone number. Please enter a valid number with country code (10-15 digits).');
                    return;
                }
                
                // Generate 8-digit pairing code
                const pairingCode = this.generatePairingCode();
                
                // Update session
                session.step = 'code_generated';
                session.phoneNumber = text;
                session.pairingCode = pairingCode;
                session.timestamp = Date.now();
                
                // Save to database
                this.savePairingCode(userId, text, pairingCode);
                
                // Notify callback
                if (this.onPairingCode) {
                    this.onPairingCode(text, pairingCode, userId);
                }
                
                const codeText = `
✅ *Pairing Code Generated!*

📱 Phone Number: ${text}
🔑 Pairing Code: *${pairingCode}*

*Instructions:*
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Select "Link with phone number instead"
5. Enter the code: *${pairingCode}*

⏳ *Code expires in 5 minutes*

⚠️ Do not share this code with anyone!
                `;
                
                this.bot.sendMessage(chatId, codeText, { parse_mode: 'Markdown' });
                
                // Set expiration
                setTimeout(() => {
                    this.pairingSessions.delete(userId);
                    this.bot.sendMessage(chatId, '⏳ Your pairing session has expired. Use /pair to start again.');
                }, 5 * 60 * 1000); // 5 minutes
            }
        });

        // Handle errors
        this.bot.on('polling_error', (error) => {
            console.log(chalk.red('Telegram polling error:'), error.message);
        });
    }

    generatePairingCode() {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    }

    savePairingCode(userId, phoneNumber, code) {
        try {
            const dbPath = path.join(__dirname, 'database', 'sessions.json');
            const data = fs.readJsonSync(dbPath) || { sessions: [], pairingCodes: {} };
            
            data.pairingCodes[userId] = {
                phoneNumber,
                code,
                timestamp: Date.now(),
                expiresAt: Date.now() + (5 * 60 * 1000)
            };
            
            fs.writeJsonSync(dbPath, data, { spaces: 2 });
        } catch (error) {
            console.error('Error saving pairing code:', error);
        }
    }

    getUptime() {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    // Notify user when WhatsApp is connected
    notifyConnected(userId, phoneNumber) {
        if (!this.bot) return;
        
        const message = `
✅ *WhatsApp Connected Successfully!*

📱 Phone Number: ${phoneNumber}
🤖 Bot: ${this.config.botName}

Your WhatsApp is now paired with the bot.
You can start using commands in WhatsApp.

Use /pair to connect another number.
        `;
        
        this.bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
        this.pairingSessions.delete(userId);
    }

    // Send message to owner
    notifyOwner(message) {
        if (!this.bot || !this.config.ownerTelegramId) return;
        
        this.bot.sendMessage(this.config.ownerTelegramId, message, { parse_mode: 'Markdown' });
    }

    stop() {
        if (this.bot) {
            this.bot.stopPolling();
            console.log(chalk.yellow('Telegram bot stopped'));
        }
    }
}

module.exports = TelegramPairing;
