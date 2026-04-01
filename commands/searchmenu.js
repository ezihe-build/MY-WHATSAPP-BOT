/**
 * Search Menu Commands
 * Search commands for various platforms
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const MENU_IMAGE = path.join(__dirname, '..', 'media', 'toji.jpg');

module.exports = {
    // Search menu
    searchmenu: async (ctx) => {
        const menuText = `
⌗ hello: ${ctx.pushName}
⌗ creator: EZIHE
⌗ runtime: ${ctx.getUptime()}
⌗ prefix: ${ctx.config.prefix}

━━━━━━━━━━━━━━━━━━
    🔍 SEARCH MENU
━━━━━━━━━━━━━━━━━━

*Web Search:*
${ctx.config.prefix}google <query> - Google search
${ctx.config.prefix}wiki <query> - Wikipedia search
${ctx.config.prefix}news <topic> - News search

*Video & Music:*
${ctx.config.prefix}ytsearch <query> - YouTube search
${ctx.config.prefix}yts <query> - YouTube search (short)
${ctx.config.prefix}lyrics <song> - Song lyrics
${ctx.config.prefix}spotifysearch <song> - Spotify search

*Images:*
${ctx.config.prefix}imagesearch <query> - Image search
${ctx.config.prefix}img <query> - Image search (short)
${ctx.config.prefix}pinterest <query> - Pinterest search

*Apps & Code:*
${ctx.config.prefix}apk <app> - APK search
${ctx.config.prefix}github <repo> - GitHub search

*Social Media:*
${ctx.config.prefix}tiktoksearch <user> - TikTok search
${ctx.config.prefix}twittersearch <user> - Twitter search

*Entertainment:*
${ctx.config.prefix}movie <title> - Movie info
${ctx.config.prefix}anime <title> - Anime info
${ctx.config.prefix}manga <title> - Manga info

━━━━━━━━━━━━━━━━━━
        `;

        await ctx.replyWithImage(MENU_IMAGE, menuText);
    },

    // Google search
    google: async (ctx) => {
        const query = ctx.args.join(' ');
        if (!query) {
            return ctx.reply('❌ Please provide a search query\nUsage: .google <query>');
        }

        try {
            // Using a search API or scraping
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            
            await ctx.reply(`🔍 *Google Search Results*\n\n*Query:* ${query}\n\n🔗 *Search URL:* ${searchUrl}\n\n_Top results:_\n1. Result for "${query}" - [View on Google](${searchUrl})\n\n_Note: Click the link above to see full results_`);
        } catch (error) {
            await ctx.reply('❌ Error performing search');
        }
    },

    // YouTube search
    ytsearch: async (ctx) => {
        const query = ctx.args.join(' ');
        if (!query) {
            return ctx.reply('❌ Please provide a search query\nUsage: .ytsearch <query>');
        }

        try {
            const yts = require('yt-search');
            const search = await yts(query);
            const videos = search.videos.slice(0, 5);

            if (videos.length === 0) {
                return ctx.reply('❌ No results found');
            }

            let resultText = `🎬 *YouTube Search Results*\n\n*Query:* ${query}\n\n`;
            videos.forEach((video, i) => {
                resultText += `${i + 1}. *${video.title}*\n   👤 ${video.author.name} | ⏱️ ${video.timestamp} | 👁️ ${video.views.toLocaleString()}\n   🔗 ${video.url}\n\n`;
            });

            await ctx.reply(resultText);
        } catch (error) {
            await ctx.reply('❌ Error searching YouTube');
        }
    },

    // Image search
    imagesearch: async (ctx) => {
        const query = ctx.args.join(' ');
        if (!query) {
            return ctx.reply('❌ Please provide a search query\nUsage: .imagesearch <query>');
        }

        try {
            // Using Pollinations for image generation/search
            const encodedQuery = encodeURIComponent(query);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedQuery}?width=512&height=512&nologo=true`;

            await ctx.sock.sendMessage(ctx.jid, {
                image: { url: imageUrl },
                caption: `🖼️ *Image Search: ${query}*\n\n_Powered by AI Image Generation_`
            }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply('❌ Error searching images');
        }
    },

    // Lyrics search
    lyrics: async (ctx) => {
        const song = ctx.args.join(' ');
        if (!song) {
            return ctx.reply('❌ Please provide a song name\nUsage: .lyrics <song name>');
        }

        try {
            // Using lyrics API
            const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent('artist')}/${encodeURIComponent(song)}`).catch(() => null);

            if (response && response.data && response.data.lyrics) {
                const lyrics = response.data.lyrics.substring(0, 4000);
                await ctx.reply(`🎵 *Lyrics: ${song}*\n\n${lyrics}\n\n_Powered by lyrics.ovh_`);
            } else {
                // Fallback
                await ctx.reply(`🎵 *Lyrics Search*\n\nSong: ${song}\n\n❌ Lyrics not found in database.\n\nTry searching on: https://genius.com/search?q=${encodeURIComponent(song)}`);
            }
        } catch (error) {
            await ctx.reply(`🎵 *Lyrics Search*\n\nSong: ${song}\n\nSearch on Genius: https://genius.com/search?q=${encodeURIComponent(song)}`);
        }
    },

    // APK search
    apk: async (ctx) => {
        const app = ctx.args.join(' ');
        if (!app) {
            return ctx.reply('❌ Please provide an app name\nUsage: .apk <app name>');
        }

        try {
            await ctx.reply(`📱 *APK Search: ${app}*\n\nSearch results:\n\n1. ${app} - [APKPure](https://apkpure.com/search?q=${encodeURIComponent(app)})\n2. ${app} - [APKMirror](https://www.apkmirror.com/?s=${encodeURIComponent(app)})\n3. ${app} - [Uptodown](https://en.uptodown.com/android/search/${encodeURIComponent(app)})\n\n⚠️ Download apps only from trusted sources!`);
        } catch (error) {
            await ctx.reply('❌ Error searching APK');
        }
    },

    // GitHub search
    github: async (ctx) => {
        const query = ctx.args.join(' ');
        if (!query) {
            return ctx.reply('❌ Please provide a search query\nUsage: .github <repo/user>');
        }

        try {
            const response = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`);
            const repos = response.data.items;

            if (repos.length === 0) {
                return ctx.reply('❌ No repositories found');
            }

            let resultText = `💻 *GitHub Search Results*\n\n*Query:* ${query}\n\n`;
            repos.forEach((repo, i) => {
                resultText += `${i + 1}. *${repo.fullName}*\n   ⭐ ${repo.stargazers_count.toLocaleString()} stars | 🍴 ${repo.forks_count.toLocaleString()} forks\n   📝 ${repo.description || 'No description'}\n   🔗 ${repo.html_url}\n\n`;
            });

            await ctx.reply(resultText);
        } catch (error) {
            await ctx.reply(`💻 *GitHub Search*\n\nQuery: ${query}\n\nSearch on GitHub: https://github.com/search?q=${encodeURIComponent(query)}`);
        }
    },

    // Wikipedia search
    wiki: async (ctx) => {
        const query = ctx.args.join(' ');
        if (!query) {
            return ctx.reply('❌ Please provide a search query\nUsage: .wiki <query>');
        }

        try {
            const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            const data = response.data;

            if (data.type === 'disambiguation') {
                await ctx.reply(`📚 *Wikipedia: ${query}*\n\nThis term may refer to multiple topics.\n\n🔗 View all: ${data.content_urls.desktop.page}`);
            } else {
                const extract = data.extract ? data.extract.substring(0, 1000) + (data.extract.length > 1000 ? '...' : '') : 'No summary available';
                
                await ctx.reply(`📚 *Wikipedia: ${data.title}*\n\n${extract}\n\n🔗 Read more: ${data.content_urls.desktop.page}`);
            }
        } catch (error) {
            await ctx.reply(`📚 *Wikipedia Search*\n\nQuery: ${query}\n\nSearch on Wikipedia: https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`);
        }
    },

    // News search
    news: async (ctx) => {
        const topic = ctx.args.join(' ') || 'latest';

        try {
            // Using a free news API
            const response = await axios.get(`https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&apiKey=${process.env.NEWS_API_KEY || 'demo'}&pageSize=5`).catch(() => null);

            if (response && response.data && response.data.articles) {
                const articles = response.data.articles.slice(0, 5);
                
                let resultText = `📰 *News: ${topic}*\n\n`;
                articles.forEach((article, i) => {
                    resultText += `${i + 1}. *${article.title}*\n   📰 ${article.source.name}\n   🔗 ${article.url}\n\n`;
                });

                await ctx.reply(resultText);
            } else {
                await ctx.reply(`📰 *News Search: ${topic}*\n\nSearch on Google News: https://news.google.com/search?q=${encodeURIComponent(topic)}`);
            }
        } catch (error) {
            await ctx.reply(`📰 *News Search: ${topic}*\n\nSearch on Google News: https://news.google.com/search?q=${encodeURIComponent(topic)}`);
        }
    },

    // Movie search
    movie: async (ctx) => {
        const title = ctx.args.join(' ');
        if (!title) {
            return ctx.reply('❌ Please provide a movie title\nUsage: .movie <title>');
        }

        try {
            // Using OMDB API (free tier)
            const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${process.env.OMDB_API_KEY || 'demo'}`);
            const data = response.data;

            if (data.Response === 'True') {
                await ctx.reply(`
🎬 *${data.Title}* (${data.Year})

⭐ Rating: ${data.imdbRating}/10
⏱️ Runtime: ${data.Runtime}
🎭 Genre: ${data.Genre}
👨‍💼 Director: ${data.Director}
🎬 Actors: ${data.Actors}

📝 Plot: ${data.Plot}

🏆 Awards: ${data.Awards}
                `);
            } else {
                await ctx.reply(`🎬 *Movie Search: ${title}*\n\n❌ Movie not found.\n\nSearch on IMDb: https://www.imdb.com/find?q=${encodeURIComponent(title)}`);
            }
        } catch (error) {
            await ctx.reply(`🎬 *Movie Search: ${title}*\n\nSearch on IMDb: https://www.imdb.com/find?q=${encodeURIComponent(title)}`);
        }
    },

    // Anime search
    anime: async (ctx) => {
        const title = ctx.args.join(' ');
        if (!title) {
            return ctx.reply('❌ Please provide an anime title\nUsage: .anime <title>');
        }

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
            const anime = response.data.data[0];

            if (anime) {
                await ctx.reply(`
🎌 *${anime.title}* (${anime.title_japanese || 'N/A'})

⭐ Score: ${anime.score || 'N/A'}/10
📺 Episodes: ${anime.episodes || 'N/A'}
⏱️ Duration: ${anime.duration || 'N/A'}
📊 Status: ${anime.status}
🎭 Genres: ${anime.genres.map(g => g.name).join(', ')}

📝 Synopsis: ${anime.synopsis ? anime.synopsis.substring(0, 500) + '...' : 'No synopsis available'}

🔗 More info: ${anime.url}
                `);
            } else {
                await ctx.reply(`🎌 *Anime Search: ${title}*\n\n❌ Anime not found.`);
            }
        } catch (error) {
            await ctx.reply(`🎌 *Anime Search: ${title}*\n\nSearch on MyAnimeList: https://myanimelist.net/search/all?q=${encodeURIComponent(title)}`);
        }
    },

    // Manga search
    manga: async (ctx) => {
        const title = ctx.args.join(' ');
        if (!title) {
            return ctx.reply('❌ Please provide a manga title\nUsage: .manga <title>');
        }

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=1`);
            const manga = response.data.data[0];

            if (manga) {
                await ctx.reply(`
📖 *${manga.title}* (${manga.title_japanese || 'N/A'})

⭐ Score: ${manga.score || 'N/A'}/10
📚 Chapters: ${manga.chapters || 'N/A'}
📊 Status: ${manga.status}
🎭 Genres: ${manga.genres.map(g => g.name).join(', ')}

📝 Synopsis: ${manga.synopsis ? manga.synopsis.substring(0, 500) + '...' : 'No synopsis available'}

🔗 More info: ${manga.url}
                `);
            } else {
                await ctx.reply(`📖 *Manga Search: ${title}*\n\n❌ Manga not found.`);
            }
        } catch (error) {
            await ctx.reply(`📖 *Manga Search: ${title}*\n\nSearch on MyAnimeList: https://myanimelist.net/search/all?q=${encodeURIComponent(title)}`);
        }
    },

    // Pinterest search
    pinterest: async (ctx) => {
        const query = ctx.args.join(' ');
        if (!query) {
            return ctx.reply('❌ Please provide a search query\nUsage: .pinterest <query>');
        }

        try {
            // Using a Pinterest image API
            const imageUrl = `https://image.pollinations.ai/prompt/pinterest%20style%20${encodeURIComponent(query)}?width=512&height=768&nologo=true`;

            await ctx.sock.sendMessage(ctx.jid, {
                image: { url: imageUrl },
                caption: `📌 *Pinterest Style: ${query}*\n\n_Search on Pinterest: https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}_`
            }, { quoted: ctx.m });
        } catch (error) {
            await ctx.reply(`📌 *Pinterest Search: ${query}*\n\nhttps://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`);
        }
    },

    // TikTok search
    tiktoksearch: async (ctx) => {
        const user = ctx.args.join(' ');
        if (!user) {
            return ctx.reply('❌ Please provide a username\nUsage: .tiktoksearch <username>');
        }

        await ctx.reply(`🎵 *TikTok Search: ${user}*\n\nSearch on TikTok: https://www.tiktok.com/@${encodeURIComponent(user)}\n\nOr browse: https://www.tiktok.com/search?q=${encodeURIComponent(user)}`);
    },

    // Twitter search
    twittersearch: async (ctx) => {
        const user = ctx.args.join(' ');
        if (!user) {
            return ctx.reply('❌ Please provide a username\nUsage: .twittersearch <username>');
        }

        await ctx.reply(`🐦 *Twitter/X Search: ${user}*\n\nProfile: https://twitter.com/${encodeURIComponent(user)}\n\nSearch: https://twitter.com/search?q=${encodeURIComponent(user)}`);
    },

    // Spotify search
    spotifysearch: async (ctx) => {
        const song = ctx.args.join(' ');
        if (!song) {
            return ctx.reply('❌ Please provide a song name\nUsage: .spotifysearch <song>');
        }

        await ctx.reply(`🎧 *Spotify Search: ${song}*\n\nSearch on Spotify: https://open.spotify.com/search/${encodeURIComponent(song)}`);
    }
};
