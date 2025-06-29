import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Play } from 'lucide-react';
import { NewsItem } from '../types/news';
import { useTheme } from '../contexts/ThemeContext';
import { useAudio } from '../contexts/AudioContext';

interface NewsCardProps {
  article: NewsItem;
  currentPage?: number;
  category?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, currentPage = 1, category = 'artificial intelligence' }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { playTrack, currentTrack, isPlaying } = useAudio();

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
      className={`group relative overflow-hidden transition-all duration-300 cursor-pointer h-80 rounded-2xl ${
        isDarkMode 
          ? 'bg-gray-900 hover:bg-gray-800' 
          : 'bg-white hover:bg-gray-50'
      }`}
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
      {/* Subtle background image layer */}
      {article.imageUrl && (
        <>
          {/* Background image with reduced blur, grayscale, and higher opacity */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-50 blur-[2px] scale-110 transition-all duration-300 group-hover:opacity-60 group-hover:scale-105"
            style={{
              backgroundImage: `url(${article.imageUrl}), linear-gradient(135deg, ${
                isDarkMode 
                  ? 'rgba(55, 65, 81, 0.1) 0%, rgba(75, 85, 99, 0.1) 100%'
                  : 'rgba(243, 244, 246, 0.1) 0%, rgba(229, 231, 235, 0.1) 100%'
              })`,
              filter: 'blur(2px) grayscale(20%) saturate(1.1)',
            }}
            aria-hidden="true"
          />
          
          {/* Semi-transparent overlay for text readability - made less opaque */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isDarkMode
                ? 'bg-gray-900/60 group-hover:bg-gray-900/50'
                : 'bg-white/70 group-hover:bg-white/60'
            }`}
            aria-hidden="true"
          />
        </>
      )}

      {/* Article content - positioned relative to appear above background */}
      <div className="relative h-full flex flex-col justify-between p-6 sm:p-8">
        {/* Top content: Headline with play button */}
        <div className="flex items-start gap-4 mb-4">
          <h2 className={`flex-1 text-xl sm:text-2xl font-bold leading-tight ${
            isDarkMode 
              ? 'text-white' 
              : 'text-gray-900'
          }`}>
            {article.title}
          </h2>
          
          {/* Minimal circular play button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playTrack(article);
            }}
            className={`flex-shrink-0 w-10 h-10 rounded-full transition-all duration-200 hover:scale-105 flex items-center justify-center backdrop-blur-sm ${
              currentTrack?.id === article.id && isPlaying
                ? 'bg-blue-600 text-white shadow-lg' 
                : isDarkMode
                  ? 'bg-gray-800/90 text-gray-400 hover:bg-gray-700/90 hover:text-white'
                  : 'bg-gray-100/90 text-gray-600 hover:bg-gray-200/90 hover:text-gray-900'
            }`}
            aria-label={`Play audio summary for ${article.title}`}
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
        
        {/* Middle content: Summary */}
        <div className="flex-1 mb-4">
          <p className={`text-base leading-relaxed line-clamp-4 font-normal ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {article.summary}
          </p>
        </div>
        
        {/* Bottom content: Metadata */}
        <div className="flex items-center gap-6 mt-auto">
          <div className={`flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <Calendar className="w-4 h-4" />
            <time dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </div>
          
          <div className={`flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{estimateReadingTime(article.summary)} min read</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard; 