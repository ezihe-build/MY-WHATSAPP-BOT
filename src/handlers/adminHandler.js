/**
 * EZIHE SUPER BOT - Admin Handler
 * Handles admin commands, group management, and bot control
 */

const config = require('../config/config');
const database = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Check if user is owner
 */
function isOwner(userId) {
  return userId.toString() === config.ownerId;
}

/**
 * Admin panel command
 */
async function adminCommand(ctx) {
  if (!ctx.isOwner) {
    return ctx.reply('❌ This command is only for the bot owner.');
  }

  const stats = await database.getStats();

  const adminMessage = `
👮 <b>ADMIN CONTROL PANEL</b>

📊 <b>Bot Statistics:</b>
👤 Total Users: ${stats.totalUsers}
👥 Total Groups: ${stats.totalGroups}
📥 Total Downloads: ${stats.totalDownloads}
🎨 AI Generations: ${stats.totalAIGenerations}
⭐ Premium Users: ${stats.premiumUsers}

🔒 <b>Bot Status:</b>
${global.botLocked ? '🔴 LOCKED' : '🟢 UNLOCKED'}

<b>Owner Commands:</b>
/lock - Lock the bot
/unlock - Unlock the bot
/broadcast [message] - Send to all users
/addpremium [user_id] - Add premium user
/removepremium [user_id] - Remove premium

<b>Admin Commands:</b>
/tagall - Tag all group members
/ban [user_id] - Ban a user
/unban [user_id] - Unban a user
/settings - Bot settings
`;

  await ctx.reply(adminMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔒 Lock Bot', callback_data: 'admin_lock' },
          { text: '🔓 Unlock Bot', callback_data: 'admin_unlock' }
        ],
        [
          { text: '📢 Broadcast', callback_data: 'admin_broadcast' },
          { text: '⚙️ Settings', callback_data: 'admin_settings' }
        ],
        [
          { text: '📊 Refresh Stats', callback_data: 'admin_stats' }
        ]
      ]
    }
  });
}

/**
 * Lock bot command (Owner only)
 */
async function lockCommand(ctx) {
  if (!ctx.isOwner) {
    return ctx.reply('❌ This command is only for the bot owner.');
  }

  global.botLocked = true;
  await database.setSetting('bot_locked', '1');

  await ctx.reply(`
🔒 <b>Bot Locked</b>

The bot has been locked. Only the owner can use it now.

To unlock, use /unlock
`);

  logger.info('Bot locked by owner');
}

/**
 * Unlock bot command (Owner only)
 */
async function unlockCommand(ctx) {
  if (!ctx.isOwner) {
    return ctx.reply('❌ This command is only for the bot owner.');
  }

  global.botLocked = false;
  await database.setSetting('bot_locked', '0');

  await ctx.reply(`
🔓 <b>Bot Unlocked</b>

The bot is now unlocked and available to all users.
`);

  logger.info('Bot unlocked by owner');
}

/**
 * Tag all members command
 */
