import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NewsHomePage from './components/NewsHomePage';
import NewsDetail from './components/NewsDetail';

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default options for all queries
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: 2, // Retry failed requests twice
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<NewsHomePage />} />
          <Route path="/article/:id" element={<NewsDetail />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App; 