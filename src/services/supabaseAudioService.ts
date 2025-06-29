import { supabase } from '../config/supabase';
import fs from 'fs';
import logger from '../utils/logger';

const AUDIO_BUCKET = 'audio';

/**
 * Upload audio file to Supabase Storage
 */
export async function uploadAudioToSupabase(
  articleId: string,
  audioBuffer: Buffer
): Promise<{ success: boolean; audioPath?: string; error?: string }> {
  try {
    const fileName = `${articleId}.mp3`;
    const filePath = `articles/${fileName}`;

    logger.info(`🎵 Uploading audio file for article ${articleId} to Supabase Storage`);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '86400', // Cache for 24 hours
        upsert: true // Overwrite if exists
      });

    if (error) {
      logger.error(`❌ Error uploading audio for ${articleId}:`, error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath);

    const audioPath = urlData.publicUrl;
    
    logger.info(`✅ Successfully uploaded audio for ${articleId}: ${audioPath}`);
    
    return { success: true, audioPath };

  } catch (error) {
    logger.error(`❌ Exception uploading audio for ${articleId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}



/**
 * Get public URL for audio file
 */
export function getSupabaseAudioUrl(articleId: string): string | null {
  try {
    const fileName = `${articleId}.mp3`;
    const filePath = `articles/${fileName}`;

    const { data } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (error) {
    logger.error(`❌ Exception getting audio URL for ${articleId}:`, error);
    return null;
  }
}



 