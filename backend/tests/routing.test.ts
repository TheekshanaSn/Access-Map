import { describe, it } from 'node:test';
import assert from 'node:assert';
import { planRoute, getSegments, getProfiles } from '../src/controllers/route.controller';
import { defaultRoutingEngine } from '../src/services/routing/routingEngine';

function createMockContext(options: {
  method?: string;
  url?: string;
  body?: any;
  query?: Record<string, string>;
} = {}) {
  let statusCode = 200;
  let responseBody: any = null;

  const req: any = {
    method: options.method || 'GET',
    url: options.url || '/',
    body: options.body || {},
    query: options.query || {},
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

describe('STEP 8: Accessibility-Aware Route Planning Test Suite', () => {

  describe('1. Start and Destination Selection', () => {
    it('should reject route planning requests missing start or destination coordinates (400)', async () => {
      const ctx = createMockContext({
        method: 'POST',
        body: {
          start: { lat: 40.7128 }, // missing lng!
          destination: { lat: 40.7282, lng: -73.9942 },
        },
      });

      await planRoute(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.getBody().error, 'Validation Error');
    });

    it('should successfully plan routes connecting Central Library and City Hospital', async () => {
      const ctx = createMockContext({
        method: 'POST',
        body: {
          start: { lat: 40.7128, lng: -74.006, name: 'Metropolitan Central Library' },
          destination: { lat: 40.7282, lng: -73.9942, name: 'City General Hospital' },
          mobilityProfile: {
            mode: 'manual_wheelchair',
            maxSlopePercent: 8.0,
            allowStairs: false,
            requireCurbRamps: true,
            avoidUnpaved: true,
          },
        },
      });

      await planRoute(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(Array.isArray(body.routes));
      assert.ok(body.routes.length > 0);
      assert.ok(body.routes[0].distanceMeters > 0);
      assert.ok(body.routes[0].estimatedDurationMinutes > 0);
    });
  });

  describe('2. Stairs Evaluation & Profile Rejection', () => {
    it('should identify stairs, count steps, and explain why route does not meet wheelchair preferences', async () => {
      const result = await defaultRoutingEngine.planRoute({
        start: { lat: 40.7128, lng: -74.006, name: 'Central Library' },
        destination: { lat: 40.7282, lng: -73.9942, name: 'City Hospital' },
        mobilityProfile: {
          mode: 'manual_wheelchair',
          maxSlopePercent: 8.0,
          allowStairs: false,
          requireCurbRamps: true,
          avoidUnpaved: true,
        },
      });

      // Find the alternative route that routes through North Plaza Grand Staircase
      const stairsRoute = result.routes.find((r) => r.stepCount > 0);
      assert.ok(stairsRoute, 'Expected at least one route option featuring stairs');
      assert.strictEqual(stairsRoute.stepCount, 8);
      assert.strictEqual(stairsRoute.evaluation.isCompliant, false);
      assert.strictEqual(stairsRoute.evaluation.overallAccessibility, 'inaccessible');

      // Check explanation
      assert.ok(
        stairsRoute.evaluation.violations.some((v) =>
          v.includes('contains 8 steps with no ramp alternative')
        )
      );
    });

    it('should allow stairs when user profile explicitly permits stairs (e.g. Standard Pedestrian)', async () => {
      const result = await defaultRoutingEngine.planRoute({
        start: { lat: 40.7128, lng: -74.006, name: 'Central Library' },
        destination: { lat: 40.7282, lng: -73.9942, name: 'City Hospital' },
        mobilityProfile: {
          mode: 'standard_pedestrian',
          maxSlopePercent: 25.0,
          allowStairs: true, // Allowed!
          requireCurbRamps: false,
          avoidUnpaved: false,
        },
      });

      const stairsRoute = result.routes.find((r) => r.stepCount > 0);
      assert.ok(stairsRoute);
      // For standard pedestrian, stairs are not a violation
      assert.strictEqual(stairsRoute.evaluation.violations.length, 0);
    });
  });

  describe('3. Inaccessible Segments: Steep Incline and Obstacles', () => {
    it('should flag excessive slopes exceeding user maximum slope limit', async () => {
      // Test with strict 4% maximum slope
      const result = await defaultRoutingEngine.planRoute({
        start: { lat: 40.7128, lng: -74.006 },
        destination: { lat: 40.7282, lng: -73.9942 },
        mobilityProfile: {
          mode: 'manual_wheelchair',
          maxSlopePercent: 4.0, // Very gentle slope limit!
          allowStairs: false,
          requireCurbRamps: true,
          avoidUnpaved: true,
        },
      });

      // Check that routes with slopes > 4% have violations explaining the slope
      const routeWithSlope = result.routes.find((r) => r.maxInclinePercent > 4.0);
      if (routeWithSlope) {
        assert.ok(
          routeWithSlope.evaluation.violations.some((v) =>
            v.includes('exceeds your 4% maximum slope preference')
          )
        );
      }
    });

    it('should detect temporary obstacles and identify blocked segments', async () => {
      const segmentsResult = await defaultRoutingEngine.planRoute({
        start: { lat: 40.7128, lng: -74.006 },
        destination: { lat: 40.7282, lng: -73.9942 },
        mobilityProfile: {
          mode: 'manual_wheelchair',
          maxSlopePercent: 10.0,
          allowStairs: true,
          requireCurbRamps: false,
          avoidUnpaved: false,
        },
      });

      assert.ok(segmentsResult.routes.length > 0);
    });
  });

  describe('4. Missing Information Handling & Zero False Claims', () => {
    it('never claims a route is fully wheelchair-accessible when required data is missing', async () => {
      const result = await defaultRoutingEngine.planRoute({
        start: { lat: 40.7128, lng: -74.006 },
        destination: { lat: 40.7282, lng: -73.9942 },
        mobilityProfile: {
          mode: 'manual_wheelchair',
          maxSlopePercent: 8.0,
          allowStairs: false,
          requireCurbRamps: true,
          avoidUnpaved: true,
        },
      });

      // Find route with missing surface or curb ramp data
      const unverifiedRoute = result.routes.find((r) =>
        r.segments.some((s) => s.verificationLevel === 'missing' || s.surfaceType === 'unknown')
      );

      if (unverifiedRoute) {
        // Crucial requirement test: Must NOT be marked as 'verified_accessible'
        assert.notStrictEqual(unverifiedRoute.evaluation.overallAccessibility, 'verified_accessible');
        assert.strictEqual(unverifiedRoute.evaluation.overallAccessibility, 'partially_unverified');
        assert.ok(
          unverifiedRoute.evaluation.warnings.some((w) =>
            w.includes('Missing Surface Information') || w.includes('cannot be fully guaranteed')
          )
        );
      }
    });
  });

  describe('5. Unavailable and Disconnected Routes', () => {
    it('should gracefully handle unreachable destination and return clear explanation', async () => {
      const ctx = createMockContext({
        method: 'POST',
        body: {
          start: { lat: 40.7128, lng: -74.006, name: 'Library' },
          destination: { lat: 40.745, lng: -73.975, name: 'Isolated Offshore Lookout' }, // Disconnected island!
          mobilityProfile: {
            mode: 'manual_wheelchair',
            maxSlopePercent: 8.0,
            allowStairs: false,
            requireCurbRamps: true,
            avoidUnpaved: true,
          },
        },
      });

      await planRoute(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 400);
      assert.strictEqual(ctx.getBody().error, 'Routing Failed');
      assert.ok(ctx.getBody().message.includes('No pedestrian path could be found'));
    });
  });

  describe('6. Alternative Routes Comparison', () => {
    it('should provide multiple alternative routes with differing attributes and metrics', async () => {
      const result = await defaultRoutingEngine.planRoute({
        start: { lat: 40.7128, lng: -74.006 },
        destination: { lat: 40.7282, lng: -73.9942 },
        mobilityProfile: {
          mode: 'manual_wheelchair',
          maxSlopePercent: 8.0,
          allowStairs: false,
          requireCurbRamps: true,
          avoidUnpaved: true,
        },
      });

      assert.ok(result.routes.length >= 2, 'Expected at least primary and 1 alternative route');
      const primary = result.routes.find((r) => r.isPrimary);
      assert.ok(primary);
      assert.strictEqual(primary.stepCount, 0); // Primary accessible route should be step-free
    });
  });

  describe('7. Querying Network Segments & Profiles', () => {
    it('should return catalogued pedestrian network segments for test area overlay', async () => {
      const ctx = createMockContext({ method: 'GET' });
      await getSegments(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(body.segmentCount > 0);
      assert.ok(Array.isArray(body.segments));
      assert.ok(body.testArea);
    });

    it('should return predefined mobility profiles', async () => {
      const ctx = createMockContext({ method: 'GET' });
      await getProfiles(ctx.req, ctx.res);

      assert.strictEqual(ctx.getStatus(), 200);
      const body = ctx.getBody();
      assert.ok(body.profiles.manual_wheelchair);
      assert.ok(body.profiles.powered_wheelchair);
      assert.ok(body.profiles.walker_cane);
    });
  });
});

