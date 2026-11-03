import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/environment';
import { User } from '../src/models/user.model';
import { AccessibilityReport } from '../src/models/report.model';
import {
  generateToken,
  authenticate,
  requireRole,
  setAuthCookie,
  clearAuthCookie,
  extractToken,
  JwtPayload,
} from '../src/middleware/auth';
import {
  validateRegister,
  validateLogin,
  validateReportStatus,
} from '../src/middleware/validate';
import { register, login, logout, getMe } from '../src/controllers/auth.controller';
import {
  updateReportStatus,
  getAdminMetrics,
  getReports,
} from '../src/controllers/report.controller';

/**
 * Lightweight in-process mock HTTP Request & Response harness.
 * Eliminates flaky TCP network socket dependencies in sandboxed CI environments.
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
  const setCookies: Record<string, any> = {};
  const clearedCookies: string[] = [];

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
    cookie(name: string, value: any, opts: any) {
      setCookies[name] = { value, opts };
      return res;
    },
    clearCookie(name: string, _opts: any) {
      clearedCookies.push(name);
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
    getSetCookies: () => setCookies,
    getClearedCookies: () => clearedCookies,
  };
}

describe('AccessMap Authentication & Security Test Suite', () => {
  // Stubs restoration
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalFindById = User.findById;
  const originalReportFindById = AccessibilityReport.findById;
  const originalReportFind = AccessibilityReport.find;
  const originalReportCountDocuments = AccessibilityReport.countDocuments;

  afterEach(() => {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    User.findById = originalFindById;
    AccessibilityReport.findById = originalReportFindById;
    AccessibilityReport.find = originalReportFind;
    AccessibilityReport.countDocuments = originalReportCountDocuments;
  });

  describe('1. Password Hashing and Credential Protection', () => {
    it('should securely hash plaintext passwords using bcrypt salt', async () => {
      const rawPassword = 'Password123!';
      const hash = await User.hashPassword(rawPassword);

      assert.notStrictEqual(hash, rawPassword);
      assert.strictEqual(hash.startsWith('$2'), true, 'Should use standard bcrypt algorithm ($2a/$2b)');

      const isMatch = await bcrypt.compare(rawPassword, hash);
      assert.strictEqual(isMatch, true, 'Correct password must match hash');

      const isWrongMatch = await bcrypt.compare('WrongPassword456!', hash);
      assert.strictEqual(isWrongMatch, false, 'Incorrect password must be rejected');
    });

    it('should never expose passwordHash in JSON serialization', () => {
      const mockDoc = new User({
        name: 'Jane Doe',
        email: 'jane@accessmap.org',
        passwordHash: '$2b$12$eXampLeHashSecretDoNotExpose',
        role: 'user',
      });

      const json = mockDoc.toJSON();
      assert.strictEqual(json.passwordHash, undefined, 'passwordHash must be omitted from toJSON output');
      assert.strictEqual(json.email, 'jane@accessmap.org');
      assert.strictEqual(json.name, 'Jane Doe');
      assert.strictEqual(json.role, 'user');
    });
  });

  describe('2. Input Validation Middleware', () => {
    it('should reject registration if email is invalid format (400 Bad Request)', () => {
      const { req, res, next, getStatus, getBody, wasNextCalled } = createMockContext({
        body: {
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'Password123!',
        },
      });

      validateRegister(req, res, next);

      assert.strictEqual(wasNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.strictEqual(getBody().error, 'Validation Error');
      assert.strictEqual(
        getBody().messages.some((m: string) => m.includes('valid email')),
        true
      );
    });

    it('should reject registration if password is too short (< 8 characters)', () => {
      const { req, res, next, getStatus, getBody, wasNextCalled } = createMockContext({
        body: {
          name: 'Short Password User',
          email: 'short@example.com',
          password: 'short',
        },
      });

      validateRegister(req, res, next);

      assert.strictEqual(wasNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.strictEqual(
        getBody().messages.some((m: string) => m.includes('at least 8 characters')),
        true
      );
    });

    it('should reject registration if password lacks numbers or special characters', () => {
      const { req, res, next, getStatus, getBody } = createMockContext({
        body: {
          name: 'Alpha Only',
          email: 'alpha@example.com',
          password: 'onlylettershere',
        },
      });

      validateRegister(req, res, next);

      assert.strictEqual(getStatus(), 400);
      assert.strictEqual(
        getBody().messages.some((m: string) => m.includes('number or special character')),
        true
      );
    });

    it('should pass registration validation when all fields are valid', () => {
      const { req, res, next, wasNextCalled } = createMockContext({
        body: {
          name: 'Valid User',
          email: 'valid@accessmap.org',
          password: 'StrongPassword2026!',
        },
      });

      validateRegister(req, res, next);
      assert.strictEqual(wasNextCalled(), true);
    });

    it('should reject login if email or password are missing (400)', () => {
      const { req, res, next, getStatus, getBody, wasNextCalled } = createMockContext({
        body: {},
      });

      validateLogin(req, res, next);

      assert.strictEqual(wasNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.strictEqual(getBody().error, 'Validation Error');
    });

    it('should reject invalid report moderation status (400)', () => {
      const { req, res, next, getStatus, getBody } = createMockContext({
        body: { status: 'invalid_status' },
      });

      validateReportStatus(req, res, next);

      assert.strictEqual(getStatus(), 400);
      assert.strictEqual(getBody().error, 'Validation Error');
    });
  });

  describe('3. Registration Workflow & Duplicate Email Prevention', () => {
    it('should successfully register a new user and set HttpOnly cookie', async () => {
      const mockCreatedUser = {
        id: 'mock-user-123',
        name: 'Sarah Wheelchair Navigator',
        email: 'sarah@example.com',
        role: 'user',
        toJSON() {
          return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
          };
        },
      };

      User.findOne = (async () => null) as any;
      User.create = (async () => mockCreatedUser) as any;

      const { req, res, getStatus, getBody, getSetCookies } = createMockContext({
        body: {
          name: 'Sarah Wheelchair Navigator',
          email: 'sarah@example.com',
          password: 'SecurePassword2026!',
        },
      });

      await register(req, res);

      assert.strictEqual(getStatus(), 201);
      assert.strictEqual(getBody().message, 'User registered successfully');
      assert.strictEqual(getBody().user.email, 'sarah@example.com');
      assert.strictEqual(getBody().user.passwordHash, undefined, 'Must not expose password hash');
      assert.strictEqual(typeof getBody().token, 'string');

      // Check HttpOnly cookie
      const cookies = getSetCookies();
      assert.strictEqual(typeof cookies[config.cookieName], 'object');
      assert.strictEqual(cookies[config.cookieName].opts.httpOnly, true);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      User.findOne = (async () => ({ id: 'existing-id', email: 'duplicate@example.com' })) as any;

      const { req, res, getStatus, getBody } = createMockContext({
        body: {
          name: 'Duplicate Attempt',
          email: 'duplicate@example.com',
          password: 'Password123!',
        },
      });

      await register(req, res);

      assert.strictEqual(getStatus(), 409);
      assert.strictEqual(getBody().error, 'Conflict');
      assert.strictEqual(getBody().message, 'An account with this email address already exists');
    });
  });

  describe('4. Login & Credential Verification', () => {
    it('should successfully log in with valid credentials and return JWT token', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword2026!', 10);
      const mockUser = {
        id: 'user-456',
        name: 'David Auditor',
        email: 'david@accessmap.org',
        role: 'moderator',
        passwordHash: hashedPassword,
        comparePassword: async (candidate: string) => bcrypt.compare(candidate, hashedPassword),
        toJSON() {
          return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
          };
        },
      };

      User.findOne = (() => ({
        select: async () => mockUser,
      })) as any;

      const { req, res, getStatus, getBody, getSetCookies } = createMockContext({
        body: {
          email: 'david@accessmap.org',
          password: 'CorrectPassword2026!',
        },
      });

      await login(req, res);

      assert.strictEqual(getStatus(), 200);
      assert.strictEqual(getBody().message, 'Logged in successfully');
      assert.strictEqual(getBody().user.email, 'david@accessmap.org');
      assert.strictEqual(getBody().user.role, 'moderator');
      assert.strictEqual(getBody().user.passwordHash, undefined);
      assert.strictEqual(typeof getBody().token, 'string');
      assert.strictEqual(getSetCookies()[config.cookieName].opts.httpOnly, true);
    });

    it('should reject login with 401 Unauthorized when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('RealPassword2026!', 10);
      const mockUser = {
        id: 'user-789',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        comparePassword: async (candidate: string) => bcrypt.compare(candidate, hashedPassword),
      };

      User.findOne = (() => ({
        select: async () => mockUser,
      })) as any;

      const { req, res, getStatus, getBody } = createMockContext({
        body: {
          email: 'user@example.com',
          password: 'WrongPassword!',
        },
      });

      await login(req, res);

      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody().error, 'Unauthorized');
      assert.strictEqual(getBody().message, 'Invalid email or password');
    });

    it('should reject login with 401 Unauthorized when user does not exist', async () => {
      User.findOne = (() => ({
        select: async () => null,
      })) as any;

      const { req, res, getStatus, getBody } = createMockContext({
        body: {
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        },
      });

      await login(req, res);

      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody().error, 'Unauthorized');
      assert.strictEqual(getBody().message, 'Invalid email or password');
    });
  });

  describe('5. Protected Endpoints & Token Authentication Middleware', () => {
    it('should reject requests without token with 401 Unauthorized', () => {
      const { req, res, next, getStatus, getBody, wasNextCalled } = createMockContext();

      authenticate(req, res, next);

      assert.strictEqual(wasNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody().error, 'Unauthorized');
    });

    it('should reject requests with invalid or tampered token (401)', () => {
      const { req, res, next, getStatus, getBody, wasNextCalled } = createMockContext({
        headers: { authorization: 'Bearer invalid_tampered_token_string' },
      });

      authenticate(req, res, next);

      assert.strictEqual(wasNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody().message, 'Invalid or malformed authentication token');
    });

    it('should reject requests with expired token (401)', () => {
      const expiredToken = jwt.sign(
        { userId: 'expired-user', email: 'expired@test.com', role: 'user' },
        config.jwtSecret,
        { expiresIn: '-1s' }
      );

      const { req, res, next, getStatus, getBody, wasNextCalled } = createMockContext({
        headers: { authorization: `Bearer ${expiredToken}` },
      });

      authenticate(req, res, next);

      assert.strictEqual(wasNextCalled(), false);
      assert.strictEqual(getStatus(), 401);
      assert.strictEqual(getBody().message, 'Your session has expired. Please log in again.');
    });

    it('should authenticate valid Bearer token and populate req.user', () => {
      const validToken = generateToken({
        userId: 'verified-user-1',
        email: 'alice@accessmap.org',
        role: 'user',
      });

      const { req, res, next, wasNextCalled } = createMockContext({
        headers: { authorization: `Bearer ${validToken}` },
      });

      authenticate(req, res, next);

      assert.strictEqual(wasNextCalled(), true);
      assert.strictEqual(req.user?.userId, 'verified-user-1');
      assert.strictEqual(req.user?.email, 'alice@accessmap.org');
      assert.strictEqual(req.user?.role, 'user');
    });

    it('should authenticate via HttpOnly cookie as alternative to Bearer header', () => {
      const validToken = generateToken({
        userId: 'cookie-user-1',
        email: 'cookie@accessmap.org',
        role: 'moderator',
      });

      const { req, res, next, wasNextCalled } = createMockContext({
        cookies: { [config.cookieName]: validToken },
      });

      authenticate(req, res, next);

      assert.strictEqual(wasNextCalled(), true);
      assert.strictEqual(req.user?.userId, 'cookie-user-1');
      assert.strictEqual(req.user?.role, 'moderator');
    });

    it('should successfully return profile via getMe controller', async () => {
      User.findById = (async () => ({
        id: 'u-1',
        name: 'Alice Wonder',
        email: 'alice@accessmap.org',
        role: 'user',
        toJSON() {
          return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
          };
        },
      })) as any;

      const { req, res, getStatus, getBody } = createMockContext({
        user: { userId: 'u-1', email: 'alice@accessmap.org', role: 'user' },
      });

      await getMe(req, res);

      assert.strictEqual(getStatus(), 200);
      assert.strictEqual(getBody().user.email, 'alice@accessmap.org');
      assert.strictEqual(getBody().user.name, 'Alice Wonder');
    });
  });

  describe('6. Role-Based Access Control (RBAC) & Endpoint Authorization', () => {
    it('should block regular user from accessing moderator/admin route (403 Forbidden)', () => {
      const guard = requireRole('moderator', 'admin');
      const { req, res, next, getStatus, getBody, wasNextCalled } = createMockContext({
        user: { userId: 'regular-user', email: 'reg@test.com', role: 'user' },
      });

      guard(req, res, next);

      assert.strictEqual(wasNextCalled(), false);
      assert.strictEqual(getStatus(), 403);
      assert.strictEqual(getBody().error, 'Forbidden');
      assert.strictEqual(
        getBody().message.includes('requires one of the following roles'),
        true
      );
    });

    it('should allow moderator through moderator/admin guard', () => {
      const guard = requireRole('moderator', 'admin');
      const { req, res, next, wasNextCalled } = createMockContext({
        user: { userId: 'mod-1', email: 'mod@accessmap.org', role: 'moderator' },
      });

      guard(req, res, next);
      assert.strictEqual(wasNextCalled(), true);
    });

    it('should allow admin through moderator/admin guard', () => {
      const guard = requireRole('moderator', 'admin');
      const { req, res, next, wasNextCalled } = createMockContext({
        user: { userId: 'admin-1', email: 'admin@accessmap.org', role: 'admin' },
      });

      guard(req, res, next);
      assert.strictEqual(wasNextCalled(), true);
    });

    it('should allow moderator to approve report and record audit trail', async () => {
      const mockReport = {
        id: 'report-abc',
        placeId: 'venue-1',
        placeName: 'City General Hospital',
        reportStatus: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: '',
        save: async () => {},
        toJSON() {
          return {
            id: this.id,
            placeId: this.placeId,
            placeName: this.placeName,
            reportStatus: this.reportStatus,
            reviewedBy: this.reviewedBy,
            reviewedAt: this.reviewedAt,
            reviewNotes: this.reviewNotes,
          };
        },
      };

      AccessibilityReport.findById = (async () => mockReport) as any;

      const { req, res, getStatus, getBody } = createMockContext({
        params: { id: 'report-abc' },
        body: { status: 'approved', reviewNotes: 'Verified ramp dimensions on-site' },
        user: { userId: 'mod-99', email: 'mod@accessmap.org', role: 'moderator' },
      });

      await updateReportStatus(req, res);

      assert.strictEqual(getStatus(), 200);
      assert.strictEqual(getBody().report.reportStatus, 'approved');
      assert.strictEqual(getBody().report.reviewNotes, 'Verified ramp dimensions on-site');
    });

    it('should scope report listing so regular users only see their own submissions', async () => {
      let capturedQuery: any = null;
      AccessibilityReport.find = ((query: any) => {
        capturedQuery = query;
        return {
          sort: () => ({
            limit: async () => [
              {
                id: 'my-report-1',
                placeName: 'My Local Library',
                toJSON() {
                  return { id: this.id, placeName: this.placeName };
                },
              },
            ],
          }),
        };
      }) as any;

      const { req, res, getStatus, getBody } = createMockContext({
        user: { userId: 'user-specific-123', email: 'user@test.com', role: 'user' },
      });

      await getReports(req, res);

      assert.strictEqual(getStatus(), 200);
      assert.strictEqual(capturedQuery['submittedBy.userId'], 'user-specific-123');
      assert.strictEqual(getBody().count, 1);
    });

    it('should provide administrative metrics to authorized moderators', async () => {
      AccessibilityReport.countDocuments = (async (query: any) => {
        if (query?.reportStatus === 'pending') return 3;
        if (query?.reportStatus === 'approved') return 12;
        if (query?.reportStatus === 'rejected') return 2;
        if (query?.temporaryObstacle) return 1;
        return 0;
      }) as any;

      const { req, res, getStatus, getBody } = createMockContext({
        user: { userId: 'mod-1', email: 'mod@accessmap.org', role: 'moderator' },
      });

      await getAdminMetrics(req, res);

      assert.strictEqual(getStatus(), 200);
      assert.strictEqual(getBody().pendingAudits, 3);
      assert.strictEqual(getBody().approvedAudits, 12);
      assert.strictEqual(getBody().activeObstacles, 1);
      assert.strictEqual(getBody().totalAudits, 17);
    });
  });

  describe('7. Logout Workflow', () => {
    it('should clear the access_token cookie on logout', async () => {
      const { req, res, getStatus, getBody, getClearedCookies } = createMockContext();

      await logout(req, res);

      assert.strictEqual(getStatus(), 200);
      assert.strictEqual(getBody().message, 'Successfully logged out');
      assert.strictEqual(getClearedCookies().includes(config.cookieName), true);
    });
  });
});
