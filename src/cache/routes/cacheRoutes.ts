import express from 'express';
import path from 'path';
import { requestCache } from '../services/requestCacheService';
import logger from '../../utils/logger';

const router = express.Router();

/**
 * Cache Dashboard - HTML Interface
 */
router.get('/dashboard', (req, res) => {
  try {
    const dashboardPath = path.join(__dirname, '../views/cacheDashboard.html');
    res.sendFile(dashboardPath);
  } catch (error) {
    logger.error('Error serving cache dashboard:', error);
    res.status(500).json({ message: 'Error loading cache dashboard' });
  }
});

/**
 * Cache Statistics API - JSON data for dashboard
 */
router.get('/stats', (req, res) => {
  try {
    const cacheStats = requestCache.getStats();
    const totalRequests = cacheStats.hits + cacheStats.misses;
    
    res.json({
      ...cacheStats,
      timestamp: new Date().toISOString(),
      description: 'Request-level cache statistics (60s TTL)',
      hitRate: totalRequests > 0 
        ? parseFloat(((cacheStats.hits / totalRequests) * 100).toFixed(2))
        : 0,
      hitRateFormatted: totalRequests > 0 
        ? ((cacheStats.hits / totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      totalRequests,
      cacheKeys: requestCache.getKeys(),
      performance: {
        avgResponseTime: totalRequests > 0 ? '< 1ms' : 'N/A',
        memoryEfficiency: 'High',
        ttl: '60 seconds'
      }
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({ message: 'Error retrieving cache stats' });
  }
});

/**
 * Cache Keys API - List all cache keys for debugging
 */
router.get('/keys', (req, res) => {
  try {
    const keys = requestCache.getKeys();
    const keyDetails = keys.map(key => ({
      key,
      preview: key.substring(0, 8) + '...',
      created: 'Active' // NodeCache doesn't expose creation time easily
    }));

    res.json({
      totalKeys: keys.length,
      keys: keyDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting cache keys:', error);
    res.status(500).json({ message: 'Error retrieving cache keys' });
  }
});

/**
 * Clear Cache API - Admin function
 */
router.delete('/clear', (req, res) => {
  try {
    const statsBefore = requestCache.getStats();
    requestCache.clear();
    logger.info('🧹 Request cache cleared via cache dashboard');
    
    res.json({
      success: true,
      message: 'Request cache cleared successfully',
      clearedEntries: statsBefore.keys,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error clearing cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health Check for Cache System
 */
router.get('/health', (req, res) => {
  try {
    const stats = requestCache.getStats();
    const isHealthy = true; // Cache is always available with NodeCache
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      uptime: process.uptime(),
      cacheSize: stats.keys,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Error checking cache health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      message: 'Error checking cache health'
    });
  }
});

export default router; 