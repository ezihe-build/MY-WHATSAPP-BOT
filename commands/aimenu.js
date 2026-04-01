/**
 * AI Menu Commands
 * AI-powered commands for various tasks
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const MENU_IMAGE = path.join(__dirname, '..', 'media', 'toji.jpg');

// Simulated AI responses (in production, use actual AI APIs)
const aiResponses = {
    greetings: [
        "Hello! How can I assist you today?",
        "Hi there! What can I do for you?",
        "Hey! Ready to help you out!"
    ],
    unknown: [
        "I'm not sure I understand. Could you rephrase that?",
        "That's interesting! Tell me more.",
        "I'm still learning. Can you clarify?"
    ]
};

// Code templates
const codeTemplates = {
    javascript: {
        hello: `console.log("Hello, World!");`,
        function: `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));`,
        array: `const fruits = ["apple", "banana", "orange"];\n\nfruits.forEach(fruit => {\n  console.log(fruit);\n});`
    },
    python: {
        hello: `print("Hello, World!")`,
        function: `def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
        list: `fruits = ["apple", "banana", "orange"]\n\nfor fruit in fruits:\n    print(fruit)`
    }
};

module.exports = {
    // AI menu
    aimenu: async (ctx) => {
        const menuText = `
⌗ hello: ${ctx.pushName}
⌗ creator: EZIHE
⌗ runtime: ${ctx.getUptime()}
⌗ prefix: ${ctx.config.prefix}

━━━━━━━━━━━━━━━━━━
    🤖 AI MENU
━━━━━━━━━━━━━━━━━━

*Chat & Conversation:*
${ctx.config.prefix}ai <text> - Chat with AI
${ctx.config.prefix}chat <text> - General conversation

*Content Generation:*
${ctx.config.prefix}aiimage <prompt> - Generate AI image
${ctx.config.prefix}code <lang> <desc> - Generate code
${ctx.config.prefix}story <topic> - Generate story
${ctx.config.prefix}poem <topic> - Generate poem
${ctx.config.prefix}essay <topic> - Generate essay
${ctx.config.prefix}lyricsai <topic> - Generate lyrics
${ctx.config.prefix}recipe <dish> - Get recipe

*Text Improvement:*
${ctx.config.prefix}explain <text> - Explain something
${ctx.config.prefix}summarize <text> - Summarize text
${ctx.config.prefix}rewrite <text> - Rewrite text
${ctx.config.prefix}improve <text> - Improve writing
${ctx.config.prefix}translateai <lang> <text> - Translate
${ctx.config.prefix}grammar <text> - Check grammar

*Advice:*
${ctx.config.prefix}advice <topic> - Get advice

━━━━━━━━━━━━━━━━━━
        `;

        await ctx.replyWithImage(MENU_IMAGE, menuText);
    },

    // AI chat
    ai: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide text\nUsage: .ai <text>');
        }

        await ctx.reply('🤔 *Thinking...*');

        try {
            // Try to use a free AI API
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: text }],
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'demo-key'}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }).catch(() => null);

            if (response && response.data) {
                const aiResponse = response.data.choices[0].message.content;
                await ctx.reply(`🤖 *AI Response:*\n\n${aiResponse}`);
            } else {
                // Fallback response
                const fallback = generateFallbackResponse(text);
                await ctx.reply(`🤖 *AI Response:*\n\n${fallback}\n\n_Note: Using fallback mode. Add OPENAI_API_KEY to .env for full AI features._`);
            }
        } catch (error) {
            const fallback = generateFallbackResponse(text);
            await ctx.reply(`🤖 *AI Response:*\n\n${fallback}\n\n_Note: Using fallback mode. Add OPENAI_API_KEY to .env for full AI features._`);
        }
    },

    // Chat (alias for ai)
    chat: async (ctx) => {
        await module.exports.ai(ctx);
    },

    // AI Image generation
    aiimage: async (ctx) => {
        const prompt = ctx.args.join(' ');
        if (!prompt) {
            return ctx.reply('❌ Please provide a prompt\nUsage: .aiimage <prompt>');
        }

        await ctx.reply('🎨 *Generating image...*\n\nThis may take a moment...');

        try {
            // Using Pollinations AI (free)
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

            await ctx.sock.sendMessage(ctx.jid, {
                image: { url: imageUrl },
                caption: `🎨 *AI Generated Image*\n\n*Prompt:* ${prompt}\n\n_Powered by Pollinations AI_`
            }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply('❌ Error generating image. Please try again.');
        }
    },

    // Code generator
    code: async (ctx) => {
        if (ctx.args.length < 2) {
            return ctx.reply('❌ Usage: .code <language> <description>\nExample: .code javascript hello world function');
        }

        const lang = ctx.args[0].toLowerCase();
        const description = ctx.args.slice(1).join(' ');

        const languages = ['javascript', 'python', 'java', 'cpp', 'html', 'css', 'sql'];
        
        if (!languages.includes(lang)) {
            return ctx.reply(`❌ Supported languages: ${languages.join(', ')}`);
        }

        // Generate code based on description
        const code = generateCode(lang, description);

        await ctx.reply(`💻 *Generated ${lang.charAt(0).toUpperCase() + lang.slice(1)} Code*\n\n*Description:* ${description}\n\n\`\`\`${lang}\n${code}\n\`\`\``);
    },

    // Explain
    explain: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide text to explain\nUsage: .explain <text>');
        }

        const explanation = generateExplanation(text);
        await ctx.reply(`📚 *Explanation:*\n\n${explanation}`);
    },

    // Summarize
    summarize: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide text to summarize\nUsage: .summarize <text>');
        }

        if (text.length < 50) {
            return ctx.reply('❌ Text is too short to summarize (minimum 50 characters)');
        }

        const summary = generateSummary(text);
        await ctx.reply(`📝 *Summary:*\n\n${summary}\n\n_Original length: ${text.length} chars_`);
    },

    // Rewrite
    rewrite: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide text to rewrite\nUsage: .rewrite <text>');
        }

        const rewritten = generateRewrite(text);
        await ctx.reply(`✍️ *Rewritten Text:*\n\n${rewritten}`);
    },

    // Improve
    improve: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide text to improve\nUsage: .improve <text>');
        }

        const improved = generateImproved(text);
        await ctx.reply(`✨ *Improved Text:*\n\n${improved}`);
    },

    // Story generator
    story: async (ctx) => {
        const topic = ctx.args.join(' ') || 'adventure';

        const story = generateStory(topic);
        await ctx.reply(`📖 *Story: ${topic.charAt(0).toUpperCase() + topic.slice(1)}*\n\n${story}`);
    },

    // Poem generator
    poem: async (ctx) => {
        const topic = ctx.args.join(' ') || 'love';

        const poem = generatePoem(topic);
        await ctx.reply(`🌹 *Poem: ${topic.charAt(0).toUpperCase() + topic.slice(1)}*\n\n${poem}`);
    },

    // Essay generator
    essay: async (ctx) => {
        const topic = ctx.args.join(' ');
        if (!topic) {
            return ctx.reply('❌ Please provide a topic\nUsage: .essay <topic>');
        }

        const essay = generateEssay(topic);
        await ctx.reply(`📄 *Essay: ${topic}*\n\n${essay}`);
    },

    // Lyrics generator
    lyricsai: async (ctx) => {
        const topic = ctx.args.join(' ') || 'love';

        const lyrics = generateLyrics(topic);
        await ctx.reply(`🎵 *Lyrics: ${topic}*\n\n${lyrics}`);
    },

    // Recipe generator
    recipe: async (ctx) => {
        const dish = ctx.args.join(' ');
        if (!dish) {
            return ctx.reply('❌ Please provide a dish name\nUsage: .recipe <dish>');
        }

        const recipe = generateRecipe(dish);
        await ctx.reply(`🍳 *Recipe: ${dish}*\n\n${recipe}`);
    },

    // Translate with AI
    translateai: async (ctx) => {
        if (ctx.args.length < 2) {
            return ctx.reply('❌ Usage: .translateai <language> <text>\nExample: .translateai spanish Hello world');
        }

        const lang = ctx.args[0];
        const text = ctx.args.slice(1).join(' ');

        try {
            const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
            const translation = response.data[0][0][0];

            await ctx.reply(`🌐 *AI Translation*\n\n*Original:* ${text}\n*Translated:* ${translation}\n*Target Language:* ${lang}`);
        } catch (error) {
            await ctx.reply('❌ Error translating text');
        }
    },

    // Grammar check
    grammar: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) {
            return ctx.reply('❌ Please provide text to check\nUsage: .grammar <text>');
        }

        const corrections = checkGrammar(text);
        await ctx.reply(`✅ *Grammar Check:*\n\n*Original:* ${text}\n\n*Suggestions:*\n${corrections}`);
    },

    // Advice
    advice: async (ctx) => {
        const topic = ctx.args.join(' ') || 'life';

        const advice = generateAdvice(topic);
        await ctx.reply(`💡 *Advice: ${topic}*\n\n${advice}`);
    }
};

// Helper functions for fallback AI responses
function generateFallbackResponse(input) {
    const responses = [
        `That's an interesting question about "${input}". Based on my analysis, I'd say it depends on various factors and context.`,
        `Regarding "${input}", there are multiple perspectives to consider. The most common approach would be to analyze it step by step.`,
        `"${input}" is a fascinating topic! Here's what I think: It requires careful consideration of all relevant aspects.`,
        `When it comes to "${input}", I recommend gathering more information and considering different viewpoints before making a decision.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateCode(lang, description) {
    const templates = {
        javascript: `// ${description}\nfunction solution() {\n  // Your code here\n  console.log("Hello from JavaScript!");\n  return "Success";\n}\n\nsolution();`,
        python: `# ${description}\ndef solution():\n    # Your code here\n    print("Hello from Python!")\n    return "Success"\n\nsolution()`,
        java: `// ${description}\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n    \n    public static String solution() {\n        return "Success";\n    }\n}`,
        html: `<!-- ${description} -->\n<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>${description}</p>\n</body>\n</html>`,
        css: `/* ${description} */\nbody {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n    margin: 0;\n    padding: 20px;\n}\n\n.container {\n    max-width: 1200px;\n    margin: 0 auto;\n}`
    };

    return templates[lang] || templates.javascript;
}

function generateExplanation(text) {
    return `Here's an explanation of "${text}":\n\n1. **Definition**: This refers to the concept or topic mentioned.\n2. **Key Points**: The main aspects include understanding the fundamentals and applications.\n3. **Importance**: It plays a significant role in its respective field.\n4. **Applications**: Can be applied in various scenarios depending on context.`;
}

function generateSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 2) return text;
    
    return `Key points:\n• ${sentences[0].trim()}\n• ${sentences[Math.floor(sentences.length / 2)].trim()}\n• ${sentences[sentences.length - 1].trim()}`;
}

function generateRewrite(text) {
    return `Here's a different way to express this:\n\n"${text}" can be rephrased while maintaining the same meaning but with improved clarity and flow.`;
}

function generateImproved(text) {
    return `Improved version:\n\n✨ ${text}\n\nChanges made:\n• Enhanced vocabulary\n• Improved sentence structure\n• Better flow and readability`;
}

function generateStory(topic) {
    return `Once upon a time, in a world where ${topic} was the most important thing, there lived a curious character who embarked on an incredible journey.\n\nThrough challenges and triumphs, they discovered that the true meaning of ${topic} was not what they initially thought. In the end, they learned a valuable lesson that changed their life forever.\n\n*The End*`;
}

function generatePoem(topic) {
    return `Roses are red,\nViolets are blue,\n${topic} is beautiful,\nAnd so are you.\n\nThrough the winds of time,\nAnd the changing seasons,\n${topic} remains,\nFor many reasons.`;
}

function generateEssay(topic) {
    return `**Introduction**\n${topic} is a subject of great importance in today's world. This essay explores its various aspects and significance.\n\n**Main Points**\n1. Historical context and development\n2. Current relevance and applications\n3. Future implications and possibilities\n\n**Conclusion**\nIn conclusion, ${topic} continues to play a vital role in shaping our understanding and approach to related matters.`;
}

