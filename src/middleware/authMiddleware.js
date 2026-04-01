/**
 * EZIHE SUPER BOT - Authentication Middleware
 */

const config = require('../config/config');
const database = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Check if user is authenticated
 */
async function authMiddleware(ctx, next) {
  const userId = ctx.from?.id;
  
  if (!userId) {
    return ctx.reply('❌ Could not identify user.');
  }

  // Owner is always authenticated
  if (userId.toString() === config.ownerId) {
    ctx.isOwner = true;
    ctx.isAdmin = true;
    return next();
  }

  // Check session authentication
  const session = global.userSessions.get(userId);
  if (session && session.authenticated) {
    // Update last activity
    session.lastActivity = Date.now();
    
    // Update database
    await database.updateUser(userId, { last_activity: Math.floor(Date.now() / 1000) });
    
    ctx.isOwner = false;
    ctx.isAdmin = false;
    return next();
  }

  // Check database authentication
  const user = await database.getUser(userId);
  if (user && user.authenticated) {
    // Update session
    if (session) {
      session.authenticated = true;
    }
    ctx.isOwner = false;
    ctx.isAdmin = false;
    return next();
  }

  // User not authenticated
  const authMessage = `
🔐 <b>Authentication Required</b>

This bot is password protected.
Please enter the password to access all features.

<b>How to authenticate:</b>
Use the command:
<code>/password ezihe</code>

Or click the button below:
`;

  await ctx.reply(authMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔐 Enter Password', callback_data: 'enter_password' }],
        [{ text: '📖 Help', callback_data: 'menu_help' }]
      ]
    }
  });
}

module.exports = authMiddleware;
