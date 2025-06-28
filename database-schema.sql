-- AI News Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    published_at DATE NOT NULL,
    image_url TEXT,
    audio_path TEXT,
    category TEXT NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_collected_at ON articles(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- Create stats table for analytics
CREATE TABLE IF NOT EXISTS stats (
    id TEXT PRIMARY KEY DEFAULT 'main_stats',
    stats_data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for audio bucket
CREATE POLICY "Audio files are publicly readable" ON storage.objects
    FOR SELECT USING (bucket_id = 'audio');

CREATE POLICY "Audio files are insertable" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'audio');

CREATE POLICY "Audio files are updatable" ON storage.objects
    FOR UPDATE USING (bucket_id = 'audio');

CREATE POLICY "Audio files are deletable" ON storage.objects
    FOR DELETE USING (bucket_id = 'audio');

-- Create a function to clean up old articles (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_articles()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM articles 
    WHERE collected_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create a function to get articles with pagination
CREATE OR REPLACE FUNCTION get_articles_paginated(
    p_category TEXT,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 6
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    summary TEXT,
    url TEXT,
    published_at DATE,
    image_url TEXT,
    audio_path TEXT,
    category TEXT,
    collected_at TIMESTAMPTZ,
    total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_page_size;
    
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.summary,
        a.url,
        a.published_at,
        a.image_url,
        a.audio_path,
        a.category,
        a.collected_at,
        COUNT(*) OVER() as total_count
    FROM articles a
    WHERE a.category = p_category
    ORDER BY a.collected_at DESC
    LIMIT p_page_size OFFSET v_offset;
END;
$$; 