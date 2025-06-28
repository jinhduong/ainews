import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from './logger';

export interface ExtractedContent {
  content: string;
  title: string;
  imageUrl?: string;
  success: boolean;
  error?: string;
}

/**
 * Extracts the main article content and featured image from a webpage URL
 * Uses multiple fallback strategies to find article text and images
 */
export async function extractArticleContent(url: string): Promise<ExtractedContent> {
  try {
    // Set reasonable timeout and user agent to avoid blocks
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer, and other non-content elements
    $('script, style, nav, footer, header, aside, .advertisement, .ad, .sidebar').remove();

    let content = '';
    let title = '';
    let imageUrl = '';

    // Extract title from various possible locations
    title = $('h1').first().text().trim() || 
            $('title').text().trim() || 
            $('meta[property="og:title"]').attr('content') || 
            '';

    // Extract featured image using multiple strategies
    const extractImage = (): string => {
      // Strategy 1: Open Graph image (most reliable)
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage && isValidImageUrl(ogImage)) {
        return makeAbsoluteUrl(ogImage, url);
      }

      // Strategy 2: Twitter Card image
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      if (twitterImage && isValidImageUrl(twitterImage)) {
        return makeAbsoluteUrl(twitterImage, url);
      }

      // Strategy 3: Article featured image selectors
      const featuredSelectors = [
        '.featured-image img',
        '.article-image img',
        '.post-image img',
        '.hero-image img',
        'article img:first-of-type',
        '.content img:first-of-type'
      ];

      for (const selector of featuredSelectors) {
        const img = $(selector).first();
        if (img.length > 0) {
          const src = img.attr('src') || img.attr('data-src');
          if (src && isValidImageUrl(src)) {
            return makeAbsoluteUrl(src, url);
          }
        }
      }

      // Strategy 4: First image in article content with reasonable size
      const contentImages = $('article img, .content img, .post-content img, .entry-content img');
      for (let i = 0; i < contentImages.length; i++) {
        const img = $(contentImages[i]);
        const src = img.attr('src') || img.attr('data-src');
        const alt = img.attr('alt') || '';
        
        if (src && isValidImageUrl(src) && !isLikelyIcon(src, alt)) {
          return makeAbsoluteUrl(src, url);
        }
      }

      // Strategy 5: Any img tag that looks like a content image
      const allImages = $('img');
      for (let i = 0; i < allImages.length; i++) {
        const img = $(allImages[i]);
        const src = img.attr('src') || img.attr('data-src');
        const alt = img.attr('alt') || '';
        
        if (src && isValidImageUrl(src) && !isLikelyIcon(src, alt)) {
          return makeAbsoluteUrl(src, url);
        }
      }

      return '';
    };

    imageUrl = extractImage();

    // Strategy 1: Look for common article content selectors
    const commonSelectors = [
      'article',
      '.article-content',
      '.post-content', 
      '.entry-content',
      '.content',
      '[class*="article"]',
      '[class*="post"]',
      '[class*="content"]'
    ];

    for (const selector of commonSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) { // Ensure we got substantial content
          break;
        }
      }
    }

    // Strategy 2: If no content found, try to extract from paragraphs
    if (content.length < 200) {
      const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
      content = paragraphs.join(' ').trim();
    }

    // Strategy 3: Last resort - get all text from body, excluding navigation
    if (content.length < 200) {
      $('nav, .nav, .navigation, .menu, .header, .footer').remove();
      content = $('body').text().trim();
    }

    // Clean up the content - remove extra whitespace and line breaks
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();

    // Validate we extracted meaningful content
    if (content.length < 100) {
      return {
        content: '',
        title: title,
        imageUrl: imageUrl || undefined,
        success: false,
        error: 'Insufficient content extracted'
      };
    }

    // Limit content length to avoid token limits (approximately 3000 words)
    if (content.length > 12000) {
      content = content.substring(0, 12000) + '...';
    }

    logger.info(`✅ Successfully extracted ${content.length} characters and ${imageUrl ? 'image' : 'no image'} from ${url}`);

    return {
      content,
      title,
      imageUrl: imageUrl || undefined,
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(`❌ Failed to extract content from ${url}: ${errorMessage}`);
    
    return {
      content: '',
      title: '',
      imageUrl: undefined,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Helper function to validate if URL looks like a valid image
 */
function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  if (imageExtensions.test(url)) return true;
  
  // Check for image URLs that don't have extensions but contain image indicators
  const imageIndicators = /\/(image|img|photo|picture|media)/i;
  if (imageIndicators.test(url)) return true;
  
  return false;
}

/**
 * Helper function to check if an image is likely an icon/logo rather than content
 */
function isLikelyIcon(src: string, alt: string): boolean {
  const iconIndicators = /\b(icon|logo|avatar|social|share|button|arrow|star|rating)\b/i;
  return iconIndicators.test(src) || iconIndicators.test(alt);
}

/**
 * Helper function to convert relative URLs to absolute URLs
 */
function makeAbsoluteUrl(imageUrl: string, baseUrl: string): string {
  try {
    // If already absolute, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Create absolute URL
    const base = new URL(baseUrl);
    const absolute = new URL(imageUrl, base);
    return absolute.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return imageUrl;
  }
} 