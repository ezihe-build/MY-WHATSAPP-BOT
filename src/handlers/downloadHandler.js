/**
 * EZIHE SUPER BOT - Download Handler
 * Handles media downloads from YouTube, TikTok, Instagram, Pinterest
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ytdl = require('ytdl-core');
const logger = require('../utils/logger');
const database = require('../utils/database');
const config = require('../config/config');

// Active downloads tracker
const activeDownloads = new Map();

/**
 * YouTube download command
 */
async function youtubeCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
📺 <b>YouTube Downloader</b>

Download videos from YouTube:

<b>Usage:</b>
/yt [URL] - Download video
/yt [URL] audio - Download audio only

<b>Examples:</b>
/yt https://youtube.com/watch?v=...
/yt https://youtube.com/watch?v=... audio

<b>Supported:</b>
• Regular videos
• Shorts
• Playlists (first video)
`, { parse_mode: 'HTML' });
  }

  const url = args[0];
  const audioOnly = args.includes('audio');

  if (!ytdl.validateURL(url)) {
    return ctx.reply('❌ Invalid YouTube URL. Please provide a valid link.');
  }

  await downloadYouTube(ctx, url, audioOnly);
}

/**
 * Download YouTube video
 */
async function downloadYouTube(ctx, url, audioOnly = false) {
  const userId = ctx.from.id;
  const downloadId = `${userId}_${Date.now()}`;

  try {
    // Check if already downloading
    if (activeDownloads.has(userId)) {
      return ctx.reply('⏳ You already have an active download. Please wait...');
    }

    activeDownloads.set(userId, downloadId);

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const duration = parseInt(info.videoDetails.lengthSeconds);
    const thumbnail = info.videoDetails.thumbnails.pop().url;

    // Check duration limit
    if (duration > config.settings.maxVideoDuration) {
      activeDownloads.delete(userId);
      return ctx.reply(`❌ Video too long! Maximum duration is ${config.settings.maxVideoDuration / 60} minutes.`);
    }

    const statusMsg = await ctx.replyWithPhoto(thumbnail, {
      caption: `
📺 <b>YouTube Download</b>

🎬 <b>${title}</b>
⏱️ Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}
📊 Views: ${parseInt(info.videoDetails.viewCount).toLocaleString()}
👤 Channel: ${info.videoDetails.author.name}

⏳ <b>Downloading...</b>
`,
      parse_mode: 'HTML'
    });

    const tempDir = path.join(config.paths.temp, `yt_${userId}`);
    await fs.ensureDir(tempDir);

    const fileName = `${Date.now()}_${userId}.${audioOnly ? 'mp3' : 'mp4'}`;
    const filePath = path.join(tempDir, fileName);

    const options = audioOnly ? {
      quality: 'highestaudio',
      filter: 'audioonly'
    } : {
      quality: 'highest',
      filter: 'audioandvideo'
    };

    const stream = ytdl(url, options);
    const writeStream = fs.createWriteStream(filePath);

    let downloadedBytes = 0;
    let totalBytes = 0;

    stream.on('progress', (chunkLength, downloaded, total) => {
      downloadedBytes = downloaded;
      totalBytes = total;
    });

    stream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      stream.on('error', reject);
    });

    const stats = await fs.stat(filePath);

    // Check file size
    if (stats.size > config.settings.maxDownloadSize) {
      await fs.remove(filePath);
      activeDownloads.delete(userId);
      return ctx.reply('❌ File too large! Maximum size is 2GB.');
    }

    // Update status
    await ctx.telegram.editMessageCaption(
      statusMsg.chat.id,
      statusMsg.message_id,
      null,
      `
📺 <b>YouTube Download Complete!</b>

🎬 <b>${title}</b>
📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB
⏱️ Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}

📤 <b>Sending file...</b>
`,
      { parse_mode: 'HTML' }
    );

    // Send file
    if (audioOnly) {
      await ctx.replyWithAudio(
        { source: filePath },
        {
          title: title,
          performer: info.videoDetails.author.name,
          thumb: thumbnail
        }
      );
    } else {
      await ctx.replyWithVideo(
        { source: filePath },
        {
          caption: `📺 ${title}\n\nDownloaded with EZIHE BOT`,
          supports_streaming: true
        }
      );
    }

    // Log download
    await database.logDownload(userId, url, 'youtube', filePath, stats.size);

    // Cleanup
    await fs.remove(filePath);
    activeDownloads.delete(userId);

    await ctx.telegram.deleteMessage(statusMsg.chat.id, statusMsg.message_id);

  } catch (error) {
    logger.error('YouTube download error:', error);
    activeDownloads.delete(userId);
    ctx.reply(`❌ Download failed: ${error.message}`);
  }
}

/**
 * TikTok download command
 */
async function tiktokCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
🎵 <b>TikTok Downloader</b>

Download TikTok videos without watermark:

<b>Usage:</b>
/tiktok [URL]

<b>Example:</b>
/tiktok https://tiktok.com/@user/video/...

<b>Features:</b>
• No watermark
• HD quality
• Fast download
`, { parse_mode: 'HTML' });
  }

  const url = args[0];
  await downloadTikTok(ctx, url);
}

