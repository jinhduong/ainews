import express from 'express';
import dashboardRoutes from './routes/dashboard';
import analyticsRoutes from './routes/analytics';

const router = express.Router();

/**
 * Mount dashboard routes
 * /api/v1/dashboard/*
 */
router.use('/dashboard', dashboardRoutes);

/**
 * Mount analytics routes  
 * /api/v1/analytics/*
 */
router.use('/analytics', analyticsRoutes);

/**
 * Legacy route for dashboard HTML
 * /console/dashboard -> redirect to /api/v1/dashboard/
 */
router.use('/console/dashboard', (req, res) => {
  res.redirect('/api/v1/dashboard/');
});

export default router; 