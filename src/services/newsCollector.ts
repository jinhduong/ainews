import OpenAI from "openai";
import axios from "axios";
import cron from "node-cron";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import crypto from "crypto";
import logger from "../utils/logger";
import { extractArticleContent } from "../utils/contentExtractor";
import {
  saveArticlesToFile,
  loadAllArticlesFromFiles,
  loadArticlesFromFile,
  cleanupOldFiles,
  getStorageStats,
  mergeArticlesWithDeduplication,
} from "./newsStorage";
import {
  generateBatchSpeech,
  cleanupOldAudioFiles,
  getAudioStats,
} from "./audioService";
import statsService from "./statsService";
// Add imports for Supabase functionality
import { getDevConfig } from "../config/development";
import { saveArticlesToSupabase } from "./supabaseArticleService";

// Load environment variables
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in the environment variables.");
}

if (!NEWS_API_KEY) {
  throw new Error("NEWS_API_KEY is not set in the environment variables.");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// In-memory storage for collected news articles (now backed by files)
// Cache for 24 hours since we refresh every 15 minutes
export const newsStore = new NodeCache({ stdTTL: 24 * 60 * 60 });

// NewsAPI endpoint
const NEWS_API_BASE_URL = "https://newsapi.org/v2";

// Categories to collect news for
const NEWS_CATEGORIES = ["artificial intelligence"];

export interface StoredNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  audioPath?: string;
  category: string;
  collectedAt: string;
}

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

/**
 * Fetches and processes news for a single category
 */
