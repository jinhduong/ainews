import express from 'express';
import { requestCache } from '../services/requestCacheService';
import logger from '../../utils/logger';

/**
 * Middleware options for request caching
 */
interface CacheMiddlewareOptions {
  ttl?: number; // Cache TTL in seconds
  keyGenerator?: (req: express.Request) => Record<string, any>; // Custom key generator
  shouldCache?: (req: express.Request, res: express.Response) => boolean; // Determine if response should be cached
  getUserContext?: (req: express.Request) => string; // Extract user context for cache isolation
}

/**
 * Default key generator extracts common request parameters
 */
const defaultKeyGenerator = (req: express.Request): Record<string, any> => {
  return {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body
  };
};

/**
 * Default cache condition - cache successful responses only
 */
const defaultShouldCache = (req: express.Request, res: express.Response): boolean => {
  return res.statusCode >= 200 && res.statusCode < 300;
};

/**
 * Default user context extractor - uses IP as fallback
 */
const defaultGetUserContext = (req: express.Request): string => {
  return req.ip || 'anonymous';
};

/**
 * Request caching middleware factory
 */
export function createRequestCacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl,
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache,
    getUserContext = defaultGetUserContext
  } = options;

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const endpoint = req.path;
      const params = keyGenerator(req);
      const userContext = getUserContext(req);

      // Try to get cached response
      const cachedResponse = await requestCache.get(endpoint, params, userContext);
      
      if (cachedResponse) {
        // Serve from cache
        logger.info(`⚡ Serving cached response for ${req.method} ${endpoint}`);
        res.json(cachedResponse);
        return;
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override res.json to intercept response
      res.json = function(body: any) {
        // Cache the response if conditions are met
        if (shouldCache(req, res)) {
          const customTTL = ttl;
          requestCache.set(endpoint, params, body, customTTL, userContext)
            .catch(error => {
              logger.error('Failed to cache response:', error);
            });
        }

        // Call original json method
        return originalJson(body);
      };

      // Continue to next middleware
      next();

    } catch (error) {
      logger.error('Error in request cache middleware:', error);
      // Continue even if caching fails
      next();
    }
  };
}

/**
 * Pre-configured middleware for news API endpoints
 */
export const newsApiCacheMiddleware = createRequestCacheMiddleware({
  ttl: 60, // 1 minute cache
  keyGenerator: (req) => ({
    method: req.method,
    path: req.path,
    category: req.body?.category,
    page: req.body?.page || 1,
    pageSize: req.body?.pageSize || 6
  }),
  shouldCache: (req, res) => {
    // Only cache successful responses
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return false;
    }
    
    // Only cache GET and POST requests for news
    if (!['GET', 'POST'].includes(req.method)) {
      return false;
    }

    return true;
  },
  getUserContext: (req) => {
    // Use IP for user context, but could be enhanced with user auth later
    return req.ip || 'anonymous';
  }
});

/**
 * Cache middleware for other API endpoints with shorter TTL
 */
export const generalApiCacheMiddleware = createRequestCacheMiddleware({
  ttl: 30, // 30 second cache
  keyGenerator: defaultKeyGenerator,
  shouldCache: defaultShouldCache,
  getUserContext: defaultGetUserContext
}); 