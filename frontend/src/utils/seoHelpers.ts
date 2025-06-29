import { NewsItem } from '../types/news';

/**
 * Generate SEO-friendly slug from article title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
};

/**
 * Generate descriptive alt text for article images
 */
export const generateImageAltText = (article: NewsItem): string => {
  const truncatedTitle = article.title.length > 60 
    ? article.title.substring(0, 60) + '...' 
    : article.title;
  
  return `${truncatedTitle} - AI news article image related to artificial intelligence developments`;
};

/**
 * Generate meta description from article summary
 */
export const generateMetaDescription = (summary: string, maxLength: number = 155): string => {
  if (summary.length <= maxLength) return summary;
  
  // Find the last complete sentence within the limit
  const truncated = summary.substring(0, maxLength);
  const lastSentenceEnd = truncated.lastIndexOf('.');
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // If no good sentence break, truncate at word boundary
  return truncated.replace(/\s+\S*$/, '') + '...';
};

/**
 * Extract relevant keywords from article title and summary
 */
export const extractArticleKeywords = (article: NewsItem): string[] => {
  const baseKeywords = ['AI news', 'artificial intelligence', 'latest AI developments'];
  
  // Extract meaningful words from title
  const titleWords = article.title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !['with', 'from', 'this', 'that', 'they', 'them', 'will', 'have', 'been', 'into', 'what', 'when', 'where', 'while'].includes(word)
    )
    .slice(0, 4);
  
  // Extract key terms from summary
  const summaryWords = article.summary
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 4 && 
      ['technology', 'machine', 'learning', 'neural', 'algorithm', 'robot', 'automation', 'intelligence', 'data', 'model'].some(keyword => 
        word.includes(keyword)
      )
    )
    .slice(0, 2);
  
  return [...baseKeywords, ...titleWords, ...summaryWords, 'AI updates', 'technology news', 'machine learning'];
};

/**
 * Format date for SEO (ISO format)
 */
export const formatDateForSEO = (dateString: string): string => {
  try {
    return new Date(dateString).toISOString();
  } catch {
    return dateString;
  }
};

/**
 * Generate breadcrumb schema for article pages
 */
export const generateBreadcrumbSchema = (article: NewsItem) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: typeof window !== 'undefined' ? window.location.origin : 'https://ainews.example.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'AI News',
        item: `${typeof window !== 'undefined' ? window.location.origin : 'https://ainews.example.com'}/#ai-news`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `${typeof window !== 'undefined' ? window.location.origin : 'https://ainews.example.com'}/article/${article.id}`
      }
    ]
  };
}; 