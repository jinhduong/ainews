import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  Play,
  Share2
} from 'lucide-react';
import { NewsItem } from '../types/news';
import { fetchNews } from '../services/newsApi';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';
import AudioPlayer from './AudioPlayer';
import FloatingAudioPlayer from './FloatingAudioPlayer';
import SEOHead from './SEOHead';
import Breadcrumb from './Breadcrumb';
import analyticsService from '../services/analyticsService';
import { generateMetaDescription, extractArticleKeywords, generateSlug } from '../utils/seoHelpers';

const NewsDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isVisible: isAudioPlayerVisible, playTrack, currentTrack, isPlaying } = useAudio();
  const [readingProgress, setReadingProgress] = useState(0);
  const [relatedArticles, setRelatedArticles] = useState<NewsItem[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Get article data and return state from location state
  const article = location.state?.article as NewsItem;
  const returnTo = location.state?.returnTo as { page: number; category: string };

  // If no article data, redirect back to home
  if (!article) {
    React.useEffect(() => {
      navigate('/', { replace: true });
    }, [navigate]);
    return null;
  }

  // Track page view and load related articles
  useEffect(() => {
    if (article) {
      analyticsService.trackPageView('detail');
      loadRelatedArticles();
    }
  }, [article]);

  // Load related articles
  const loadRelatedArticles = async () => {
    try {
      const newsData = await fetchNews({ 
        category: returnTo?.category || 'artificial intelligence', 
        page: 1, 
        pageSize: 3 
      });
      
      // Filter out the current article
      const filtered = newsData.articles
        .filter(item => item.id !== article.id)
        .slice(0, 3);
      
      setRelatedArticles(filtered);
    } catch (error) {
      console.error('Error loading related articles:', error);
    }
  };

  // Reading progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;
      
      const start = elementTop - windowHeight;
      const end = elementTop + elementHeight;
      const progress = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
      
      setReadingProgress(progress * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Estimate reading time
  const estimateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleReadOriginal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleGoBack = () => {
    if (returnTo) {
      navigate('/', { 
        state: { 
          returnToPage: returnTo.page,
          returnToCategory: returnTo.category 
        },
        replace: true 
      });
    } else {
      navigate(-1);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <SEOHead 
        title={`${article.title} | AI News`}
        description={generateMetaDescription(article.summary)}
        keywords={extractArticleKeywords(article)}
        canonical={article.slug ? `/news/${article.slug}` : `/article/${article.id}`}
        article={article}
        type="article"
        image={article.imageUrl}
      />
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    } ${
      isAudioPlayerVisible ? 'pb-20 sm:pb-24' : ''
    }`}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-blue-500 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Hero Section with Subtle Background Image */}
      <section className="relative min-h-[70vh] overflow-hidden">
        {/* Background Image Layer */}
        {article.imageUrl && (
          <>
            {/* Background image with high visibility */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60 scale-105"
              style={{
                backgroundImage: `url(${article.imageUrl})`,
                filter: 'blur(2px) grayscale(20%) saturate(1.1)',
              }}
              aria-hidden="true"
            />
            
            {/* Semi-transparent overlay for text readability */}
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gray-900/65'
                  : 'bg-white/70'
              }`}
              aria-hidden="true"
            />
          </>
        )}

        {/* Header Navigation */}
        <div className="relative z-10 flex items-center justify-between p-6 md:p-8">
          <button
            onClick={handleGoBack}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Audio Play Button */}
            <button
              onClick={() => playTrack(article)}
              className={`p-3 rounded-full transition-all duration-200 ${
                currentTrack?.id === article.id && isPlaying
                  ? 'bg-blue-600 text-white' 
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              aria-label="Play audio summary"
            >
              <Play className="w-5 h-5" />
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className={`p-3 rounded-full transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              aria-label="Share article"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center min-h-[50vh] px-6 md:px-8">
          <div className="max-w-4xl mx-auto w-full">
            {/* Metadata */}
            <div className="flex items-center gap-6 mb-6">
              <div className={`flex items-center gap-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Calendar className="w-4 h-4" />
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
              </div>
              
              <div className={`flex items-center gap-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{estimateReadingTime(article.summary)} min read</span>
              </div>
            </div>

            {/* Title */}
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {article.title}
            </h1>

            {/* Summary Preview */}
            <p className={`text-xl md:text-2xl leading-relaxed max-w-3xl ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {article.summary.split('.')[0]}.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main ref={contentRef} className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        {/* Breadcrumb Navigation */}
        <Breadcrumb article={article} />
        {/* Article Summary */}
        <article className={`mb-12 p-8 md:p-12 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800' 
            : 'bg-white'
        }`}>
          <div className="prose prose-lg md:prose-xl max-w-none">
            <div className="text-lg md:text-xl leading-relaxed space-y-6">
              {article.summary.split(/\.\s+/).map((sentence, index, array) => {
                const processedSentence = index < array.length - 1 
                  ? sentence + '.'
                  : sentence;
                
                return (
                  <p key={index} className={`leading-relaxed ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {processedSentence}
                  </p>
                );
              })}
            </div>
            
            {/* Article Tags/Topics */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className={`text-sm font-semibold mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {['AI', 'Artificial Intelligence', 'Technology', 'Machine Learning', 'Innovation'].map((tag) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isDarkMode
                        ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Read original link */}
              <button
                onClick={handleReadOriginal}
                className={`text-sm font-light tracking-wide transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:underline decoration-gray-500' 
                    : 'text-gray-500 hover:text-gray-700 hover:underline decoration-gray-400'
                } hover:underline-offset-4`}
              >
                read original article
              </button>
            </div>
          </div>
        </article>

        {/* Audio Player Section */}
        {article.audioPath && (
          <section className={`mb-12 p-8 md:p-12 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800' 
              : 'bg-white'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Listen to Summary
            </h2>
            <AudioPlayer 
              articleId={article.id} 
              title={article.title}
              audioPath={article.audioPath}
              className="border-0 shadow-none bg-transparent"
            />
          </section>
        )}



        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className={`p-8 md:p-12 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800' 
              : 'bg-white'
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Related AI News Articles
            </h2>
            <p className={`text-sm mb-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Discover more artificial intelligence updates and technology developments
            </p>
            
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <article 
                  key={relatedArticle.id}
                  className={`group relative overflow-hidden h-80 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gray-900 hover:bg-gray-700' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    // Use slug-based URL for better SEO
                    const slug = relatedArticle.slug || generateSlug(relatedArticle.title);
                    const urlPath = slug ? `/news/${slug}` : `/article/${relatedArticle.id}`;
                    
                    navigate(urlPath, {
                      state: { 
                        article: relatedArticle,
                        returnTo: { page: 1, category: returnTo?.category || 'artificial intelligence' }
                      }
                    });
                  }}
                >
                  {/* Background Image */}
                  {relatedArticle.imageUrl && (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm scale-110 transition-all duration-300 group-hover:opacity-30 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${relatedArticle.imageUrl})`,
                          filter: 'blur(5px) grayscale(50%) saturate(0.8)',
                        }}
                        aria-hidden="true"
                      />
                      
                      <div
                        className={`absolute inset-0 transition-opacity duration-300 ${
                          isDarkMode
                            ? 'bg-gray-900/80 group-hover:bg-gray-900/75'
                            : 'bg-white/85 group-hover:bg-white/80'
                        }`}
                        aria-hidden="true"
                      />
                    </>
                  )}

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div>
                      <h3 className={`text-lg font-bold leading-tight mb-3 line-clamp-3 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {relatedArticle.title}
                      </h3>
                      <p className={`text-sm leading-relaxed line-clamp-3 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {relatedArticle.summary}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className={`flex items-center gap-2 text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{estimateReadingTime(relatedArticle.summary)} min read</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            
            {/* More AI News Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link
                to="/"
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } hover:shadow-lg`}
              >
                Explore More AI News & Updates
              </Link>
            </div>
          </section>
        )}
        
        {/* Call-to-Action for Homepage */}
        {relatedArticles.length === 0 && (
          <section className={`p-8 md:p-12 text-center transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800' 
              : 'bg-white'
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Discover More AI News
            </h2>
            <p className={`text-lg mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Stay updated with the latest artificial intelligence developments and technology insights
            </p>
            <Link
              to="/"
              className={`inline-flex items-center px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } hover:shadow-lg`}
            >
              Browse All AI News Articles
            </Link>
          </section>
        )}
      </main>
      
      {/* Floating Audio Player */}
      <FloatingAudioPlayer />
    </div>
    </>
  );
};

export default NewsDetail; 