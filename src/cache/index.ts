// Cache Services
export { requestCache, default as RequestCacheService } from './services/requestCacheService';

// Cache Middleware
export { 
  createRequestCacheMiddleware, 
  newsApiCacheMiddleware, 
  generalApiCacheMiddleware 
} from './middleware/requestCacheMiddleware';

// Cache Routes
export { default as cacheRoutes } from './routes/cacheRoutes'; 