import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseOsmElement,
  importOsmElements,
  mapOsmTagsToCategory,
  RawOsmElement,
} from '../src/services/osmImport.service';
import { isWithinSriLanka, resolveNearestSriLankanLocation } from '../src/services/sriLankaGeo';
import {
  findPlaceByOsmId,
  createPlaceInStore,
  updatePlaceInStore,
} from '../src/services/placeStore';
import { importOsmDataset } from '../src/controllers/admin.controller';
import { SRI_LANKA_OSM_SAMPLE_FACILITIES } from '../src/data/sri-lanka-osm-sample';

/**
 * Lightweight in-process mock HTTP Request & Response harness.
 */
function createMockContext(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  user?: any;
} = {}) {
  let statusCode = 200;
  let responseBody: any = null;

  const req: any = {
    method: options.method || 'POST',
    url: options.url || '/api/admin/osm-import',
    headers: options.headers || {},
    body: options.body || {},
    user: options.user,
  };

  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: any) {
      responseBody = body;
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

describe('STEP 12: Sri Lanka OpenStreetMap Data Integration Test Suite', () => {
  describe('1. Geographic Boundary & Spatial Resolution', () => {
    it('should correctly identify coordinates within Sri Lanka bounds', () => {
      // Colombo Fort coordinates
      assert.strictEqual(isWithinSriLanka(6.9344, 79.8504), true);
      // Kandy coordinates
      assert.strictEqual(isWithinSriLanka(7.2906, 80.6337), true);
      // Jaffna coordinates
      assert.strictEqual(isWithinSriLanka(9.6615, 80.0255), true);
    });

    it('should reject coordinates outside Sri Lanka envelope', () => {
      // London coordinates
      assert.strictEqual(isWithinSriLanka(51.5074, -0.1278), false);
      // New York coordinates
      assert.strictEqual(isWithinSriLanka(40.7128, -74.006), false);
      // Indian Ocean far south
      assert.strictEqual(isWithinSriLanka(3.5, 80.0), false);
    });

    it('should resolve nearest Sri Lankan city and administrative district', () => {
      // Near Colombo National Hospital (lat: 6.9185, lng: 79.8685)
      const loc = resolveNearestSriLankanLocation(6.9185, 79.8685);
      assert.strictEqual(loc.name, 'Colombo');
      assert.strictEqual(loc.district, 'Colombo');
      assert.strictEqual(loc.province, 'Western');
    });
  });

  describe('2. OSM Tag Mapping & Category Identification', () => {
    it('should map hospitals and clinics to healthcare category', () => {
      const hospital = mapOsmTagsToCategory({ amenity: 'hospital' });
      assert.strictEqual(hospital.category, 'healthcare');

      const clinic = mapOsmTagsToCategory({ amenity: 'clinic' });
      assert.strictEqual(clinic.category, 'healthcare');

      const pharmacy = mapOsmTagsToCategory({ amenity: 'pharmacy' });
      assert.strictEqual(pharmacy.category, 'healthcare');
    });

    it('should map railway stations and bus stations to transport category', () => {
      const train = mapOsmTagsToCategory({ railway: 'station' });
      assert.strictEqual(train.category, 'transport');

      const bus = mapOsmTagsToCategory({ amenity: 'bus_station' });
      assert.strictEqual(bus.category, 'transport');
    });

    it('should map universities, colleges and schools to education category', () => {
      const uni = mapOsmTagsToCategory({ amenity: 'university' });
      assert.strictEqual(uni.category, 'education');

      const school = mapOsmTagsToCategory({ amenity: 'school' });
      assert.strictEqual(school.category, 'education');
    });

    it('should map town halls, police stations and post offices to government category', () => {
      const townhall = mapOsmTagsToCategory({ amenity: 'townhall' });
      assert.strictEqual(townhall.category, 'government');

      const police = mapOsmTagsToCategory({ amenity: 'police' });
      assert.strictEqual(police.category, 'government');
    });

    it('should map toilets to restroom category and parks to parks category', () => {
      const toilets = mapOsmTagsToCategory({ amenity: 'toilets' });
      assert.strictEqual(toilets.category, 'restroom');

      const park = mapOsmTagsToCategory({ leisure: 'park' });
      assert.strictEqual(park.category, 'parks');
    });
  });

  describe('3. Safe Parsing, Geospatial Structure & Zero False Claims', () => {
    it('should parse valid OSM element with GeoJSON 2dsphere location', () => {
      const raw: RawOsmElement = {
        type: 'node',
        id: 999111,
        lat: 6.9185,
        lon: 79.8685,
        tags: {
          amenity: 'hospital',
          name: 'Colombo Central Clinic',
          'name:si': 'කොළඹ මධ්‍යම සායනය',
          'addr:street': 'Ward Place',
          'addr:city': 'Colombo',
        },
      };

      const result = parseOsmElement(raw, 'test-batch');
      assert.ok(result);
      assert.strictEqual(result.osmId, 'node/999111');
      assert.strictEqual(result.candidate.name, 'Colombo Central Clinic');
      assert.strictEqual(result.candidate.category, 'healthcare');
      assert.strictEqual(result.candidate.coordinates?.lat, 6.9185);
      assert.strictEqual(result.candidate.coordinates?.lng, 79.8685);
      
      // Standard GeoJSON Point structure: [longitude, latitude]
      assert.strictEqual(result.candidate.location?.type, 'Point');
      assert.deepStrictEqual(result.candidate.location?.coordinates, [79.8685, 6.9185]);
      assert.strictEqual(result.candidate.dataSource, 'osm');
      assert.strictEqual(result.candidate.sourceAttribution, '© OpenStreetMap contributors, ODbL 1.0');
    });

    it('never marks a place accessible simply because it exists in OSM', () => {
      const raw: RawOsmElement = {
        type: 'node',
        id: 999222,
        lat: 7.2906,
        lon: 80.6337,
        tags: {
          amenity: 'library',
          name: 'Kandy Municipal Reading Room',
          // No wheelchair tag
        },
      };

      const result = parseOsmElement(raw, 'test-batch');
      assert.ok(result);
      // Crucial requirement: Must be pending_verification, not verified
      assert.strictEqual(result.candidate.verifiedStatus, 'pending_verification');
      assert.strictEqual(result.candidate.accessibilityAuditStatus, 'unverified_osm');
      // Must not assume step-free entrance exists
      assert.strictEqual(result.candidate.amenities?.stepFreeEntrance, false);
      assert.strictEqual(result.candidate.amenities?.ramp.available, false);
      // Rating must not be fake
      assert.strictEqual(result.candidate.overallRating, 0);
      assert.strictEqual(result.candidate.reviewCount, 0);
    });

    it('marks wheelchair=yes as pending_verification requiring physical audit', () => {
      const raw: RawOsmElement = {
        type: 'node',
        id: 999333,
        lat: 6.0535,
        lon: 80.221,
        tags: {
          amenity: 'hospital',
          name: 'Galle Healthcare Facility',
          wheelchair: 'yes',
        },
      };

      const result = parseOsmElement(raw, 'test-batch');
      assert.ok(result);
      assert.strictEqual(result.candidate.amenities?.stepFreeEntrance, true);
      // Still requires community/moderator verification!
      assert.strictEqual(result.candidate.verifiedStatus, 'pending_verification');
    });

    it('rejects elements outside Sri Lanka bounding box with clear error', () => {
      const foreignNode: RawOsmElement = {
        type: 'node',
        id: 888777,
        lat: 13.0827, // Chennai, India
        lon: 80.2707,
        tags: { amenity: 'hospital', name: 'Madras General Hospital' },
      };

      assert.throws(() => {
        parseOsmElement(foreignNode, 'test-batch');
      }, /outside Sri Lanka geographic envelope/);
    });
  });

  describe('4. Duplicate Prevention & Non-Destructive Update Pipeline', () => {
    it('should import sample facilities and prevent duplicate creations on re-import', async () => {
      const sampleItem = SRI_LANKA_OSM_SAMPLE_FACILITIES[0]; // National Hospital of Sri Lanka
      const osmId = `${sampleItem.type}/${sampleItem.id}`;

      // First import
      const summary1 = await importOsmElements([sampleItem], {
        batchId: 'batch-test-1',
        sourceName: 'Sample Test',
      });
      assert.strictEqual(summary1.totalElements, 1);
      assert.strictEqual(summary1.errorCount, 0);

      // Verify place is in store
      const placeInDb = await findPlaceByOsmId(osmId);
      assert.ok(placeInDb);
      assert.strictEqual(placeInDb.osmId, osmId);
      assert.strictEqual(placeInDb.category, 'healthcare');

      // Second import with same element: MUST NOT insert duplicate
      const summary2 = await importOsmElements([sampleItem], {
        batchId: 'batch-test-2',
        sourceName: 'Sample Test Duplicate Check',
      });
      assert.strictEqual(summary2.importedCount, 0);
      assert.strictEqual(summary2.updatedCount, 1);
    });

    it('must NEVER overwrite community-verified reports with imported OSM data', async () => {
      const testNode: RawOsmElement = {
        type: 'node',
        id: 777666,
        lat: 6.9271,
        lon: 79.8612,
        tags: {
          amenity: 'hospital',
          name: 'Community Audited Clinic',
          wheelchair: 'no', // OSM says no
        },
      };

      // 1. Initial creation
      await importOsmElements([testNode], { batchId: 'batch-init' });
      const initial = await findPlaceByOsmId('node/777666');
      assert.ok(initial);

      // 2. Simulate community audit verification
      await updatePlaceInStore(initial.id, {
        verifiedStatus: 'community_verified',
        overallRating: 4.8,
        reviewCount: 12,
        amenities: {
          stepFreeEntrance: true, // Physical audit verified ramp exists!
          ramp: { available: true, slope: 'gentle', hasHandrails: true },
          doorWidthCm: 110,
          automatedDoor: true,
          elevator: { available: true, workingStatus: 'operational', auditoryPrompts: true, brailleButtons: true },
          accessibleRestroom: { available: true, grabBars: true, rollInSink: true, emergencyCord: true, groundFloorOrElevator: true },
          disabledParking: { available: true, bayCount: 4, distanceToEntranceMeters: 10 },
          brailleSignage: true,
          hearingLoop: true,
          quietHoursAvailable: false,
        },
      });

      // 3. Re-run import with conflicting OSM data
      const reimportNode: RawOsmElement = {
        type: 'node',
        id: 777666,
        lat: 6.9272, // Slight GPS refinement
        lon: 79.8613,
        tags: {
          amenity: 'hospital',
          name: 'Community Audited Clinic',
          wheelchair: 'no',
        },
      };

      const reimportSummary = await importOsmElements([reimportNode], { batchId: 'batch-update' });
      assert.strictEqual(reimportSummary.preservedCommunityCount, 1);
      assert.strictEqual(reimportSummary.updatedCount, 0);

      // 4. Verify verified status and amenities were preserved intact!
      const afterPlace = await findPlaceByOsmId('node/777666');
      assert.strictEqual(afterPlace?.verifiedStatus, 'community_verified');
      assert.strictEqual(afterPlace?.overallRating, 4.8);
      assert.strictEqual(afterPlace?.reviewCount, 12);
      assert.strictEqual(afterPlace?.amenities.stepFreeEntrance, true);
      assert.strictEqual(afterPlace?.amenities.ramp.available, true);
    });
  });

  describe('5. Admin Controller Endpoint Integration', () => {
    it('should successfully trigger sample dataset import via admin endpoint', async () => {
      const { req, res, getStatus, getBody } = createMockContext({
        body: {
          sample: true,
          dryRun: true,
        },
        user: {
          userId: 'admin-1',
          email: 'admin@accessmap.org',
          role: 'admin',
        },
      });

      await importOsmDataset(req, res);
      assert.strictEqual(getStatus(), 200);
      const body = getBody();
      assert.ok(body.summary);
      assert.strictEqual(body.summary.dryRun, true);
      assert.strictEqual(body.summary.totalElements, SRI_LANKA_OSM_SAMPLE_FACILITIES.length);
      assert.strictEqual(body.summary.errorCount, 0);
    });
  });
});

