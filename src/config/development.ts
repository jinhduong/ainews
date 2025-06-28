import logger from '../utils/logger';

export interface DevConfig {
  mode: 'local' | 'supabase';
  useLocalFiles: boolean;
  useSupabase: boolean;
}

// Check environment variables to determine mode
const isDevelopment = process.env.NODE_ENV === 'development';
const forceLocal = process.env.USE_LOCAL_DB === 'true';
const hasSupabaseCredentials = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

export function getDevConfig(): DevConfig {
  if (forceLocal || (!hasSupabaseCredentials && isDevelopment)) {
    logger.info('🏠 Development Mode: Using LOCAL files (no Supabase calls)');
    return {
      mode: 'local',
      useLocalFiles: true,
      useSupabase: false
    };
  }

  logger.info('☁️ Production Mode: Using SUPABASE');
  return {
    mode: 'supabase',
    useLocalFiles: false,
    useSupabase: true
  };
}

export const devConfig = getDevConfig();

// Helper functions for easy checking
export const isLocalMode = () => devConfig.mode === 'local';
export const isSupabaseMode = () => devConfig.mode === 'supabase';

// Development utilities
export function switchToLocalMode(): void {
  process.env.USE_LOCAL_DB = 'true';
  logger.info('🔄 Switched to LOCAL development mode');
  logger.info('💡 Restart server to apply changes');
}

export function getConfigSummary(): string {
  const config = getDevConfig();
  return `
🔧 Development Configuration:
   Mode: ${config.mode.toUpperCase()}
   Local Files: ${config.useLocalFiles ? '✅' : '❌'}
   Supabase: ${config.useSupabase ? '✅' : '❌'}
   Environment: ${process.env.NODE_ENV || 'production'}
   
💡 To use local mode: export USE_LOCAL_DB=true
💡 To use Supabase: unset USE_LOCAL_DB (or set to false)
  `;
} 