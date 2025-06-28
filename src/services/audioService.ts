import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import logger from "../utils/logger";
import statsService from "./statsService";
// Add imports for Supabase functionality
import { getDevConfig } from "../config/development";
import { uploadAudioToSupabase } from "./supabaseAudioService";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in the environment variables.");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Directory to store audio files
const AUDIO_DIR = path.join(process.cwd(), "data", "audio");

/**
 * Ensures audio directory exists
 */
function ensureAudioDirectoryExists(): void {
  try {
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
      logger.info("📁 Created audio directory");
    }
  } catch (error) {
    logger.error("❌ Error creating audio directory:", error);
  }
}

/**
 * Generates a unique filename for audio based on article ID
 */
function getAudioFilePath(articleId: string): string {
  return path.join(AUDIO_DIR, `${articleId}.mp3`);
}

/**
 * Generates audio on-demand for an article when user requests it
 */
export async function generateAudioOnDemand(
  article: { id: string; title: string; summary: string },
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"
): Promise<string | null> {
  try {
    ensureAudioDirectoryExists();

    const audioFilePath = getAudioFilePath(article.id);
    const config = getDevConfig();

    // Check if audio file already exists locally
    if (fs.existsSync(audioFilePath)) {
      logger.info(
        `🎵 Audio file already exists locally for article ${article.id}`
      );

      // In Supabase mode, prefer Supabase URL if available
      if (config.mode === "supabase" && config.useSupabase) {
        try {
          const { getSupabaseAudioUrl } = await import(
            "./supabaseAudioService"
          );
          const supabaseUrl = getSupabaseAudioUrl(article.id);
          if (supabaseUrl) {
            logger.info(
              `🎵 Using existing Supabase audio URL for article ${article.id}`
            );
            return supabaseUrl;
          }
        } catch (error) {
          logger.warn(
            `⚠️ Could not check Supabase audio URL for ${article.id}, using local file`
          );
        }
      }

      return audioFilePath;
    }

    logger.info(`🎤 Generating audio on-demand for article: ${article.title.substring(0, 50)}...`);

    // Prepare content for speech (combine title and summary)
    const fullContent = `${article.title}. ${article.summary}`;
    const speechText = prepareSpeechText(fullContent);

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Use tts-1 for faster generation
      voice: voice,
      input: speechText,
      response_format: "mp3",
      speed: 1.0,
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Always save locally first (backup)
    fs.writeFileSync(audioFilePath, buffer);

    let finalAudioPath = audioFilePath;

    // Also upload to Supabase if in Supabase mode
    if (config.mode === "supabase" && config.useSupabase) {
      try {
        logger.info(
          `☁️ Uploading generated audio for article ${article.id} to Supabase Storage...`
        );
        const supabaseResult = await uploadAudioToSupabase(article.id, buffer);

        if (supabaseResult.success && supabaseResult.audioPath) {
          logger.info(
            `✅ Successfully uploaded audio to Supabase: ${supabaseResult.audioPath}`
          );
          finalAudioPath = supabaseResult.audioPath;

          // Update the article in Supabase with the audio path
          try {
            const { updateArticleAudioPath } = await import("./supabaseArticleService");
            const updateResult = await updateArticleAudioPath(article.id, supabaseResult.audioPath);
            
            if (updateResult.success) {
              logger.info(`✅ Updated article ${article.id} with audio path in database`);
            } else {
              logger.warn(`⚠️ Failed to update article ${article.id} audio path: ${updateResult.error}`);
            }
          } catch (updateError) {
            logger.error(`❌ Error updating article audio path:`, updateError);
          }
        } else {
          logger.error(
            `❌ Failed to upload audio to Supabase: ${supabaseResult.error}`
          );
          // Fall back to local path
        }
      } catch (error) {
        logger.error(
          `❌ Exception uploading audio to Supabase for ${article.id}:`,
          error
        );
        // Fall back to local path
      }
    } else {
      // Local mode: Update local storage with audio path
      try {
        const { updateArticleAudioPathLocal } = await import("./newsStorage");
        const updateResult = updateArticleAudioPathLocal(article.id, audioFilePath);
        
        if (updateResult) {
          logger.info(`✅ Updated local article ${article.id} with audio path`);
        } else {
          logger.warn(`⚠️ Could not update local article ${article.id} with audio path`);
        }
      } catch (updateError) {
        logger.error(`❌ Error updating local article audio path:`, updateError);
      }
    }

    const fileSizeKB = (buffer.length / 1024).toFixed(2);
    logger.info(
      `✅ Generated audio on-demand for article ${article.id} (${fileSizeKB} KB)`
    );

    // Track OpenAI usage
    const estimatedDurationMinutes = speechText.length / 5 / 150;
    statsService.recordOpenAiAudioCall(true, estimatedDurationMinutes);

    return finalAudioPath;

  } catch (error) {
    logger.error(`❌ Error generating audio on-demand for article ${article.id}:`, error);
    statsService.recordOpenAiAudioCall(false, 0);
    return null;
  }
}

