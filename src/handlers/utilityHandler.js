/**
 * EZIHE SUPER BOT - Utility Handler
 * Handles utility commands and stats
 */

const os = require('os');
const moment = require('moment');
const database = require('../utils/database');
const logger = require('../utils/logger');
const config = require('../config/config');

// Bot start time
const startTime = Date.now();

/**
 * Stats command
 */
async function statsCommand(ctx) {
  try {
    const dbStats = await database.getStats();
    
    // Calculate uptime
    const uptime = Date.now() - startTime;
    const uptimeFormatted = formatUptime(uptime);

    // System stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = ((usedMem / totalMem) * 100).toFixed(1);

    const statsMessage = `
📊 <b>BOT STATISTICS</b>

👥 <b>User Statistics:</b>
• Total Users: ${dbStats.totalUsers}
• Total Groups: ${dbStats.totalGroups}
• Premium Users: ${dbStats.premiumUsers}

📥 <b>Activity:</b>
• Total Downloads: ${dbStats.totalDownloads}
• AI Generations: ${dbStats.totalAIGenerations}

⚙️ <b>System:</b>
• Uptime: ${uptimeFormatted}
• Memory Usage: ${memUsage}%
• Platform: ${os.platform()} ${os.arch()}
• Node.js: ${process.version}

🔒 <b>Bot Status:</b>
• Locked: ${global.botLocked ? '🔴 YES' : '🟢 NO'}
• Version: 2.0.0
`;

    await ctx.reply(statsMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Refresh', callback_data: 'util_stats' }]
        ]
      }
    });

  } catch (error) {
    logger.error('Stats error:', error);
    ctx.reply('❌ Failed to get statistics.');
  }
}

/**
 * Ping command
 */
async function pingCommand(ctx) {
  const start = Date.now();
  
  const msg = await ctx.reply('🏓 Pong!');
  
  const responseTime = Date.now() - start;
  const apiLatency = Math.round(ctx.telegram.options.handlerTimeout / 1000);

  await ctx.telegram.editMessageText(
    msg.chat.id,
    msg.message_id,
    null,
    `
🏓 <b>Pong!</b>

📡 Response Time: ${responseTime}ms
⚡ API Latency: ~${apiLatency}s
🟢 Bot Status: Online

Bot is running smoothly!
`,
    { parse_mode: 'HTML' }
  );
}

/**
 * Info command
 */
async function infoCommand(ctx) {
  const infoMessage = `
ℹ️ <b>BOT INFORMATION</b>

🤖 <b>EZIHE SUPER BOT</b>
Version: 2.0.0

📋 <b>Features:</b>
• Music Download & Streaming
• Movie Search & Info
• AI Image Generator
• AI Video Generator
• YouTube Downloader
• TikTok Downloader
• Instagram Downloader
• Pinterest Downloader
• Admin Control Panel
• WhatsApp Integration
• Group Management

👨‍💻 <b>Developer:</b>
@ezihe

📢 <b>Channel:</b>
@ezihe_channel

💬 <b>Support:</b>
@ezihe_support

🌟 <b>Powered by:</b>
• Node.js
• Telegraf
• SQLite
• Various APIs

© 2024 EZIHE BOT. All rights reserved.
`;

  await ctx.reply(infoMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📢 Channel', url: 'https://t.me/ezihe_channel' },
          { text: '💬 Support', url: 'https://t.me/ezihe_support' }
        ],
        [{ text: '📋 Menu', callback_data: 'menu_main' }]
      ]
    }
  });
}

/**
 * Profile command
 */
async function profileCommand(ctx) {
  const userId = ctx.from.id;
  
  try {
    const user = await database.getUser(userId);
    
    if (!user) {
      return ctx.reply('❌ User not found. Please use /start first.');
    }

    const profileMessage = `
👤 <b>YOUR PROFILE</b>

🆔 User ID: <code>${userId}</code>
👤 Username: @${ctx.from.username || 'N/A'}
📛 Name: ${ctx.from.first_name} ${ctx.from.last_name || ''}

⭐ <b>Status:</b> ${user.is_premium ? '⭐ PREMIUM' : '👤 Regular'}
🔐 <b>Authenticated:</b> ${user.authenticated ? '✅ Yes' : '❌ No'}

📊 <b>Activity:</b>
• Commands Used: ${user.command_count}
• Downloads: ${user.download_count}
• Joined: ${moment.unix(user.created_at).format('YYYY-MM-DD')}
• Last Active: ${moment.unix(user.last_activity).fromNow()}

${user.is_premium ? '🎉 Thank you for being a premium user!' : '💎 Upgrade to premium for exclusive features!'}
`;

    await ctx.reply(profileMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Menu', callback_data: 'menu_main' }]
        ]
      }
    });

  } catch (error) {
    logger.error('Profile error:', error);
    ctx.reply('❌ Failed to get profile information.');
  }
}

/**
 * Format uptime
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

module.exports = {
  statsCommand,
  pingCommand,
  infoCommand,
  profileCommand
};
