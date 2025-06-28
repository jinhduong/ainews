// TypeScript interfaces matching the backend API structure
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  audioPath?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NewsResponse {
  articles: NewsItem[];
  pagination: PaginationInfo;
}

// Request parameters for the API call
export interface NewsRequestParams {
  category: string;
  page?: number;
  pageSize?: number;
} 