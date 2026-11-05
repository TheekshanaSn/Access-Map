import { Request, Response } from 'express';
import { ReportModerationStatus } from '../models/report.model';
import {
  createReportInStore,
  findReportById,
  findReportsInStore,
  findReportsPaginatedInStore,
  countReportsInStore,
} from '../services/reportStore';
import { recordAuditLog } from '../services/auditLogStore';
import { AdminActionType } from '../models/auditLog.model';

/**
 * Upload evidence photos for an accessibility report
 * POST /api/reports/upload-photos
 * Protected: Authenticated users only
 */
export const uploadEvidencePhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        error: 'No Files Uploaded',
        message: 'Please select at least one photo file to upload',
      });
      return;
    }

    // Convert saved files to accessible web paths
    const urls = files.map((file) => `/uploads/reports/${file.filename}`);

    res.status(201).json({
      message: 'Evidence photos uploaded successfully',
      urls,
      count: urls.length,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Upload Failed',
      message: err.message || 'Failed to process evidence photo uploads',
    });
  }
};

/**
 * Submit a new accessibility audit/report
 * POST /api/reports
 * Protected: Requires authentication
 */
export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication is required to submit an accessibility report',
      });
      return;
    }

    const {
      placeId,
      placeName,
      isProposedPlace,
      proposedPlaceDetails,
      reporterName,
      reporterRole,
      rampStatus,
      stairsStatus,
      liftStatus,
      accessibleToiletStatus,
      entranceInformation,
      parkingStatus,
      surfaceCondition,
      doorWidthCm,
      stepCount,
      temporaryObstacle,
      temporaryObstacleDetails,
      notes,
      evidenceImageReferences,
    } = req.body;

    const isProposed = Boolean(isProposedPlace);
    const resolvedPlaceName = isProposed && proposedPlaceDetails?.name
      ? proposedPlaceDetails.name.trim()
      : (placeName || 'Unnamed Venue').trim();

    const resolvedPlaceId = isProposed
      ? `proposed-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      : placeId;

    const report = await createReportInStore({
      placeId: resolvedPlaceId,
      placeName: resolvedPlaceName,
      isProposedPlace: isProposed,
      proposedPlaceDetails: isProposed ? proposedPlaceDetails : undefined,
      submittedBy: {
        userId: req.user.userId,
        // Hide email from public name display if not explicitly provided
        name: reporterName?.trim() || 'Community Contributor',
        role: reporterRole || 'community_auditor',
      },
      // Never assume missing answer means a feature exists: fallback to 'not_specified'
      rampStatus: rampStatus || 'not_specified',
      stairsStatus: stairsStatus || 'not_specified',
      liftStatus: liftStatus || 'not_specified',
      accessibleToiletStatus: accessibleToiletStatus || 'not_specified',
      entranceInformation: entranceInformation || 'not_specified',
      parkingStatus: parkingStatus || 'not_specified',
      surfaceCondition: surfaceCondition || 'not_specified',
      doorWidthCm: doorWidthCm ? Number(doorWidthCm) : undefined,
      stepCount: stepCount !== undefined && stepCount !== null ? Number(stepCount) : undefined,
      temporaryObstacle: Boolean(temporaryObstacle),
      temporaryObstacleDetails: temporaryObstacleDetails || '',
      notes: notes || '',
      evidenceImageReferences: Array.isArray(evidenceImageReferences) ? evidenceImageReferences : [],
      reportStatus: 'pending', // Submissions always start in Pending status
    });

    res.status(201).json({
      message: 'Accessibility report submitted successfully and queued for verification',
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
 * Fetch reports submitted by the current authenticated user
 * GET /api/reports/my-reports
 * Protected: Authenticated users
 */
export const getMyReports = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to view your submitted reports',
      });
      return;
    }

    const reports = await findReportsInStore({
      'submittedBy.userId': req.user.userId,
    });

    res.status(200).json({
      count: reports.length,
      reports: reports.map((r) => r.toJSON()),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve reports',
      message: err.message,
    });
  }
};

/**
 * Correct or update an existing accessibility report
 * PUT /api/reports/:id
 * Protected: Reporter can correct their own report
 */
export const updateReportCorrection = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to edit or correct a report',
      });
      return;
    }

    const { id } = req.params;
    const report = await findReportById(id);

    if (!report) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Accessibility report not found',
      });
      return;
    }

    // Security check: Only the reporter or an administrator can update the report
    const isOwner = report.submittedBy?.userId?.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to update this report',
      });
      return;
    }

    const {
      rampStatus,
      stairsStatus,
      liftStatus,
      accessibleToiletStatus,
      entranceInformation,
      parkingStatus,
      surfaceCondition,
      doorWidthCm,
      stepCount,
      temporaryObstacle,
      temporaryObstacleDetails,
      notes,
      evidenceImageReferences,
      correctionNotes,
    } = req.body;

    // Apply corrections
    if (rampStatus !== undefined) report.rampStatus = rampStatus;
    if (stairsStatus !== undefined) report.stairsStatus = stairsStatus;
    if (liftStatus !== undefined) report.liftStatus = liftStatus;
    if (accessibleToiletStatus !== undefined) report.accessibleToiletStatus = accessibleToiletStatus;
    if (entranceInformation !== undefined) report.entranceInformation = entranceInformation;
    if (parkingStatus !== undefined) report.parkingStatus = parkingStatus;
    if (surfaceCondition !== undefined) report.surfaceCondition = surfaceCondition;
    if (doorWidthCm !== undefined) report.doorWidthCm = Number(doorWidthCm);
    if (stepCount !== undefined) report.stepCount = Number(stepCount);
    if (temporaryObstacle !== undefined) report.temporaryObstacle = Boolean(temporaryObstacle);
    if (temporaryObstacleDetails !== undefined) report.temporaryObstacleDetails = temporaryObstacleDetails;
    if (notes !== undefined) report.notes = notes;
    if (Array.isArray(evidenceImageReferences)) report.evidenceImageReferences = evidenceImageReferences;

    // Mark as correction and reset to 'pending' review if it was previously reviewed
    report.isCorrection = true;
    report.correctionNotes = correctionNotes || 'Report updated with corrected observations';
    report.reportStatus = 'pending';

    await report.save();

    res.status(200).json({
      message: 'Accessibility report updated and queued for re-verification',
      report: report.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Update Failed',
      message: err.message || 'Failed to update accessibility report',
    });
  }
};

/**
 * Get reports list
 * GET /api/reports
 * - Regular Users: only see their own submitted reports
 * - Moderators & Admins: see all reports across venues with filtering
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
    const { page, limit, search, isCorrection } = req.query;

    // Role-based visibility scoping
    if (req.user.role === 'user') {
      query['submittedBy.userId'] = req.user.userId;
    } else {
      if (req.query.status && req.query.status !== 'all') {
        query.reportStatus = req.query.status;
      }
      if (req.query.placeId) {
        query.placeId = req.query.placeId;
      }
      if (isCorrection !== undefined) {
        query.isCorrection = isCorrection === 'true';
      }
    }

    if (page || limit || search) {
      const paginated = await findReportsPaginatedInStore(query, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search ? String(search) : undefined,
      });

      res.status(200).json({
        count: paginated.reports.length,
        reports: paginated.reports.map((r) => r.toJSON()),
        total: paginated.total,
        page: paginated.page,
        totalPages: paginated.totalPages,
      });
      return;
    }

    const reports = await findReportsInStore(query);

    res.status(200).json({
      count: reports.length,
      reports: reports.map((r) => r.toJSON()),
      total: reports.length,
      page: 1,
      totalPages: 1,
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
 * Strictly protected: Moderators and Administrators only
 * Safety requirements:
 * 1. Users cannot approve their own reports.
 * 2. Rejecting or requesting corrections requires a reason.
 * 3. Administrative audit trail logged.
 */
export const updateReportStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const { id } = req.params;
    const { status, reviewNotes, reason } = req.body;
    const effectiveReason = (reviewNotes || reason || '').trim();

    // Enforce reason for negative/correction moderation decisions
    if ((status === 'rejected' || status === 'needs_review') && !effectiveReason) {
      res.status(400).json({
        error: 'Validation Error',
        message: `A reason is required when marking a report as ${status === 'needs_review' ? 'needing corrections' : 'rejected'}`,
      });
      return;
    }

    const report = await findReportById(id);
    if (!report) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Accessibility report not found',
      });
      return;
    }

    // Prevention of self-approval: A moderator or administrator CANNOT approve their own report
    const isReporter = report.submittedBy?.userId?.toString() === req.user.userId;
    if (isReporter && status === 'approved') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Self-approval is forbidden. An independent moderator must review and approve your submission.',
      });
      return;
    }

    const previousStatus = report.reportStatus;

    // Update status and reviewer audit trail
    report.reportStatus = status as ReportModerationStatus;
    report.reviewedBy = req.user.userId as any;
    report.reviewedAt = new Date();
    if (effectiveReason) {
      report.reviewNotes = effectiveReason;
    }

    await report.save();

    // Record audit log
    let actionType: AdminActionType = 'REPORT_APPROVED';
    if (status === 'rejected') actionType = 'REPORT_REJECTED';
    if (status === 'needs_review') actionType = 'REPORT_CORRECTION_REQUESTED';

    await recordAuditLog({
      action: actionType,
      performedBy: {
        userId: req.user.userId,
        name: req.user.email,
        email: req.user.email,
        role: req.user.role,
      },
      targetType: 'report',
      targetId: report.id,
      targetName: report.placeName,
      reason: effectiveReason || `Report marked as ${status}`,
      details: { previousStatus, newStatus: status },
    });

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
    const [pending, approved, rejected, needsReview, obstacles] = await Promise.all([
      countReportsInStore({ reportStatus: 'pending' }),
      countReportsInStore({ reportStatus: 'approved' }),
      countReportsInStore({ reportStatus: 'rejected' }),
      countReportsInStore({ reportStatus: 'needs_review' }),
      countReportsInStore({ temporaryObstacle: true }),
    ]);

    res.status(200).json({
      pendingAudits: pending,
      approvedAudits: approved,
      rejectedAudits: rejected,
      needsReviewAudits: needsReview,
      activeObstacles: obstacles,
      totalAudits: pending + approved + rejected + needsReview,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve administrative metrics',
      message: err.message,
    });
  }
};
