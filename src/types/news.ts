export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  audioPath?: string;
  slug?: string;
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