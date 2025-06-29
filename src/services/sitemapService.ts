import { getStoredNews } from './newsCollector';
import { NewsItem } from '../types/news';

// Generate slug from title for consistent URL structure
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

// Generate XML sitemap
export function generateSitemap(baseUrl: string = 'https://ainews.example.com'): string {
  const currentDate = new Date().toISOString();
  
  // Get all articles (we'll fetch a large number to include all)
  const newsData = getStoredNews('artificial intelligence', 1, 1000);
  const articles = newsData.articles;

  // Generate sitemap XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${currentDate}</lastmod>
  </url>
  
  <!-- AI News Category Page -->
  <url>
    <loc>${baseUrl}/#ai-news</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${currentDate}</lastmod>
  </url>
`;

  // Add article URLs
  articles.forEach((article) => {
    const slug = generateSlug(article.title);
    const articleUrl = `${baseUrl}/news/${slug}`;
    const publishedDate = new Date(article.publishedAt).toISOString();
    
    sitemap += `
  <!-- Article: ${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->
  <url>
    <loc>${articleUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${publishedDate}</lastmod>
    <news:news>
      <news:publication>
        <news:name>AI News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publishedDate}</news:publication_date>
      <news:title>${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</news:title>
      <news:keywords>AI news, artificial intelligence, latest AI developments, technology news</news:keywords>
    </news:news>`;
    
    // Add image sitemap data if available
    if (article.imageUrl) {
      sitemap += `
    <image:image>
      <image:loc>${article.imageUrl}</image:loc>
      <image:title>${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
      <image:caption>AI news article image related to artificial intelligence developments</image:caption>
    </image:image>`;
    }
    
    sitemap += `
  </url>`;
  });

  sitemap += `
</urlset>`;

  return sitemap;
}

// Generate sitemap index for large sites (if needed in the future)
export function generateSitemapIndex(baseUrl: string = 'https://ainews.example.com'): string {
  const currentDate = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;
}

// Get sitemap statistics
export function getSitemapStats() {
  const newsData = getStoredNews('artificial intelligence', 1, 1000);
  const articleCount = newsData.articles.length;
  
  return {
    totalUrls: articleCount + 2, // +2 for homepage and category page
    articleUrls: articleCount,
    staticUrls: 2,
    lastGenerated: new Date().toISOString()
  };
} 