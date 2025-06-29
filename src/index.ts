import express from 'express';
import cors from 'cors';
import path from 'path';
import { getStoredNews, initializeNewsCollection } from './services/newsCollector';
import { getStorageStats } from './services/newsStorage';
import { getAudioPath, getAudioStats } from './services/audioService';
import statsService from './services/statsService';
import logger from './utils/logger';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { newsApiCacheMiddleware, requestCache, cacheRoutes } from './cache';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// API Key Authentication Middleware
const authenticateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ message: 'Unauthorized: Invalid API Key' });
    return;
  }
  next();
};

app.get('/', (req, res) => {
  res.send('AI News Backend is running!');
});

// News API Endpoint with category and pagination in request body
app.post('/api/v1/news', authenticateApiKey, newsApiCacheMiddleware, async (req, res) => {
  const { category, page, pageSize } = req.body;
  
  // Validate that category is provided
  if (!category || typeof category !== 'string') {
    res.status(400).json({ 
      message: "Category is required and must be a string",
      example: { 
        category: "technology",
        page: 1,
        pageSize: 5 
      }
    });
    return;
  }

  // Validate pagination parameters
  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    res.status(400).json({ 
      message: "Page must be a positive integer",
      example: { 
        category: "technology",
        page: 1,
        pageSize: 5 
      }
    });
    return;
  }

  if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 20)) {
    res.status(400).json({ 
      message: "Page size must be an integer between 1 and 20",
      example: { 
        category: "technology",
        page: 1,
        pageSize: 5 
      }
    });
    return;
  }

  try {
    // Track API request
    statsService.recordApiRequest('news');
    
    // Check if we're in Supabase mode
    const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) && 
                       process.env.USE_LOCAL_DB !== 'true';
    
    if (useSupabase) {
      // Supabase mode: Fetch from Supabase with correct Storage URLs
      try {
        const { getArticlesPaginated } = await import('./services/supabaseArticleService');
        const news = await getArticlesPaginated(
          category.trim(),
          page || 1,
          pageSize || 6
        );
        res.json(news);
        return;
      } catch (error) {
        logger.error('❌ Error fetching from Supabase, falling back to local:', error);
        // Fall through to local mode
      }
    }
    
    // Local mode: Serve from cache/files
    const news = getStoredNews(
      category.trim(),
      page || 1,
      pageSize || 5
    );
    res.json(news);
  } catch (error) {
    console.error("Error in news endpoint:", error);
    res.status(500).json({ message: "Error fetching news" });
  }
});

// Health check endpoint to see cache status
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'AI News Backend with cron-based news collection',
    timestamp: new Date().toISOString()
  });
});

// Storage stats endpoint for monitoring
app.get('/api/v1/storage/stats', (req, res) => {
  try {
    const stats = getStorageStats();
    res.json({
      ...stats,
      timestamp: new Date().toISOString(),
      dataDirectory: 'data/articles'
    });
  } catch (error) {
    logger.error('Error getting storage stats:', error);
    res.status(500).json({ message: 'Error retrieving storage stats' });
  }
});

// Audio stats endpoint for monitoring
app.get('/api/v1/audio/stats', (req, res) => {
  try {
    const audioStats = getAudioStats();
    res.json({
      ...audioStats,
      timestamp: new Date().toISOString(),
      audioDirectory: 'data/audio'
    });
  } catch (error) {
    logger.error('Error getting audio stats:', error);
    res.status(500).json({ message: 'Error retrieving audio stats' });
  }
});

// 🚀 CACHE MANAGEMENT ENDPOINTS
// Mount cache routes
app.use('/api/v1/cache', cacheRoutes);

// 📊 DASHBOARD & ANALYTICS ENDPOINTS
// Import and mount the organized dashboard routes
import dashboardRoutes from './dashboard';
app.use('/api/v1', dashboardRoutes);

// Legacy route for console dashboard
app.get('/console/dashboard', (req, res) => {
  res.redirect('/api/v1/dashboard/');
});

