import { Router } from 'express';
import {
  getAdminOverview,
  getAuditLogs,
  getUsers,
  updateUserRole,
  importOsmDataset,
  getOsmImportHistory,
} from '../controllers/admin.controller';
import { authenticate, requireModeratorOrAdmin, requireRole } from '../middleware/auth';

const router = Router();

// Overview metrics & recent activity (Moderators & Admins)
router.get('/overview', authenticate, requireModeratorOrAdmin, getAdminOverview);

// Administrative audit logs (Moderators & Admins)
router.get('/audit-logs', authenticate, requireModeratorOrAdmin, getAuditLogs);

// User administration (Administrators only)
router.get('/users', authenticate, requireRole('admin'), getUsers);
router.patch('/users/:id/role', authenticate, requireRole('admin'), updateUserRole);

// OpenStreetMap Sri Lanka Data Ingestion (Administrators only)
router.post('/osm-import', authenticate, requireRole('admin'), importOsmDataset);
router.get('/osm-import/history', authenticate, requireRole('admin'), getOsmImportHistory);

export default router;

