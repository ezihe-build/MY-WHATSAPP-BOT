/**
 * EZIHE SUPER BOT - Movie Handler
 * Handles movie search and information
 */

const axios = require('axios');
const logger = require('../utils/logger');

// TMDB API (free tier available)
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Movie search command
 */
async function movieCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
🎬 <b>Movie Search</b>

Search for movies and TV shows!

<b>Usage:</b>
/movie [movie title]

<b>Examples:</b>
/movie The Dark Knight
/movie Inception
/movie Avengers Endgame

<b>Features:</b>
• Movie details & ratings
• Cast information
• Trailers
• Similar movies
`, { parse_mode: 'HTML' });
  }

  const query = args.join(' ');
  await searchMovies(ctx, query);
}

/**
 * Advanced movie search command
 */
async function searchCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    return ctx.reply(`
🔍 <b>Advanced Movie Search</b>

Search with filters:

<b>Usage:</b>
/searchmovie [title] [year]

<b>Examples:</b>
/searchmovie action 2023
/searchmovie comedy
/searchmovie marvel

Results include ratings, overview, and more!
`, { parse_mode: 'HTML' });
  }

  const query = args.join(' ');
  await searchMovies(ctx, query, true);
}

/**
 * Search for movies
 */
async function searchMovies(ctx, query, advanced = false) {
  try {
    const searchingMsg = await ctx.reply(`🔍 Searching for "${query}"...`);

    let movies = [];

    // Try TMDB API first if key is available
    if (TMDB_API_KEY) {
      try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: query,
            language: 'en-US',
            page: 1
          },
          timeout: 10000
        });

        if (response.data && response.data.results) {
          movies = response.data.results.slice(0, 5).map(m => ({
            id: m.id,
            title: m.title,
            year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
            rating: m.vote_average,
            overview: m.overview,
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : null
          }));
        }
      } catch (err) {
        logger.warn('TMDB API failed:', err.message);
      }
    }

    // Fallback to OMDB API or other sources
    if (movies.length === 0) {
      // Use OMDB API (free tier)
      const omdbKey = process.env.OMDB_API_KEY;
      if (omdbKey) {
        try {
          const response = await axios.get(`http://www.omdbapi.com/`, {
            params: {
              apikey: omdbKey,
              s: query,
              type: 'movie'
            },
            timeout: 10000
          });

          if (response.data && response.data.Search) {
            movies = response.data.Search.slice(0, 5).map(m => ({
              id: m.imdbID,
              title: m.Title,
              year: m.Year,
              rating: 'N/A',
              overview: '',
              poster: m.Poster !== 'N/A' ? m.Poster : null,
              backdrop: null
            }));
          }
        } catch (err) {
          logger.warn('OMDB API failed:', err.message);
        }
      }
    }

    // If no API keys, use a free movie database
    if (movies.length === 0) {
      // Return sample results or use web scraping
      movies = [
        {
          title: `${query} (Search Result)`,
          year: '2024',
          rating: 'N/A',
          overview: 'Full movie search requires API key configuration. Please contact the bot owner.',
          poster: null
        }
      ];
    }

    await ctx.telegram.deleteMessage(searchingMsg.chat.id, searchingMsg.message_id);

    // Display results
    if (movies.length === 0) {
      return ctx.reply('❌ No movies found. Try a different search.');
    }

    // Send each movie as a separate message with details
    for (const movie of movies.slice(0, 3)) {
      const ratingStars = movie.rating !== 'N/A' ? '⭐'.repeat(Math.round(movie.rating / 2)) : '⭐ N/A';
      
      const movieText = `
🎬 <b>${movie.title}</b> (${movie.year})

${ratingStars} ${movie.rating !== 'N/A' ? movie.rating + '/10' : ''}

📝 <b>Overview:</b>
${movie.overview || 'No overview available.'}

<i>Use download tools to find this movie online.</i>
`;

      if (movie.poster) {
        await ctx.replyWithPhoto(movie.poster, {
          caption: movieText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📺 Trailer', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}` },
                { text: '🔍 More Info', url: `https://www.google.com/search?q=${encodeURIComponent(movie.title + ' movie')}` }
              ]
            ]
          }
        });
      } else {
        await ctx.reply(movieText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📺 Trailer', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}` },
                { text: '🔍 More Info', url: `https://www.google.com/search?q=${encodeURIComponent(movie.title + ' movie')}` }
              ]
            ]
          }
        });
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    logger.error('Movie search error:', error);
    ctx.reply('❌ Search failed. Please try again.');
  }
}

