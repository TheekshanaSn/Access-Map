import { Router } from 'express';
import {
  createReport,
  getReports,
  updateReportStatus,
  getAdminMetrics,
} from '../controllers/report.controller';
import {
  authenticate,
  optionalAuthenticate,
  requireModeratorOrAdmin,
} from '../middleware/auth';
import { validateReportStatus } from '../middleware/validate';

const router = Router();

// Submit report (public or authenticated)
router.post('/', optionalAuthenticate, createReport);

// View reports (authenticated: user sees own, moderator/admin sees all)
router.get('/', authenticate, getReports);

// Admin / Moderator Metrics
router.get('/metrics', authenticate, requireModeratorOrAdmin, getAdminMetrics);

// Moderate report status (Strictly protected for Moderator and Admin only)
router.patch(
  '/:id/status',
  authenticate,
  requireModeratorOrAdmin,
  validateReportStatus,
  updateReportStatus
);

export default router;

