import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { countPlacesInStore, detectDuplicatePlacesInStore } from '../services/placeStore';
import { countReportsInStore } from '../services/reportStore';
import { countUsersInStore, findUsersInStore, updateUserRoleInStore, findUserById } from '../services/userStore';
import { findAuditLogsInStore, recordAuditLog } from '../services/auditLogStore';
import { UserRole } from '../models/user.model';
import { importOsmElements } from '../services/osmImport.service';
import { SRI_LANKA_OSM_SAMPLE_FACILITIES } from '../data/sri-lanka-osm-sample';

/**
 * Administrative Overview & Statistics
 * GET /api/admin/overview
 * Protected: Moderators and Admins
 */
export const getAdminOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalPlaces,
      verifiedPlaces,
      pendingPlaces,
      totalUsers,
      pendingAudits,
      approvedAudits,
      rejectedAudits,
      needsReviewAudits,
      activeObstacles,
      duplicates,
      recentAuditLogs,
    ] = await Promise.all([
      countPlacesInStore(),
      countPlacesInStore({ verifiedStatus: 'staff_verified' }),
      countPlacesInStore({ verifiedStatus: 'pending_verification' }),
      countUsersInStore(),
      countReportsInStore({ reportStatus: 'pending' }),
      countReportsInStore({ reportStatus: 'approved' }),
      countReportsInStore({ reportStatus: 'rejected' }),
      countReportsInStore({ reportStatus: 'needs_review' }),
      countReportsInStore({ temporaryObstacle: true }),
      detectDuplicatePlacesInStore(),
      findAuditLogsInStore({}, { page: 1, limit: 6 }),
    ]);

    const totalAudits = pendingAudits + approvedAudits + rejectedAudits + needsReviewAudits;

    res.status(200).json({
      metrics: {
        places: {
          total: totalPlaces,
          verified: verifiedPlaces,
          pending: pendingPlaces,
          possibleDuplicates: duplicates.length,
        },
        reports: {
          total: totalAudits,
          pending: pendingAudits,
          approved: approvedAudits,
          rejected: rejectedAudits,
          needsReview: needsReviewAudits,
          activeObstacles: activeObstacles,
        },
        users: {
          total: totalUsers,
        },
      },
      recentActivity: recentAuditLogs.logs.map((l) => l.toJSON()),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve administrative overview',
      message: err.message,
    });
  }
};

/**
 * Retrieve paginated administrative audit logs
 * GET /api/admin/audit-logs
 * Protected: Moderators and Admins
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, targetType, targetId, page, limit } = req.query;

    const query: any = {};
    if (action) query.action = String(action);
    if (targetType) query.targetType = String(targetType);
    if (targetId) query.targetId = String(targetId);

    const result = await findAuditLogsInStore(query, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.status(200).json({
      logs: result.logs.map((l) => l.toJSON()),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      message: err.message,
    });
  }
};

/**
 * Retrieve user list
 * GET /api/admin/users
 * Protected: Administrators only
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, search } = req.query;

    const result = await findUsersInStore({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search ? String(search) : undefined,
    });

    res.status(200).json({
      users: result.users,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: err.message,
    });
  }
};

/**
 * Change user account role
 * PATCH /api/admin/users/:id/role
 * Protected: Administrators only
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, reason } = req.body;

    const validRoles: UserRole[] = ['user', 'moderator', 'admin'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Valid role is required (${validRoles.join(', ')})`,
      });
      return;
    }

    const targetUser = await findUserById(id);
    if (!targetUser) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    const updated = await updateUserRoleInStore(id, role);
    if (!updated) {
      res.status(500).json({
        error: 'Update Failed',
        message: 'Could not update user role',
      });
      return;
    }

    // Record audit log
    if (req.user) {
      await recordAuditLog({
        action: 'USER_ROLE_CHANGED',
        performedBy: {
          userId: req.user.userId,
          name: req.user.email,
          email: req.user.email,
          role: req.user.role,
        },
        targetType: 'user',
        targetId: id,
        targetName: targetUser.name,
        reason: reason || `Updated role to ${role}`,
        details: { previousRole: targetUser.role, newRole: role },
      });
    }

    res.status(200).json({
      message: `User role successfully updated to ${role}`,
      user: updated.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update user role',
      message: err.message,
    });
  }
};

/**
 * Trigger Sri Lanka OpenStreetMap data import
 * POST /api/admin/osm-import
 * Protected: Admin only
 */
export const importOsmDataset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { elements, sample, dryRun, sourceName } = req.body || {};
    let dataToImport = elements;

    if (sample || (!dataToImport && !Array.isArray(dataToImport))) {
      dataToImport = SRI_LANKA_OSM_SAMPLE_FACILITIES;
    }

    const summary = await importOsmElements(dataToImport, {
      batchId: `admin-import-${Date.now()}`,
      sourceName: sourceName || (sample ? 'Sri Lanka Sample Public Facilities' : 'Custom OSM Upload'),
      dryRun: !!dryRun,
      importedBy: req.user
        ? {
            userId: req.user.userId,
            email: req.user.email,
            role: req.user.role,
          }
        : undefined,
    });

    res.status(200).json({
      message: dryRun ? 'OSM Import Dry-Run Completed Successfully' : 'OSM Dataset Successfully Imported',
      summary,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'OSM Import Failed',
      message: err?.message || 'An error occurred during OpenStreetMap data ingestion',
    });
  }
};

/**
 * List past OSM import reports
 * GET /api/admin/osm-import/history
 * Protected: Admin only
 */
export const getOsmImportHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reportsDir = path.resolve(process.cwd(), 'data', 'import-reports');
    if (!fs.existsSync(reportsDir)) {
      res.status(200).json({ reports: [] });
      return;
    }

    const files = fs
      .readdirSync(reportsDir)
      .filter((f) => f.endsWith('.json'))
      .slice(-20)
      .reverse();

    const reports = files.map((f) => {
      try {
        const content = fs.readFileSync(path.join(reportsDir, f), 'utf-8');
        return JSON.parse(content);
      } catch {
        return { filename: f, error: 'Could not read log file' };
      }
    });

    res.status(200).json({ reports });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve import history',
      message: err?.message || 'Failed to list reports',
    });
  }
};