/**
 * Get trending movies
 */
async function getTrendingMovies(ctx) {
  try {
    if (!TMDB_API_KEY) {
      return ctx.reply(`
📈 <b>Trending Movies</b>

To see trending movies, the bot needs a TMDB API key.

Get your free API key at:
https://www.themoviedb.org/settings/api

Then add it to your .env file:
TMDB_API_KEY=your_key_here
`);
    }

    const searchingMsg = await ctx.reply('📈 Fetching trending movies...');

    const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: {
        api_key: TMDB_API_KEY
      },
      timeout: 10000
    });

    await ctx.telegram.deleteMessage(searchingMsg.chat.id, searchingMsg.message_id);

    if (!response.data || !response.data.results) {
      return ctx.reply('❌ Could not fetch trending movies.');
    }

    const movies = response.data.results.slice(0, 5);

    let message = '📈 <b>Trending Movies This Week</b>\n\n';
    
    movies.forEach((movie, index) => {
      const rating = movie.vote_average ? `⭐ ${movie.vote_average}/10` : '';
      message += `${index + 1}. <b>${movie.title}</b> (${movie.release_date?.split('-')[0] || 'N/A'}) ${rating}\n`;
    });

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Refresh', callback_data: 'movie_trending' }]
        ]
      }
    });

  } catch (error) {
    logger.error('Trending movies error:', error);
    ctx.reply('❌ Failed to fetch trending movies.');
  }
}

/**
 * Get movie details
 */
async function getMovieDetails(ctx, movieId) {
  try {
    if (!TMDB_API_KEY) {
      return ctx.reply('❌ TMDB API key not configured.');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'credits,videos'
      },
      timeout: 10000
    });

    const movie = response.data;
    
    const ratingStars = '⭐'.repeat(Math.round(movie.vote_average / 2));
    const genres = movie.genres?.map(g => g.name).join(', ') || 'N/A';
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';

    const message = `
🎬 <b>${movie.title}</b> (${movie.release_date?.split('-')[0] || 'N/A'})

${ratingStars} ${movie.vote_average}/10 (${movie.vote_count} votes)

📊 <b>Details:</b>
🎭 Genres: ${genres}
⏱️ Runtime: ${runtime}
💰 Budget: $${(movie.budget / 1000000).toFixed(1)}M
💵 Revenue: $${(movie.revenue / 1000000).toFixed(1)}M

📝 <b>Overview:</b>
${movie.overview || 'No overview available.'}
`;

    if (movie.poster_path) {
      await ctx.replyWithPhoto(`https://image.tmdb.org/t/p/w500${movie.poster_path}`, {
        caption: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📺 Trailer', callback_data: `trailer_${movieId}` },
              { text: '👥 Cast', callback_data: `cast_${movieId}` }
            ],
            [{ text: '🔙 Back to Results', callback_data: 'back_search' }]
          ]
        }
      });
    } else {
      await ctx.reply(message, {
        parse_mode: 'HTML'
      });
    }

  } catch (error) {
    logger.error('Movie details error:', error);
    ctx.reply('❌ Failed to get movie details.');
  }
}

module.exports = {
  movieCommand,
  searchCommand,
  searchMovies,
  getTrendingMovies,
  getMovieDetails
};
