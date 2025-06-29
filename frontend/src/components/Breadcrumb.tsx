import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { NewsItem } from '../types/news';

interface BreadcrumbProps {
  article?: NewsItem;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ article }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  const breadcrumbs = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      current: false
    },
    {
      name: 'AI News',
      href: '/#ai-news',
      current: !article
    }
  ];

  // Add article breadcrumb if on article page
  if (article) {
    breadcrumbs.push({
      name: article.title.length > 50 ? article.title.substring(0, 50) + '...' : article.title,
      href: location.pathname,
      current: true
    });
  }

  return (
    <nav 
      className="flex mb-6" 
      aria-label="Breadcrumb"
      role="navigation"
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.name} className="flex items-center">
            {index > 0 && (
              <ChevronRight 
                className={`w-4 h-4 mx-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} 
                aria-hidden="true" 
              />
            )}
            
            {breadcrumb.current ? (
              <span 
                className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                aria-current="page"
              >
                {breadcrumb.icon && index === 0 && (
                  <breadcrumb.icon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                )}
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                to={breadcrumb.href}
                className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
                aria-label={`Navigate to ${breadcrumb.name}`}
              >
                {breadcrumb.icon && index === 0 && (
                  <breadcrumb.icon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                )}
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* Structured Data for Breadcrumbs */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((breadcrumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: breadcrumb.name,
            item: breadcrumb.href.startsWith('http') 
              ? breadcrumb.href 
              : `${window.location.origin}${breadcrumb.href}`
          }))
        })}
      </script>
    </nav>
  );
};

export default Breadcrumb; 