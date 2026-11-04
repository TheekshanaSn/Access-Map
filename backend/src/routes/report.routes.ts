import { Router } from 'express';
import {
  createReport,
  getReports,
  getMyReports,
  updateReportCorrection,
  updateReportStatus,
  getAdminMetrics,
  uploadEvidencePhotos,
} from '../controllers/report.controller';
import {
  authenticate,
  requireModeratorOrAdmin,
} from '../middleware/auth';
import {
  validateReportSubmission,
  validateReportStatus,
} from '../middleware/validate';
import { uploadReportImages } from '../middleware/upload';

const router = Router();

// Upload evidence photos (Authenticated users, max 5 images, max 5MB each, JPEG/PNG/WebP)
router.post('/upload-photos', authenticate, uploadReportImages, uploadEvidencePhotos);

// Submit report (Authenticated users only)
router.post('/', authenticate, validateReportSubmission, createReport);

// View current user's submitted reports and track verification status
router.get('/my-reports', authenticate, getMyReports);

// Correct / update an existing report (Reporter or Admin)
router.put('/:id', authenticate, updateReportCorrection);

// View reports (User sees own reports, Moderator/Admin sees all)
router.get('/', authenticate, getReports);

// Admin / Moderator Metrics
router.get('/metrics', authenticate, requireModeratorOrAdmin, getAdminMetrics);

// Moderate report status (Strictly protected for Moderator and Admin only; no self-approval)
router.patch(
  '/:id/status',
  authenticate,
  requireModeratorOrAdmin,
  validateReportStatus,
  updateReportStatus
);

export default router;
