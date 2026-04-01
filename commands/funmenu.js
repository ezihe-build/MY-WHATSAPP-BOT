/**
 * Fun Menu Commands
 * Entertainment and fun commands
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const MENU_IMAGE = path.join(__dirname, '..', 'media', 'toji.jpg');

// Data collections
const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "Why don't eggs tell jokes? They'd crack each other up!",
    "What do you call a fake noodle? An impasta!",
    "Why did the math book look sad? Because it had too many problems.",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why did the cookie go to the doctor? Because it was feeling crumbly.",
    "What do you call a sleeping dinosaur? A dino-snore!",
    "Why did the student eat his homework? Because his teacher said it was a piece of cake!",
    "What do you call a fish wearing a crown? A king fish!"
];

const truths = [
    "What's the most embarrassing thing you've ever done?",
    "What's your biggest fear?",
    "Have you ever lied to your best friend?",
    "What's the worst gift you've ever received?",
    "What's your most annoying habit?",
    "Have you ever cheated on a test?",
    "What's your biggest insecurity?",
    "What's the weirdest dream you've ever had?",
    "Have you ever stolen something?",
    "What's your biggest regret?"
];

const dares = [
    "Send a funny selfie to the group",
    "Text your crush 'I love you'",
    "Do 10 pushups right now",
    "Sing your favorite song out loud",
    "Tell a joke to everyone",
    "Dance for 30 seconds",
    "Make a funny face and send it",
    "Call someone and sing happy birthday",
    "Do your best animal impression",
    "Speak in an accent for the next 5 minutes"
];

const pickupLines = [
    "Are you a magician? Because whenever I look at you, everyone else disappears!",
    "Do you have a map? I keep getting lost in your eyes.",
    "Are you a camera? Because every time I look at you, I smile.",
    "Is your name Google? Because you have everything I've been searching for.",
    "Are you a parking ticket? Because you've got FINE written all over you.",
    "Do you believe in love at first sight, or should I walk by again?",
    "Are you a WiFi signal? Because I'm feeling a connection.",
    "Is your dad a boxer? Because you're a knockout!",
    "Are you a bank loan? Because you have my interest.",
    "If you were a vegetable, you'd be a cute-cumber!"
];

const compliments = [
    "You're an awesome friend!",
    "You have a great sense of humor!",
    "You're more helpful than you realize!",
    "You're like a ray of sunshine on a rainy day!",
    "You have the best laugh!",
    "You're more fun than bubble wrap!",
    "You're wonderful just the way you are!",
    "You bring out the best in people!",
    "Your smile is contagious!",
    "You make the world a better place!"
];

const roasts = [
    "You're like a cloud. When you disappear, it's a beautiful day!",
    "I'd agree with you but then we'd both be wrong.",
    "You're not stupid; you just have bad luck thinking.",
    "I'm not saying I hate you, but I would unplug your life support to charge my phone.",
    "You're the reason the gene pool needs a lifeguard.",
    "I'd explain it to you, but I left my crayons at home.",
    "You're not dumb. You just have bad luck when it comes to thinking.",
    "I'm jealous of people who don't know you.",
    "You're like a software update. Whenever I see you, I think 'Not now'.",
    "You bring everyone so much joy... when you leave the room!"
];

const facts = [
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!",
    "Octopuses have three hearts, nine brains, and blue blood!",
    "Bananas are berries, but strawberries aren't!",
    "A day on Venus is longer than a year on Venus!",
    "Wombat poop is cube-shaped!",
    "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes!",
    "A group of flamingos is called a 'flamboyance'!",
    "The unicorn is the national animal of Scotland!",
    "A jiffy is an actual unit of time: 1/100th of a second!",
    "The world's oldest known living tree is over 5,000 years old!"
];

const riddles = [
    { question: "What has keys but no locks?", answer: "A piano" },
    { question: "What has a head and a tail but no body?", answer: "A coin" },
    { question: "What gets wetter the more it dries?", answer: "A towel" },
    { question: "What has an eye but cannot see?", answer: "A needle" },
    { question: "What can travel around the world while staying in a corner?", answer: "A stamp" },
    { question: "What has hands but cannot clap?", answer: "A clock" },
    { question: "What has a neck but no head?", answer: "A bottle" },
    { question: "What belongs to you but others use it more than you?", answer: "Your name" },
    { question: "What goes up but never comes down?", answer: "Your age" },
    { question: "What has cities but no houses?", answer: "A map" }
];

const wouldYouRather = [
    "Would you rather be able to fly or be invisible?",
    "Would you rather be rich and ugly or poor and beautiful?",
    "Would you rather have no internet or no phone?",
    "Would you rather be always hot or always cold?",
    "Would you rather have super strength or super speed?",
    "Would you rather be able to read minds or see the future?",
    "Would you rather live in space or under the sea?",
    "Would you rather have unlimited money or unlimited time?",
    "Would you rather be famous or be rich?",
    "Would you rather have no friends or no family?"
];

const trivia = [
    { question: "What is the capital of France?", answer: "Paris" },
    { question: "How many continents are there?", answer: "7" },
    { question: "What is the largest planet in our solar system?", answer: "Jupiter" },
    { question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci" },
    { question: "What is the chemical symbol for gold?", answer: "Au" },
    { question: "How many bones are in the human body?", answer: "206" },
    { question: "What is the speed of light?", answer: "299,792,458 m/s" },
    { question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare" },
    { question: "What is the smallest country in the world?", answer: "Vatican City" },
    { question: "What year did World War II end?", answer: "1945" }
];

module.exports = {
    // Fun menu
    funmenu: async (ctx) => {
        const menuText = `
⌗ hello: ${ctx.pushName}
⌗ creator: EZIHE
⌗ runtime: ${ctx.getUptime()}
⌗ prefix: ${ctx.config.prefix}

━━━━━━━━━━━━━━━━━━
    🎮 FUN MENU
━━━━━━━━━━━━━━━━━━

*Entertainment:*
${ctx.config.prefix}joke - Random joke
${ctx.config.prefix}meme - Random meme
${ctx.config.prefix}truth - Truth question
${ctx.config.prefix}dare - Dare challenge
${ctx.config.prefix}pickup - Pickup line
${ctx.config.prefix}compliment - Get compliment
${ctx.config.prefix}roast - Get roasted

*Games:*
${ctx.config.prefix}trivia - Trivia question
${ctx.config.prefix}fact - Random fact
${ctx.config.prefix}riddle - Riddle challenge
${ctx.config.prefix}wouldyou - Would you rather
${ctx.config.prefix}8ball - Magic 8-ball
${ctx.config.prefix}roll - Roll dice
${ctx.config.prefix}coin - Flip coin

*Fun Tools:*
${ctx.config.prefix}ship <@user1> <@user2> - Ship users
${ctx.config.prefix}rate <thing> - Rate something

━━━━━━━━━━━━━━━━━━
        `;

        await ctx.replyWithImage(MENU_IMAGE, menuText);
    },

    // Random joke
    joke: async (ctx) => {
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await ctx.reply(`😂 *Joke*\n\n${joke}`);
    },

    // Random meme
    meme: async (ctx) => {
        try {
            const response = await axios.get('https://meme-api.com/gimme');
            const meme = response.data;

            await ctx.sock.sendMessage(ctx.jid, {
                image: { url: meme.url },
                caption: `🎭 *${meme.title}*\n\n👍 ${meme.ups} upvotes`
            }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply('❌ Error fetching meme');
        }
    },

    // Truth
    truth: async (ctx) => {
        const truth = truths[Math.floor(Math.random() * truths.length)];
        await ctx.reply(`🤔 *Truth*\n\n${truth}`);
    },

    // Dare
    dare: async (ctx) => {
        const dare = dares[Math.floor(Math.random() * dares.length)];
        await ctx.reply(`😈 *Dare*\n\n${dare}`);
    },

    // Pickup line
    pickup: async (ctx) => {
        const line = pickupLines[Math.floor(Math.random() * pickupLines.length)];
        await ctx.reply(`💘 *Pickup Line*\n\n${line}`);
    },

    // Compliment
    compliment: async (ctx) => {
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        await ctx.reply(`💝 *Compliment*\n\n${compliment}`);
    },

    // Roast
    roast: async (ctx) => {
        const roast = roasts[Math.floor(Math.random() * roasts.length)];
        await ctx.reply(`🔥 *Roast*\n\n${roast}`);
    },

    // Trivia
    trivia: async (ctx) => {
        const item = trivia[Math.floor(Math.random() * trivia.length)];
        await ctx.reply(`🧠 *Trivia*\n\n${item.question}\n\n_Answer will be revealed in 10 seconds..._`);

        setTimeout(async () => {
            await ctx.reply(`✅ *Answer:* ${item.answer}`);
        }, 10000);
    },

    // Random fact
    fact: async (ctx) => {
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await ctx.reply(`📚 *Did You Know?*\n\n${fact}`);
    },

    // Riddle
    riddle: async (ctx) => {
        const riddle = riddles[Math.floor(Math.random() * riddles.length)];
        await ctx.reply(`🤯 *Riddle*\n\n${riddle.question}\n\n_Answer will be revealed in 15 seconds..._`);

        setTimeout(async () => {
            await ctx.reply(`✅ *Answer:* ${riddle.answer}`);
        }, 15000);
    },

    // Would you rather
    wouldyou: async (ctx) => {
        const question = wouldYouRather[Math.floor(Math.random() * wouldYouRather.length)];
        await ctx.reply(`🤔 *Would You Rather*\n\n${question}`);
    },

    // 8-ball
    eightball: async (ctx) => {
        const question = ctx.args.join(' ');
        if (!question) {
            return ctx.reply('❌ Please ask a question\nUsage: .8ball <question>');
        }

        const responses = [
            "It is certain",
            "It is decidedly so",
            "Without a doubt",
            "Yes definitely",
            "You may rely on it",
            "As I see it, yes",
            "Most likely",
            "Outlook good",
            "Yes",
            "Signs point to yes",
            "Reply hazy, try again",
            "Ask again later",
            "Better not tell you now",
            "Cannot predict now",
            "Concentrate and ask again",
            "Don't count on it",
            "My reply is no",
            "My sources say no",
            "Outlook not so good",
            "Very doubtful"
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        await ctx.reply(`🎱 *Magic 8-Ball*\n\n*Q:* ${question}\n*A:* ${response}`);
    },

    // Roll dice
    roll: async (ctx) => {
        const sides = parseInt(ctx.args[0]) || 6;
        const result = Math.floor(Math.random() * sides) + 1;
        await ctx.reply(`🎲 *Roll*\n\nRolled a ${result} (1-${sides})`);
    },

    // Flip coin
    coin: async (ctx) => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        await ctx.reply(`🪙 *Coin Flip*\n\nResult: *${result}*`);
    },

    // Ship users
    ship: async (ctx) => {
        if (ctx.args.length < 2) {
            return ctx.reply('❌ Please mention two users\nUsage: .ship @user1 @user2');
        }

        const user1 = ctx.args[0].replace(/[@\s]/g, '');
        const user2 = ctx.args[1].replace(/[@\s]/g, '');
        const percentage = Math.floor(Math.random() * 101);

        let emoji = '💔';
        let message = 'Not meant to be...';
        if (percentage > 30) { emoji = '💛'; message = 'There\'s potential!'; }
        if (percentage > 50) { emoji = '💚'; message = 'Good match!'; }
        if (percentage > 70) { emoji = '💙'; message = 'Great match!'; }
        if (percentage > 90) { emoji = '💜'; message = 'Perfect match!'; }

        await ctx.reply(`
💕 *Ship Result* 💕

👤 ${user1}
❤️ ${user2}

📊 Compatibility: ${percentage}%
${emoji} ${message}
        `);
    },

    // Rate something
    rate: async (ctx) => {
        const thing = ctx.args.join(' ') || 'you';
        const rating = Math.floor(Math.random() * 11);

        let emoji = '😢';
        if (rating > 3) emoji = '😐';
        if (rating > 6) emoji = '🙂';
        if (rating > 8) emoji = '😍';

        await ctx.reply(`⭐ *Rating*\n\nI rate "${thing}" ${rating}/10 ${emoji}`);
    }
};
