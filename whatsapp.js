/**
 * WhatsApp Bot - Baileys Implementation
 * Handles WhatsApp connection and messaging
 */

const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    makeInMemoryStore,
    proto,
    jidDecode,
    getContentType,
    Browsers,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { Boom } = require('@hapi/boom');

class WhatsAppBot {
    constructor(config) {
        this.config = config;
        this.sock = null;
        this.store = null;
        this.qrCode = null;
        this.isConnected = false;
        this.messageHandler = null;
        this.connectionState = 'disconnected';
    }

    async initialize() {
        try {
            console.log(chalk.blue('🚀 Initializing WhatsApp Bot...'));
            
            // Create store
            this.store = makeInMemoryStore({ 
                logger: pino().child({ level: 'silent', stream: 'store' }) 
            });
            
            // Load auth state
            const { state, saveCreds } = await useMultiFileAuthState(
                path.join(__dirname, this.config.sessionName)
            );
            
            // Create socket
            this.sock = makeWASocket({
                logger: pino({ level: 'silent' }),
                printQRInTerminal: false,
                auth: state,
                browser: Browsers.macOS('Safari'),
                version: [2, 3000, 1015901307],
                getMessage: async (key) => {
                    const jid = jidDecode(key.remoteJid);
                    const msg = await this.store.loadMessage(jid, key.id);
                    return msg?.message || '';
                }
            });
            
            // Bind store
            this.store.bind(this.sock.ev);
            
            // Handle connection updates
            this.sock.ev.on('connection.update', async (update) => {
                await this.handleConnectionUpdate(update);
            });
            
            // Handle credentials update
            this.sock.ev.on('creds.update', saveCreds);
            
            // Handle messages
            this.sock.ev.on('messages.upsert', async (m) => {
                if (this.messageHandler) {
                    await this.messageHandler(m, this.sock);
                }
            });
            
            return this.sock;
        } catch (error) {
            console.error(chalk.red('❌ Error initializing WhatsApp:'), error);
            throw error;
        }
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            this.qrCode = qr;
            this.connectionState = 'qr_ready';
            console.log(chalk.yellow('📱 Scan QR code to connect'));
        }
        