// Serve audio files endpoint - generates audio on-demand and serves it
app.get('/api/v1/audio/:articleId', async (req, res) => {
  try {
    // Track API request and audio play
    statsService.recordApiRequest('audio');
    statsService.recordAudioPlay(req.params.articleId);
    
    const { articleId } = req.params;
    
    if (!articleId) {
      res.status(400).json({ message: 'Article ID is required' });
      return;
    }

    // Check if we're in Supabase mode
    const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) && 
                       process.env.USE_LOCAL_DB !== 'true';
    
    let article = null;
    
    if (useSupabase) {
      // Supabase mode: Look up the article
      try {
        const { getArticleById } = await import('./services/supabaseArticleService');
        article = await getArticleById(articleId);
        
        if (!article) {
          res.status(404).json({ message: 'Article not found' });
          return;
        }
        
        // If audio already exists, redirect to it
        if (article.audioPath) {
          logger.info(`🎵 Using existing audio: ${article.audioPath}`);
          res.redirect(article.audioPath);
          return;
        }
        
        // Generate audio on-demand
        logger.info(`🎤 Audio not found for article ${articleId}, generating on-demand...`);
        const { generateAudioOnDemand } = await import('./services/audioService');
        
        const audioPath = await generateAudioOnDemand({
          id: article.id,
          title: article.title,
          summary: article.summary
        });
        
        if (audioPath) {
          // Audio generated successfully, redirect to it
          logger.info(`✅ Generated audio on-demand, redirecting to: ${audioPath}`);
          res.redirect(audioPath);
          return;
        } else {
          res.status(500).json({ message: 'Failed to generate audio for this article' });
        return;
        }
        
      } catch (error) {
        logger.error('❌ Error in Supabase audio generation:', error);
        res.status(500).json({ message: 'Error processing audio request' });
        return;
      }
    } else {
      // Local mode: Check files and generate if needed
      try {
        const { getStoredNews } = await import('./services/newsCollector');
        const { getAudioPath } = await import('./services/audioService');
        
        // Find the article in local storage
        const allCategories = ['artificial intelligence']; // Add other categories as needed
        let foundArticle = null;
        
        for (const category of allCategories) {
          const categoryNews = getStoredNews(category, 1, 1000); // Get all articles
          foundArticle = categoryNews.articles.find(a => a.id === articleId);
          if (foundArticle) break;
        }
        
        if (!foundArticle) {
          res.status(404).json({ message: 'Article not found' });
      return;
    }
    
        // Check if audio file already exists
        const existingAudioPath = getAudioPath(articleId);
    const fs = require('fs');
        
        if (existingAudioPath && fs.existsSync(existingAudioPath)) {
          // Audio exists, serve it
          logger.info(`🎵 Using existing local audio for article ${articleId}`);
          
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          
          const audioStream = fs.createReadStream(existingAudioPath);
          audioStream.pipe(res);
          
          audioStream.on('error', (error: Error) => {
            logger.error(`Error streaming audio file ${existingAudioPath}:`, error);
            if (!res.headersSent) {
              res.status(500).json({ message: 'Error streaming audio file' });
            }
          });
      return;
    }
    
        // Generate audio on-demand
        logger.info(`🎤 Audio not found for article ${articleId}, generating on-demand...`);
        const { generateAudioOnDemand } = await import('./services/audioService');
        
        const audioPath = await generateAudioOnDemand({
          id: foundArticle.id,
          title: foundArticle.title,
          summary: foundArticle.summary
        });
        
        if (audioPath && fs.existsSync(audioPath)) {
          // Audio generated successfully, serve it
          logger.info(`✅ Generated audio on-demand for article ${articleId}`);
          
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'public, max-age=86400');
    
    const audioStream = fs.createReadStream(audioPath);
    audioStream.pipe(res);
    
    audioStream.on('error', (error: Error) => {
            logger.error(`Error streaming generated audio file ${audioPath}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming audio file' });
      }
    });
          return;
        } else {
          res.status(500).json({ message: 'Failed to generate audio for this article' });
          return;
        }
        
      } catch (error) {
        logger.error('❌ Error in local audio generation:', error);
        res.status(500).json({ message: 'Error processing audio request' });
        return;
      }
    }
    
  } catch (error) {
    logger.error('Error serving audio file:', error);
    res.status(500).json({ message: 'Error serving audio file' });
  }
});

// Centralized error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, err);
  res.status(500).send('Something broke!');
});

// Initialize news collection system BEFORE starting the server
logger.info('🚀 Initializing news collection system...');
initializeNewsCollection();

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
  logger.info('📁 File-based storage system active');
  logger.info('📅 News collection cron jobs are active - collecting every 15 minutes');
});
