/**
 * EZIHE SUPER BOT - Menu Handler
 */

const config = require('../config/config');
const database = require('../utils/database');
const logger = require('../utils/logger');

// Menu keyboard layouts
const keyboards = {
  main: [
    [
      { text: '📥 Media Tools', callback_data: 'menu_media' },
      { text: '🤖 AI Tools', callback_data: 'menu_ai' }
    ],
    [
      { text: '🎵 Music', callback_data: 'menu_music' },
      { text: '🎬 Movies', callback_data: 'menu_movie' }
    ],
    [
      { text: '⬇️ Download Tools', callback_data: 'menu_download' },
      { text: '🛠️ Utility Tools', callback_data: 'menu_utility' }
    ],
    [
      { text: '👮 Admin Tools', callback_data: 'menu_admin' },
      { text: '📱 WhatsApp', callback_data: 'menu_whatsapp' }
    ],
    [
      { text: '❓ Help', callback_data: 'menu_help' },
      { text: '📊 Stats', callback_data: 'menu_stats' }
    ]
  ],

  media: [
    [
      { text: '📺 YouTube', callback_data: 'media_youtube' },
      { text: '🎵 TikTok', callback_data: 'media_tiktok' }
    ],
    [
      { text: '📸 Instagram', callback_data: 'media_instagram' },
      { text: '📌 Pinterest', callback_data: 'media_pinterest' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ],

  ai: [
    [
      { text: '🖼️ AI Image Gen', callback_data: 'ai_image' },
      { text: '🎥 AI Video Gen', callback_data: 'ai_video' }
    ],
    [
      { text: '💬 AI Chat', callback_data: 'ai_chat' },
      { text: '🎨 AI Art Styles', callback_data: 'ai_styles' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ],

  download: [
    [
      { text: '📺 YouTube DL', callback_data: 'dl_youtube' },
      { text: '🎵 TikTok DL', callback_data: 'dl_tiktok' }
    ],
    [
      { text: '📸 Instagram DL', callback_data: 'dl_instagram' },
      { text: '📌 Pinterest DL', callback_data: 'dl_pinterest' }
    ],
    [
      { text: '🎵 Music DL', callback_data: 'dl_music' },
      { text: '🎬 Movie DL', callback_data: 'dl_movie' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ],

  admin: [
    [
      { text: '🔒 Lock Bot', callback_data: 'admin_lock' },
      { text: '🔓 Unlock Bot', callback_data: 'admin_unlock' }
    ],
    [
      { text: '👥 Tag All', callback_data: 'admin_tagall' },
      { text: '🚫 Ban User', callback_data: 'admin_ban' }
    ],
    [
      { text: '⚙️ Settings', callback_data: 'admin_settings' },
      { text: '📢 Broadcast', callback_data: 'admin_broadcast' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ],

  utility: [
    [
      { text: '📊 Bot Stats', callback_data: 'util_stats' },
      { text: '🏓 Ping', callback_data: 'util_ping' }
    ],
    [
      { text: 'ℹ️ Bot Info', callback_data: 'util_info' },
      { text: '👤 My Profile', callback_data: 'util_profile' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ],

  music: [
    [
      { text: '🔍 Search Music', callback_data: 'music_search' },
      { text: '▶️ Play Song', callback_data: 'music_play' }
    ],
    [
      { text: '📋 My Playlist', callback_data: 'music_playlist' },
      { text: '🔝 Top Charts', callback_data: 'music_charts' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ],

  movie: [
    [
      { text: '🔍 Search Movies', callback_data: 'movie_search' },
      { text: '📺 Now Playing', callback_data: 'movie_now' }
    ],
    [
      { text: '⭐ Top Rated', callback_data: 'movie_top' },
      { text: '🎬 Genres', callback_data: 'movie_genres' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ],

  whatsapp: [
    [
      { text: '🔗 Pair Device', callback_data: 'wa_pair' },
      { text: '📱 My Devices', callback_data: 'wa_devices' }
    ],
    [
      { text: '💬 Send Message', callback_data: 'wa_send' },
      { text: '⚙️ Settings', callback_data: 'wa_settings' }
    ],
    [
      { text: '🔙 Back to Main', callback_data: 'back_main' }
    ]
  ]
};

// Menu messages
const messages = {
  main: `
📋 <b>MAIN MENU</b>

Welcome to the EZIHE SUPER BOT Control Center!
Select a category below to explore features:

🎯 <b>Quick Commands:</b>
/start - Restart bot
/menu - Open this menu
/help - View all commands

Choose an option below 👇
`,

  media: `
📥 <b>MEDIA TOOLS</b>

Download media from various platforms:

📺 <b>YouTube</b> - Videos & Shorts
🎵 <b>TikTok</b> - Videos without watermark
📸 <b>Instagram</b> - Posts, Reels & Stories
📌 <b>Pinterest</b> - Images & Videos

<b>Commands:</b>
/yt [url] - YouTube downloader
/tiktok [url] - TikTok downloader
/ig [url] - Instagram downloader
/pinterest [url] - Pinterest downloader
`,

  ai: `
🤖 <b>AI TOOLS</b>

Generate amazing content with AI:

🖼️ <b>AI Image Generator</b>
Create stunning images from text

🎥 <b>AI Video Generator</b>
Generate videos from descriptions

💬 <b>AI Chat</b>
Chat with intelligent AI

<b>Commands:</b>
/aiimg [prompt] - Generate image
/aivid [prompt] - Generate video
/ai [message] - Chat with AI
`,

  download: `
⬇️ <b>DOWNLOAD TOOLS</b>

Download content from any platform:

• YouTube videos & playlists
• TikTok videos (no watermark)
• Instagram posts & reels
• Pinterest images
• Music tracks
• Movies & TV shows

<b>Usage:</b>
Just send a link and I'll detect it!
Or use specific commands.
`,

  admin: `
👮 <b>ADMIN TOOLS</b>

Group management & bot control:

🔒 <b>Lock/Unlock Bot</b>
Control bot availability

👥 <b>Tag All Members</b>
Mention everyone in group

🚫 <b>Ban/Unban Users</b>
Manage user access

⚙️ <b>Settings</b>
Configure bot behavior

<b>Owner Commands:</b>
/broadcast - Send message to all
/addpremium - Add premium user
`,

  utility: `
🛠️ <b>UTILITY TOOLS</b>

Useful bot utilities:

📊 <b>Statistics</b> - View bot stats
🏓 <b>Ping</b> - Check response time
ℹ️ <b>Bot Info</b> - Version & details
👤 <b>My Profile</b> - Your usage stats

<b>Commands:</b>
/stats - Bot statistics
/ping - Response time
/info - Bot information
`,

  music: `
🎵 <b>MUSIC TOOLS</b>

Search and download music:

🔍 <b>Search</b> - Find any song
▶️ <b>Play</b> - Stream instantly
📋 <b>Playlist</b> - Your saved songs
🔝 <b>Top Charts</b> - Trending music

<b>Commands:</b>
/music [song name] - Search music
/play [song name] - Play song
`,

  movie: `
🎬 <b>MOVIE TOOLS</b>

Search and download movies:

🔍 <b>Search</b> - Find any movie
📺 <b>Now Playing</b> - In theaters
⭐ <b>Top Rated</b> - Best movies
🎬 <b>Genres</b> - Browse by category

<b>Commands:</b>
/movie [title] - Search movies
/searchmovie [title] - Advanced search
`,

  whatsapp: `
📱 <b>WHATSAPP INTEGRATION</b>

Connect your WhatsApp account:

🔗 <b>Pair Device</b>
Link using pairing code

💬 <b>Cross-Platform</b>
Use bot on both platforms

📤 <b>Send Messages</b>
Send from Telegram to WhatsApp

<b>Commands:</b>
/whatsapp - WhatsApp menu
/pair - Pair new device
`
};

/**
 * Send menu with banner
 */
async function sendMenuWithBanner(ctx, message, keyboard) {
  try {
    await ctx.replyWithPhoto(
      { source: './assets/menu_banner.jpg' },
      {
        caption: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  } catch (err) {
    // Fallback to text-only menu
    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }
}

/**
 * Main menu command
 */
async function menuCommand(ctx) {
  await sendMenuWithBanner(ctx, messages.main, keyboards.main);
}

/**
 * Help command
 */
async function helpCommand(ctx) {
  const helpMessage = `
📖 <b>EZIHE SUPER BOT - HELP</b>

<b>🔐 Authentication</b>
/password [password] - Authenticate with bot

<b>📋 General</b>
/start - Start the bot
/menu - Open main menu
/help - Show this help message

<b>📥 Media Downloads</b>
/yt [url] - Download YouTube video
/tiktok [url] - Download TikTok video
/ig [url] - Download Instagram content
/pinterest [url] - Download Pinterest

<b>🤖 AI Tools</b>
/aiimg [prompt] - Generate AI image
/aivid [prompt] - Generate AI video
/ai [message] - Chat with AI

<b>🎵 Music</b>
/music [song] - Search music
/play [song] - Play music

<b>🎬 Movies</b>
/movie [title] - Search movies
/searchmovie [title] - Advanced search

<b>👮 Admin Commands</b>
/admin - Admin panel
/tagall - Tag all members
/lock - Lock bot
/unlock - Unlock bot
/ban [user] - Ban user
/settings - Bot settings

<b>📱 WhatsApp</b>
/whatsapp - WhatsApp menu
/pair - Pair device

<b>🛠️ Utilities</b>
/stats - Bot statistics
/ping - Check latency
/info - Bot info

💡 <b>Tip:</b> Just send a link to auto-download!
`;

  await ctx.reply(helpMessage, { parse_mode: 'HTML' });
}

/**
 * Menu action handlers
 */
async function mainMenuAction(ctx) {
  await ctx.editMessageCaption(messages.main, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.main
    }
  }).catch(async () => {
    await sendMenuWithBanner(ctx, messages.main, keyboards.main);
  });
  await ctx.answerCbQuery('Main Menu');
}

async function mediaMenuAction(ctx) {
  await ctx.editMessageCaption(messages.media, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.media
    }
  }).catch(async () => {
    await ctx.reply(messages.media, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.media
      }
    });
  });
  await ctx.answerCbQuery('Media Tools');
}

async function aiMenuAction(ctx) {
  await ctx.editMessageCaption(messages.ai, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.ai
    }
  }).catch(async () => {
    await ctx.reply(messages.ai, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.ai
      }
    });
  });
  await ctx.answerCbQuery('AI Tools');
}

async function adminMenuAction(ctx) {
  if (!ctx.isOwner && !ctx.isAdmin) {
    return ctx.answerCbQuery('❌ Admin only!', { show_alert: true });
  }
  
  await ctx.editMessageCaption(messages.admin, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.admin
    }
  }).catch(async () => {
    await ctx.reply(messages.admin, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.admin
      }
    });
  });
  await ctx.answerCbQuery('Admin Tools');
}

async function downloadMenuAction(ctx) {
  await ctx.editMessageCaption(messages.download, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.download
    }
  }).catch(async () => {
    await ctx.reply(messages.download, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.download
      }
    });
  });
  await ctx.answerCbQuery('Download Tools');
}