async function tagallCommand(ctx) {
  // Check if in group
  if (ctx.chat.type === 'private') {
    return ctx.reply('❌ This command only works in groups.');
  }

  // Check if user is admin
  try {
    const chatMember = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    if (!['creator', 'administrator'].includes(chatMember.status)) {
      return ctx.reply('❌ You must be an admin to use this command.');
    }
  } catch (err) {
    return ctx.reply('❌ Could not verify admin status.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  const message = args.join(' ') || 'Attention everyone!';

  try {
    // Get all chat members
    const members = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    
    // Get regular members (this is limited by Telegram API)
    // We'll use a different approach - get recent message senders
    
    // Create mentions
    let mentions = '';
    const taggedUsers = [];

    // Tag admins
    for (const member of members) {
      const user = member.user;
      if (!user.is_bot) {
        const name = user.username ? `@${user.username}` : user.first_name;
        mentions += `[${name}](tg://user?id=${user.id}) `;
        taggedUsers.push(user.id);
      }
    }

    // Send message with mentions
    if (mentions) {
      await ctx.reply(`
📢 <b>Announcement</b>

${message}

${mentions}
`, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } else {
      ctx.reply('❌ Could not tag members.');
    }

  } catch (error) {
    logger.error('Tagall error:', error);
    ctx.reply('❌ Failed to tag members. Please try again.');
  }
}

/**
 * Ban user command
 */
async function banCommand(ctx) {
  if (!ctx.isOwner && !ctx.isAdmin) {
    return ctx.reply('❌ This command is only for admins.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
🚫 <b>Ban User</b>

Ban a user from using the bot.

<b>Usage:</b>
/ban [user_id]

<b>Example:</b>
/ban 123456789
`);
  }

  const userId = args[0];

  try {
    await database.updateUser(userId, { is_banned: 1 });
    await database.run(
      'INSERT INTO admin_actions (admin_id, action, target_id, reason) VALUES (?, ?, ?, ?)',
      [ctx.from.id, 'ban', userId, args.slice(1).join(' ') || 'No reason provided']
    );

    await ctx.reply(`
🚫 <b>User Banned</b>

User ID: <code>${userId}</code>
Status: Banned

This user can no longer use the bot.
`);

    logger.info(`User ${userId} banned by ${ctx.from.id}`);

  } catch (error) {
    logger.error('Ban error:', error);
    ctx.reply('❌ Failed to ban user.');
  }
}

/**
 * Unban user command
 */
async function unbanCommand(ctx) {
  if (!ctx.isOwner && !ctx.isAdmin) {
    return ctx.reply('❌ This command is only for admins.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
✅ <b>Unban User</b>

Unban a previously banned user.

<b>Usage:</b>
/unban [user_id]

<b>Example:</b>
/unban 123456789
`);
  }

  const userId = args[0];

  try {
    await database.updateUser(userId, { is_banned: 0 });
    await database.run(
      'INSERT INTO admin_actions (admin_id, action, target_id, reason) VALUES (?, ?, ?, ?)',
      [ctx.from.id, 'unban', userId, 'User unbanned']
    );

    await ctx.reply(`
✅ <b>User Unbanned</b>

User ID: <code>${userId}</code>
Status: Unbanned

This user can now use the bot again.
`);

    logger.info(`User ${userId} unbanned by ${ctx.from.id}`);

  } catch (error) {
    logger.error('Unban error:', error);
    ctx.reply('❌ Failed to unban user.');
  }
}

/**
 * Settings command
 */
async function settingsCommand(ctx) {
  if (!ctx.isOwner) {
    return ctx.reply('❌ This command is only for the bot owner.');
  }

  const settings = await database.getSetting('maintenance_mode');

  await ctx.reply(`
⚙️ <b>Bot Settings</b>

Current configuration:

🔧 <b>Maintenance Mode:</b> ${settings === '1' ? 'ON' : 'OFF'}
🔒 <b>Bot Locked:</b> ${global.botLocked ? 'YES' : 'NO'}

<b>Available Settings:</b>
• Maintenance mode
• Max download size
• Rate limiting
• Feature toggles

Use buttons to modify settings:
`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔧 Maintenance: ' + (settings === '1' ? 'ON' : 'OFF'), callback_data: 'toggle_maintenance' }
        ],
        [
          { text: '📊 View All Settings', callback_data: 'view_settings' }
        ]
      ]
    }
  });
}

/**
 * Broadcast command (Owner only)
 */
async function broadcastCommand(ctx) {
  if (!ctx.isOwner) {
    return ctx.reply('❌ This command is only for the bot owner.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
📢 <b>Broadcast Message</b>

Send a message to all bot users.

<b>Usage:</b>
/broadcast [your message]

<b>Example:</b>
/broadcast Hello everyone! New features added!

⚠️ Use responsibly!
`);
  }

  const message = args.join(' ');

  await ctx.reply('📢 Starting broadcast... This may take a while.');

  try {
    // Get all users
    const users = await database.all('SELECT user_id FROM users WHERE is_banned = 0');
    
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.user_id, `
📢 <b>Announcement</b>

${message}

— <i>EZIHE BOT Team</i>
`, { parse_mode: 'HTML' });
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        failCount++;
      }
    }

    await ctx.reply(`
✅ <b>Broadcast Complete</b>

📤 Sent: ${successCount}
❌ Failed: ${failCount}
📊 Total: ${users.length}
`);

    logger.info(`Broadcast sent to ${successCount} users`);

  } catch (error) {
    logger.error('Broadcast error:', error);
    ctx.reply('❌ Broadcast failed.');
  }
}

/**
 * Add premium user command
 */
async function addPremiumCommand(ctx) {
  if (!ctx.isOwner) {
    return ctx.reply('❌ This command is only for the bot owner.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
⭐ <b>Add Premium User</b>

Grant premium access to a user.

<b>Usage:</b>
/addpremium [user_id]

<b>Example:</b>
/addpremium 123456789
`);
  }

  const userId = args[0];

  try {
    await database.updateUser(userId, { is_premium: 1 });
    
    await ctx.reply(`
⭐ <b>Premium User Added</b>

User ID: <code>${userId}</code>
Status: Premium

This user now has premium access!
`);

    // Notify user
    try {
      await ctx.telegram.sendMessage(userId, `
🎉 <b>Congratulations!</b>

You have been upgraded to <b>PREMIUM</b>!

Enjoy exclusive features and benefits.

Thank you for using EZIHE BOT! ⭐
`);
    } catch (err) {
      // User may have blocked the bot
    }

    logger.info(`Premium added to user ${userId}`);

  } catch (error) {
    logger.error('Add premium error:', error);
    ctx.reply('❌ Failed to add premium user.');
  }
}

