import fs from 'fs';
import path from 'path';
import { loadArticlesFromFile } from './newsStorage';
import { saveArticlesToSupabase } from './supabaseArticleService';
import { uploadAudioToSupabase } from './supabaseAudioService';
import logger from '../utils/logger';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');

/**
 * Migrate articles from JSON files to Supabase
 */
export async function migrateArticlesToSupabase(): Promise<{ success: boolean; totalMigrated: number; errors: string[] }> {
  try {
    logger.info('🚀 Starting migration of articles from files to Supabase');

    if (!fs.existsSync(ARTICLES_DIR)) {
      logger.warn('📂 No articles directory found - nothing to migrate');
      return { success: true, totalMigrated: 0, errors: [] };
    }

    const errors: string[] = [];
    let totalMigrated = 0;

    // Get all JSON files in articles directory
    const files = fs.readdirSync(ARTICLES_DIR).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      logger.warn('📂 No article files found - nothing to migrate');
      return { success: true, totalMigrated: 0, errors: [] };
    }

    logger.info(`📄 Found ${files.length} article files to migrate`);

    // Process each category file
    for (const file of files) {
      try {
        const category = file.replace('.json', '').replace('_', ' ');
        logger.info(`📝 Migrating articles for category: ${category}`);

        // Load articles from file
        const articles = loadArticlesFromFile(category);
        
        if (articles.length === 0) {
          logger.info(`⏭️  No articles found in ${file}, skipping`);
          continue;
        }

        // Save to Supabase
        const result = await saveArticlesToSupabase(category, articles);
        
        if (result.success) {
          totalMigrated += result.newCount;
          logger.info(`✅ Migrated ${result.newCount} articles for ${category} (${result.duplicateCount} duplicates)`);
        } else {
          const error = `Failed to migrate ${category}: ${result.error}`;
          errors.push(error);
          logger.error(`❌ ${error}`);
        }

      } catch (error) {
        const errorMsg = `Error processing file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error(`❌ ${errorMsg}`);
      }
    }

    const success = errors.length === 0;
    logger.info(`🎉 Migration completed! Total migrated: ${totalMigrated}, Errors: ${errors.length}`);

    return { success, totalMigrated, errors };

  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(`❌ ${errorMsg}`);
    return { success: false, totalMigrated: 0, errors: [errorMsg] };
  }
}

/**
 * Migrate audio files from local storage to Supabase Storage
 */
export async function migrateAudioToSupabase(): Promise<{ success: boolean; totalMigrated: number; errors: string[] }> {
  try {
    logger.info('🎵 Starting migration of audio files to Supabase Storage');

    if (!fs.existsSync(AUDIO_DIR)) {
      logger.warn('📂 No audio directory found - nothing to migrate');
      return { success: true, totalMigrated: 0, errors: [] };
    }

    const errors: string[] = [];
    let totalMigrated = 0;

    // Get all MP3 files
    const files = fs.readdirSync(AUDIO_DIR).filter(file => file.endsWith('.mp3'));
    
    if (files.length === 0) {
      logger.warn('🎵 No audio files found - nothing to migrate');
      return { success: true, totalMigrated: 0, errors: [] };
    }

    logger.info(`🎵 Found ${files.length} audio files to migrate`);

    // Process each audio file
    for (const file of files) {
      try {
        const filePath = path.join(AUDIO_DIR, file);
        const articleId = file.replace('.mp3', '');

        logger.info(`🎵 Migrating audio file: ${file}`);

        // Read file as buffer
        const audioBuffer = fs.readFileSync(filePath);

        // Upload to Supabase
        const result = await uploadAudioToSupabase(articleId, audioBuffer);
        
        if (result.success) {
          totalMigrated++;
          logger.info(`✅ Migrated audio file: ${file} -> ${result.audioPath}`);
        } else {
          const error = `Failed to migrate ${file}: ${result.error}`;
          errors.push(error);
          logger.error(`❌ ${error}`);
        }

      } catch (error) {
        const errorMsg = `Error processing audio file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error(`❌ ${errorMsg}`);
      }
    }

    const success = errors.length === 0;
    logger.info(`🎉 Audio migration completed! Total migrated: ${totalMigrated}, Errors: ${errors.length}`);

    return { success, totalMigrated, errors };

  } catch (error) {
    const errorMsg = `Audio migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(`❌ ${errorMsg}`);
    return { success: false, totalMigrated: 0, errors: [errorMsg] };
  }
}

/**
 * Complete migration from file storage to Supabase
 */
export async function migrateAllToSupabase(): Promise<{
  success: boolean;
  articles: { totalMigrated: number; errors: string[] };
  audio: { totalMigrated: number; errors: string[] };
}> {
  try {
    logger.info('🚀 Starting complete migration to Supabase');

    // Migrate articles first
    const articlesResult = await migrateArticlesToSupabase();
    
    // Then migrate audio files
    const audioResult = await migrateAudioToSupabase();

    const success = articlesResult.success && audioResult.success;
    
    logger.info(`🎉 Complete migration finished!`);
    logger.info(`📄 Articles: ${articlesResult.totalMigrated} migrated, ${articlesResult.errors.length} errors`);
    logger.info(`🎵 Audio: ${audioResult.totalMigrated} migrated, ${audioResult.errors.length} errors`);

    return {
      success,
      articles: {
        totalMigrated: articlesResult.totalMigrated,
        errors: articlesResult.errors
      },
      audio: {
        totalMigrated: audioResult.totalMigrated,
        errors: audioResult.errors
      }
    };

  } catch (error) {
    const errorMsg = `Complete migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(`❌ ${errorMsg}`);
    return {
      success: false,
      articles: { totalMigrated: 0, errors: [errorMsg] },
      audio: { totalMigrated: 0, errors: [errorMsg] }
    };
  }
}

/**
 * Backup current file data before migration
 */
export async function backupFileData(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), `backup-${timestamp}`);

    logger.info(`💾 Creating backup at: ${backupDir}`);

    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });

    // Copy data directory
    if (fs.existsSync(DATA_DIR)) {
      const copyDir = (src: string, dest: string) => {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        fs.mkdirSync(dest, { recursive: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      copyDir(DATA_DIR, path.join(backupDir, 'data'));
      logger.info(`✅ Backup created successfully at: ${backupDir}`);
      
      return { success: true, backupPath: backupDir };
    } else {
      logger.warn('📂 No data directory found to backup');
      return { success: true, backupPath: backupDir };
    }

  } catch (error) {
    const errorMsg = `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
} 