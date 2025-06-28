import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types for TypeScript
export interface DatabaseArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  published_at: string;
  image_url?: string;
  audio_path?: string;
  category: string;
  collected_at: string;
  created_at?: string;
}

export interface DatabaseStats {
  id: string;
  stats_data: any; // JSON object
  last_updated: string;
  created_at?: string;
}

// Table names
export const TABLES = {
  ARTICLES: 'articles',
  STATS: 'stats'
} as const; 