/**
 * User Menu Commands
 * User-related utilities and tools
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');

const MENU_IMAGE = path.join(__dirname, '..', 'media', 'toji.jpg');

// Notes storage
const notesPath = path.join(__dirname, '..', 'database', 'notes.json');

// Initialize notes file
const initNotes = async () => {
    if (!await fs.pathExists(notesPath)) {
        await fs.writeJson(notesPath, {}, { spaces: 2 });
    }
};
initNotes();

module.exports = {
    // User menu
    usermenu: async (ctx) => {
        const menuText = `
⌗ hello: ${ctx.pushName}
⌗ creator: EZIHE
⌗ runtime: ${ctx.getUptime()}
⌗ prefix: ${ctx.config.prefix}

━━━━━━━━━━━━━━━━━━
    👤 USER MENU
━━━━━━━━━━━━━━━━━━

*Profile Commands:*
${ctx.config.prefix}setbio <text> - Set your bio
${ctx.config.prefix}getbio - View your bio

*Utility Commands:*
${ctx.config.prefix}tts <text> - Text to speech
${ctx.config.prefix}quote - Random quote
${ctx.config.prefix}translate <lang> <text> - Translate text
${ctx.config.prefix}shortlink <url> - Shorten URL
${ctx.config.prefix}weather <city> - Weather info
${ctx.config.prefix}timezone <city> - Timezone info
${ctx.config.prefix}emojimix <emoji1> <emoji2> - Mix emojis
${ctx.config.prefix}calc <expression> - Calculator

*Reminder Commands:*
${ctx.config.prefix}timer <time> - Set timer
${ctx.config.prefix}remind <time> <text> - Set reminder

*Note Commands:*
${ctx.config.prefix}note <name> <text> - Save note
${ctx.config.prefix}getnote <name> - Get note
${ctx.config.prefix}delnote <name> - Delete note
${ctx.config.prefix}listnotes - List all notes

━━━━━━━━━━━━━━━━━━
        `;

        await ctx.replyWithImage(MENU_IMAGE, menuText);
    },

    // Set bio
    setbio: async (ctx) => {
        const bio = ctx.args.join(' ');
        if (!bio) {
            return ctx.reply('❌ Please provide a bio text\nUsage: .setbio <text>');
        }

        const user = await ctx.getUser(ctx.sender) || { jid: ctx.sender };
        user.bio = bio;
        await ctx.saveUser(user);

        await ctx.reply('✅ Bio updated successfully!');
    },

    // Get bio
    getbio: async (ctx) => {
        const user = await ctx.getUser(ctx.sender);
        if (!user || !user.bio) {
            return ctx.reply('❌ You have not set a bio yet\nUse .setbio <text> to set one');
        }

        await ctx.reply(`👤 *Your Bio:*\n\n${user.bio}`);
    },

    // Text to speech
    tts: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide text\nUsage: .tts <text>');
        }

        try {
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
            const response = await axios.get(url, { responseType: 'arraybuffer' });

            await ctx.sock.sendMessage(ctx.jid, {
                audio: Buffer.from(response.data),
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply('❌ Error generating audio');
        }
    },

    // Random quote
    quote: async (ctx) => {
        try {
            const quotes = [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
                { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
                { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
                { text: "Whoever is happy will make others happy too.", author: "Anne Frank" },
                { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
                { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
                { text: "Money and success don't change people; they merely amplify what is already there.", author: "Will Smith" },
                { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" }
            ];

            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            await ctx.reply(`📜 *Quote of the Day*\n\n"${quote.text}"\n\n— *${quote.author}*`);
        } catch (error) {
            await ctx.reply('❌ Error fetching quote');
        }
    },

    // Translate
    translate: async (ctx) => {
        if (ctx.args.length < 2) {
            return ctx.reply('❌ Usage: .translate <language> <text>\nExample: .translate es Hello world');
        }

        const lang = ctx.args[0];
        const text = ctx.args.slice(1).join(' ');

        try {
            const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
            const translation = response.data[0][0][0];

            await ctx.reply(`🌐 *Translation*\n\n*Original:* ${text}\n*Translated:* ${translation}\n*Language:* ${lang}`);
        } catch (error) {
            await ctx.reply('❌ Error translating text');
        }
    },

    // Shorten URL
    shortlink: async (ctx) => {
        const url = ctx.args[0];
        if (!url) {
            return ctx.reply('❌ Please provide a URL\nUsage: .shortlink <url>');
        }

        try {
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            await ctx.reply(`🔗 *URL Shortened*\n\n*Original:* ${url}\n*Short:* ${response.data}`);
        } catch (error) {
            await ctx.reply('❌ Error shortening URL');
        }
    },

    // Weather
    weather: async (ctx) => {
        const city = ctx.args.join(' ');
        if (!city) {
            return ctx.reply('❌ Please provide a city name\nUsage: .weather <city>');
        }

        try {
            // Using a free weather API
            const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            const data = response.data;
            const current = data.current_condition[0];

            await ctx.reply(`
🌤️ *Weather in ${city}*

🌡️ Temperature: ${current.temp_C}°C / ${current.temp_F}°F
💧 Humidity: ${current.humidity}%
🌬️ Wind: ${current.windspeedKmph} km/h
☁️ Condition: ${current.weatherDesc[0].value}
👁️ Visibility: ${current.visibility} km
            `);
        } catch (error) {
            await ctx.reply('❌ Error fetching weather data');
        }
    },

    // Timezone
    timezone: async (ctx) => {
        const city = ctx.args.join(' ');
        if (!city) {
            return ctx.reply('❌ Please provide a city/region\nUsage: .timezone <city>');
        }

        try {
            const time = moment().tz(city).format('YYYY-MM-DD HH:mm:ss');
            const offset = moment().tz(city).format('Z');

            await ctx.reply(`🕐 *Timezone: ${city}*\n\n📅 Date & Time: ${time}\n🌍 UTC Offset: ${offset}`);
        } catch (error) {
            await ctx.reply('❌ Invalid timezone. Try formats like: Africa/Lagos, Asia/Tokyo, America/New_York');
        }
    },

    // Emoji mix
    emojimix: async (ctx) => {
        if (ctx.args.length < 2) {
            return ctx.reply('❌ Please provide two emojis\nUsage: .emojimix <emoji1> <emoji2>');
        }

        const emoji1 = ctx.args[0];
        const emoji2 = ctx.args[1];

        try {
            const code1 = emoji1.codePointAt(0).toString(16);
            const code2 = emoji2.codePointAt(0).toString(16);
            
            const url = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${code1}/u${code1}_u${code2}.png`;
            
            await ctx.sock.sendMessage(ctx.jid, {
                image: { url: url },
                caption: `${emoji1} + ${emoji2} = Magic!`
            }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply('❌ Error mixing emojis. Try different emojis!');
        }
    },

    // Calculator
    calc: async (ctx) => {
        const expression = ctx.args.join(' ');
        if (!expression) {
            return ctx.reply('❌ Please provide an expression\nUsage: .calc <expression>\nExample: .calc 5 + 5');
        }

        try {
            // Safe evaluation
            const sanitized = expression.replace(/[^0-9+\-*/.()\s]/g, '');
            const result = Function('"use strict"; return (' + sanitized + ')')();

            await ctx.reply(`🧮 *Calculator*\n\n*Expression:* ${sanitized}\n*Result:* ${result}`);
        } catch (error) {
            await ctx.reply('❌ Invalid expression');
        }
    },

    // Timer
    timer: async (ctx) => {
        const time = ctx.args[0];
        if (!time) {
            return ctx.reply('❌ Please provide time\nUsage: .timer <time>\nExamples: .timer 5m, .timer 30s, .timer 1h');
        }

        const match = time.match(/^(\d+)([smh])$/);
        if (!match) {
            return ctx.reply('❌ Invalid time format. Use: 30s, 5m, 1h');
        }

        const value = parseInt(match[1]);
        const unit = match[2];
        let ms = value * 1000;
        if (unit === 'm') ms = value * 60 * 1000;
        if (unit === 'h') ms = value * 60 * 60 * 1000;

        await ctx.reply(`⏱️ Timer set for ${value}${unit}`);

        setTimeout(async () => {
            await ctx.sock.sendMessage(ctx.jid, {
                text: `⏰ @${ctx.sender.split('@')[0]}, your timer is up!`,
                mentions: [ctx.sender]
            });
        }, ms);
    },

    // Reminder
    remind: async (ctx) => {
        if (ctx.args.length < 2) {
            return ctx.reply('❌ Usage: .remind <time> <message>\nExample: .remind 10m Check the oven');
        }

        const time = ctx.args[0];
        const message = ctx.args.slice(1).join(' ');

        const match = time.match(/^(\d+)([smh])$/);
        if (!match) {
            return ctx.reply('❌ Invalid time format. Use: 30s, 5m, 1h');
        }

        const value = parseInt(match[1]);
        const unit = match[2];
        let ms = value * 1000;
        if (unit === 'm') ms = value * 60 * 1000;
        if (unit === 'h') ms = value * 60 * 60 * 1000;

        await ctx.reply(`✅ Reminder set for ${value}${unit}: "${message}"`);

        setTimeout(async () => {
            await ctx.sock.sendMessage(ctx.jid, {
                text: `🔔 @${ctx.sender.split('@')[0]}, REMINDER:\n\n${message}`,
                mentions: [ctx.sender]
            });
        }, ms);
    },

    // Save note
    note: async (ctx) => {
        if (ctx.args.length < 2) {
            return ctx.reply('❌ Usage: .note <name> <content>\nExample: .note shopping Buy milk and eggs');
        }

        const name = ctx.args[0];
        const content = ctx.args.slice(1).join(' ');
        const userId = ctx.sender.split('@')[0];

        try {
            const notes = await fs.readJson(notesPath);
            if (!notes[userId]) notes[userId] = {};
            notes[userId][name] = {
                content,
                created: new Date().toISOString()
            };
            await fs.writeJson(notesPath, notes, { spaces: 2 });

            await ctx.reply(`✅ Note "${name}" saved successfully!`);
        } catch (error) {
            await ctx.reply('❌ Error saving note');
        }
    },

    // Get note
    getnote: async (ctx) => {
        const name = ctx.args[0];
        if (!name) {
            return ctx.reply('❌ Please provide note name\nUsage: .getnote <name>');
        }

        const userId = ctx.sender.split('@')[0];

        try {
            const notes = await fs.readJson(notesPath);
            const note = notes[userId]?.[name];

            if (!note) {
                return ctx.reply(`❌ Note "${name}" not found`);
            }

            await ctx.reply(`📝 *Note: ${name}*\n\n${note.content}\n\n_Created: ${ctx.formatTime(new Date(note.created))}_`);
        } catch (error) {
            await ctx.reply('❌ Error reading note');
        }
    },

    // Delete note
    delnote: async (ctx) => {
        const name = ctx.args[0];
        if (!name) {
            return ctx.reply('❌ Please provide note name\nUsage: .delnote <name>');
        }

        const userId = ctx.sender.split('@')[0];

        try {
            const notes = await fs.readJson(notesPath);
            if (!notes[userId]?.[name]) {
                return ctx.reply(`❌ Note "${name}" not found`);
            }

            delete notes[userId][name];
            await fs.writeJson(notesPath, notes, { spaces: 2 });

            await ctx.reply(`✅ Note "${name}" deleted successfully!`);
        } catch (error) {
            await ctx.reply('❌ Error deleting note');
        }
    },

    // List notes
    listnotes: async (ctx) => {
        const userId = ctx.sender.split('@')[0];

        try {
            const notes = await fs.readJson(notesPath);
            const userNotes = notes[userId] || {};
            const noteNames = Object.keys(userNotes);

            if (noteNames.length === 0) {
                return ctx.reply('📭 You have no saved notes\nUse .note <name> <content> to create one');
            }

            const list = noteNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
            await ctx.reply(`📝 *Your Notes (${noteNames.length})*\n\n${list}\n\nUse .getnote <name> to view a note`);
        } catch (error) {
            await ctx.reply('❌ Error listing notes');
        }
    }
};