/**
 * Remove premium user command
 */
async function removePremiumCommand(ctx) {
  if (!ctx.isOwner) {
    return ctx.reply('❌ This command is only for the bot owner.');
  }

  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
⭐ <b>Remove Premium User</b>

Remove premium access from a user.

<b>Usage:</b>
/removepremium [user_id]

<b>Example:</b>
/removepremium 123456789
`);
  }

  const userId = args[0];

  try {
    await database.updateUser(userId, { is_premium: 0 });
    
    await ctx.reply(`
⭐ <b>Premium User Removed</b>

User ID: <code>${userId}</code>
Status: Regular

Premium access has been removed.
`);

    logger.info(`Premium removed from user ${userId}`);

  } catch (error) {
    logger.error('Remove premium error:', error);
    ctx.reply('❌ Failed to remove premium user.');
  }
}

/**
 * Admin action handler
 */
async function adminAction(ctx) {
  const action = ctx.match[1];
  
  if (!ctx.isOwner) {
    return ctx.answerCbQuery('❌ Owner only!', { show_alert: true });
  }

  switch (action) {
    case 'lock':
      global.botLocked = true;
      await database.setSetting('bot_locked', '1');
      await ctx.answerCbQuery('Bot locked');
      await ctx.editMessageText('🔒 Bot has been locked.', {
        reply_markup: {
          inline_keyboard: [[{ text: '🔓 Unlock', callback_data: 'admin_unlock' }]]
        }
      });
      break;
      
    case 'unlock':
      global.botLocked = false;
      await database.setSetting('bot_locked', '0');
      await ctx.answerCbQuery('Bot unlocked');
      await ctx.editMessageText('🔓 Bot has been unlocked.', {
        reply_markup: {
          inline_keyboard: [[{ text: '🔒 Lock', callback_data: 'admin_lock' }]]
        }
      });
      break;
      
    case 'stats':
      const stats = await database.getStats();
      await ctx.answerCbQuery('Stats refreshed');
      await ctx.editMessageText(`
📊 <b>Bot Statistics</b>

👤 Total Users: ${stats.totalUsers}
👥 Total Groups: ${stats.totalGroups}
📥 Total Downloads: ${stats.totalDownloads}
🎨 AI Generations: ${stats.totalAIGenerations}
⭐ Premium Users: ${stats.premiumUsers}
`, { parse_mode: 'HTML' });
      break;
      
    case 'broadcast':
      await ctx.answerCbQuery('Use /broadcast command');
      await ctx.reply('Use the command: /broadcast [your message]');
      break;
      
    case 'settings':
      await ctx.answerCbQuery('Opening settings...');
      await settingsCommand(ctx);
      break;
      
    case 'tagall':
      await ctx.answerCbQuery('Use .tagall or /tagall command');
      await ctx.reply('Use the command: /tagall [message]');
      break;
      
    default:
      await ctx.answerCbQuery('Unknown action');
  }
}

module.exports = {
  adminCommand,
  lockCommand,
  unlockCommand,
  tagallCommand,
  banCommand,
  unbanCommand,
  settingsCommand,
  broadcastCommand,
  addPremiumCommand,
  removePremiumCommand,
  adminAction
};
