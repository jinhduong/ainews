import { supabase, DatabaseArticle, TABLES } from '../config/supabase';
import { StoredNewsItem } from './newsCollector';
import logger from '../utils/logger';

/**
 * Converts StoredNewsItem to DatabaseArticle format
 */
function toDatabase(article: StoredNewsItem): Omit<DatabaseArticle, 'created_at'> {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    url: article.url,
    published_at: article.publishedAt,
    image_url: article.imageUrl || undefined,
    audio_path: article.audioPath || undefined,
    category: article.category,
    collected_at: article.collectedAt
  };
}

/**
 * Converts DatabaseArticle to StoredNewsItem format
 */
function fromDatabase(dbArticle: DatabaseArticle): StoredNewsItem {
  return {
    id: dbArticle.id,
    title: dbArticle.title,
    summary: dbArticle.summary,
    url: dbArticle.url,
    publishedAt: dbArticle.published_at,
    imageUrl: dbArticle.image_url || undefined,
    audioPath: dbArticle.audio_path || undefined,
    category: dbArticle.category,
    collectedAt: dbArticle.collected_at
  };
}

/**
 * Save multiple articles to Supabase with deduplication
 */
export async function saveArticlesToSupabase(
  category: string,
  articles: StoredNewsItem[]
): Promise<{ success: boolean; newCount: number; duplicateCount: number; error?: string }> {
  try {
    if (articles.length === 0) {
      return { success: true, newCount: 0, duplicateCount: 0 };
    }

    logger.info(`💾 Saving ${articles.length} articles to Supabase for category: ${category}`);

    // Deduplicate articles by ID to prevent constraint violations in the same command
    const uniqueArticles = articles.reduce((acc, article) => {
      if (!acc.has(article.id)) {
        acc.set(article.id, article);
      }
      return acc;
    }, new Map<string, StoredNewsItem>());

    const deduplicatedArticles = Array.from(uniqueArticles.values());
    const duplicatesRemoved = articles.length - deduplicatedArticles.length;

    if (duplicatesRemoved > 0) {
      logger.info(`🔄 Removed ${duplicatesRemoved} duplicate articles before Supabase insert`);
    }

    // Convert to database format
    const dbArticles = deduplicatedArticles.map(toDatabase);

    // Insert articles, handling conflicts (duplicates) gracefully
    const { data, error } = await supabase
      .from(TABLES.ARTICLES)
      .upsert(dbArticles, { 
        onConflict: 'id', // Use ID as unique constraint since it's the primary key
        ignoreDuplicates: false // We want to know about duplicates
      })
      .select();

    if (error) {
      logger.error('❌ Error saving articles to Supabase:', error);
      return { success: false, newCount: 0, duplicateCount: 0, error: error.message };
    }

    const newCount = data?.length || 0;
    const duplicateCount = (deduplicatedArticles.length - newCount) + duplicatesRemoved;

    logger.info(`✅ Saved ${newCount} new articles, ${duplicateCount} duplicates skipped for ${category}`);
    
    return { success: true, newCount, duplicateCount };

  } catch (error) {
    logger.error('❌ Exception saving articles to Supabase:', error);
    return { 
      success: false, 
      newCount: 0, 
      duplicateCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get existing articles for duplicate checking
 */
export async function getExistingArticleUrls(category: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ARTICLES)
      .select('url')
      .eq('category', category);

    if (error) {
      logger.error('❌ Error fetching existing article URLs:', error);
      return new Set();
    }

    return new Set(data?.map(item => item.url) || []);

  } catch (error) {
    logger.error('❌ Exception fetching existing article URLs:', error);
    return new Set();
  }
}

/**
 * Get articles with pagination
 */
export async function getArticlesPaginated(
  category: string,
  page: number = 1,
  pageSize: number = 6
): Promise<{
  articles: StoredNewsItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> {
  try {
    logger.info(`📖 Fetching articles for ${category} (page ${page}, size ${pageSize})`);

    // Use the custom function for better performance
    const { data, error } = await supabase
      .rpc('get_articles_paginated', {
        p_category: category,
        p_page: page,
        p_page_size: pageSize
      });

    if (error) {
      logger.error('❌ Error fetching paginated articles:', error);
      return {
        articles: [],
        pagination: {
          page,
          pageSize,
          totalResults: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: page > 1
        }
      };
    }

    const articles = data?.map(fromDatabase) || [];
    const totalResults = data?.[0]?.total_count || 0;
    const totalPages = Math.ceil(totalResults / pageSize);

    logger.info(`✅ Retrieved ${articles.length} articles, total: ${totalResults}`);

    return {
      articles,
      pagination: {
        page,
        pageSize,
        totalResults: Number(totalResults),
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };

  } catch (error) {
    logger.error('❌ Exception fetching paginated articles:', error);
    return {
      articles: [],
      pagination: {
        page,
        pageSize,
        totalResults: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: page > 1
      }
    };
  }
}

/**
 * Clean up old articles (older than specified days)
 */
export async function cleanupOldArticles(daysOld: number = 7): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    logger.info(`🗑️ Cleaning up articles older than ${daysOld} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from(TABLES.ARTICLES)
      .delete()
      .lt('collected_at', cutoffDate.toISOString())
      .select();

    if (error) {
      logger.error('❌ Error cleaning up old articles:', error);
      return { success: false, deletedCount: 0, error: error.message };
    }

    const deletedCount = data?.length || 0;
    logger.info(`✅ Cleaned up ${deletedCount} old articles`);

    return { success: true, deletedCount };

  } catch (error) {
    logger.error('❌ Exception cleaning up old articles:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  categories: Array<{
    category: string;
    articleCount: number;
    lastUpdated: string;
  }>;
  totalArticles: number;
}> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ARTICLES)
      .select('category, collected_at')
      .order('collected_at', { ascending: false });

    if (error) {
      logger.error('❌ Error fetching storage stats:', error);
      return { categories: [], totalArticles: 0 };
    }

    // Group by category and get stats
    const categoryStats = new Map<string, { count: number; lastUpdated: string }>();
    
    data?.forEach(article => {
      const existing = categoryStats.get(article.category) || { count: 0, lastUpdated: article.collected_at };
      categoryStats.set(article.category, {
        count: existing.count + 1,
        lastUpdated: article.collected_at > existing.lastUpdated ? article.collected_at : existing.lastUpdated
      });
    });

    const categories = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      articleCount: stats.count,
      lastUpdated: stats.lastUpdated
    }));

    return {
      categories,
      totalArticles: data?.length || 0
    };

  } catch (error) {
    logger.error('❌ Exception fetching storage stats:', error);
    return { categories: [], totalArticles: 0 };
  }
}

/**
 * Get a single article by ID
 */
export async function getArticleById(articleId: string): Promise<StoredNewsItem | null> {
  try {
    logger.info(`📖 Fetching article by ID: ${articleId}`);

    const { data, error } = await supabase
      .from(TABLES.ARTICLES)
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned (article not found)
        logger.info(`📖 Article not found: ${articleId}`);
        return null;
      }
      logger.error('❌ Error fetching article by ID:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const article = fromDatabase(data);
    logger.info(`✅ Retrieved article: ${article.title.substring(0, 50)}...`);
    
    return article;

  } catch (error) {
    logger.error('❌ Exception fetching article by ID:', error);
    return null;
  }
}

/**
 * Update article with audio path after generating audio on-demand
 */
export async function updateArticleAudioPath(
  articleId: string, 
  audioPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info(`🎵 Updating article ${articleId} with audio path: ${audioPath}`);

    const { error } = await supabase
      .from(TABLES.ARTICLES)
      .update({ audio_path: audioPath })
      .eq('id', articleId);

    if (error) {
      logger.error('❌ Error updating article audio path:', error);
      return { success: false, error: error.message };
    }

    logger.info(`✅ Successfully updated audio path for article: ${articleId}`);
    return { success: true };

  } catch (error) {
    logger.error('❌ Exception updating article audio path:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}