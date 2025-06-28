import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { StoredNewsItem } from './newsCollector';

// Directory to store news data files
const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');

/**
 * Ensures data directories exist
 */
function ensureDirectoriesExist(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      logger.info('📁 Created data directory');
    }
    
    if (!fs.existsSync(ARTICLES_DIR)) {
      fs.mkdirSync(ARTICLES_DIR, { recursive: true });
      logger.info('📁 Created articles directory');
    }
  } catch (error) {
    logger.error('❌ Error creating directories:', error);
  }
}

/**
 * Gets the file path for a specific category
 */
function getCategoryFilePath(category: string): string {
  const fileName = `${category.toLowerCase().replace(/\s+/g, '_')}.json`;
  return path.join(ARTICLES_DIR, fileName);
}

/**
 * Creates a unique identifier from article URL for deduplication
 */
function createArticleId(url: string, category: string): string {
  // Create a hash from URL for consistent ID generation
  // Use longer hash to prevent collisions (20 chars instead of 10)
  const urlHash = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  return `news_${category}_${urlHash}`;
}

/**
 * Merges new articles with existing ones, removing duplicates and old articles
 */
export function mergeArticlesWithDeduplication(
  existingArticles: StoredNewsItem[], 
  newArticles: StoredNewsItem[],
  category: string
): { 
  mergedArticles: StoredNewsItem[]; 
  newCount: number; 
  duplicateCount: number; 
  removedCount: number; 
} {
  
  // Create a map of existing articles by URL for fast lookup
  const existingByUrl = new Map<string, StoredNewsItem>();
  existingArticles.forEach(article => {
    existingByUrl.set(article.url, article);
  });

  // Filter out articles older than 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const validExistingArticles = existingArticles.filter(article => {
    const articleDate = new Date(article.collectedAt);
    return articleDate > twentyFourHoursAgo;
  });
  
  const removedCount = existingArticles.length - validExistingArticles.length;

  // Process new articles and check for duplicates
  const genuinelyNewArticles: StoredNewsItem[] = [];
  let duplicateCount = 0;

  newArticles.forEach(newArticle => {
    if (!existingByUrl.has(newArticle.url)) {
      // Ensure consistent ID generation based on URL
      const consistentId = createArticleId(newArticle.url, category);
      genuinelyNewArticles.push({
        ...newArticle,
        id: consistentId
      });
    } else {
      duplicateCount++;
      logger.info(`🔄 Skipping duplicate article: ${newArticle.title}`);
    }
  });

  // Update existing map with valid articles for final merge
  const validExistingByUrl = new Map<string, StoredNewsItem>();
  validExistingArticles.forEach(article => {
    validExistingByUrl.set(article.url, article);
  });

  // Merge: existing valid articles + genuinely new articles
  const mergedArticles = [
    // ...validExistingArticles, // don't need to update existing articles
    ...genuinelyNewArticles
  ];

  // Sort by collection date (newest first)
  mergedArticles.sort((a, b) => 
    new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
  );

  return {
    mergedArticles,
    newCount: genuinelyNewArticles.length,
    duplicateCount,
    removedCount
  };
}

/**
 * Saves articles for a specific category to file (now with merge support)
 */
export function saveArticlesToFile(
  category: string, 
  articles: StoredNewsItem[], 
  merge: boolean = false
): void {
  try {
    ensureDirectoriesExist();
    
    let finalArticles = articles;
    let stats = { newCount: articles.length, duplicateCount: 0, removedCount: 0 };

    if (merge) {
      // Load existing articles and merge with deduplication
      const existingArticles = loadArticlesFromFile(category);
      const mergeResult = mergeArticlesWithDeduplication(existingArticles, articles, category);
      finalArticles = mergeResult.mergedArticles;
      stats = {
        newCount: mergeResult.newCount,
        duplicateCount: mergeResult.duplicateCount,
        removedCount: mergeResult.removedCount
      };
    }
    
    const filePath = getCategoryFilePath(category);
    const data = {
      category,
      lastUpdated: new Date().toISOString(),
      totalArticles: finalArticles.length,
      articles: finalArticles
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    if (merge) {
      logger.info(`💾 Merged articles for ${category}: ${stats.newCount} new, ${stats.duplicateCount} duplicates skipped, ${stats.removedCount} old removed. Total: ${finalArticles.length}`);
    } else {
      logger.info(`💾 Saved ${finalArticles.length} articles for ${category} to file`);
    }
    
  } catch (error) {
    logger.error(`❌ Error saving articles for ${category}:`, error);
  }
}

/**
 * Loads articles for a specific category from file
 */
export function loadArticlesFromFile(category: string): StoredNewsItem[] {
  try {
    const filePath = getCategoryFilePath(category);
    
    if (!fs.existsSync(filePath)) {
      logger.info(`📂 No existing file found for ${category}`);
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Validate file structure
    if (!data.articles || !Array.isArray(data.articles)) {
      logger.warn(`⚠️  Invalid file format for ${category}, returning empty array`);
      return [];
    }
    
    // Filter out old articles (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const validArticles = data.articles.filter((article: StoredNewsItem) => {
      const articleDate = new Date(article.collectedAt);
      return articleDate > twentyFourHoursAgo;
    });
    
    logger.info(`📖 Loaded ${validArticles.length}/${data.articles.length} valid articles for ${category} from file`);
    
    // If we filtered out articles, save the cleaned version
    if (validArticles.length !== data.articles.length) {
      saveArticlesToFile(category, validArticles);
    }
    
    return validArticles;
    
  } catch (error) {
    logger.error(`❌ Error loading articles for ${category}:`, error);
    return [];
  }
}

