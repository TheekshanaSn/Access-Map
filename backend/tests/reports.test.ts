import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createReport,
  getMyReports,
  updateReportCorrection,
  updateReportStatus,
  uploadEvidencePhotos,
} from '../src/controllers/report.controller';
import {
  validateReportSubmission,
  validateReportStatus,
} from '../src/middleware/validate';
import {
  createReportInStore,
  findReportById,
  findReportsInStore,
} from '../src/services/reportStore';
import { JwtPayload } from '../src/middleware/auth';

/**
 * In-process mock context for testing Express handlers and middlewares
 */
function createMockContext(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: JwtPayload;
  files?: any[];
} = {}) {
  let statusCode = 200;
  let responseBody: any = null;

  const req: any = {
    method: options.method || 'GET',
    url: options.url || '/',
    headers: options.headers || {},
    cookies: options.cookies || {},
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    user: options.user,
    files: options.files,
  };

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseBody = data;
      return res;
    },
  };

  let nextCalled = false;
  let nextError: any = null;
  const next = (err?: any) => {
    nextCalled = true;
    nextError = err;
  };

  return {
    req,
    res,
    next,
    wasNextCalled: () => nextCalled,
    getNextError: () => nextError,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

describe('STEP 6: Accessibility Reporting System Test Suite', () => {

  const regularUser: JwtPayload = {
    userId: 'user-reporter-123',
    email: 'reporter@accessmap.org',
    role: 'user',
  };

  const moderatorUser: JwtPayload = {
    userId: 'mod-verifier-456',
    email: 'moderator@accessmap.org',
    role: 'moderator',
  };

  describe('1. Report Submission & Validation', () => {
    it('should reject unauthenticated report submissions with 401', async () => {
      const ctx = createMockContext({
        method: 'POST',
        body: {
          placeId: 'place-1',
          placeName: 'City Hospital',
        },
        user: undefined, // Unauthenticated
      });

      await createReport(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 401);
      assert.strictEqual(ctx.getBody().error, 'Unauthorized');
    });

    it('should reject report submission when placeId and proposedPlace are missing', () => {
      const ctx = createMockContext({
        method: 'POST',
        body: {
          rampStatus: 'available',
        },
      });

      validateReportSubmission(ctx.req, ctx.res, ctx.next);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.wasNextCalled(), false);
      assert.ok(ctx.getBody().messages.some((m: string) => m.includes('Place ID is required')));
    });

    it('should reject invalid accessibility enum values', () => {
      const ctx = createMockContext({
        method: 'POST',
        body: {
          placeId: 'place-1',
          placeName: 'City Hospital',
          rampStatus: 'super_steep_invalid_value',
        },
      });

      validateReportSubmission(ctx.req, ctx.res, ctx.next);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.wasNextCalled(), false);
      assert.ok(ctx.getBody().messages.some((m: string) => m.includes('Invalid rampStatus')));
    });

    it('should allow valid report submission with authenticated user', async () => {
      const ctx = createMockContext({
        method: 'POST',
        user: regularUser,
        body: {
          placeId: 'place-1',
          placeName: 'City Hospital OPD',
          reporterName: 'Wheelchair Navigator',
          reporterRole: 'wheelchair_user',
          rampStatus: 'available',
          stairsStatus: 'has_alternative_ramp',
          liftStatus: 'available',
          accessibleToiletStatus: 'available',
          entranceInformation: 'step_free',
          parkingStatus: 'accessible_bays',
          surfaceCondition: 'smooth_paved',
          notes: 'Wide concrete ramp at entrance, gradient is mild and smooth.',
          evidenceImageReferences: ['/uploads/reports/test-ramp-photo.webp'],
        },
      });

      await createReport(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 201);
      const resBody = ctx.getBody();
      assert.ok(resBody.report);
      assert.strictEqual(resBody.report.placeId, 'place-1');
      assert.strictEqual(resBody.report.placeName, 'City Hospital OPD');
      // Must start with pending moderation status
      assert.strictEqual(resBody.report.reportStatus, 'pending');
      // Submitter must be referenced
      assert.strictEqual(resBody.report.submittedBy.userId, regularUser.userId);
      assert.strictEqual(resBody.report.rampStatus, 'available');
      assert.strictEqual(resBody.report.evidenceImageReferences.length, 1);
    });

    it('should support proposing a new unlisted place with proposed details', async () => {
      const ctx = createMockContext({
        method: 'POST',
        user: regularUser,
        body: {
          isProposedPlace: true,
          proposedPlaceDetails: {
            name: 'New Community Clinic',
            address: '45 Lotus Road',
            city: 'Colombo',
            category: 'health',
          },
          rampStatus: 'available',
          entranceInformation: 'step_free',
        },
      });

      // Validate middleware
      validateReportSubmission(ctx.req, ctx.res, ctx.next);
      assert.strictEqual(ctx.wasNextCalled(), true);

      // Execute controller
      await createReport(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 201);
      const report = ctx.getBody().report;
      assert.strictEqual(report.isProposedPlace, true);
      assert.strictEqual(report.placeName, 'New Community Clinic');
      assert.ok(report.placeId.startsWith('proposed-'));
    });

    it('never treats a missing answer as proof that an accessibility feature exists', async () => {
      const ctx = createMockContext({
        method: 'POST',
        user: regularUser,
        body: {
          placeId: 'place-99',
          placeName: 'Library Branch',
          // Notice: rampStatus, liftStatus, accessibleToiletStatus are omitted!
        },
      });

      await createReport(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 201);
      const report = ctx.getBody().report;
      // All missing physical dimensions default to 'not_specified'
      assert.strictEqual(report.rampStatus, 'not_specified');
      assert.strictEqual(report.stairsStatus, 'not_specified');
      assert.strictEqual(report.liftStatus, 'not_specified');
      assert.strictEqual(report.accessibleToiletStatus, 'not_specified');
      assert.strictEqual(report.parkingStatus, 'not_specified');
      assert.strictEqual(report.entranceInformation, 'not_specified');
    });
  });

  describe('2. Photo Evidence Handling', () => {
    it('should reject photo upload when no files are provided', async () => {
      const ctx = createMockContext({
        method: 'POST',
        user: regularUser,
        files: [],
      });

      await uploadEvidencePhotos(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.getBody().error, 'No Files Uploaded');
    });

    it('should return web-accessible URLs when valid image files are uploaded', async () => {
      const ctx = createMockContext({
        method: 'POST',
        user: regularUser,
        files: [
          { filename: 'report-12345.webp', originalname: 'ramp.webp', mimetype: 'image/webp', size: 102400 },
          { filename: 'report-67890.jpg', originalname: 'door.jpg', mimetype: 'image/jpeg', size: 204800 },
        ],
      });

      await uploadEvidencePhotos(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 201);
      const body = ctx.getBody();
      assert.strictEqual(body.count, 2);
      assert.deepStrictEqual(body.urls, [
        '/uploads/reports/report-12345.webp',
        '/uploads/reports/report-67890.jpg',
      ]);
    });
  });

  describe('3. User Report History & Review Statuses', () => {
    it('should return reports submitted by the logged-in user', async () => {
      // Seed a report for user
      await createReportInStore({
        placeId: 'place-history-1',
        placeName: 'Suburban Train Station',
        submittedBy: {
          userId: regularUser.userId,
          name: 'Regular User',
          role: 'wheelchair_user',
        },
        rampStatus: 'available',
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'GET',
        user: regularUser,
      });

      await getMyReports(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(Array.isArray(body.reports));
      assert.ok(body.reports.some((r: any) => r.placeId === 'place-history-1'));
    });
  });

  describe('4. Mistake Correction / Updated Report', () => {
    it('should allow the original reporter to update/correct their report', async () => {
      const created = await createReportInStore({
        placeId: 'place-correction-1',
        placeName: 'Town Hall',
        submittedBy: {
          userId: regularUser.userId,
          name: 'Regular User',
          role: 'wheelchair_user',
        },
        rampStatus: 'none',
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'PUT',
        params: { id: created.id },
        user: regularUser,
        body: {
          rampStatus: 'available', // User corrects mistake: ramp actually exists at side entrance
          notes: 'Correction: Ramp exists at side entrance next to parking bay.',
          correctionNotes: 'Fixed ramp availability note',
        },
      });

      await updateReportCorrection(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const updated = ctx.getBody().report;
      assert.strictEqual(updated.rampStatus, 'available');
      assert.strictEqual(updated.isCorrection, true);
      assert.strictEqual(updated.reportStatus, 'pending');
    });

    it('should reject report correction attempts by unauthorized users (403)', async () => {
      const otherUser: JwtPayload = {
        userId: 'other-stranger-999',
        email: 'stranger@accessmap.org',
        role: 'user',
      };

      const created = await createReportInStore({
        placeId: 'place-correction-2',
        placeName: 'District Courthouse',
        submittedBy: {
          userId: regularUser.userId,
          name: 'Regular User',
          role: 'wheelchair_user',
        },
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'PUT',
        params: { id: created.id },
        user: otherUser, // Stranger trying to edit regularUser's report
        body: {
          rampStatus: 'available',
        },
      });

      await updateReportCorrection(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 403);
      assert.strictEqual(ctx.getBody().error, 'Forbidden');
    });
  });

  describe('5. Moderation Workflow & Self-Approval Prevention', () => {
    it('should prevent users from approving their own reports even if they are a moderator', async () => {
      // Moderator creates a report under their own account
      const modReport = await createReportInStore({
        placeId: 'place-self-mod-1',
        placeName: 'City Center Mall',
        submittedBy: {
          userId: moderatorUser.userId,
          name: 'Moderator User',
          role: 'moderator',
        },
        reportStatus: 'pending',
      });

      // Moderator attempts to approve their own report
      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: modReport.id },
        user: moderatorUser,
        body: {
          status: 'approved',
          reviewNotes: 'Self verifying my own report',
        },
      });

      await updateReportStatus(ctx.req, ctx.res);

      // Must be forbidden (403) to prevent bias and ensure integrity
      assert.strictEqual(ctx.getStatus(), 403);
      assert.strictEqual(ctx.getBody().error, 'Forbidden');
      assert.ok(ctx.getBody().message.includes('Self-approval is forbidden'));
    });

    it('should allow an independent moderator to approve another user’s report', async () => {
      const userReport = await createReportInStore({
        placeId: 'place-verify-1',
        placeName: 'Public Arts Theatre',
        submittedBy: {
          userId: regularUser.userId,
          name: 'Regular User',
          role: 'wheelchair_user',
        },
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: userReport.id },
        user: moderatorUser,
        body: {
          status: 'approved',
          reviewNotes: 'Verified ramp dimensions with venue facilities team',
        },
      });

      await updateReportStatus(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      assert.strictEqual(ctx.getBody().report.reportStatus, 'approved');
      assert.strictEqual(ctx.getBody().report.reviewNotes, 'Verified ramp dimensions with venue facilities team');
    });

    it('should support "needs_review" status for reports requiring more evidence', async () => {
      const userReport = await createReportInStore({
        placeId: 'place-needs-review-1',
        placeName: 'Old City Museum',
        submittedBy: {
          userId: regularUser.userId,
          name: 'Regular User',
          role: 'wheelchair_user',
        },
        reportStatus: 'pending',
      });

      // Test validateReportStatus middleware
      const valCtx = createMockContext({
        method: 'PATCH',
        body: { status: 'needs_review' },
      });
      validateReportStatus(valCtx.req, valCtx.res, valCtx.next);
      assert.strictEqual(valCtx.wasNextCalled(), true);

      // Test controller update
      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: userReport.id },
        user: moderatorUser,
        body: {
          status: 'needs_review',
          reviewNotes: 'Please upload a photo of the elevator control buttons to confirm Braille.',
        },
      });

      await updateReportStatus(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      assert.strictEqual(ctx.getBody().report.reportStatus, 'needs_review');
    });
  });

  describe('6. Privacy & Data Protection', () => {
    it('does not expose reporter email address in serialized report output', async () => {
      const report = await createReportInStore({
        placeId: 'place-privacy-1',
        placeName: 'National Archives',
        submittedBy: {
          userId: regularUser.userId,
          name: 'Alice',
          role: 'manual_wheelchair_user',
        },
        notes: 'Door width is 85cm.',
        reportStatus: 'approved',
      });

      const serialized = report.toJSON();
      assert.strictEqual(serialized.submittedBy.name, 'Alice');
      assert.strictEqual(serialized.submittedBy.email, undefined);
      assert.strictEqual(serialized.__v, undefined);
    });
  });
});

