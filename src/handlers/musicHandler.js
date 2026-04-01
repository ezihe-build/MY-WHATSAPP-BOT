/**
 * EZIHE SUPER BOT - Music Handler
 * Handles music search and download
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const logger = require('../utils/logger');
const database = require('../utils/database');
const config = require('../config/config');

const activeDownloads = new Map();

/**
 * Music search command
 */
async function musicCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
🎵 <b>Music Search</b>

Search and download any song!

<b>Usage:</b>
/music [song name or artist]

<b>Examples:</b>
/music Shape of You
/music Ed Sheeran Perfect
/music latest hits 2024

<b>Features:</b>
• High quality audio
• Fast download
• Metadata included
`, { parse_mode: 'HTML' });
  }

  const query = args.join(' ');
  await searchMusic(ctx, query);
}

/**
 * Play music command
 */
async function playCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
▶️ <b>Play Music</b>

Search and play music instantly!

<b>Usage:</b>
/play [song name]

<b>Example:</b>
/play happy birthday song

The first result will be downloaded and sent.
`, { parse_mode: 'HTML' });
  }

  const query = args.join(' ');
  await playMusic(ctx, query);
}

/**
 * Search for music
 */
async function searchMusic(ctx, query) {
  try {
    const searchingMsg = await ctx.reply(`🔍 Searching for "${query}"...`);

    // Search YouTube for music
    const searchResults = await yts(query);
    
    if (!searchResults.videos || searchResults.videos.length === 0) {
      await ctx.telegram.deleteMessage(searchingMsg.chat.id, searchingMsg.message_id);
      return ctx.reply('❌ No results found. Try a different search.');
    }

    // Get top 5 results
    const videos = searchResults.videos.slice(0, 5);

    // Create results message
    let resultsText = `🎵 <b>Search Results for "${query}"</b>\n\n`;
    const keyboard = [];

    videos.forEach((video, index) => {
      const duration = video.duration.timestamp;
      const views = parseInt(video.views).toLocaleString();
      
      resultsText += `${index + 1}. <b>${video.title}</b>\n`;
      resultsText += `   👤 ${video.author.name} | ⏱️ ${duration} | 👁️ ${views}\n\n`;

      keyboard.push([{
        text: `▶️ ${index + 1}. ${video.title.substring(0, 40)}...`,
        callback_data: `play_${video.videoId}`
      }]);
    });

    keyboard.push([{ text: '🔍 New Search', callback_data: 'music_search' }]);

    await ctx.telegram.deleteMessage(searchingMsg.chat.id, searchingMsg.message_id);

    await ctx.replyWithPhoto(videos[0].thumbnail, {
      caption: resultsText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });

  } catch (error) {
    logger.error('Music search error:', error);
    ctx.reply('❌ Search failed. Please try again.');
  }
}

/**
 * Play/download music
 */
async function playMusic(ctx, query) {
  const userId = ctx.from.id;

  try {
    if (activeDownloads.has(userId)) {
      return ctx.reply('⏳ You already have an active download. Please wait...');
    }

    activeDownloads.set(userId, true);

    const searchingMsg = await ctx.reply(`🔍 Searching for "${query}"...`);

    // Search and get first result
    const searchResults = await yts(query);
    
    if (!searchResults.videos || searchResults.videos.length === 0) {
      activeDownloads.delete(userId);
      await ctx.telegram.deleteMessage(searchingMsg.chat.id, searchingMsg.message_id);
      return ctx.reply('❌ No results found.');
    }

    const video = searchResults.videos[0];
    
    await ctx.telegram.editMessageText(
      searchingMsg.chat.id,
      searchingMsg.message_id,
      null,
      `🎵 Found: ${video.title}\n⏳ Downloading...`
    );

    // Download audio
    const tempDir = path.join(config.paths.temp, `music_${userId}`);
    await fs.ensureDir(tempDir);

    const fileName = `music_${Date.now()}.mp3`;
    const filePath = path.join(tempDir, fileName);

    const stream = ytdl(video.url, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      stream.on('error', reject);
    });

    const stats = await fs.stat(filePath);

    // Check file size (Telegram limit for bots is 50MB)
    if (stats.size > 50 * 1024 * 1024) {
      await fs.remove(filePath);
      activeDownloads.delete(userId);
      await ctx.telegram.deleteMessage(searchingMsg.chat.id, searchingMsg.message_id);
      return ctx.reply('❌ File too large. Maximum size is 50MB.');
    }

    // Delete searching message
    await ctx.telegram.deleteMessage(searchingMsg.chat.id, searchingMsg.message_id);

    // Send audio
    await ctx.replyWithAudio(
      { source: filePath },
      {
        title: video.title,
        performer: video.author.name,
        duration: video.duration.seconds,
        thumb: video.thumbnail
      }
    );

    // Log download
    await database.logDownload(userId, video.url, 'music', filePath, stats.size);

    // Cleanup
    await fs.remove(filePath);
    activeDownloads.delete(userId);

  } catch (error) {
    logger.error('Music play error:', error);
    activeDownloads.delete(userId);
    ctx.reply('❌ Failed to download music. Please try again.');
  }
}

/**
 * Download specific video by ID
 */
async function downloadById(ctx, videoId) {
  const userId = ctx.from.id;

  try {
    if (activeDownloads.has(userId)) {
      return ctx.answerCbQuery('⏳ Active download in progress', { show_alert: true });
    }

    activeDownloads.set(userId, true);
    await ctx.answerCbQuery('⬇️ Downloading...');

    const url = `https://youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);

    const tempDir = path.join(config.paths.temp, `music_${userId}`);
    await fs.ensureDir(tempDir);

    const filePath = path.join(tempDir, `music_${Date.now()}.mp3`);

    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      stream.on('error', reject);
    });

    const stats = await fs.stat(filePath);

    if (stats.size > 50 * 1024 * 1024) {
      await fs.remove(filePath);
      activeDownloads.delete(userId);
      return ctx.reply('❌ File too large.');
    }

    await ctx.replyWithAudio(
      { source: filePath },
      {
        title: info.videoDetails.title,
        performer: info.videoDetails.author.name,
        thumb: info.videoDetails.thumbnails.pop().url
      }
    );

    await database.logDownload(userId, url, 'music', filePath, stats.size);

    await fs.remove(filePath);
    activeDownloads.delete(userId);

  } catch (error) {
    logger.error('Download by ID error:', error);
    activeDownloads.delete(userId);
    ctx.reply('❌ Download failed.');
  }
}

module.exports = {
  musicCommand,
  playCommand,
  searchMusic,
  playMusic,
  downloadById
};
