import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNews } from '../services/newsApi';
import NewsCard from './NewsCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Pagination from './Pagination';

interface NewsGridProps {
  category: string;
  page: number;
  onPageChange: (page: number) => void;
}

const NewsGrid: React.FC<NewsGridProps> = ({ category, page, onPageChange }) => {
  // Use TanStack Query for efficient data fetching with caching
  const {
    data: newsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['news', category, page], // Query key includes category and page for proper caching
    queryFn: () => fetchNews({ category, page, pageSize: 6 }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (matches backend cache)
    gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
    retry: 2, // Retry failed requests twice
  });

  // Handle loading state
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading latest news..." />;
  }

  // Handle error state with retry functionality
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return (
      <ErrorMessage 
        message={errorMessage} 
        onRetry={() => refetch()} 
        retryLabel="Retry"
      />
    );
  }

  // Handle empty results
  if (!newsData || newsData.articles.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles found</h3>
        <p className="text-gray-500">
          No {category} news articles are available at the moment. Please try again later.
        </p>
      </div>
    );
  }

  const { articles, pagination } = newsData;

  return (
    <div className="w-full">
      {/* Articles grid with responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {articles.map((article) => (
          <NewsCard 
            key={article.id} 
            article={article} 
            currentPage={page}
            category={category}
          />
        ))}
      </div>

      {/* Pagination component */}
      <Pagination 
        pagination={pagination} 
        onPageChange={onPageChange} 
      />
    </div>
  );
};

export default NewsGrid; 