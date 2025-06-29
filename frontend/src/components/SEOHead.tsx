import React from 'react';
import { Helmet } from 'react-helmet-async';
import { NewsItem } from '../types/news';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  article?: NewsItem;
  type?: 'website' | 'article';
  image?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'AI News - Latest Artificial Intelligence Updates & Developments',
  description = 'Stay updated with the latest AI news, artificial intelligence developments, and cutting-edge technology insights. Get comprehensive AI-generated summaries from full article content.',
  keywords = ['AI news', 'artificial intelligence', 'latest AI developments', 'AI updates', 'machine learning news', 'technology news', 'AI research'],
  canonical,
  article,
  type = 'website',
  image = '/logo.png'
}) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ainews.example.com';
  const fullCanonical = canonical ? `${baseUrl}${canonical}` : `${baseUrl}${window.location.pathname}`;
  const fullImage = image.startsWith('http') ? image : `${baseUrl}${image}`;

  // Generate structured data for articles
  const generateStructuredData = () => {
    if (type === 'article' && article) {
      return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.summary,
        image: article.imageUrl || fullImage,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        author: {
          '@type': 'Organization',
          name: 'AI News',
          url: baseUrl
        },
        publisher: {
          '@type': 'Organization',
          name: 'AI News',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': fullCanonical
        },
        articleSection: 'Artificial Intelligence',
        keywords: keywords.join(', '),
        url: fullCanonical,
        isAccessibleForFree: true,
        hasPart: {
          '@type': 'WebPageElement',
          isAccessibleForFree: true,
          cssSelector: 'article'
        }
      };
    }
    
    // Website structured data
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AI News',
      description: description,
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: 'AI News',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`
        }
      }
    };
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={article?.imageUrl || fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={article ? `${article.title} - AI news article` : 'AI News - Latest artificial intelligence updates'} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:site_name" content="AI News" />
      <meta property="og:locale" content="en_US" />
      {article && <meta property="og:updated_time" content={article.publishedAt} />}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={article?.imageUrl || fullImage} />
      <meta name="twitter:image:alt" content={article ? `${article.title} - AI news article` : 'AI News - Latest artificial intelligence updates'} />
      <meta name="twitter:site" content="@ainews" />
      <meta name="twitter:creator" content="@ainews" />
      <meta name="twitter:domain" content={baseUrl.replace(/https?:\/\//, '')} />

      {/* Article-specific meta tags */}
      {type === 'article' && article && (
        <>
          <meta property="article:published_time" content={article.publishedAt} />
          <meta property="article:modified_time" content={article.publishedAt} />
          <meta property="article:section" content="Artificial Intelligence" />
          <meta property="article:tag" content="AI" />
          <meta property="article:tag" content="Artificial Intelligence" />
          <meta property="article:tag" content="Technology" />
        </>
      )}

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="theme-color" content="#4f46e5" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="AI News" />
      <meta name="application-name" content="AI News" />
      <meta name="msapplication-TileColor" content="#4f46e5" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData(), null, 2)}
      </script>

      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
      {/* DNS prefetch for better performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
    </Helmet>
  );
};

export default SEOHead; 