import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Calendar, ImageIcon, Clock } from 'lucide-react';
import { NewsItem } from '../types/news';
import AudioPlayer from './AudioPlayer';

interface NewsCardProps {
  article: NewsItem;
  currentPage?: number;
  category?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, currentPage = 1, category = 'artificial intelligence' }) => {
  const navigate = useNavigate();

  // Format the published date for better readability
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString; // Fallback to original string if parsing fails
    }
  };

  // Estimate reading time for the summary
  const estimateReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  // Handle click to navigate to detail page
  const handleClick = () => {
    navigate(`/article/${article.id}`, {
      state: { 
        article,
        returnTo: {
          page: currentPage,
          category: category
        }
      }
    });
  };

  return (
    <article 
      className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-[1.02] border border-gray-100 overflow-hidden backdrop-blur-sm"
      onClick={handleClick}
      onKeyDown={(e) => {
        // Allow keyboard navigation (Enter and Space)
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Read summary: ${article.title}`}
    >
      {/* Article Image with modern overlay */}
      {article.imageUrl ? (
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            onError={(e) => {
              // Hide image if it fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          {/* Modern gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          
          {/* Floating reading time badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 text-xs font-medium text-gray-700 shadow-lg">
            <Clock className="w-3 h-3" />
            <span>{estimateReadingTime(article.summary)} min</span>
          </div>
        </div>
      ) : (
        // Modern placeholder for articles without images
        <div className="h-56 w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-blue-100/50" />
          <ImageIcon className="w-16 h-16 text-indigo-300 relative z-10" />
          
          {/* Reading time badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 text-xs font-medium text-gray-700 shadow-lg">
            <Clock className="w-3 h-3" />
            <span>{estimateReadingTime(article.summary)} min</span>
          </div>
        </div>
      )}

      <div className="p-7">
        {/* Article title with enhanced typography */}
        <h2 className="text-xl font-bold text-gray-900 mb-5 line-clamp-2 leading-tight tracking-tight group-hover:text-indigo-700 transition-colors duration-300">
          {article.title}
        </h2>
        
        {/* Enhanced AI summary section with modern design */}
        <div className="mb-6">
          <div className="relative bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
            {/* Subtle accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-t-xl" />
            
            <p className="text-gray-700 leading-relaxed line-clamp-3 font-medium text-sm">
              {article.summary}
            </p>
          </div>
        </div>
        
        {/* Audio Player with enhanced styling */}
        <div 
          className="mb-6"
          onClick={(e) => e.stopPropagation()} // Prevent navigation when interacting with audio player
        >
          <AudioPlayer 
            articleId={article.id} 
            title={article.title}
            audioPath={article.audioPath}
            className="shadow-sm border-0 bg-gradient-to-r from-gray-50 to-slate-50"
          />
        </div>
        
        {/* Modern footer with enhanced design */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              <time dateTime={article.publishedAt} className="font-medium">
                {formatDate(article.publishedAt)}
              </time>
            </div>
          </div>
          
          {/* Enhanced read summary button */}
          <div className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-all duration-300 group-hover:translate-x-1">
            <span className="font-semibold text-sm">Read Summary</span>
            <div className="bg-indigo-100 group-hover:bg-indigo-200 rounded-full p-1 transition-colors duration-300">
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard; 