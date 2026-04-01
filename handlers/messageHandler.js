/**
 * Message Handler
 * Processes incoming WhatsApp messages and routes commands
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');

// Import command modules
const MenuCommands = require('../commands/menu');
const UserCommands = require('../commands/usermenu');
const OwnerCommands = require('../commands/ownermenu');
const FunCommands = require('../commands/funmenu');
const BugCommands = require('../commands/bugmenu');
const AICommands = require('../commands/aimenu');
const SearchCommands = require('../commands/searchmenu');

class MessageHandler {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.commands = new Map();
        this.cooldowns = new Map();
        this.startTime = Date.now();
        
        // Initialize commands
        this.initializeCommands();
    }

    initializeCommands() {
        // General commands
        this.registerCommand('menu', MenuCommands.menu, 'general');
        this.registerCommand('help', MenuCommands.menu, 'general');
        this.registerCommand('ping', MenuCommands.ping, 'general');
        this.registerCommand('runtime', MenuCommands.runtime, 'general');
        this.registerCommand('vv', MenuCommands.vv, 'general');
        this.registerCommand('tag', MenuCommands.tag, 'general');
        this.registerCommand('take', MenuCommands.take, 'general');
        this.registerCommand('play', MenuCommands.play, 'general');
        this.registerCommand('sticker', MenuCommands.sticker, 'general');
        this.registerCommand('toimg', MenuCommands.toimg, 'general');
        this.registerCommand('tomp3', MenuCommands.tomp3, 'general');
        this.registerCommand('tourl', MenuCommands.tourl, 'general');
        this.registerCommand('info', MenuCommands.info, 'general');
        this.registerCommand('profile', MenuCommands.profile, 'general');
        this.registerCommand('groupinfo', MenuCommands.groupinfo, 'general');

        // User menu commands
        this.registerCommand('usermenu', UserCommands.usermenu, 'user');
        this.registerCommand('setbio', UserCommands.setbio, 'user');
        this.registerCommand('getbio', UserCommands.getbio, 'user');
        this.registerCommand('tts', UserCommands.tts, 'user');
        this.registerCommand('quote', UserCommands.quote, 'user');
        this.registerCommand('translate', UserCommands.translate, 'user');
        this.registerCommand('shortlink', UserCommands.shortlink, 'user');
        this.registerCommand('weather', UserCommands.weather, 'user');
        this.registerCommand('timezone', UserCommands.timezone, 'user');
        this.registerCommand('emojimix', UserCommands.emojimix, 'user');
        this.registerCommand('calc', UserCommands.calc, 'user');
        this.registerCommand('timer', UserCommands.timer, 'user');
        this.registerCommand('remind', UserCommands.remind, 'user');
        this.registerCommand('note', UserCommands.note, 'user');
        this.registerCommand('getnote', UserCommands.getnote, 'user');
        this.registerCommand('delnote', UserCommands.delnote, 'user');
        this.registerCommand('listnotes', UserCommands.listnotes, 'user');

        // Owner menu commands
        this.registerCommand('ownermenu', OwnerCommands.ownermenu, 'owner');
        this.registerCommand('self', OwnerCommands.self, 'owner');
        this.registerCommand('public', OwnerCommands.public, 'owner');
        this.registerCommand('broadcast', OwnerCommands.broadcast, 'owner');
        this.registerCommand('block', OwnerCommands.block, 'owner');
        this.registerCommand('unblock', OwnerCommands.unblock, 'owner');
        this.registerCommand('ban', OwnerCommands.ban, 'owner');
        this.registerCommand('unban', OwnerCommands.unban, 'owner');
        this.registerCommand('setpp', OwnerCommands.setpp, 'owner');
        this.registerCommand('setname', OwnerCommands.setname, 'owner');
        this.registerCommand('restart', OwnerCommands.restart, 'owner');
        this.registerCommand('shutdown', OwnerCommands.shutdown, 'owner');
        this.registerCommand('eval', OwnerCommands.eval, 'owner');
        this.registerCommand('exec', OwnerCommands.exec, 'owner');
        this.registerCommand('getsession', OwnerCommands.getsession, 'owner');
        this.registerCommand('clearsession', OwnerCommands.clearsession, 'owner');
        this.registerCommand('addpremium', OwnerCommands.addpremium, 'owner');
        this.registerCommand('delpremium', OwnerCommands.delpremium, 'owner');

        // Fun menu commands
        this.registerCommand('funmenu', FunCommands.funmenu, 'fun');
        this.registerCommand('joke', FunCommands.joke, 'fun');
        this.registerCommand('meme', FunCommands.meme, 'fun');
        this.registerCommand('truth', FunCommands.truth, 'fun');
        this.registerCommand('dare', FunCommands.dare, 'fun');
        this.registerCommand('pickup', FunCommands.pickup, 'fun');
        this.registerCommand('insult', FunCommands.insult, 'fun');
        this.registerCommand('compliment', FunCommands.compliment, 'fun');
        this.registerCommand('trivia', FunCommands.trivia, 'fun');
        this.registerCommand('fact', FunCommands.fact, 'fun');
        this.registerCommand('roll', FunCommands.roll, 'fun');
        this.registerCommand('coin', FunCommands.coin, 'fun');
        this.registerCommand('8ball', FunCommands.eightball, 'fun');
        this.registerCommand('riddle', FunCommands.riddle, 'fun');
        this.registerCommand('wouldyou', FunCommands.wouldyou, 'fun');
        this.registerCommand('roast', FunCommands.roast, 'fun');
        this.registerCommand('ship', FunCommands.ship, 'fun');
        this.registerCommand('rate', FunCommands.rate, 'fun');

        // Bug menu commands (safe only)
        this.registerCommand('bugmenu', BugCommands.bugmenu, 'bug');
        this.registerCommand('stresstest', BugCommands.stresstest, 'bug');
        this.registerCommand('latency', BugCommands.latency, 'bug');
        this.registerCommand('spamdemo', BugCommands.spamdemo, 'bug');
        this.registerCommand('floodtest', BugCommands.floodtest, 'bug');
        this.registerCommand('debug', BugCommands.debug, 'bug');
        this.registerCommand('pingtest', BugCommands.pingtest, 'bug');
        this.registerCommand('connectiontest', BugCommands.connectiontest, 'bug');

        // AI menu commands
        this.registerCommand('aimenu', AICommands.aimenu, 'ai');
        this.registerCommand('ai', AICommands.ai, 'ai');
        this.registerCommand('chat', AICommands.chat, 'ai');
        this.registerCommand('aiimage', AICommands.aiimage, 'ai');
        this.registerCommand('code', AICommands.code, 'ai');
        this.registerCommand('explain', AICommands.explain, 'ai');
        this.registerCommand('summarize', AICommands.summarize, 'ai');
        this.registerCommand('story', AICommands.story, 'ai');
        this.registerCommand('rewrite', AICommands.rewrite, 'ai');
        this.registerCommand('improve', AICommands.improve, 'ai');
        this.registerCommand('translateai', AICommands.translateai, 'ai');
        this.registerCommand('grammar', AICommands.grammar, 'ai');
        this.registerCommand('essay', AICommands.essay, 'ai');
        this.registerCommand('poem', AICommands.poem, 'ai');
        this.registerCommand('lyricsai', AICommands.lyricsai, 'ai');
        this.registerCommand('recipe', AICommands.recipe, 'ai');
        this.registerCommand('advice', AICommands.advice, 'ai');

        // Search menu commands
        this.registerCommand('searchmenu', SearchCommands.searchmenu, 'search');
        this.registerCommand('google', SearchCommands.google, 'search');
        this.registerCommand('ytsearch', SearchCommands.ytsearch, 'search');
        this.registerCommand('yts', SearchCommands.ytsearch, 'search');
        this.registerCommand('imagesearch', SearchCommands.imagesearch, 'search');
        this.registerCommand('img', SearchCommands.imagesearch, 'search');
        this.registerCommand('lyrics', SearchCommands.lyrics, 'search');
        this.registerCommand('apk', SearchCommands.apk, 'search');
        this.registerCommand('github', SearchCommands.github, 'search');
        this.registerCommand('wiki', SearchCommands.wiki, 'search');
        this.registerCommand('wikipedia', SearchCommands.wiki, 'search');
        this.registerCommand('news', SearchCommands.news, 'search');
        this.registerCommand('movie', SearchCommands.movie, 'search');
        this.registerCommand('anime', SearchCommands.anime, 'search');
        this.registerCommand('manga', SearchCommands.manga, 'search');
        this.registerCommand('pinterest', SearchCommands.pinterest, 'search');
        this.registerCommand('tiktoksearch', SearchCommands.tiktoksearch, 'search');
        this.registerCommand('twittersearch', SearchCommands.twittersearch, 'search');
        this.registerCommand('spotifysearch', SearchCommands.spotifysearch, 'search');

        console.log(chalk.green(`✅ Loaded ${this.commands.size} commands`));
    }

    registerCommand(name, handler, category) {
        this.commands.set(name.toLowerCase(), {
            name: name.toLowerCase(),
            handler,
            category
        });
    }

    async handle(chatUpdate, sock) {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;

            // Get message content
            const messageType = Object.keys(m.message)[0];
            const messageContent = m.message[messageType];
            
            // Extract text from different message types
            let text = '';
            if (messageType === 'conversation') {
                text = messageContent;
            } else if (messageType === 'extendedTextMessage') {
                text = messageContent.text;
            } else if (messageType === 'imageMessage' && messageContent.caption) {
                text = messageContent.caption;
            } else if (messageType === 'videoMessage' && messageContent.caption) {
                text = messageContent.caption;
            } else if (messageType === 'buttonsResponseMessage') {
                text = messageContent.selectedButtonId;
            } else if (messageType === 'listResponseMessage') {
                text = messageContent.singleSelectReply.selectedRowId;
            }

            if (!text) return;

            // Parse command
            const prefix = this.config.prefix;
            if (!text.startsWith(prefix)) return;

            const args = text.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Get command
            const command = this.commands.get(commandName);
            if (!command) return;

            // Build context
            const ctx = await this.buildContext(m, sock, args, text);

            // Check cooldown
            if (this.isOnCooldown(ctx.sender, commandName)) {
                const remaining = this.getCooldownRemaining(ctx.sender, commandName);
                await ctx.reply(`⏳ Please wait ${remaining} seconds before using this command again.`);
                return;
            }

            // Check permissions
            if (command.category === 'owner' && !ctx.isOwner) {
                await ctx.reply(this.config.messages.ownerOnly);
                return;
            }

            // Execute command
            try {
                this.setCooldown(ctx.sender, commandName, 3); // 3 second cooldown
                await command.handler(ctx);
            } catch (error) {
                console.error(chalk.red(`Error executing command ${commandName}:`), error);
                await ctx.reply('❌ An error occurred while executing this command.');
            }

        } catch (error) {
            console.error(chalk.red('Error handling message:'), error);
        }
    }

    async buildContext(m, sock, args, fullText) {
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const sender = m.key.participant || m.key.remoteJid;
        const pushName = m.pushName || 'Unknown';
        
        // Get group metadata if in group
        let groupMetadata = null;
        let isAdmin = false;
        if (isGroup) {
            groupMetadata = await this.bot.getGroupMetadata(jid);
            isAdmin = await this.bot.isAdmin(jid, sender);
        }

        // Check if owner
        const isOwner = this.bot.isOwner(sender);

        // Get quoted message
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedJid = m.message.extendedTextMessage?.contextInfo?.participant;

        // Build context object
        const ctx = {
            // Message info
            m,
            sock,
            bot: this.bot,
            config: this.config,
            
            // Chat info
            jid,
            isGroup,
            sender,
            pushName,
            
            // Permissions
            isOwner,
            isAdmin,
            
            // Group info
            groupMetadata,
            
            // Command info
            args,
            fullText,
            command: args[0],
            
            // Quoted message
            quoted,
            quotedJid,
            
            // Reply functions
            reply: async (text, options = {}) => {
                return await this.bot.sendMessage(jid, { text }, { quoted: m, ...options });
            },
            
            replyWithImage: async (imagePath, caption = '', options = {}) => {
                return await this.bot.sendImage(jid, imagePath, caption, { quoted: m, ...options });
            },
            
            replyWithButtons: async (text, buttons, options = {}) => {
                return await this.bot.sendButtons(jid, text, buttons, { quoted: m, ...options });
            },
            
            replyWithList: async (title, text, sections, options = {}) => {
                return await this.bot.sendList(jid, title, text, sections, { quoted: m, ...options });
            },
            
            // Utility functions
            getUptime: () => {
                const uptime = Math.floor((Date.now() - this.startTime) / 1000);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                return `${hours}h ${minutes}m ${seconds}s`;
            },
            
            formatTime: (date = new Date()) => {
                return moment(date).format('YYYY-MM-DD HH:mm:ss');
            },
            
            // Database functions
            getUser: async (userJid = sender) => {
                return await this.getUser(userJid);
            },
            
            saveUser: async (userData) => {
                return await this.saveUser(userData);
            },
            
            isBanned: async (userJid = sender) => {
                return await this.isBanned(userJid);
            },
            
            // Media functions
            downloadMedia: async () => {
                if (quoted) {
                    return await this.bot.downloadMedia(quoted);
                }
                return null;
            },
            
            // React to message
            react: async (emoji) => {
                try {
                    await sock.sendMessage(jid, {
                        react: {
                            text: emoji,
                            key: m.key
                        }
                    });
                } catch (e) {}
            }
        };

        return ctx;
    }

    isOnCooldown(userJid, command) {
        const key = `${userJid}_${command}`;
        const cooldown = this.cooldowns.get(key);
        if (!cooldown) return false;
        return Date.now() < cooldown;
    }

    getCooldownRemaining(userJid, command) {
        const key = `${userJid}_${command}`;
        const cooldown = this.cooldowns.get(key);
        if (!cooldown) return 0;
        return Math.ceil((cooldown - Date.now()) / 1000);
    }

    setCooldown(userJid, command, seconds) {
        const key = `${userJid}_${command}`;
        this.cooldowns.set(key, Date.now() + (seconds * 1000));
    }

    async getUser(userJid) {
        try {
            const dbPath = path.join(__dirname, '..', 'database', 'users.json');
            const data = await fs.readJson(dbPath);
            return data.users.find(u => u.jid === userJid) || null;
        } catch (error) {
            return null;
        }
    }

    async saveUser(userData) {
        try {
            const dbPath = path.join(__dirname, '..', 'database', 'users.json');
            const data = await fs.readJson(dbPath);
            const index = data.users.findIndex(u => u.jid === userData.jid);
            
            if (index >= 0) {
                data.users[index] = { ...data.users[index], ...userData };
            } else {
                data.users.push(userData);
            }
            
            await fs.writeJson(dbPath, data, { spaces: 2 });
        } catch (error) {
            console.error('Error saving user:', error);
        }
    }

    async isBanned(userJid) {
        try {
            const dbPath = path.join(__dirname, '..', 'database', 'users.json');
            const data = await fs.readJson(dbPath);
            return data.banned.includes(userJid);
        } catch (error) {
            return false;
        }
    }
}

module.exports = MessageHandler;