async function utilityMenuAction(ctx) {
  await ctx.editMessageCaption(messages.utility, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.utility
    }
  }).catch(async () => {
    await ctx.reply(messages.utility, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.utility
      }
    });
  });
  await ctx.answerCbQuery('Utility Tools');
}

async function musicMenuAction(ctx) {
  await ctx.editMessageCaption(messages.music, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.music
    }
  }).catch(async () => {
    await ctx.reply(messages.music, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.music
      }
    });
  });
  await ctx.answerCbQuery('Music Tools');
}

async function movieMenuAction(ctx) {
  await ctx.editMessageCaption(messages.movie, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.movie
    }
  }).catch(async () => {
    await ctx.reply(messages.movie, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.movie
      }
    });
  });
  await ctx.answerCbQuery('Movie Tools');
}

async function whatsappMenuAction(ctx) {
  await ctx.editMessageCaption(messages.whatsapp, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboards.whatsapp
    }
  }).catch(async () => {
    await ctx.reply(messages.whatsapp, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboards.whatsapp
      }
    });
  });
  await ctx.answerCbQuery('WhatsApp Tools');
}

/**
 * Inline query handler
 */
async function inlineQueryHandler(ctx) {
  const query = ctx.inlineQuery.query;
  
  const results = [
    {
      type: 'article',
      id: 'menu',
      title: '📋 Open Bot Menu',
      description: 'Access all bot features',
      input_message_content: {
        message_text: 'Click the button below to open the bot menu:',
      },
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Open Menu', url: `https://t.me/${ctx.botInfo.username}?start=menu` }]
        ]
      }
    },
    {
      type: 'article',
      id: 'help',
      title: '❓ Get Help',
      description: 'View all available commands',
      input_message_content: {
        message_text: 'Use /help in the bot to see all commands!',
      }
    }
  ];

  await ctx.answerInlineQuery(results);
}

module.exports = {
  menuCommand,
  helpCommand,
  mainMenuAction,
  mediaMenuAction,
  aiMenuAction,
  adminMenuAction,
  downloadMenuAction,
  utilityMenuAction,
  musicMenuAction,
  movieMenuAction,
  whatsappMenuAction,
  inlineQueryHandler,
  sendMenuWithBanner,
  keyboards,
  messages
};
