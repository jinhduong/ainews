import NodeCache from 'node-cache';
import crypto from 'crypto';
import logger from '../../utils/logger';

/**
 * Request-level cache for preventing duplicate API calls
 * Short TTL (60 seconds) to handle rapid page reloads without stale data
 */
class RequestCacheService {
  private cache: NodeCache;
  private readonly defaultTTL: number;

  constructor(ttlSeconds: number = 60) {
    this.defaultTTL = ttlSeconds;
    this.cache = new NodeCache({ 
      stdTTL: ttlSeconds,
      checkperiod: 10, // Check for expired keys every 10 seconds
      useClones: false // Better performance for read-only data
    });

    logger.info(`🔄 Request cache initialized with ${ttlSeconds}s TTL`);
  }

  /**
   * Generate a cache key from request parameters
   */
  private generateCacheKey(endpoint: string, params: Record<string, any>, userContext?: string): string {
    const keyData = {
      endpoint,
      params: this.normalizeParams(params),
      user: userContext || 'anonymous'
    };
    
    const keyString = JSON.stringify(keyData);
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Normalize parameters for consistent cache keys
   */
  private normalizeParams(params: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    Object.keys(params).sort().forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        // Normalize strings to lowercase and trim
        if (typeof params[key] === 'string') {
          normalized[key] = params[key].toLowerCase().trim();
        } else {
          normalized[key] = params[key];
        }
      }
    });
    
    return normalized;
  }

  /**
   * Get cached response if available
   */
  async get<T>(endpoint: string, params: Record<string, any>, userContext?: string): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(endpoint, params, userContext);
      const cached = this.cache.get<T>(cacheKey);
      
      if (cached) {
        logger.info(`⚡ Cache HIT for ${endpoint} - ${cacheKey.substring(0, 8)}...`);
        return cached;
      }
      
      logger.debug(`💨 Cache MISS for ${endpoint} - ${cacheKey.substring(0, 8)}...`);
      return null;
    } catch (error) {
      logger.error('Error reading from request cache:', error);
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set<T>(
    endpoint: string, 
    params: Record<string, any>, 
    data: T, 
    customTTL?: number,
    userContext?: string
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(endpoint, params, userContext);
      const ttl = customTTL || this.defaultTTL;
      
      this.cache.set(cacheKey, data, ttl);
      logger.debug(`💾 Cached response for ${endpoint} - ${cacheKey.substring(0, 8)}... (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error('Error storing in request cache:', error);
    }
  }

  /**
   * Check if a response is cached
   */
  has(endpoint: string, params: Record<string, any>, userContext?: string): boolean {
    try {
      const cacheKey = this.generateCacheKey(endpoint, params, userContext);
      return this.cache.has(cacheKey);
    } catch (error) {
      logger.error('Error checking request cache:', error);
      return false;
    }
  }

  /**
   * Clear specific cache entry
   */
  delete(endpoint: string, params: Record<string, any>, userContext?: string): void {
    try {
      const cacheKey = this.generateCacheKey(endpoint, params, userContext);
      this.cache.del(cacheKey);
      logger.debug(`🗑️ Cleared cache for ${endpoint} - ${cacheKey.substring(0, 8)}...`);
    } catch (error) {
      logger.error('Error deleting from request cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      this.cache.flushAll();
      logger.info('🧹 Request cache cleared completely');
    } catch (error) {
      logger.error('Error clearing request cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
  } {
    return this.cache.getStats();
  }

  /**
   * List all cache keys (for debugging)
   */
  getKeys(): string[] {
    return this.cache.keys();
  }
}

// Create singleton instance
export const requestCache = new RequestCacheService(60); // 60 second TTL

export default RequestCacheService; 