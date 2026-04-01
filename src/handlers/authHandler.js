/**
 * EZIHE SUPER BOT - Authentication Handler
 */

const config = require('../config/config');
const database = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Start command handler
 */
async function startCommand(ctx) {
  const userId = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name;
  const lastName = ctx.from.last_name || '';

  // Create or update user in database
  await database.createUser(userId, username, firstName, lastName);

  const welcomeMessage = `
👋 <b>Welcome to EZIHE SUPER BOT!</b>

Hello <a href="tg://user?id=${userId}">${firstName}</a>!

I'm your all-in-one assistant with powerful features:

🎵 <b>Music Download</b> - Download any song
🎬 <b>Movie Search</b> - Find and download movies
🤖 <b>AI Generation</b> - Create images & videos
📥 <b>Media Downloader</b> - YouTube, TikTok, IG, Pinterest
👮 <b>Admin Tools</b> - Group management
📱 <b>WhatsApp</b> - Cross-platform integration

🔐 <b>To get started:</b>
Enter the password using:
<code>/password ezihe</code>

📋 <b>View all commands:</b> /menu
❓ <b>Get help:</b> /help
`;

  // Send banner image with welcome message
  try {
    await ctx.replyWithPhoto(
      { source: './assets/banner.jpg' },
      {
        caption: welcomeMessage,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔐 Enter Password', callback_data: 'enter_password' }],
            [{ text: '📋 Open Menu', callback_data: 'menu_main' }],
            [{ text: '❓ Help', callback_data: 'menu_help' }]
          ]
        }
      }
    );
  } catch (err) {
    // If banner image not found, send text only
    await ctx.reply(welcomeMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔐 Enter Password', callback_data: 'enter_password' }],
          [{ text: '📋 Open Menu', callback_data: 'menu_main' }],
          [{ text: '❓ Help', callback_data: 'menu_help' }]
        ]
      }
    });
  }

  logger.info(`New user started bot: ${userId} (${username || 'no_username'})`);
}

/**
 * Password command handler
 */
async function passwordCommand(ctx) {
  const userId = ctx.from.id;
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
🔐 <b>Password Entry</b>

Please provide the password:
<code>/password YOUR_PASSWORD</code>

Example:
<code>/password ezihe</code>
`, { parse_mode: 'HTML' });
  }

  const enteredPassword = args[0];

  if (enteredPassword === config.botPassword) {
    // Update session
    const session = global.userSessions.get(userId);
    if (session) {
      session.authenticated = true;
      session.authTime = Date.now();
    }

    // Update database
    await database.authenticateUser(userId);

    const successMessage = `
✅ <b>Authentication Successful!</b>

Welcome! You now have full access to all bot features.

🎯 <b>Quick Start:</b>
/menu - Open main menu
/help - View all commands

Enjoy using EZIHE SUPER BOT! 🚀
`;

    await ctx.reply(successMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Open Menu', callback_data: 'menu_main' }],
          [{ text: '❓ View Help', callback_data: 'menu_help' }]
        ]
      }
    });

    logger.info(`User authenticated: ${userId}`);
  } else {
    await ctx.reply(`
❌ <b>Incorrect Password!</b>

The password you entered is incorrect.
Please try again.

💡 <b>Hint:</b> The default password is <code>ezihe</code>
`, { 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Try Again', callback_data: 'enter_password' }]
        ]
      }
    });

    logger.warn(`Failed authentication attempt: ${userId}`);
  }
}

module.exports = {
  startCommand,
  passwordCommand,
};
