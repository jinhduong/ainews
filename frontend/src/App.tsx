import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { AudioProvider } from './contexts/AudioContext';
import FloatingAudioPlayer from './components/FloatingAudioPlayer';
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
    <HelmetProvider>
      <ThemeProvider>
        <AudioProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
                          <Routes>
              <Route path="/" element={<NewsHomePage />} />
              <Route path="/article/:id" element={<NewsDetail />} />
              <Route path="/news/:slug" element={<NewsDetail />} />
            </Routes>
              <Analytics />
              <FloatingAudioPlayer />
            </Router>
          </QueryClientProvider>
        </AudioProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App; 