async function collectNewsForCategory(
  category: string
): Promise<StoredNewsItem[]> {
  try {
    logger.info(`🔍 Collecting news for category: ${category}`);

    // Fetch top 10 articles from NewsAPI
    const newsApiUrl = `${NEWS_API_BASE_URL}/everything`;
    let response;
    try {
      response = await axios.get<NewsAPIResponse>(newsApiUrl, {
        params: {
          q: category,
          sortBy: "publishedAt",
          pageSize: 10, // Top 10 articles
          language: "en",
          apiKey: NEWS_API_KEY,
        },
      });

      if (response.data.status !== "ok" || !response.data.articles.length) {
        statsService.recordNewsApiCall(true, 0); // Successful call but no articles
        logger.warn(`❌ No articles found for category: ${category}`);
        return [];
      }

      statsService.recordNewsApiCall(true, response.data.articles.length);
    } catch (error) {
      statsService.recordNewsApiCall(false, 0);
      throw error;
    }

    const rawArticles = response.data.articles;
    logger.info(`📰 Found ${rawArticles.length} articles for ${category}`);

    // Load existing articles to check for duplicates BEFORE processing
    let existingArticles = newsStore.get<StoredNewsItem[]>(category) || [];
    if (existingArticles.length === 0) {
      existingArticles = loadArticlesFromFile(category);
    }

    // Create a set of existing URLs for fast duplicate checking
    const existingUrls = new Set(
      existingArticles.map((article) => article.url)
    );

    // Filter out articles that already exist
    const newRawArticles = rawArticles.filter(
      (article) => !existingUrls.has(article.url)
    );

    if (newRawArticles.length === 0) {
      logger.info(
        `✅ All ${rawArticles.length} articles for ${category} already exist - skipping processing`
      );
      return [];
    }

    if (newRawArticles.length < rawArticles.length) {
      logger.info(
        `🔄 Found ${
          rawArticles.length - newRawArticles.length
        } duplicate articles for ${category}, processing ${
          newRawArticles.length
        } new ones`
      );
    }

    // Extract content and images in parallel for NEW articles only
    const contentExtractionPromises = newRawArticles.map(
      async (article, index) => {
        const extractionResult = await extractArticleContent(article.url);

        return {
          title: extractionResult.title || article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          extractedContent: extractionResult.success
            ? extractionResult.content
            : "",
          imageUrl: extractionResult.imageUrl,
          fallbackDescription: article.description,
        };
      }
    );

    const articlesWithContent = await Promise.all(contentExtractionPromises);
    const successfulExtractions = articlesWithContent.filter(
      (article) => article.extractedContent.length > 0
    );
    logger.info(
      `✅ Successfully extracted content from ${successfulExtractions.length}/${newRawArticles.length} NEW articles for ${category}`
    );

    // Generate summaries using OpenAI
    const summaryPromises = articlesWithContent.map(async (article, index) => {
      const contentToSummarize =
        article.extractedContent || article.fallbackDescription || "";

      if (!contentToSummarize) {
        logger.warn(`⚠️  No content available for article: ${article.url}`);
        return null;
      }

      try {
        const promptText = article.extractedContent
          ? `Please create a comprehensive summary of this news article. The summary should be 2-3 sentences that capture the main points, key facts, and significance of the story.

Article Title: ${article.title}
Full Article Content: ${contentToSummarize}

Return only the summary text, without any prefixes or formatting.`
          : `Please create a comprehensive summary based on this article description. The summary should be 2-3 sentences that capture the main points and significance.

Article Title: ${article.title}  
Article Description: ${contentToSummarize}

Return only the summary text, without any prefixes or formatting.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: promptText }],
          temperature: 0.3,
          max_tokens: 300,
        });

        const summary =
          completion.choices[0]?.message?.content?.trim() ||
          "Summary not available";

        // Track OpenAI summary generation
        const tokensUsed = completion.usage?.total_tokens || 0;
        statsService.recordOpenAiSummaryCall(true, tokensUsed);

        // Create consistent ID based on URL for deduplication
        // Use crypto hash for better uniqueness and collision prevention
        const urlHash = crypto.createHash('sha256').update(article.url).digest('hex').substring(0, 16);
        const categoryId = category.replace(/\s+/g, "_").toLowerCase(); // Replace spaces with underscores
        const consistentId = `news_${categoryId}_${urlHash}`;

        return {
          id: consistentId,
          title: article.title,
          summary: summary,
          url: article.url,
          publishedAt: new Date(article.publishedAt)
            .toISOString()
            .split("T")[0],
          imageUrl: article.imageUrl || undefined,
          category: category,
          collectedAt: new Date().toISOString(),
        } as StoredNewsItem;
      } catch (error) {
        logger.error(
          `Error generating summary for article ${article.url}:`,
          error
        );
        statsService.recordOpenAiSummaryCall(false, 0);
        return null;
      }
    });

    const newsItems = await Promise.all(summaryPromises);
    let validNewsItems = newsItems.filter(
      (item): item is StoredNewsItem => item !== null
    );

    logger.info(
      `📝 Successfully processed ${validNewsItems.length} NEW articles for ${category}`
    );

    // Audio will be generated on-demand when users request it
    // This saves costs and improves efficiency since many articles are never listened to
    logger.info(
      `🎵 Audio will be generated on-demand for ${validNewsItems.length} articles`
    );

    return validNewsItems;
  } catch (error) {
    logger.error(`Error collecting news for category ${category}:`, error);
    return [];
  }
}

/**
 * Collects news for all categories and stores them
 */
export async function collectAllNews(): Promise<void> {
  logger.info("🚀 Starting news collection for all categories...");
  const startTime = Date.now();

  // Track collection start
  statsService.recordNewsCollectionStart();

  try {
    // Collect news for all categories in parallel
    const collectionPromises = NEWS_CATEGORIES.map((category) =>
      collectNewsForCategory(category)
    );
    const allCategoryResults = await Promise.all(collectionPromises);

    // Store results in both cache and files with deduplication
    let totalNewArticles = 0;
    let totalDuplicates = 0;
    let totalRemovedOld = 0;

    for (let index = 0; index < NEWS_CATEGORIES.length; index++) {
      const category = NEWS_CATEGORIES[index];
      const newArticles = allCategoryResults[index];
      if (newArticles.length > 0) {
        // Load existing articles from cache or file
        let existingArticles = newsStore.get<StoredNewsItem[]>(category) || [];
        if (existingArticles.length === 0) {
          existingArticles = loadArticlesFromFile(category);
        }

        // Merge with deduplication
        const mergeResult = mergeArticlesWithDeduplication(
          existingArticles,
          newArticles,
          category
        );

        // Update memory cache with merged articles
        newsStore.set(category, mergeResult.mergedArticles);

        // Save merged articles to file
        // saveArticlesToFile(category, mergeResult.mergedArticles, false); // false because we already merged

        // Also save to Supabase if in Supabase mode
        const config = getDevConfig();
        if (config.mode === "supabase" && config.useSupabase) {
          try {
            logger.info(
              `☁️ Saving ${mergeResult.mergedArticles.length} articles to Supabase for ${category}`
            );
            const supabaseResult = await saveArticlesToSupabase(
              category,
              mergeResult.mergedArticles
            );

            if (supabaseResult.success) {
              logger.info(
                `✅ Successfully saved to Supabase: ${supabaseResult.newCount} new, ${supabaseResult.duplicateCount} duplicates for ${category}`
              );
            } else {
              logger.error(
                `❌ Failed to save to Supabase for ${category}: ${supabaseResult.error}`
              );
            }
          } catch (error) {
            logger.error(
              `❌ Exception saving to Supabase for ${category}:`,
              error
            );
          }
        } else {
          saveArticlesToFile(category, mergeResult.mergedArticles, false); // false because we already merged
        }

        totalNewArticles += mergeResult.newCount;
        totalDuplicates += mergeResult.duplicateCount;
        totalRemovedOld += mergeResult.removedCount;

        logger.info(
          `💾 Updated ${category}: ${mergeResult.newCount} new, ${mergeResult.duplicateCount} duplicates, ${mergeResult.removedCount} old removed. Total: ${mergeResult.mergedArticles.length}`
        );
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    // Track collection end
    statsService.recordNewsCollectionEnd(
      duration,
      totalNewArticles,
      totalDuplicates,
      totalRemovedOld
    );

    logger.info(
      `✅ News collection completed! New: ${totalNewArticles}, Duplicates: ${totalDuplicates}, Removed old: ${totalRemovedOld} in ${duration.toFixed(
        2
      )}s`
    );
  } catch (error) {
    logger.error("❌ Error during news collection:", error);
    statsService.recordNewsCollectionError();
  }
}

/**
 * Loads existing articles from files into memory cache on startup
 */
export function loadExistingArticles(): void {
  logger.info("📚 Loading existing articles from files...");

  try {
    const articlesMap = loadAllArticlesFromFiles(NEWS_CATEGORIES);
    let totalLoaded = 0;

    // Load articles into memory cache
    articlesMap.forEach((articles, category) => {
      if (articles.length > 0) {
        newsStore.set(category, articles);
        totalLoaded += articles.length;
        logger.info(
          `📖 Loaded ${articles.length} articles for ${category} into cache`
        );
      }
    });

    if (totalLoaded > 0) {
      logger.info(
        `✅ Successfully loaded ${totalLoaded} existing articles from files`
      );
    } else {
      logger.info("📭 No existing articles found - will collect fresh data");
    }
  } catch (error) {
    logger.error("❌ Error loading existing articles:", error);
  }
}

/**
 * Gets stored news for a specific category with pagination
 * Now checks files if memory cache is empty
 */
export function getStoredNews(
  category: string,
  page: number = 1,
  pageSize: number = 5
): {
  articles: StoredNewsItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
} {
  const normalizedCategory = category.toLowerCase().trim();

  // Try to get from memory cache first
  let storedArticles = newsStore.get<StoredNewsItem[]>(normalizedCategory);

  // If not in memory, try to load from file
  if (!storedArticles || storedArticles.length === 0) {
    logger.info(
      `📂 Loading ${normalizedCategory} from file (not in memory cache)`
    );
    storedArticles = loadArticlesFromFile(normalizedCategory);

    // Store in memory cache for future requests
    if (storedArticles.length > 0) {
      newsStore.set(normalizedCategory, storedArticles);
    }
  }

  if (!storedArticles) {
    storedArticles = [];
  }

  // Calculate pagination
  const totalResults = storedArticles.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = storedArticles.slice(startIndex, endIndex);

  return {
    articles: paginatedArticles,
    pagination: {
      page,
      pageSize,
      totalResults,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Initialize cron jobs for news collection
 */
export function initializeNewsCollection(): void {
  logger.info("📅 Initializing news collection system...");

  // First, load existing articles from files
  loadExistingArticles();

  // Check if we have recent articles, if not, collect immediately
  const stats = getStorageStats();
  const hasRecentArticles = stats.totalArticles > 0;

  if (!hasRecentArticles) {
    logger.info("🎯 No recent articles found, running immediate collection...");
    collectAllNews();
  } else {
    logger.info(
      `✅ Found ${stats.totalArticles} existing articles, skipping immediate collection`
    );
  }

  // Schedule collection every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    logger.info("⏰ Running scheduled news collection (15-minute interval)...");
    collectAllNews();
  });

  // Schedule cleanup every 24 hours (both files and audio)
  cron.schedule("0 0 * * *", () => {
    logger.info("🧹 Running daily cleanup of old files...");
    cleanupOldFiles();
    cleanupOldAudioFiles();
  });

  logger.info("✅ News collection cron jobs initialized successfully");
}
