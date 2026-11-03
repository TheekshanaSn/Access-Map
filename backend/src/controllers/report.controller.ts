import { Request, Response } from 'express';
import { ReportModerationStatus } from '../models/report.model';
import {
  createReportInStore,
  findReportById,
  findReportsInStore,
  countReportsInStore,
} from '../services/reportStore';

/**
 * Submit a new accessibility audit/report
 * POST /api/reports
 */
export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      placeId,
      placeName,
      reporterName,
      reporterRole,
      rampStatus,
      stairsStatus,
      liftStatus,
      accessibleToiletStatus,
      entranceInformation,
      surfaceCondition,
      temporaryObstacle,
      temporaryObstacleDetails,
      notes,
      evidenceImageReferences,
    } = req.body;

    if (!placeId || !placeName) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Place ID and Place Name are required to submit an audit',
      });
      return;
    }

    const report = await createReportInStore({
      placeId,
      placeName,
      submittedBy: {
        userId: req.user?.userId || undefined,
        name: reporterName || req.user?.email || 'Anonymous Community Auditor',
        role: reporterRole || 'community_auditor',
      },
      rampStatus: rampStatus || 'not_specified',
      stairsStatus: stairsStatus || 'not_specified',
      liftStatus: liftStatus || 'not_specified',
      accessibleToiletStatus: accessibleToiletStatus || 'not_specified',
      entranceInformation: entranceInformation || 'standard_door',
      surfaceCondition: surfaceCondition || 'paved',
      temporaryObstacle: !!temporaryObstacle,
      temporaryObstacleDetails: temporaryObstacleDetails || '',
      notes: notes || '',
      evidenceImageReferences: Array.isArray(evidenceImageReferences) ? evidenceImageReferences : [],
      reportStatus: 'pending', // Always pending initially - never auto-approved
    });

    res.status(201).json({
      message: 'Accessibility report submitted successfully and queued for moderation review',
      report: report.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Submission Failed',
      message: err.message || 'Failed to submit accessibility report',
    });
  }
};

/**
 * Get reports list
 * GET /api/reports
 * - Moderators & Admins: can see all reports across all venues
 * - Regular Users: can only see their own submitted reports
 */
export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to view reports list',
      });
      return;
    }

    const query: any = {};

    // Role-based visibility scoping
    if (req.user.role === 'user') {
      query['submittedBy.userId'] = req.user.userId;
    } else {
      if (req.query.status) {
        query.reportStatus = req.query.status;
      }
      if (req.query.placeId) {
        query.placeId = req.query.placeId;
      }
    }

    const reports = await findReportsInStore(query);

    res.status(200).json({
      count: reports.length,
      reports: reports.map((r) => r.toJSON()),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: err.message,
    });
  }
};

/**
 * Update report moderation status
 * PATCH /api/reports/:id/status
 * Strictly protected: Only Moderators and Administrators can approve/reject
 */
export const updateReportStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const report = await findReportById(id);
    if (!report) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Accessibility report not found',
      });
      return;
    }

    // Update status and reviewer audit trail
    report.reportStatus = status as ReportModerationStatus;
    report.reviewedBy = req.user ? (req.user.userId as any) : undefined;
    report.reviewedAt = new Date();
    if (reviewNotes) {
      report.reviewNotes = reviewNotes;
    }

    await report.save();

    res.status(200).json({
      message: `Report status successfully updated to ${status}`,
      report: report.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update report status',
      message: err.message,
    });
  }
};

/**
 * Administrative metrics overview
 * GET /api/reports/metrics
 * Strictly protected: Moderators and Admins only
 */
export const getAdminMetrics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [pending, approved, rejected, obstacles] = await Promise.all([
      countReportsInStore({ reportStatus: 'pending' }),
      countReportsInStore({ reportStatus: 'approved' }),
      countReportsInStore({ reportStatus: 'rejected' }),
      countReportsInStore({ temporaryObstacle: true }),
    ]);

    res.status(200).json({
      pendingAudits: pending,
      approvedAudits: approved,
      rejectedAudits: rejected,
      activeObstacles: obstacles,
      totalAudits: pending + approved + rejected,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve administrative metrics',
      message: err.message,
    });
  }
};