/**
 * Generates speech audio from text using OpenAI TTS API
 */
export async function generateSpeechFromText(
  text: string,
  articleId: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"
): Promise<string | null> {
  try {
    ensureAudioDirectoryExists();

    const audioFilePath = getAudioFilePath(articleId);
    const config = getDevConfig();

    // Check if audio file already exists
    if (fs.existsSync(audioFilePath)) {
      logger.info(
        `🎵 Audio file already exists locally for article ${articleId}`
      );

      // In Supabase mode, prefer Supabase URL if available
      if (config.mode === "supabase" && config.useSupabase) {
        try {
          const { getSupabaseAudioUrl } = await import(
            "./supabaseAudioService"
          );
          const supabaseUrl = getSupabaseAudioUrl(articleId);
          if (supabaseUrl) {
            logger.info(
              `🎵 Using existing Supabase audio URL for article ${articleId}`
            );
            return supabaseUrl;
          }
        } catch (error) {
          logger.warn(
            `⚠️ Could not check Supabase audio URL for ${articleId}, using local file`
          );
        }
      }

      return audioFilePath;
    }

    logger.info(`🎤 Generating speech for article ${articleId}...`);

    // Prepare text for speech (clean up and add pauses)
    const speechText = prepareSpeechText(text);

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Use tts-1 for faster generation, tts-1-hd for higher quality
      voice: voice,
      input: speechText,
      response_format: "mp3",
      speed: 1.0, // Normal speed
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Also upload to Supabase if in Supabase mode
    if (config.mode === "supabase" && config.useSupabase) {
      try {
        logger.info(
          `☁️ Uploading audio for article ${articleId} to Supabase Storage...`
        );
        const supabaseResult = await uploadAudioToSupabase(articleId, buffer);

        if (supabaseResult.success && supabaseResult.audioPath) {
          logger.info(
            `✅ Successfully uploaded audio to Supabase: ${supabaseResult.audioPath}`
          );

          // Estimate audio duration (rough estimate: 150 words per minute, ~5 chars per word)
          const estimatedDurationMinutes = speechText.length / 5 / 150;
          statsService.recordOpenAiAudioCall(true, estimatedDurationMinutes);

          // Return Supabase URL instead of local path
          return supabaseResult.audioPath;
        } else {
          logger.error(
            `❌ Failed to upload audio to Supabase: ${supabaseResult.error}`
          );
          // Fall back to local path
        }
      } catch (error) {
        logger.error(
          `❌ Exception uploading audio to Supabase for ${articleId}:`,
          error
        );
        // Fall back to local path
      }
    } else {
      // Save the audio file locally (always keep local copy)
      fs.writeFileSync(audioFilePath, buffer);

      const fileSizeKB = (buffer.length / 1024).toFixed(2);
      logger.info(
        `✅ Generated speech for article ${articleId} (${fileSizeKB} KB)`
      );
    }

    // Estimate audio duration (rough estimate: 150 words per minute, ~5 chars per word)
    const estimatedDurationMinutes = speechText.length / 5 / 150;
    statsService.recordOpenAiAudioCall(true, estimatedDurationMinutes);

    return `${articleId}.mp3`
  } catch (error) {
    logger.error(`❌ Error generating speech for article ${articleId}:`, error);
    statsService.recordOpenAiAudioCall(false, 0);
    return null;
  }
}

/**
 * Prepares text for better speech synthesis
 */