/**
 * Updates a specific article with audio path in local storage
 */
export function updateArticleAudioPathLocal(
  articleId: string,
  audioPath: string
): boolean {
  try {
    const categories = ['artificial intelligence']; // Add other categories as needed
    let updated = false;

    for (const category of categories) {
      const articles = loadArticlesFromFile(category);
      const articleIndex = articles.findIndex(a => a.id === articleId);
      
      if (articleIndex >= 0) {
        articles[articleIndex].audioPath = audioPath;
        saveArticlesToFile(category, articles, false);
        
        // Also update the memory cache
        try {
          const { newsStore } = require('./newsCollector');
          newsStore.set(category, articles);
        } catch (cacheError) {
          logger.warn(`⚠️ Could not update cache for ${category}:`, cacheError);
        }
        
        logger.info(`✅ Updated local article ${articleId} with audio path: ${audioPath}`);
        updated = true;
        break;
      }
    }

    if (!updated) {
      logger.warn(`⚠️ Article ${articleId} not found in local storage for audio path update`);
    }

    return updated;
  } catch (error) {
    logger.error(`❌ Error updating local article audio path:`, error);
    return false;
  }
}

/**
 * Loads all articles from files for all categories
 */
export function loadAllArticlesFromFiles(categories: string[]): Map<string, StoredNewsItem[]> {
  logger.info('📚 Loading all articles from files...');
  
  const articlesMap = new Map<string, StoredNewsItem[]>();
  let totalLoaded = 0;
  
  categories.forEach(category => {
    const articles = loadArticlesFromFile(category);
    articlesMap.set(category, articles);
    totalLoaded += articles.length;
  });
  
  logger.info(`✅ Loaded total of ${totalLoaded} articles from files for ${categories.length} categories`);
  return articlesMap;
}

/**
 * Gets file stats for monitoring
 */
export function getStorageStats(): { 
  categories: Array<{
    category: string;
    articleCount: number;
    lastUpdated: string;
    fileSize: string;
  }>;
  totalArticles: number;
} {
  try {
    ensureDirectoriesExist();
    
    const files = fs.readdirSync(ARTICLES_DIR);
    const stats = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        try {
          const filePath = path.join(ARTICLES_DIR, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          const fileStats = fs.statSync(filePath);
          
          return {
            category: data.category || file.replace('.json', ''),
            articleCount: data.articles ? data.articles.length : 0,
            lastUpdated: data.lastUpdated || 'Unknown',
            fileSize: `${(fileStats.size / 1024).toFixed(2)} KB`
          };
        } catch (error) {
          logger.error(`Error reading stats for ${file}:`, error);
          return null;
        }
      })
      .filter(Boolean) as Array<{
        category: string;
        articleCount: number;
        lastUpdated: string;
        fileSize: string;
      }>;
    
    const totalArticles = stats.reduce((sum, stat) => sum + stat.articleCount, 0);
    
    return { categories: stats, totalArticles };
    
  } catch (error) {
    logger.error('❌ Error getting storage stats:', error);
    return { categories: [], totalArticles: 0 };
  }
}

/**
 * Cleans up old article files (older than 7 days)
 */
export function cleanupOldFiles(): void {
  try {
    if (!fs.existsSync(ARTICLES_DIR)) {
      return;
    }
    
    const files = fs.readdirSync(ARTICLES_DIR);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(ARTICLES_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        cleanedCount++;
        logger.info(`🗑️  Cleaned up old file: ${file}`);
      }
    });
    
    if (cleanedCount > 0) {
      logger.info(`✅ Cleaned up ${cleanedCount} old files`);
    }
    
  } catch (error) {
    logger.error('❌ Error during cleanup:', error);
  }
} 