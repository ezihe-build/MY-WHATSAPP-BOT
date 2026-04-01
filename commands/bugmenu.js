/**
 * Bug Menu Commands
 * Safe debugging and testing commands only
 * NO harmful crash/exploit tools
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const MENU_IMAGE = path.join(__dirname, '..', 'media', 'toji.jpg');

module.exports = {
    // Bug menu
    bugmenu: async (ctx) => {
        const menuText = `
⌗ hello: ${ctx.pushName}
⌗ creator: EZIHE
⌗ runtime: ${ctx.getUptime()}
⌗ prefix: ${ctx.config.prefix}

━━━━━━━━━━━━━━━━━━
    🐞 BUG MENU
━━━━━━━━━━━━━━━━━━

⚠️ *SAFE DEBUGGING TOOLS ONLY*

*Performance Tests:*
${ctx.config.prefix}stresstest - System stress test
${ctx.config.prefix}latency - Network latency test
${ctx.config.prefix}pingtest - Ping test

*Connection Tests:*
${ctx.config.prefix}connectiontest - Test WhatsApp connection

*Demo Tools:*
${ctx.config.prefix}spamdemo - Spam demonstration (safe)
${ctx.config.prefix}floodtest - Message flood test (controlled)

*Debug Info:*
${ctx.config.prefix}debug - Show debug information

━━━━━━━━━━━━━━━━━━
✅ All commands are safe and controlled
❌ No harmful crash/exploit tools
        `;

        await ctx.replyWithImage(MENU_IMAGE, menuText);
    },

    // Stress test
    stresstest: async (ctx) => {
        await ctx.reply('🧪 *Starting Stress Test...*');

        const startTime = Date.now();
        const results = [];

        // CPU test
        const cpuStart = process.cpuUsage();
        let cpuLoad = 0;
        for (let i = 0; i < 1000000; i++) {
            cpuLoad += Math.sqrt(i);
        }
        const cpuEnd = process.cpuUsage(cpuStart);

        // Memory test
        const memBefore = process.memoryUsage();
        const testArray = new Array(1000000).fill('test');
        const memAfter = process.memoryUsage();
        testArray.length = 0; // Clear array

        // Response time test
        const responseTimes = [];
        for (let i = 0; i < 10; i++) {
            const start = Date.now();
            await new Promise(r => setTimeout(r, 10));
            responseTimes.push(Date.now() - start);
        }
        const avgResponse = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

        const totalTime = Date.now() - startTime;

        await ctx.reply(`
✅ *Stress Test Complete*

⏱️ Total Time: ${totalTime}ms

💻 *CPU Usage:*
  • User: ${(cpuEnd.user / 1000).toFixed(2)}ms
  • System: ${(cpuEnd.system / 1000).toFixed(2)}ms

💾 *Memory Usage:*
  • Before: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB
  • After: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB
  • Difference: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB

📡 *Response Time:*
  • Average: ${avgResponse.toFixed(2)}ms

✅ System is running normally
        `);
    },

    // Latency test
    latency: async (ctx) => {
        await ctx.reply('📡 *Testing Latency...*');

        const tests = [];
        const testUrls = [
            'https://www.google.com',
            'https://www.cloudflare.com',
            'https://www.github.com'
        ];

        for (const url of testUrls) {
            const start = Date.now();
            try {
                const axios = require('axios');
                await axios.get(url, { timeout: 5000 });
                tests.push({ url: new URL(url).hostname, latency: Date.now() - start, status: '✅' });
            } catch (error) {
                tests.push({ url: new URL(url).hostname, latency: Date.now() - start, status: '❌' });
            }
        }

        const resultText = tests.map(t => `${t.status} ${t.url}: ${t.latency}ms`).join('\n');
        const avgLatency = tests.reduce((a, b) => a + b.latency, 0) / tests.length;

        await ctx.reply(`
📡 *Latency Test Results*

${resultText}

📊 Average: ${avgLatency.toFixed(0)}ms

${avgLatency < 200 ? '✅ Excellent connection' : avgLatency < 500 ? '⚠️ Good connection' : '❌ Slow connection'}
        `);
    },

    // Ping test
    pingtest: async (ctx) => {
        await ctx.reply('🏓 *Running Ping Test...*');

        const pings = [];
        for (let i = 0; i < 5; i++) {
            const start = Date.now();
            await ctx.sock.sendMessage(ctx.jid, { text: 'ping' });
            pings.push(Date.now() - start);
            await new Promise(r => setTimeout(r, 500));
        }

        const min = Math.min(...pings);
        const max = Math.max(...pings);
        const avg = pings.reduce((a, b) => a + b, 0) / pings.length;

        await ctx.reply(`
🏓 *Ping Test Results*

📊 Statistics:
  • Min: ${min}ms
  • Max: ${max}ms
  • Average: ${avg.toFixed(0)}ms

📈 All pings: ${pings.join(', ')}ms

${avg < 100 ? '✅ Excellent' : avg < 300 ? '⚠️ Good' : '❌ High latency'}
        `);
    },

    // Connection test
    connectiontest: async (ctx) => {
        await ctx.reply('🔌 *Testing WhatsApp Connection...*');

        const status = ctx.bot.getStatus();
        const connectionInfo = {
            connected: status.connected ? '✅ Connected' : '❌ Disconnected',
            state: status.state,
            user: status.user ? status.user.split(':')[0] : 'Not logged in'
        };

        // Test message send
        const start = Date.now();
        try {
            await ctx.sock.sendMessage(ctx.jid, { text: 'Connection test' });
            var sendTime = Date.now() - start;
        } catch (error) {
            var sendTime = 'Failed';
        }

        await ctx.reply(`
🔌 *Connection Test Results*

📱 WhatsApp Status:
  • State: ${connectionInfo.state}
  • Connected: ${connectionInfo.connected}
  • User: ${connectionInfo.user}

📤 Message Send Test:
  • Time: ${sendTime}ms
  • Status: ${typeof sendTime === 'number' ? '✅ Success' : '❌ Failed'}

${status.connected ? '✅ Connection is healthy' : '❌ Connection issues detected'}
        `);
    },

    // Spam demo (safe - limited messages)
    spamdemo: async (ctx) => {
        if (!ctx.isGroup) {
            return ctx.reply('❌ This command can only be used in groups');
        }

        if (!ctx.isAdmin && !ctx.isOwner) {
            return ctx.reply('❌ Only admins can use this command');
        }

        await ctx.reply('⚠️ *Starting Safe Spam Demo*\n\nSending 5 test messages...');

        for (let i = 1; i <= 5; i++) {
            await ctx.sock.sendMessage(ctx.jid, {
                text: `📢 Spam Demo ${i}/5\n\nThis is a controlled demonstration.\nTime: ${new Date().toLocaleTimeString()}`
            });
            await new Promise(r => setTimeout(r, 1000));
        }

        await ctx.reply('✅ *Spam Demo Complete*\n\n5 messages sent successfully.\nThis was a safe demonstration only.');
    },

    // Flood test (controlled)
    floodtest: async (ctx) => {
        if (!ctx.isGroup) {
            return ctx.reply('❌ This command can only be used in groups');
        }

        if (!ctx.isAdmin && !ctx.isOwner) {
            return ctx.reply('❌ Only admins can use this command');
        }

        const count = parseInt(ctx.args[0]) || 10;
        if (count > 20) {
            return ctx.reply('❌ Maximum 20 messages allowed for safety');
        }

        await ctx.reply(`🌊 *Starting Flood Test*\n\nSending ${count} messages...`);

        const startTime = Date.now();
        let success = 0;
        let failed = 0;

        for (let i = 1; i <= count; i++) {
            try {
                await ctx.sock.sendMessage(ctx.jid, {
                    text: `🌊 Flood Test ${i}/${count}`
                });
                success++;
            } catch (error) {
                failed++;
            }
            await new Promise(r => setTimeout(r, 500)); // 500ms delay between messages
        }

        const totalTime = Date.now() - startTime;

        await ctx.reply(`
✅ *Flood Test Complete*

📊 Results:
  • Total: ${count}
  • Success: ${success}
  • Failed: ${failed}
  • Time: ${totalTime}ms
  • Rate: ${(success / (totalTime / 1000)).toFixed(2)} msg/s

⚠️ This was a controlled test with safety limits.
        `);
    },

    // Debug information
    debug: async (ctx) => {
        const status = ctx.bot.getStatus();
        const memory = process.memoryUsage();
        const uptime = ctx.getUptime();

        await ctx.reply(`
🐛 *Debug Information*

🤖 *Bot Info:*
  • Name: ${ctx.config.botName}
  • Version: ${ctx.config.version}
  • Prefix: ${ctx.config.prefix}
  • Public Mode: ${ctx.config.publicMode ? 'Yes' : 'No'}

📱 *WhatsApp Status:*
  • Connected: ${status.connected ? 'Yes' : 'No'}
  • State: ${status.state}
  • User: ${status.user ? status.user.split(':')[0] : 'N/A'}

💻 *System Info:*
  • Platform: ${os.platform()}
  • Arch: ${os.arch()}
  • Node.js: ${process.version}
  • CPUs: ${os.cpus().length}
  • Total Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
  • Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB

💾 *Process Memory:*
  • RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB
  • Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
  • Heap Total: ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB
  • External: ${(memory.external / 1024 / 1024).toFixed(2)} MB

⏱️ *Uptime:*
  • Bot: ${uptime}
  • System: ${(os.uptime() / 3600).toFixed(2)} hours

📅 *Time:* ${ctx.formatTime()}
        `);
    }
};