function prepareSpeechText(text: string): string {
  // Clean up the text and add natural pauses
  let speechText = text
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    .trim()
    // Add pauses after sentences
    .replace(/\. /g, ". ... ")
    // Add longer pause after question marks and exclamations
    .replace(/[?!] /g, "$& ... ")
    // Handle abbreviations to prevent awkward pronunciation
    .replace(/\bAI\b/g, "Artificial Intelligence")
    .replace(/\bAPI\b/g, "A-P-I")
    .replace(/\bURL\b/g, "U-R-L")
    .replace(/\bCEO\b/g, "C-E-O")
    .replace(/\bIPO\b/g, "I-P-O");

  // Add introduction for better context
  const intro = "Here's your AI-generated news summary: ";

  return intro + speechText;
}

/**
 * Generates speech for multiple articles in batch
 */
export async function generateBatchSpeech(
  articles: Array<{ id: string; title: string; summary: string }>,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"
): Promise<Map<string, string>> {
  logger.info(
    `🎤 Starting batch speech generation for ${articles.length} articles...`
  );

  const audioFiles = new Map<string, string>();
  const maxConcurrent = 3; // Limit concurrent TTS requests

  // Process articles in batches to avoid overwhelming the API
  for (let i = 0; i < articles.length; i += maxConcurrent) {
    const batch = articles.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (article) => {
      const combinedText = `${article.title}. ${article.summary}`;
      const audioPath = await generateSpeechFromText(
        combinedText,
        article.id,
        voice
      );

      if (audioPath) {
        audioFiles.set(article.id, audioPath);
      }

      return { articleId: article.id, success: !!audioPath };
    });

    const batchResults = await Promise.all(batchPromises);
    const successCount = batchResults.filter((r) => r.success).length;

    logger.info(
      `✅ Batch ${
        Math.floor(i / maxConcurrent) + 1
      }: Generated ${successCount}/${batch.length} audio files`
    );

    // Small delay between batches to be respectful to the API
    if (i + maxConcurrent < articles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  logger.info(
    `🎵 Completed batch speech generation: ${audioFiles.size}/${articles.length} successful`
  );
  return audioFiles;
}

/**
 * Gets audio file path for an article if it exists
 */
export function getAudioPath(articleId: string): string | null {
  const audioFilePath = getAudioFilePath(articleId);
  return fs.existsSync(audioFilePath) ? audioFilePath : null;
}

/**
 * Cleans up old audio files (older than 7 days)
 */
export function cleanupOldAudioFiles(): void {
  try {
    if (!fs.existsSync(AUDIO_DIR)) {
      return;
    }

    const files = fs.readdirSync(AUDIO_DIR);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    files.forEach((file) => {
      if (file.endsWith(".mp3")) {
        const filePath = path.join(AUDIO_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          cleanedCount++;
          logger.info(`🗑️  Cleaned up old audio file: ${file}`);
        }
      }
    });

    if (cleanedCount > 0) {
      logger.info(`✅ Cleaned up ${cleanedCount} old audio files`);
    }
  } catch (error) {
    logger.error("❌ Error during audio cleanup:", error);
  }
}

/**
 * Gets audio storage statistics
 */
export function getAudioStats(): {
  totalFiles: number;
  totalSizeKB: number;
  oldestFile: string | null;
  newestFile: string | null;
} {
  try {
    if (!fs.existsSync(AUDIO_DIR)) {
      return {
        totalFiles: 0,
        totalSizeKB: 0,
        oldestFile: null,
        newestFile: null,
      };
    }

    const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".mp3"));
    let totalSize = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);
    let oldestFile = null;
    let newestFile = null;

    files.forEach((file) => {
      const filePath = path.join(AUDIO_DIR, file);
      const stats = fs.statSync(filePath);

      totalSize += stats.size;

      if (stats.mtime < oldestDate) {
        oldestDate = stats.mtime;
        oldestFile = file;
      }

      if (stats.mtime > newestDate) {
        newestDate = stats.mtime;
        newestFile = file;
      }
    });

    return {
      totalFiles: files.length,
      totalSizeKB: Math.round(totalSize / 1024),
      oldestFile,
      newestFile,
    };
  } catch (error) {
    logger.error("❌ Error getting audio stats:", error);
    return {
      totalFiles: 0,
      totalSizeKB: 0,
      oldestFile: null,
      newestFile: null,
    };
  }
}
