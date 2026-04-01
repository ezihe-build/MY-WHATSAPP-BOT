/**
 * Main Menu Commands
 * General and navigation commands
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { exec } = require('child');
const util = require('util');
const execPromise = util.promisify(exec);

// Menu image path
const MENU_IMAGE = path.join(__dirname, '..', 'media', 'toji.jpg');

// Generate menu text
const generateMenuText = (ctx) => {
    const uptime = ctx.getUptime();
    
    return `
⌗ hello: ${ctx.pushName}
⌗ creator: EZIHE
⌗ runtime: ${uptime}
⌗ prefix: ${ctx.config.prefix}

━━━━━━━━━━━━━━━━━━
     📜 MAIN MENU
━━━━━━━━━━━━━━━━━━

${ctx.config.prefix}menu - Show this menu
${ctx.config.prefix}usermenu - User commands
${ctx.config.prefix}ownermenu - Owner commands
${ctx.config.prefix}funmenu - Fun commands
${ctx.config.prefix}bugmenu - Bug commands
${ctx.config.prefix}aimenu - AI commands
${ctx.config.prefix}searchmenu - Search commands

━━━━━━━━━━━━━━━━━━
   ⚡ QUICK ACCESS
━━━━━━━━━━━━━━━━━━

${ctx.config.prefix}ping - Check latency
${ctx.config.prefix}runtime - Bot uptime
${ctx.config.prefix}info - Bot information
${ctx.config.prefix}profile - Your profile

━━━━━━━━━━━━━━━━━━
`;
};

// Navigation buttons
const navigationButtons = [
    { id: '.usermenu', text: '👤 User Menu' },
    { id: '.funmenu', text: '🎮 Fun Menu' },
    { id: '.aimenu', text: '🤖 AI Menu' },
    { id: '.searchmenu', text: '🔍 Search Menu' },
    { id: '.ownermenu', text: '⚙️ Owner Menu' },
    { id: '.bugmenu', text: '🐞 Bug Menu' }
];

module.exports = {
    // Main menu
    menu: async (ctx) => {
        const menuText = generateMenuText(ctx);
        
        // Send menu with image
        await ctx.replyWithImage(MENU_IMAGE, menuText);
        
        // Send navigation buttons
        await ctx.replyWithButtons('📱 *Select a menu:*', navigationButtons, {
            footer: 'EZIHE-BOT © 2024'
        });
    },

    // Ping command
    ping: async (ctx) => {
        const start = Date.now();
        const msg = await ctx.reply('🏓 *Pong!*');
        const latency = Date.now() - start;
        
        await ctx.sock.sendMessage(ctx.jid, {
            text: `🏓 *Pong!*\n\n📡 Latency: ${latency}ms\n⏱️ Uptime: ${ctx.getUptime()}`,
            edit: msg.key
        });
    },

    // Runtime command
    runtime: async (ctx) => {
        const uptime = ctx.getUptime();
        const memory = process.memoryUsage();
        
        await ctx.reply(`
⏱️ *Bot Runtime*

🕐 Uptime: ${uptime}
💾 Memory Usage:
  • RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB
  • Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
  • Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB

🤖 ${ctx.config.botName} v${ctx.config.version}
        `);
    },

    // View once message viewer
    vv: async (ctx) => {
        if (!ctx.quoted) {
            return ctx.reply('❌ Please reply to a view-once message');
        }

        try {
            const buffer = await ctx.downloadMedia();
            if (!buffer) {
                return ctx.reply('❌ Could not download media');
            }

            const messageType = Object.keys(ctx.quoted)[0];
            
            if (messageType.includes('image')) {
                await ctx.sock.sendMessage(ctx.jid, { image: buffer });
            } else if (messageType.includes('video')) {
                await ctx.sock.sendMessage(ctx.jid, { video: buffer });
            } else if (messageType.includes('audio')) {
                await ctx.sock.sendMessage(ctx.jid, { audio: buffer, mimetype: 'audio/mp4' });
            } else {
                await ctx.reply('❌ Unsupported media type');
            }
        } catch (error) {
            await ctx.reply('❌ Error processing media');
        }
    },

    // Tag all members
    tag: async (ctx) => {
        if (!ctx.isGroup) {
            return ctx.reply('❌ This command can only be used in groups');
        }

        if (!ctx.isAdmin && !ctx.isOwner) {
            return ctx.reply('❌ Only admins can use this command');
        }

        const text = ctx.args.join(' ') || 'Attention everyone!';
        const participants = ctx.groupMetadata.participants.map(p => p.id);

        await ctx.sock.sendMessage(ctx.jid, {
            text: text,
            mentions: participants
        });
    },

    // Take/sticker command
    take: async (ctx) => {
        if (!ctx.quoted) {
            return ctx.reply('❌ Please reply to an image/video');
        }

        try {
            const packname = ctx.args.join(' ') || ctx.config.botName;
            const buffer = await ctx.downloadMedia();
            
            if (!buffer) {
                return ctx.reply('❌ Could not download media');
            }

            await ctx.sock.sendMessage(ctx.jid, {
                sticker: buffer,
                packname: packname,
                author: 'EZIHE-BOT'
            });
        } catch (error) {
            await ctx.reply('❌ Error creating sticker');
        }
    },

    // Sticker command
    sticker: async (ctx) => {
        if (!ctx.quoted) {
            return ctx.reply('❌ Please reply to an image/video');
        }

        try {
            const buffer = await ctx.downloadMedia();
            
            if (!buffer) {
                return ctx.reply('❌ Could not download media');
            }

            await ctx.sock.sendMessage(ctx.jid, {
                sticker: buffer,
                packname: ctx.config.botName,
                author: 'EZIHE-BOT'
            });
        } catch (error) {
            await ctx.reply('❌ Error creating sticker');
        }
    },

    // Play command (search and download audio)
    play: async (ctx) => {
        const query = ctx.args.join(' ');
        if (!query) {
            return ctx.reply('❌ Please provide a song name\nUsage: .play <song name>');
        }

        await ctx.reply('🔍 Searching...');

        try {
            const yts = require('yt-search');
            const search = await yts(query);
            const video = search.videos[0];

            if (!video) {
                return ctx.reply('❌ No results found');
            }

            await ctx.reply(`
🎵 *Found:* ${video.title}
👤 *Channel:* ${video.author.name}
⏱️ *Duration:* ${video.timestamp}
👁️ *Views:* ${video.views.toLocaleString()}

⬇️ Downloading audio...`);

            const ytdl = require('ytdl-core');
            const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
            
            let buffer = Buffer.from([]);
            stream.on('data', chunk => buffer = Buffer.concat([buffer, chunk]));
            
            stream.on('end', async () => {
                await ctx.sock.sendMessage(ctx.jid, {
                    audio: buffer,
                    mimetype: 'audio/mp4',
                    ptt: false
                }, { quoted: ctx.m });
            });

            stream.on('error', async () => {
                await ctx.reply('❌ Error downloading audio');
            });
        } catch (error) {
            await ctx.reply('❌ Error: ' + error.message);
        }
    },

    // To image command
    toimg: async (ctx) => {
        if (!ctx.quoted) {
            return ctx.reply('❌ Please reply to a sticker');
        }

        try {
            const buffer = await ctx.downloadMedia();
            if (!buffer) {
                return ctx.reply('❌ Could not download sticker');
            }

            await ctx.sock.sendMessage(ctx.jid, { image: buffer }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply('❌ Error converting sticker');
        }
    },

    // To MP3 command
    tomp3: async (ctx) => {
        if (!ctx.quoted) {
            return ctx.reply('❌ Please reply to a video');
        }

        await ctx.reply('⏳ Converting to audio...');

        try {
            const buffer = await ctx.downloadMedia();
            if (!buffer) {
                return ctx.reply('❌ Could not download video');
            }

            await ctx.sock.sendMessage(ctx.jid, {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply('❌ Error converting video');
        }
    },

    // To URL command (upload to catbox)
    tourl: async (ctx) => {
        if (!ctx.quoted) {
            return ctx.reply('❌ Please reply to an image/video/document');
        }

        await ctx.reply('⏳ Uploading...');

        try {
            const buffer = await ctx.downloadMedia();
            if (!buffer) {
                return ctx.reply('❌ Could not download media');
            }

            const FormData = require('form-data');
            const form = new FormData();
            form.append('fileToUpload', buffer, 'file.jpg');
            form.append('reqtype', 'fileupload');

            const response = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders()
            });

            await ctx.reply(`✅ *Upload Successful!*\n\n🔗 URL: ${response.data}`);
        } catch (error) {
            await ctx.reply('❌ Error uploading file');
        }
    },

    // Bot info
    info: async (ctx) => {
        await ctx.reply(`
🤖 *${ctx.config.botName} Information*

📌 Version: ${ctx.config.version}
👨‍💻 Owner: ${ctx.config.ownerName}
📞 Owner Number: ${ctx.config.ownerNumber}
🔧 Prefix: ${ctx.config.prefix}

⏱️ Uptime: ${ctx.getUptime()}
📅 Date: ${ctx.formatTime()}

💻 Node.js: ${process.version}
🖥️ Platform: ${process.platform}

━━━━━━━━━━━━━━━━━━
Thank you for using ${ctx.config.botName}!
        `);
    },

    // User profile
    profile: async (ctx) => {
        try {
            const user = await ctx.getUser(ctx.sender);
            const ppUrl = await ctx.bot.getProfilePicture(ctx.sender);
            
            const profileText = `
👤 *User Profile*

📱 Number: ${ctx.sender.split('@')[0]}
🏷️ Name: ${ctx.pushName}
🆔 JID: ${ctx.sender}

📊 Statistics:
  • Commands Used: ${user?.commandsUsed || 0}
  • Joined: ${user?.joined ? ctx.formatTime(new Date(user.joined)) : 'Unknown'}

👑 Status: ${ctx.isOwner ? 'Owner' : ctx.isAdmin ? 'Admin' : 'User'}
            `;

            if (ppUrl) {
                await ctx.sock.sendMessage(ctx.jid, {
                    image: { url: ppUrl },
                    caption: profileText
                }, { quoted: ctx.m });
            } else {
                await ctx.reply(profileText);
            }
        } catch (error) {
            await ctx.reply('❌ Error fetching profile');
        }
    },

    // Group info
    groupinfo: async (ctx) => {
        if (!ctx.isGroup) {
            return ctx.reply('❌ This command can only be used in groups');
        }

        try {
            const metadata = ctx.groupMetadata;
            const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            
            await ctx.reply(`
👥 *Group Information*

📛 Name: ${metadata.subject}
📝 Description: ${metadata.desc || 'No description'}
👤 Creator: ${metadata.owner?.split('@')[0] || 'Unknown'}

📊 Statistics:
  • Total Members: ${metadata.participants.length}
  • Admins: ${admins.length}
  • Created: ${ctx.formatTime(new Date(metadata.creation * 1000))}

🔒 Settings:
  • Restrict: ${metadata.restrict ? 'Yes' : 'No'}
  • Announce: ${metadata.announce ? 'Yes' : 'No'}
            `);
        } catch (error) {
            await ctx.reply('❌ Error fetching group info');
        }
    }
};
