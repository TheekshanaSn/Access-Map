import { Router } from 'express';
import {
  getAdminOverview,
  getAuditLogs,
  getUsers,
  updateUserRole,
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

export default router;