        if (connection === 'close') {
            this.isConnected = false;
            this.connectionState = 'disconnected';
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(chalk.red('❌ Connection closed due to:'), lastDisconnect?.error?.message);
            
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Reconnecting...'));
                await this.initialize();
            }
        } else if (connection === 'open') {
            this.isConnected = true;
            this.connectionState = 'connected';
            console.log(chalk.green('✅ WhatsApp connected successfully!'));
            console.log(chalk.green(`👤 User: ${this.sock.user.id.split(':')[0]}`));
            
            // Send connection message to owner
            await this.sendOwnerNotification();
        }
    }

    async sendOwnerNotification() {
        try {
            const ownerJid = `${this.config.ownerNumber}@s.whatsapp.net`;
            const message = `✅ *${this.config.botName} Connected!*\n\n🤖 Bot is now online and ready to use.\n⏰ Time: ${new Date().toLocaleString()}`;
            
            await this.sendMessage(ownerJid, { text: message });
        } catch (error) {
            console.log(chalk.yellow('⚠️ Could not send owner notification'));
        }
    }

    // Send text message
    async sendMessage(jid, content, options = {}) {
        try {
            return await this.sock.sendMessage(jid, content, options);
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    // Send image with caption
    async sendImage(jid, imagePath, caption = '', options = {}) {
        try {
            const buffer = await fs.readFile(imagePath);
            return await this.sock.sendMessage(jid, {
                image: buffer,
                caption: caption,
                ...options
            });
        } catch (error) {
            console.error('Error sending image:', error);
            throw error;
        }
    }

    // Send button message
    async sendButtons(jid, text, buttons, options = {}) {
        try {
            const buttonMessage = {
                text: text,
                footer: options.footer || this.config.botName,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id || `btn_${index}`,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                ...options
            };
            
            return await this.sock.sendMessage(jid, buttonMessage);
        } catch (error) {
            console.error('Error sending buttons:', error);
            // Fallback to text message
            return await this.sendMessage(jid, { text });
        }
    }

    // Send list message
    async sendList(jid, title, text, sections, options = {}) {
        try {
            const listMessage = {
                text: text,
                footer: options.footer || this.config.botName,
                title: title,
                buttonText: options.buttonText || 'Select Option',
                sections: sections.map((section, idx) => ({
                    title: section.title || `Section ${idx + 1}`,
                    rows: section.rows.map((row, ridx) => ({
                        title: row.title,
                        rowId: row.id || `row_${idx}_${ridx}`,
                        description: row.description || ''
                    }))
                }))
            };
            
            return await this.sock.sendMessage(jid, listMessage);
        } catch (error) {
            console.error('Error sending list:', error);
            // Fallback to text message
            return await this.sendMessage(jid, { text });
        }
    }

    // Send interactive menu with image
    async sendMenu(jid, menuText, imagePath, buttons = []) {
        try {
            // Send image first
            if (imagePath && await fs.pathExists(imagePath)) {
                await this.sendImage(jid, imagePath, menuText);
            } else {
                await this.sendMessage(jid, { text: menuText });
            }
            
            // Send navigation buttons if provided
            if (buttons.length > 0) {
                await this.sendButtons(jid, '📱 *Quick Navigation*', buttons, {
                    footer: 'EZIHE-BOT © 2024'
                });
            }
        } catch (error) {
            console.error('Error sending menu:', error);
        }
    }

    // Send template message with quick replies
    async sendTemplate(jid, text, templateButtons, options = {}) {
        try {
            const templateMessage = {
                text: text,
                footer: options.footer || this.config.botName,
                templateButtons: templateButtons.map((btn, idx) => ({
                    index: idx + 1,
                    urlButton: btn.url ? {
                        displayText: btn.text,
                        url: btn.url
                    } : undefined,
                    callButton: btn.phone ? {
                        displayText: btn.text,
                        phoneNumber: btn.phone
                    } : undefined,
                    quickReplyButton: btn.id ? {
                        displayText: btn.text,
                        id: btn.id
                    } : undefined
                })).filter(btn => btn.urlButton || btn.callButton || btn.quickReplyButton)
            };
            
            return await this.sock.sendMessage(jid, templateMessage);
        } catch (error) {
            console.error('Error sending template:', error);
        }
    }

    // Download media from message
    async downloadMedia(message) {
        try {
            const type = Object.keys(message)[0];
            const msg = message[type];
            
            if (!msg || !msg.url) return null;
            
            const stream = await downloadContentFromMessage(msg, type.replace('Message', ''));
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
        } catch (error) {
            console.error('Error downloading media:', error);
            return null;
        }
    }

    // Get group metadata
    async getGroupMetadata(jid) {
        try {
            return await this.sock.groupMetadata(jid);
        } catch (error) {
            console.error('Error getting group metadata:', error);
            return null;
        }
    }

    // Check if user is admin
    async isAdmin(jid, userJid) {
        try {
            const metadata = await this.getGroupMetadata(jid);
            if (!metadata) return false;
            
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(userJid);
        } catch (error) {
            return false;
        }
    }

    // Check if user is owner
    isOwner(jid) {
        const number = jid.split('@')[0];
        return number === this.config.ownerNumber;
    }

    // Get user profile picture
    async getProfilePicture(jid) {
        try {
            return await this.sock.profilePictureUrl(jid, 'image');
        } catch (error) {
            return null;
        }
    }

    // Set message handler
    setMessageHandler(handler) {
        this.messageHandler = handler;
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.isConnected,
            state: this.connectionState,
            user: this.sock?.user?.id || null
        };
    }

    // Disconnect
    async disconnect() {
        if (this.sock) {
            await this.sock.logout();
            this.isConnected = false;
            console.log(chalk.yellow('WhatsApp disconnected'));
        }
    }
}

module.exports = WhatsAppBot;
