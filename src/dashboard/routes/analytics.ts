import express from 'express';
import logger from '../../utils/logger';
import statsService from '../../services/statsService';

const router = express.Router();

/**
 * Page view tracking endpoint for frontend
 */
router.post('/page-view', (req, res) => {
  try {
    const { page } = req.body;
    if (page === 'home' || page === 'detail') {
      statsService.recordPageView(page);
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error recording page view:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * Audio start tracking endpoint
 */
router.post('/audio-start', (req, res) => {
  try {
    statsService.recordAudioStart();
    res.json({ success: true });
  } catch (error) {
    logger.error('Error recording audio start:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * Audio end tracking endpoint
 */
router.post('/audio-end', (req, res) => {
  try {
    const { listeningTimeMinutes } = req.body;
    statsService.recordAudioEnd(listeningTimeMinutes || 0);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error recording audio end:', error);
    res.status(500).json({ success: false });
  }
});

export default router; 