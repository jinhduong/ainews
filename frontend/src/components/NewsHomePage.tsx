import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import NewsGrid from './NewsGrid';
import SEOHead from './SEOHead';
import analyticsService from '../services/analyticsService';

const NewsHomePage: React.FC = () => {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  // Check if we're returning from a detail page with specific state
  const returnToPage = location.state?.returnToPage;
  const returnToCategory = location.state?.returnToCategory;
  
  // State management for pagination (category is now fixed to AI)
  const [currentPage, setCurrentPage] = useState<number>(returnToPage || 1);
  const activeCategory = returnToCategory || 'artificial intelligence'; // Fixed to AI category

  // Clear the return state after using it
  useEffect(() => {
    if (returnToPage) {
      // Clear the location state to prevent it from persisting
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [returnToPage]);

  // Track page view on component mount
  useEffect(() => {
    analyticsService.trackPageView('home');
  }, []);

  // Handle page change within the AI category
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Smooth scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEOHead 
        title="AI News - Latest Artificial Intelligence Updates & Developments"
        description="Stay updated with the latest AI news, artificial intelligence developments, and cutting-edge technology insights. Get comprehensive AI-generated summaries from full article content - read smarter, not longer."
        keywords={[
          'AI news', 
          'artificial intelligence', 
          'latest AI developments', 
          'AI updates', 
          'machine learning news', 
          'technology news', 
          'AI research',
          'AI summaries',
          'artificial intelligence news',
          'AI technology updates'
        ]}
        canonical="/"
        type="website"
      />
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
          : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100'
      }`}>
      {/* Modern header with the new AI News logo */}
      <header className={`backdrop-blur-lg shadow-sm border-b transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800/80 border-gray-700/50' 
          : 'bg-white/80 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dark Mode Toggle - Top Right */}
          <div className="absolute top-6 right-6">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                isDarkMode 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            {/* New AI News logo */}
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="/logo.png" 
                alt="AI News - Latest artificial intelligence updates and technology news platform logo" 
                className="w-16 h-16 object-contain drop-shadow-lg"
                onError={(e) => {
                  // Fallback to text if logo doesn't load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-16 h-16 bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg';
                    fallback.textContent = 'AI';
                    parent.insertBefore(fallback, target);
                  }
                }}
              />
              <h1 className={`text-4xl font-bold tracking-tight transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>AI News</h1>
            </div>
            
            {/* Enhanced subtitle highlighting AI summaries */}
            <p className={`text-center max-w-2xl text-lg leading-relaxed transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Get comprehensive AI-generated summaries from full article content. 
              <span className={`font-semibold ${
                isDarkMode ? 'text-blue-400' : 'text-indigo-600'
              }`}> Read smarter, not longer.</span>
            </p>
          </div>
          
          {/* Note: Category tabs removed since AI is now the only category */}
        </div>
      </header>

      {/* Main content with enhanced styling */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page title with modern design */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
            <h2 className={`text-3xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Latest AI News
            </h2>
          </div>
          <p className={`text-lg leading-relaxed transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Intelligent summaries of the latest artificial intelligence developments • Powered by AI analysis of full articles
          </p>
        </div>

        {/* News grid component */}
        <NewsGrid
          category={activeCategory}
          page={currentPage}
          onPageChange={handlePageChange}
        />
      </main>

      {/* Enhanced footer */}
      <footer className={`backdrop-blur-lg border-t mt-20 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800/80 border-gray-700/50' 
          : 'bg-white/80 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src="/logo.png" 
                alt="AI News platform - Artificial intelligence news and technology updates" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <span className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>AI News</span>
            </div>
            <p className={`transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              &copy; 2025 AI News. Powered by artificial intelligence and built with love ❤️
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default NewsHomePage; 