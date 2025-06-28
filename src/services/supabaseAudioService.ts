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
 * Check if audio file exists in Supabase Storage
 */
export async function checkAudioExists(articleId: string): Promise<boolean> {
  try {
    const fileName = `${articleId}.mp3`;
    const filePath = `articles/${fileName}`;

    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list('articles', {
        search: fileName
      });

    if (error) {
      logger.error(`❌ Error checking audio existence for ${articleId}:`, error);
      return false;
    }

    return data?.some(file => file.name === fileName) || false;

  } catch (error) {
    logger.error(`❌ Exception checking audio existence for ${articleId}:`, error);
    return false;
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

/**
 * Delete audio file from Supabase Storage
 */
export async function deleteAudioFromSupabase(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fileName = `${articleId}.mp3`;
    const filePath = `articles/${fileName}`;

    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove([filePath]);

    if (error) {
      logger.error(`❌ Error deleting audio for ${articleId}:`, error);
      return { success: false, error: error.message };
    }

    logger.info(`✅ Successfully deleted audio for ${articleId}`);
    return { success: true };

  } catch (error) {
    logger.error(`❌ Exception deleting audio for ${articleId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Clean up old audio files from Supabase Storage
 */
export async function cleanupOldAudioFiles(daysOld: number = 7): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    logger.info(`🗑️ Cleaning up audio files older than ${daysOld} days`);

    // List all files in the articles folder
    const { data: files, error: listError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list('articles');

    if (listError) {
      logger.error('❌ Error listing audio files for cleanup:', listError);
      return { success: false, deletedCount: 0, error: listError.message };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Filter files older than cutoff date
    const oldFiles = files?.filter(file => {
      const fileDate = new Date(file.updated_at || file.created_at);
      return fileDate < cutoffDate;
    }) || [];

    if (oldFiles.length === 0) {
      logger.info('✅ No old audio files to clean up');
      return { success: true, deletedCount: 0 };
    }

    // Delete old files
    const filePaths = oldFiles.map(file => `articles/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      logger.error('❌ Error deleting old audio files:', deleteError);
      return { success: false, deletedCount: 0, error: deleteError.message };
    }

    logger.info(`✅ Cleaned up ${oldFiles.length} old audio files`);
    return { success: true, deletedCount: oldFiles.length };

  } catch (error) {
    logger.error('❌ Exception cleaning up old audio files:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get audio storage statistics
 */
export async function getSupabaseAudioStats(): Promise<{
  totalFiles: number;
  totalSizeKB: number;
  oldestFile: string | null;
  newestFile: string | null;
}> {
  try {
    const { data: files, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list('articles');

    if (error) {
      logger.error('❌ Error getting audio stats:', error);
      return { totalFiles: 0, totalSizeKB: 0, oldestFile: null, newestFile: null };
    }

    if (!files || files.length === 0) {
      return { totalFiles: 0, totalSizeKB: 0, oldestFile: null, newestFile: null };
    }

    let totalSize = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);
    let oldestFile = null;
    let newestFile = null;

    files.forEach(file => {
      totalSize += file.metadata?.size || 0;
      
      const fileDate = new Date(file.updated_at || file.created_at);
      
      if (fileDate < oldestDate) {
        oldestDate = fileDate;
        oldestFile = file.name;
      }
      
      if (fileDate > newestDate) {
        newestDate = fileDate;
        newestFile = file.name;
      }
    });

    return {
      totalFiles: files.length,
      totalSizeKB: Math.round(totalSize / 1024),
      oldestFile,
      newestFile
    };

  } catch (error) {
    logger.error('❌ Exception getting audio stats:', error);
    return { totalFiles: 0, totalSizeKB: 0, oldestFile: null, newestFile: null };
  }
} 