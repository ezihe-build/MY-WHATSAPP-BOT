/**
 * Owner Menu Commands
 * Owner-only administrative commands
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const MENU_IMAGE = path.join(__dirname, '..', 'media', 'toji.jpg');

module.exports = {
    // Owner menu
    ownermenu: async (ctx) => {
        const menuText = `
⌗ hello: ${ctx.pushName}
⌗ creator: EZIHE
⌗ runtime: ${ctx.getUptime()}
⌗ prefix: ${ctx.config.prefix}

━━━━━━━━━━━━━━━━━━
   ⚙️ OWNER MENU
━━━━━━━━━━━━━━━━━━

*Bot Mode:*
${ctx.config.prefix}self - Set bot to self mode
${ctx.config.prefix}public - Set bot to public mode

*User Management:*
${ctx.config.prefix}block <number> - Block user
${ctx.config.prefix}unblock <number> - Unblock user
${ctx.config.prefix}ban <number> - Ban user
${ctx.config.prefix}unban <number> - Unban user
${ctx.config.prefix}addpremium <number> - Add premium user
${ctx.config.prefix}delpremium <number> - Remove premium user

*Broadcast:*
${ctx.config.prefix}broadcast <text> - Send to all chats

*Profile:*
${ctx.config.prefix}setpp - Set bot profile picture
${ctx.config.prefix}setname <name> - Set bot name

*System:*
${ctx.config.prefix}restart - Restart bot
${ctx.config.prefix}shutdown - Shutdown bot
${ctx.config.prefix}eval <code> - Evaluate code
${ctx.config.prefix}exec <command> - Execute shell command

*Session:*
${ctx.config.prefix}getsession - Get session info
${ctx.config.prefix}clearsession - Clear session data

━━━━━━━━━━━━━━━━━━
⚠️ These commands are for owner only!
        `;

        await ctx.replyWithImage(MENU_IMAGE, menuText);
    },

    // Self mode
    self: async (ctx) => {
        ctx.config.publicMode = false;
        await ctx.reply('🔒 Bot set to *SELF MODE*\n\nOnly owner can use commands now.');
    },

    // Public mode
    public: async (ctx) => {
        ctx.config.publicMode = true;
        await ctx.reply('🔓 Bot set to *PUBLIC MODE*\n\nEveryone can use commands now.');
    },

    // Block user
    block: async (ctx) => {
        const number = ctx.args[0];
        if (!number) {
            return ctx.reply('❌ Please provide a number\nUsage: .block <number>');
        }

        try {
            const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
            await ctx.sock.updateBlockStatus(jid, 'block');
            await ctx.reply(`✅ Blocked ${number}`);
        } catch (error) {
            await ctx.reply('❌ Error blocking user');
        }
    },

    // Unblock user
    unblock: async (ctx) => {
        const number = ctx.args[0];
        if (!number) {
            return ctx.reply('❌ Please provide a number\nUsage: .unblock <number>');
        }

        try {
            const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
            await ctx.sock.updateBlockStatus(jid, 'unblock');
            await ctx.reply(`✅ Unblocked ${number}`);
        } catch (error) {
            await ctx.reply('❌ Error unblocking user');
        }
    },

    // Ban user
    ban: async (ctx) => {
        const number = ctx.args[0];
        if (!number) {
            return ctx.reply('❌ Please provide a number\nUsage: .ban <number>');
        }

        try {
            const dbPath = path.join(__dirname, '..', 'database', 'users.json');
            const data = await fs.readJson(dbPath);
            const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
            
            if (!data.banned.includes(jid)) {
                data.banned.push(jid);
                await fs.writeJson(dbPath, data, { spaces: 2 });
            }

            await ctx.reply(`✅ Banned ${number}`);
        } catch (error) {
            await ctx.reply('❌ Error banning user');
        }
    },

    // Unban user
    unban: async (ctx) => {
        const number = ctx.args[0];
        if (!number) {
            return ctx.reply('❌ Please provide a number\nUsage: .unban <number>');
        }

        try {
            const dbPath = path.join(__dirname, '..', 'database', 'users.json');
            const data = await fs.readJson(dbPath);
            const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
            
            data.banned = data.banned.filter(b => b !== jid);
            await fs.writeJson(dbPath, data, { spaces: 2 });

            await ctx.reply(`✅ Unbanned ${number}`);
        } catch (error) {
            await ctx.reply('❌ Error unbanning user');
        }
    },

    // Add premium user
    addpremium: async (ctx) => {
        const number = ctx.args[0];
        if (!number) {
            return ctx.reply('❌ Please provide a number\nUsage: .addpremium <number>');
        }

        try {
            const dbPath = path.join(__dirname, '..', 'database', 'users.json');
            const data = await fs.readJson(dbPath);
            const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
            
            if (!data.premium.includes(jid)) {
                data.premium.push(jid);
                await fs.writeJson(dbPath, data, { spaces: 2 });
            }

            await ctx.reply(`✅ Added ${number} to premium users`);
        } catch (error) {
            await ctx.reply('❌ Error adding premium user');
        }
    },

    // Remove premium user
    delpremium: async (ctx) => {
        const number = ctx.args[0];
        if (!number) {
            return ctx.reply('❌ Please provide a number\nUsage: .delpremium <number>');
        }

        try {
            const dbPath = path.join(__dirname, '..', 'database', 'users.json');
            const data = await fs.readJson(dbPath);
            const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
            
            data.premium = data.premium.filter(p => p !== jid);
            await fs.writeJson(dbPath, data, { spaces: 2 });

            await ctx.reply(`✅ Removed ${number} from premium users`);
        } catch (error) {
            await ctx.reply('❌ Error removing premium user');
        }
    },

    // Broadcast message
    broadcast: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide a message\nUsage: .broadcast <text>');
        }

        await ctx.reply('📢 Broadcasting message...');

        try {
            const chats = ctx.sock.chats || [];
            let sent = 0;
            let failed = 0;

            for (const [jid, chat] of Object.entries(chats)) {
                try {
                    if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net')) {
                        await ctx.sock.sendMessage(jid, {
                            text: `📢 *Broadcast*\n\n${text}\n\n_From: ${ctx.config.botName}_`
                        });
                        sent++;
                        await new Promise(r => setTimeout(r, 1000)); // Delay to avoid rate limit
                    }
                } catch (e) {
                    failed++;
                }
            }

            await ctx.reply(`✅ Broadcast completed!\n\n📤 Sent: ${sent}\n❌ Failed: ${failed}`);
        } catch (error) {
            await ctx.reply('❌ Error broadcasting message');
        }
    },

    // Set profile picture
    setpp: async (ctx) => {
        if (!ctx.quoted) {
            return ctx.reply('❌ Please reply to an image');
        }

        try {
            const buffer = await ctx.downloadMedia();
            if (!buffer) {
                return ctx.reply('❌ Could not download image');
            }

            await ctx.sock.updateProfilePicture(ctx.sock.user.id, buffer);
            await ctx.reply('✅ Profile picture updated!');
        } catch (error) {
            await ctx.reply('❌ Error updating profile picture');
        }
    },

    // Set bot name
    setname: async (ctx) => {
        const name = ctx.args.join(' ');
        if (!name) {
            return ctx.reply('❌ Please provide a name\nUsage: .setname <name>');
        }

        try {
            await ctx.sock.updateProfileName(name);
            await ctx.reply(`✅ Bot name updated to: ${name}`);
        } catch (error) {
            await ctx.reply('❌ Error updating bot name');
        }
    },

    // Restart bot
    restart: async (ctx) => {
        await ctx.reply('🔄 Restarting bot...');
        
        setTimeout(() => {
            process.exit(0); // Render will restart the bot
        }, 2000);
    },

    // Shutdown bot
    shutdown: async (ctx) => {
        await ctx.reply('🛑 Shutting down bot...');
        
        setTimeout(() => {
            process.exit(1);
        }, 2000);
    },

    // Evaluate JavaScript code
    eval: async (ctx) => {
        const code = ctx.args.join(' ');
        if (!code) {
            return ctx.reply('❌ Please provide code\nUsage: .eval <code>');
        }

        try {
            let result = await eval(`(async () => { ${code} })()`);
            
            if (typeof result !== 'string') {
                result = util.inspect(result, { depth: 0 });
            }

            await ctx.reply(`✅ *Eval Result:*\n\n\`\`\`\n${result}\n\`\`\``);
        } catch (error) {
            await ctx.reply(`❌ *Error:*\n\n\`\`\`\n${error.message}\n\`\`\``);
        }
    },

    // Execute shell command
    exec: async (ctx) => {
        const command = ctx.args.join(' ');
        if (!command) {
            return ctx.reply('❌ Please provide a command\nUsage: .exec <command>');
        }

        try {
            const { stdout, stderr } = await execPromise(command);
            const output = stdout || stderr || 'No output';

            await ctx.reply(`✅ *Exec Result:*\n\n\`\`\`\n${output}\n\`\`\``);
        } catch (error) {
            await ctx.reply(`❌ *Error:*\n\n\`\`\`\n${error.message}\n\`\`\``);
        }
    },

    // Get session info
    getsession: async (ctx) => {
        try {
            const sessionPath = path.join(__dirname, '..', ctx.config.sessionName);
            const exists = await fs.pathExists(sessionPath);

            if (!exists) {
                return ctx.reply('❌ No session found');
            }

            const files = await fs.readdir(sessionPath);
            await ctx.reply(`📁 *Session Info*\n\nPath: ${sessionPath}\nFiles: ${files.length}\n\n${files.join('\n')}`);
        } catch (error) {
            await ctx.reply('❌ Error getting session info');
        }
    },

    // Clear session
    clearsession: async (ctx) => {
        try {
            const sessionPath = path.join(__dirname, '..', ctx.config.sessionName);
            await fs.remove(sessionPath);
            await ctx.reply('✅ Session cleared!\n\n⚠️ You will need to scan QR code again on next start.');
        } catch (error) {
            await ctx.reply('❌ Error clearing session');
        }
    }
};