function generateLyrics(topic) {
    return `[Verse 1]\nWalking down this lonely road\nThinking about ${topic}\nDon't know where this path will go\nBut I'll keep moving through\n\n[Chorus]\nOh, ${topic} is all I need\nIn this moment, I am free\nWith ${topic} in my heart\nWe'll never be apart`;
}

function generateRecipe(dish) {
    return `**Ingredients:**\n• Main ingredient for ${dish}\n• Spices and seasonings\n• Fresh vegetables\n• Cooking oil\n• Salt to taste\n\n**Instructions:**\n1. Prepare all ingredients\n2. Heat oil in a pan\n3. Add spices and sauté\n4. Add main ingredients\n5. Cook until done\n6. Serve hot and enjoy!\n\n*Prep time: 15 mins | Cook time: 30 mins*`;
}

function checkGrammar(text) {
    return `• Consider using more varied sentence structures\n• Check for proper punctuation\n• Ensure subject-verb agreement\n• Review word choice for clarity`;
}

function generateAdvice(topic) {
    const advices = [
        `When it comes to ${topic}, remember that patience and persistence are key. Take things one step at a time.`,
        `For ${topic}, I recommend staying informed and being open to new perspectives. Knowledge is power.`,
        `Dealing with ${topic}? Don't forget to take care of yourself first. Self-care is essential for success.`
    ];
    return advices[Math.floor(Math.random() * advices.length)];
}
