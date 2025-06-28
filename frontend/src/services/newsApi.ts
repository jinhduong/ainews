import axios from 'axios';
import { NewsResponse, NewsRequestParams } from '../types/news';

// API configuration - environment-based URL selection
const getApiBaseUrl = () => {
  // Check if we're in development mode (localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api/v1';
  }
  // Production environment (Vercel deployment)
  return 'https://ainews-one.vercel.app/api/v1';
};

const API_BASE_URL = getApiBaseUrl();
const API_KEY = '123';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Service function to fetch news from the backend
export const fetchNews = async (params: NewsRequestParams): Promise<NewsResponse> => {
  try {
    // Use POST request as required by the backend API
    const response = await apiClient.post<NewsResponse>('/news', {
      category: params.category,
      page: params.page || 1,
      pageSize: params.pageSize || 6, // Default to 6 articles per page for good grid layout
    });

    return response.data;
  } catch (error) {
    // Enhanced error handling with specific error messages
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please check your API key');
      }
      if (error.response?.status === 400) {
        throw new Error('Bad Request: ' + (error.response.data?.message || 'Invalid request'));
      }
      if (error.response?.status && error.response?.status >= 500) {
        throw new Error('Server Error: Please try again later');
      }
    }
    
    // Fallback error message for unknown errors
    throw new Error('Failed to fetch news. Please check your connection and try again.');
  }
}; 