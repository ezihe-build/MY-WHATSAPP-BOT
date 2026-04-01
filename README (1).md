# EZIHE-BOT 🤖

A complete WhatsApp bot with Telegram pairing system, built with Node.js and Baileys.

## Features ✨

- **WhatsApp Bot**: Full-featured bot using Baileys library
- **Telegram Pairing**: Pair WhatsApp via Telegram bot
- **100+ Commands**: 7 categories with 15-20 commands each
- **Interactive UI**: Buttons, lists, and quick replies
- **Modern Design**: Clean menu system with image support

## Menu Categories 📱

| Menu | Commands | Description |
|------|----------|-------------|
| `.menu` | 13 | Main navigation hub |
| `.usermenu` | 17 | User utilities & tools |
| `.ownermenu` | 18 | Owner/admin commands |
| `.funmenu` | 18 | Entertainment & games |
| `.bugmenu` | 7 | Safe debugging tools |
| `.aimenu` | 17 | AI-powered features |
| `.searchmenu` | 18 | Search commands |

**Total: 108+ Commands!**

## Installation 🚀

### Local Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ezihe-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OWNER_ID=your_telegram_id
PREFIX=.
BOT_NAME=EZIHE-BOT
OWNER_NUMBER=your_whatsapp_number
```

4. Start the bot:
```bash
npm start
```

### Deploy on Render

1. Fork this repository to your GitHub account

2. Create a new Web Service on Render:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. Configure the service:
   - **Name**: `ezihe-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. Add Environment Variables:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `OWNER_ID`: Your Telegram user ID
   - `OWNER_NUMBER`: Your WhatsApp number

5. Click "Create Web Service"

The bot will automatically deploy and start!

## Telegram Pairing Flow 📲

1. User sends `/pair` to Telegram bot
2. Bot asks for WhatsApp number
3. User provides number with country code
4. Bot generates 8-digit pairing code
5. User enters code in WhatsApp
6. Session is saved automatically

## Commands Reference 📖

### General Commands
- `.menu` - Show main menu
- `.ping` - Check latency
- `.runtime` - Bot uptime
- `.sticker` - Create sticker
- `.play <song>` - Play music
- `.info` - Bot information

### User Commands
- `.usermenu` - User menu
- `.tts <text>` - Text to speech
- `.translate <lang> <text>` - Translate
- `.weather <city>` - Weather info
- `.timer <time>` - Set timer
- `.note <name> <text>` - Save note

### Owner Commands
- `.ownermenu` - Owner menu
- `.broadcast <text>` - Broadcast message
- `.block <number>` - Block user
- `.ban <number>` - Ban user
- `.restart` - Restart bot
- `.eval <code>` - Evaluate code

### Fun Commands
- `.funmenu` - Fun menu
- `.joke` - Random joke
- `.meme` - Random meme
- `.truth` - Truth question
- `.dare` - Dare challenge
- `.8ball <question>` - Magic 8-ball

### AI Commands
- `.aimenu` - AI menu
- `.ai <text>` - Chat with AI
- `.aiimage <prompt>` - Generate image
- `.code <lang> <desc>` - Generate code
- `.story <topic>` - Generate story
- `.summarize <text>` - Summarize

### Search Commands
- `.searchmenu` - Search menu
- `.google <query>` - Google search
- `.ytsearch <query>` - YouTube search
- `.imagesearch <query>` - Image search
- `.lyrics <song>` - Song lyrics
- `.github <repo>` - GitHub search

### Bug Commands (Safe)
- `.bugmenu` - Bug menu
- `.stresstest` - System test
- `.latency` - Network test
- `.debug` - Debug info

## File Structure 📁

```
ezihe-bot/
├── commands/
│   ├── menu.js          # Main menu (13 commands)
│   ├── usermenu.js      # User menu (17 commands)
│   ├── ownermenu.js     # Owner menu (18 commands)
│   ├── funmenu.js       # Fun menu (18 commands)
│   ├── bugmenu.js       # Bug menu (7 commands)
│   ├── aimenu.js        # AI menu (17 commands)
│   └── searchmenu.js    # Search menu (18 commands)
├── handlers/
│   └── messageHandler.js # Message processor
├── database/
│   ├── users.json       # User data
│   └── sessions.json    # Session data
├── media/
│   └── toji.jpg         # Menu image
├── index.js             # Main entry
├── whatsapp.js          # WhatsApp handler
├── telegram.js          # Telegram pairing
├── config.js            # Configuration
├── package.json         # Dependencies
├── .env                 # Environment variables
├── render.yaml          # Render config
└── README.md            # Documentation
```

## Environment Variables 🔐

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather | Yes |
| `OWNER_ID` | Your Telegram user ID | Yes |
| `OWNER_NUMBER` | Your WhatsApp number | Yes |
| `PREFIX` | Command prefix (default: .) | No |
| `BOT_NAME` | Bot name | No |
| `PORT` | Server port (default: 3000) | No |

## API Keys (Optional) 🔑

For enhanced AI features, add these to `.env`:

```env
OPENAI_API_KEY=your_openai_key
WEATHER_API_KEY=your_openweather_key
NEWS_API_KEY=your_newsapi_key
```

Without API keys, the bot will use fallback responses.

## Troubleshooting 🔧

### Bot not connecting?
- Check your WhatsApp number format
- Ensure session folder is writable
- Check Render logs for errors

### Telegram not working?
- Verify bot token is correct
- Check if bot is started in Telegram
- Ensure OWNER_ID is correct

### Commands not responding?
- Check prefix configuration
- Verify user is not banned
- Check message handler logs

## Support 💬

For support, contact the owner:
- Telegram: @EZIHE
- WhatsApp: 09035659542

## License 📄

MIT License - Feel free to use and modify!

## Credits 🙏

- Built with [Baileys](https://github.com/WhiskeySockets/Baileys)
- Telegram API by [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

---

**EZIHE-BOT** © 2024 - Made with ❤️ by EZIHE