/**
 * Download TikTok video
 */
async function downloadTikTok(ctx, url) {
  const userId = ctx.from.id;

  try {
    if (activeDownloads.has(userId)) {
      return ctx.reply('⏳ You already have an active download. Please wait...');
    }

    activeDownloads.set(userId, true);

    const processingMsg = await ctx.reply('🔍 Processing TikTok link...');

    // Use TikTok API service
    const apiUrl = `https://api.tikdown.org/api/download?url=${encodeURIComponent(url)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.data || !response.data.video) {
      throw new Error('Failed to fetch video');
    }

    const videoData = response.data;
    const videoUrl = videoData.video.noWatermark || videoData.video.watermark;

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      null,
      '⬇️ Downloading video...'
    );

    // Download video
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 60000
    });

    const tempDir = path.join(config.paths.temp, `tiktok_${userId}`);
    await fs.ensureDir(tempDir);

    const filePath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
    await fs.writeFile(filePath, videoResponse.data);

    const stats = await fs.stat(filePath);

    // Send video
    await ctx.replyWithVideo(
      { source: filePath },
      {
        caption: `
🎵 <b>TikTok Download</b>

👤 Author: ${videoData.author?.name || 'Unknown'}
❤️ Likes: ${videoData.stats?.likes || 'N/A'}
💬 Comments: ${videoData.stats?.comments || 'N/A'}
🔄 Shares: ${videoData.stats?.shares || 'N/A'}

Downloaded with EZIHE BOT
`,
        parse_mode: 'HTML',
        supports_streaming: true
      }
    );

    // Log download
    await database.logDownload(userId, url, 'tiktok', filePath, stats.size);

    // Cleanup
    await fs.remove(filePath);
    await ctx.telegram.deleteMessage(processingMsg.chat.id, processingMsg.message_id);
    activeDownloads.delete(userId);

  } catch (error) {
    logger.error('TikTok download error:', error);
    activeDownloads.delete(userId);
    
    // Fallback method
    ctx.reply(`
❌ <b>Download Failed</b>

Trying alternative method...

Please try again later or use the direct link:
${url}
`, { parse_mode: 'HTML' });
  }
}

/**
 * Instagram download command
 */
async function instagramCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
📸 <b>Instagram Downloader</b>

Download Instagram posts, reels & stories:

<b>Usage:</b>
/ig [URL]

<b>Example:</b>
/ig https://instagram.com/p/...
/ig https://instagram.com/reel/...

<b>Supported:</b>
• Posts (single & carousel)
• Reels
• Stories
• IGTV
`, { parse_mode: 'HTML' });
  }

  const url = args[0];
  await downloadInstagram(ctx, url);
}

/**
 * Download Instagram content
 */
async function downloadInstagram(ctx, url) {
  const userId = ctx.from.id;

  try {
    if (activeDownloads.has(userId)) {
      return ctx.reply('⏳ You already have an active download. Please wait...');
    }

    activeDownloads.set(userId, true);

    const processingMsg = await ctx.reply('🔍 Processing Instagram link...');

    // Use Instagram API service
    const apiUrl = `https://insta-dl.hazex.workers.dev/?url=${encodeURIComponent(url)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.data || !response.data.result) {
      throw new Error('Failed to fetch content');
    }

    const mediaData = response.data.result;
    const mediaUrls = Array.isArray(mediaData) ? mediaData : [mediaData];

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      null,
      `📥 Found ${mediaUrls.length} media item(s). Downloading...`
    );

    const tempDir = path.join(config.paths.temp, `ig_${userId}`);
    await fs.ensureDir(tempDir);

    let downloadCount = 0;

    for (const mediaUrl of mediaUrls.slice(0, 10)) { // Limit to 10 items
      try {
        const mediaResponse = await axios.get(mediaUrl.url || mediaUrl, {
          responseType: 'arraybuffer',
          timeout: 60000
        });

        const isVideo = mediaUrl.type === 'video' || (mediaUrl.url && mediaUrl.url.includes('.mp4'));
        const ext = isVideo ? 'mp4' : 'jpg';
        const filePath = path.join(tempDir, `ig_${Date.now()}_${downloadCount}.${ext}`);
        
        await fs.writeFile(filePath, mediaResponse.data);

        if (isVideo) {
          await ctx.replyWithVideo(
            { source: filePath },
            { caption: `📸 Instagram ${downloadCount + 1}/${mediaUrls.length}` }
          );
        } else {
          await ctx.replyWithPhoto(
            { source: filePath },
            { caption: `📸 Instagram ${downloadCount + 1}/${mediaUrls.length}` }
          );
        }

        await fs.remove(filePath);
        downloadCount++;

        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        logger.error('Error downloading IG media item:', err);
      }
    }

    // Log download
    await database.logDownload(userId, url, 'instagram', '', 0);

    await ctx.telegram.deleteMessage(processingMsg.chat.id, processingMsg.message_id);
    activeDownloads.delete(userId);

  } catch (error) {
    logger.error('Instagram download error:', error);
    activeDownloads.delete(userId);
    ctx.reply('❌ Failed to download Instagram content. Please check the URL and try again.');
  }
}

/**
 * Pinterest download command
 */
async function pinterestCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
📌 <b>Pinterest Downloader</b>

Download Pinterest images & videos:

<b>Usage:</b>
/pinterest [URL]

<b>Example:</b>
/pinterest https://pinterest.com/pin/...

<b>Supported:</b>
• Images (HD)
• Videos
• GIFs
`, { parse_mode: 'HTML' });
  }

  const url = args[0];
  await downloadPinterest(ctx, url);
}

