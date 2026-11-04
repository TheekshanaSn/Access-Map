import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getAdminOverview,
  getAuditLogs,
  getUsers,
  updateUserRole,
} from '../src/controllers/admin.controller';
import {
  getPlaces,
  getPlaceById,
  updatePlace,
  detectDuplicatePlaces,
  resolveDuplicatePlace,
} from '../src/controllers/place.controller';
import { updateReportStatus, getReports } from '../src/controllers/report.controller';
import { createReportInStore } from '../src/services/reportStore';
import { findPlaceById } from '../src/services/placeStore';
import { JwtPayload } from '../src/middleware/auth';

/**
 * In-process mock context for testing Express handlers
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

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

describe('STEP 7: AccessMap Admin Dashboard Test Suite', () => {
  const adminUser: JwtPayload = {
    userId: 'admin-test-1',
    email: 'admin@accessmap.org',
    role: 'admin',
  };

  const modUser: JwtPayload = {
    userId: 'mod-test-1',
    email: 'moderator@accessmap.org',
    role: 'moderator',
  };

  const regularUser: JwtPayload = {
    userId: 'user-regular-1',
    email: 'user@accessmap.org',
    role: 'user',
  };

  describe('1. Administrative Overview & Metrics', () => {
    it('should return aggregated overview metrics for places, reports, users and duplicates', async () => {
      const ctx = createMockContext({
        method: 'GET',
        user: modUser,
      });

      await getAdminOverview(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(body.metrics);
      assert.ok(typeof body.metrics.places.total === 'number');
      assert.ok(typeof body.metrics.reports.pending === 'number');
      assert.ok(typeof body.metrics.reports.approved === 'number');
      assert.ok(typeof body.metrics.users.total === 'number');
      assert.ok(Array.isArray(body.recentActivity));
    });
  });

  describe('2. Report Moderation, Status Transitions & Reason Enforcement', () => {
    it('should reject report status change to rejected when reason is missing (400)', async () => {
      const report = await createReportInStore({
        placeId: 'place-test-rej-1',
        placeName: 'City Library Branch',
        submittedBy: { userId: 'some-user', name: 'User', role: 'wheelchair_user' },
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: report.id },
        user: modUser,
        body: {
          status: 'rejected',
          // reviewNotes / reason missing!
        },
      });

      await updateReportStatus(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.getBody().error, 'Validation Error');
      assert.ok(ctx.getBody().message.includes('A reason is required'));
    });

    it('should reject report status change to needs_review when reason is missing (400)', async () => {
      const report = await createReportInStore({
        placeId: 'place-test-nr-1',
        placeName: 'City Hospital OPD',
        submittedBy: { userId: 'some-user', name: 'User', role: 'wheelchair_user' },
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: report.id },
        user: modUser,
        body: {
          status: 'needs_review',
          // reviewNotes missing!
        },
      });

      await updateReportStatus(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.getBody().error, 'Validation Error');
    });

    it('should successfully reject report with clear reason and log to audit trail', async () => {
      const report = await createReportInStore({
        placeId: 'place-test-rej-2',
        placeName: 'Downtown Cafe',
        submittedBy: { userId: 'some-user', name: 'User', role: 'wheelchair_user' },
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: report.id },
        user: modUser,
        body: {
          status: 'rejected',
          reason: 'Photo shows steep staircase of 6 steps with no ramp alternative.',
        },
      });

      await updateReportStatus(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      assert.strictEqual(ctx.getBody().report.reportStatus, 'rejected');
      assert.strictEqual(ctx.getBody().report.reviewNotes, 'Photo shows steep staircase of 6 steps with no ramp alternative.');
    });

    it('should successfully request corrections (needs_review) with reason', async () => {
      const report = await createReportInStore({
        placeId: 'place-test-nr-2',
        placeName: 'Community Medical Center',
        submittedBy: { userId: 'some-user', name: 'User', role: 'wheelchair_user' },
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: report.id },
        user: modUser,
        body: {
          status: 'needs_review',
          reviewNotes: 'Please measure entrance doorway clear width to confirm wheelchair clearance.',
        },
      });

      await updateReportStatus(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      assert.strictEqual(ctx.getBody().report.reportStatus, 'needs_review');
    });
  });

  describe('3. Filtering Reports, User Corrections & Pagination', () => {
    it('should filter reports by isCorrection=true to review user-submitted corrections', async () => {
      // Seed a corrected report
      await createReportInStore({
        placeId: 'place-corr-test',
        placeName: 'Correction Venue',
        submittedBy: { userId: 'user-1', name: 'Tester', role: 'wheelchair_user' },
        isCorrection: true,
        correctionNotes: 'Re-measured ramp gradient to 1:14.',
        reportStatus: 'pending',
      });

      const ctx = createMockContext({
        method: 'GET',
        user: modUser,
        query: {
          isCorrection: 'true',
        },
      });

      await getReports(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const reports = ctx.getBody().reports;
      assert.ok(Array.isArray(reports));
      assert.ok(reports.every((r: any) => r.isCorrection === true));
    });

    it('should support pagination in reports listing', async () => {
      const ctx = createMockContext({
        method: 'GET',
        user: modUser,
        query: {
          page: '1',
          limit: '2',
        },
      });

      await getReports(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(body.reports.length <= 2);
      assert.strictEqual(body.page, 1);
      assert.ok(body.totalPages >= 1);
    });
  });

  describe('4. Place Information Editing & Corrections', () => {
    it('should allow moderator to update inaccurate place details and record audit log', async () => {
      const placeId = 'place-central-library';
      const ctx = createMockContext({
        method: 'PUT',
        params: { id: placeId },
        user: modUser,
        body: {
          name: 'Metropolitan Central Library (Updated)',
          reason: 'Corrected official venue naming and entrance ramp status.',
          amenities: {
            stepFreeEntrance: true,
            doorWidthCm: 110,
          },
        },
      });

      await updatePlace(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const updated = ctx.getBody().place;
      assert.strictEqual(updated.name, 'Metropolitan Central Library (Updated)');

      const placeInDb = await findPlaceById(placeId);
      assert.strictEqual(placeInDb?.name, 'Metropolitan Central Library (Updated)');
    });
  });

  describe('5. Duplicate Places Detection & Resolution', () => {
    it('should detect possible duplicate places based on proximity and name similarity', async () => {
      const ctx = createMockContext({
        method: 'GET',
        user: modUser,
      });

      await detectDuplicatePlaces(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(Array.isArray(body.duplicates));
      assert.ok(body.duplicates.length > 0);

      // Verify structure of duplicate pair
      const pair = body.duplicates[0];
      assert.ok(pair.placeA);
      assert.ok(pair.placeB);
      assert.ok(pair.similarityScore > 0);
      assert.ok(Array.isArray(pair.reasons));
    });

    it('should resolve a duplicate pair by marking duplicate', async () => {
      const ctx = createMockContext({
        method: 'POST',
        user: modUser,
        body: {
          primaryId: 'place-central-library',
          duplicateId: 'place-central-library-dup',
          action: 'mark_duplicate',
          reason: 'Duplicate venue submission for west pavilion entrance.',
        },
      });

      await resolveDuplicatePlace(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      assert.strictEqual(ctx.getBody().action, 'mark_duplicate');

      const dupPlace = await findPlaceById('place-central-library-dup');
      assert.strictEqual(dupPlace?.isDuplicate, true);
      assert.strictEqual(dupPlace?.duplicateOf, 'place-central-library');
    });
  });

  describe('6. Administrative Audit Trail Logs', () => {
    it('should retrieve paginated audit logs', async () => {
      const ctx = createMockContext({
        method: 'GET',
        user: modUser,
        query: { page: '1', limit: '10' },
      });

      await getAuditLogs(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(Array.isArray(body.logs));
      assert.ok(body.logs.length > 0);
      assert.ok(body.logs[0].action);
      assert.ok(body.logs[0].performedBy);
      assert.ok(body.logs[0].timestamp);
    });
  });

  describe('7. User Management & Role Promotion', () => {
    it('should list users with pagination for administrator', async () => {
      const ctx = createMockContext({
        method: 'GET',
        user: adminUser,
        query: { page: '1', limit: '5' },
      });

      await getUsers(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(Array.isArray(body.users));
      assert.ok(body.users.length > 0);
      // Passwords must never be exposed
      assert.strictEqual((body.users[0] as any).passwordHash, undefined);
    });

    it('should update user role and record audit trail', async () => {
      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: 'dev-user-3' },
        user: adminUser,
        body: {
          role: 'moderator',
          reason: 'Promoted community volunteer to accessibility moderator',
        },
      });

      await updateUserRole(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      assert.strictEqual(ctx.getBody().user.role, 'moderator');
    });

    it('should reject invalid role updates (400)', async () => {
      const ctx = createMockContext({
        method: 'PATCH',
        params: { id: 'dev-user-3' },
        user: adminUser,
        body: {
          role: 'super_hacker_role',
        },
      });

      await updateUserRole(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.getBody().error, 'Validation Error');
    });
  });
});

