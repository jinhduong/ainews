import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, Clock, ImageIcon } from 'lucide-react';
import { NewsItem } from '../types/news';
import AudioPlayer from './AudioPlayer';
import analyticsService from '../services/analyticsService';

const NewsDetail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
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

  // Track page view on component mount
  useEffect(() => {
    if (article) {
      analyticsService.trackPageView('detail');
    }
  }, [article]);

  // Format the published date for better readability
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Estimate reading time for the summary (average 200 words per minute)
  const estimateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleReadOriginal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleGoBack = () => {
    // If we have return state, navigate back to the specific page
    if (returnTo) {
      navigate('/', { 
        state: { 
          returnToPage: returnTo.page,
          returnToCategory: returnTo.category 
        },
        replace: true 
      });
    } else {
      // Fallback to browser history
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      {/* Modern header with enhanced design */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="group flex items-center gap-3 text-gray-600 hover:text-indigo-700 transition-all duration-300 hover:translate-x-1"
              aria-label="Go back"
            >
              <div className="bg-gray-100 group-hover:bg-indigo-100 rounded-full p-2 transition-colors duration-300">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-semibold">Back to News</span>
            </button>
            
            {/* AI News logo in header */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="AI News Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <span className="text-lg font-semibold text-gray-800">AI News</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with enhanced layout */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200/50">
          {/* Enhanced Article Image */}
          {article.imageUrl ? (
            <div className="relative h-72 md:h-96 w-full overflow-hidden">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Show modern placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="h-full w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-blue-100/50"></div>
                        <svg class="w-20 h-20 text-indigo-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              
              {/* Floating metadata badges */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 shadow-lg">
                  <Clock className="w-4 h-4" />
                  <span>{estimateReadingTime(article.summary)} min read</span>
                </div>
              </div>
            </div>
          ) : (
            // Modern placeholder for articles without images
            <div className="h-72 md:h-96 w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-blue-100/50" />
              <ImageIcon className="w-20 h-20 text-indigo-300 relative z-10" />
              
              {/* Reading time badge */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 shadow-lg">
                <Clock className="w-4 h-4" />
                <span>{estimateReadingTime(article.summary)} min read</span>
              </div>
            </div>
          )}

          {/* Enhanced article content */}
          <div className="p-8 sm:p-12">
            {/* Enhanced title with modern typography */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-8 tracking-tight">
              {article.title}
            </h1>

            {/* Modern article metadata */}
            <div className="flex items-center justify-between text-gray-500 text-sm mb-10 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full px-4 py-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <time dateTime={article.publishedAt} className="font-semibold text-gray-700">
                    {formatDate(article.publishedAt)}
                  </time>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-cyan-100 to-teal-100 rounded-full px-4 py-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  <span className="font-semibold text-gray-700">{estimateReadingTime(article.summary)} min read</span>
                </div>
              </div>
            </div>

            {/* Enhanced summary content */}
            <div className="prose prose-lg max-w-none">
              <div className="relative bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-8 border border-gray-200/50 shadow-sm mb-10">
                {/* Modern accent line */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-t-2xl" />
                
                <div className="text-gray-700 leading-relaxed space-y-6">
                  {/* Split summary into paragraphs for better readability */}
                  {article.summary.split(/\.\s+/).map((sentence, index, array) => {
                    // Add period back except for the last sentence
                    const processedSentence = index < array.length - 1 
                      ? sentence + '.'
                      : sentence;
                    
                    return (
                      <p key={index} className="text-lg leading-relaxed">
                        {processedSentence}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Audio Player */}
              <div className="mb-12">
                <AudioPlayer 
                  articleId={article.id} 
                  title={article.title}
                  audioPath={article.audioPath}
                  className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl"
                />
              </div>

              {/* Modern call-to-action section */}
              <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-2xl p-8 border border-indigo-200/50 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full p-3 flex-shrink-0">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Want to dive deeper?
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      This AI-generated summary captures the key points, but the full article contains additional details, 
                      quotes, and context that might interest you.
                    </p>
                    <button
                      onClick={handleReadOriginal}
                      className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <span>Read Full Original Article</span>
                      <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default NewsDetail; 