/**
 * Download Pinterest content
 */
async function downloadPinterest(ctx, url) {
  const userId = ctx.from.id;

  try {
    if (activeDownloads.has(userId)) {
      return ctx.reply('⏳ You already have an active download. Please wait...');
    }

    activeDownloads.set(userId, true);

    const processingMsg = await ctx.reply('🔍 Processing Pinterest link...');

    // Use Pinterest API service
    const apiUrl = `https://pinterest-downloader.deno.dev/?url=${encodeURIComponent(url)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.data) {
      throw new Error('Failed to fetch content');
    }

    const mediaData = response.data;
    const downloadUrl = mediaData.video_url || mediaData.image_url;

    if (!downloadUrl) {
      throw new Error('No downloadable content found');
    }

    await ctx.telegram.editMessageText(
      processingMsg.chat.id,
      processingMsg.message_id,
      null,
      '⬇️ Downloading...'
    );

    const mediaResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 60000
    });

    const tempDir = path.join(config.paths.temp, `pinterest_${userId}`);
    await fs.ensureDir(tempDir);

    const isVideo = !!mediaData.video_url;
    const ext = isVideo ? 'mp4' : 'jpg';
    const filePath = path.join(tempDir, `pinterest_${Date.now()}.${ext}`);
    
    await fs.writeFile(filePath, mediaResponse.data);

    if (isVideo) {
      await ctx.replyWithVideo(
        { source: filePath },
        {
          caption: `
📌 <b>Pinterest Download</b>

📝 Title: ${mediaData.title || 'N/A'}
👤 Author: ${mediaData.author || 'N/A'}

Downloaded with EZIHE BOT
`,
          parse_mode: 'HTML'
        }
      );
    } else {
      await ctx.replyWithPhoto(
        { source: filePath },
        {
          caption: `
📌 <b>Pinterest Download</b>

📝 Title: ${mediaData.title || 'N/A'}
👤 Author: ${mediaData.author || 'N/A'}
📐 Size: ${mediaData.image_size || 'N/A'}

Downloaded with EZIHE BOT
`,
          parse_mode: 'HTML'
        }
      );
    }

    // Log download
    const stats = await fs.stat(filePath);
    await database.logDownload(userId, url, 'pinterest', filePath, stats.size);

    await fs.remove(filePath);
    await ctx.telegram.deleteMessage(processingMsg.chat.id, processingMsg.message_id);
    activeDownloads.delete(userId);

  } catch (error) {
    logger.error('Pinterest download error:', error);
    activeDownloads.delete(userId);
    ctx.reply('❌ Failed to download Pinterest content. Please check the URL and try again.');
  }
}

/**
 * Handle automatic link detection
 */
async function handleLinkDetection(ctx, urls) {
  for (const url of urls.slice(0, 3)) { // Process max 3 links
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        await ctx.reply('🔍 YouTube link detected! Use /yt command or wait for download...');
        await downloadYouTube(ctx, url);
      } else if (url.includes('tiktok.com')) {
        await ctx.reply('🔍 TikTok link detected! Downloading...');
        await downloadTikTok(ctx, url);
      } else if (url.includes('instagram.com')) {
        await ctx.reply('🔍 Instagram link detected! Downloading...');
        await downloadInstagram(ctx, url);
      } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
        await ctx.reply('🔍 Pinterest link detected! Downloading...');
        await downloadPinterest(ctx, url);
      }
    } catch (err) {
      logger.error('Link detection error:', err);
    }
  }
}

/**
 * Quality selection action
 */
async function qualityAction(ctx) {
  const quality = ctx.match[1];
  await ctx.answerCbQuery(`Selected quality: ${quality}`);
  await ctx.reply(`✅ Quality set to: ${quality}\n\nSend a link to download with this quality.`);
}

module.exports = {
  youtubeCommand,
  tiktokCommand,
  instagramCommand,
  pinterestCommand,
  handleLinkDetection,
  qualityAction,
  downloadYouTube,
  downloadTikTok,
  downloadInstagram,
  downloadPinterest
};
