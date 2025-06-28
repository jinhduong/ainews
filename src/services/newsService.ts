import logger from '../utils/logger';
import { getStoredNews, StoredNewsItem } from './newsCollector';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface PaginatedNewsResponse {
  articles: NewsItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface NewsRequestParams {
  category: string;
  page?: number;
  pageSize?: number;
}

/**
 * Convert StoredNewsItem to NewsItem (removing internal fields)
 */
function convertStoredToNewsItem(storedItem: StoredNewsItem): NewsItem {
  return {
    id: storedItem.id,
    title: storedItem.title,
    summary: storedItem.summary,
    url: storedItem.url,
    publishedAt: storedItem.publishedAt,
    imageUrl: storedItem.imageUrl
  };
}

/**
 * Gets news from stored cache (collected by cron jobs)
 * This replaces the previous getNewsFromOpenAI function that made live API calls
 */
export function getNewsFromCache(params: NewsRequestParams): PaginatedNewsResponse {
  const { category, page = 1, pageSize = 5 } = params;
  
  // Validate pagination parameters
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.min(Math.max(1, pageSize), 20); // Max 20 articles per page
  
  const normalizedCategory = category.toLowerCase().trim();
  
  logger.info(`📖 Serving news for ${normalizedCategory} (page ${validatedPage}, size ${validatedPageSize}) from cache`);

  try {
    // Get stored news from cache
    const result = getStoredNews(normalizedCategory, validatedPage, validatedPageSize);
    
    // Convert stored news items to public news items
    const articles = result.articles.map(convertStoredToNewsItem);
    
    logger.info(`✅ Served ${articles.length} articles for ${normalizedCategory} from cache`);
    
    return {
      articles,
      pagination: result.pagination
    };

  } catch (error) {
    logger.error(`Error serving news from cache for category ${normalizedCategory}:`, error);
    
    // Return empty response on error
    return {
      articles: [],
      pagination: {
        page: validatedPage,
        pageSize: validatedPageSize,
        totalResults: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: validatedPage > 1
      }
    };
  }
}

// Keep the old function name for backward compatibility, but make it use cache
export const getNewsFromOpenAI = getNewsFromCache;
