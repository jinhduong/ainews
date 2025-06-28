import express from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger';
import statsService from '../../services/statsService';
import { getStorageStats } from '../../services/newsStorage';
import { getAudioStats } from '../../services/audioService';

const router = express.Router();

/**
 * Main dashboard stats endpoint
 */
router.get('/stats', (req, res) => {
  try {
    statsService.recordApiRequest('stats');
    
    // Get current storage stats and update stats service
    const storageStats = getStorageStats();
    const audioStats = getAudioStats();
    
    // Update storage stats in stats service
    statsService.updateStorageStats(
      {
        totalArticles: storageStats.totalArticles,
        totalCategories: storageStats.categories.length,
        storageSize: `${storageStats.categories.reduce((sum, cat) => sum + parseFloat(cat.fileSize), 0).toFixed(2)} KB`
      },
      {
        totalFiles: audioStats.totalFiles,
        storageSize: `${audioStats.totalSizeKB} KB`
      }
    );
    
    const dashboardStats = statsService.getStats();
    res.json(dashboardStats);
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error retrieving dashboard stats' });
  }
});

/**
 * Dashboard HTML interface
 */
router.get('/', (req, res) => {
  try {
    const dashboardHtmlPath = path.join(__dirname, '../views/dashboard.html');
    const dashboardHtml = fs.readFileSync(dashboardHtmlPath, 'utf8');
    res.send(dashboardHtml);
  } catch (error) {
    logger.error('Error serving dashboard HTML:', error);
    res.status(500).send('Error loading dashboard');
  }
});

/**
 * Trigger news collection manually
 */
router.post('/trigger-collection', async (req, res) => {
  try {
    const result = await statsService.triggerNewsCollection();
    res.json(result);
  } catch (error) {
    logger.error('Error triggering news collection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to trigger news collection' 
    });
  }
});

export default router; 