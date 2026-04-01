/**
 * EZIHE SUPER BOT - Bot Lock Middleware
 */

const config = require('../config/config');

/**
 * Check if bot is locked (only owner can use when locked)
 */
async function lockMiddleware(ctx, next) {
  // If bot is not locked, allow all
  if (!global.botLocked) {
    return next();
  }

  const userId = ctx.from?.id;
  
  // Owner can always use bot even when locked
  if (userId.toString() === config.ownerId) {
    ctx.botLocked = true;
    return next();
  }

  // Bot is locked, notify user
  return ctx.reply(`
🔒 <b>Bot is Currently Locked</b>

The bot has been temporarily locked by the owner.
Please try again later.

For urgent matters, contact the owner.
`, { parse_mode: 'HTML' });
}

module.exports = lockMiddleware;
