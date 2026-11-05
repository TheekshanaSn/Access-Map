import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RoutingService, DEFAULT_MOBILITY_PROFILES } from './routing.service';
import { RoutePlanningRequest, RoutePlanningResult } from '../models/route.model';

describe('RoutingService', () => {
  let service: RoutingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoutingService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RoutingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and provide default mobility profiles', () => {
    expect(service).toBeTruthy();
    expect(service.defaultProfiles).toBeDefined();
    expect(service.defaultProfiles['manual_wheelchair']).toBeDefined();
    expect(service.defaultProfiles['manual_wheelchair'].maxSlopePercent).toBe(8.0);
    expect(service.defaultProfiles['manual_wheelchair'].allowStairs).toBe(false);
  });

  it('should plan route via POST /api/routes/plan', () => {
    const request: RoutePlanningRequest = {
      start: { lat: 40.7128, lng: -74.006, name: 'Library' },
      destination: { lat: 40.725, lng: -73.996, name: 'Hospital' },
      mobilityProfile: DEFAULT_MOBILITY_PROFILES['manual_wheelchair'],
    };

    let result: RoutePlanningResult | undefined;
    service.planRoute(request).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne('/api/routes/plan');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.start.name).toBe('Library');

    const mockResponse: RoutePlanningResult = {
      startPoint: { name: 'Library', coordinates: [40.7128, -74.006] },
      destinationPoint: { name: 'Hospital', coordinates: [40.725, -73.996] },
      selectedProfile: DEFAULT_MOBILITY_PROFILES['manual_wheelchair'],
      activeTestArea: {
        name: 'Metro City Civic & Healthcare Pedestrian District',
        description: 'Testbed',
        bounds: { north: 40.735, south: 40.71, east: -73.99, west: -74.01 },
      },
      limitationsDisclaimer: 'Prototype notice',
      routes: [
        {
          id: 'route-1',
          name: 'Primary Step-Free Route',
          isPrimary: true,
          distanceMeters: 1215,
          estimatedDurationMinutes: 18,
          stepCount: 0,
          maxInclinePercent: 4.5,
          polyline: [[40.7128, -74.006], [40.725, -73.996]],
          segments: [],
          evaluation: {
            isCompliant: true,
            overallAccessibility: 'verified_accessible',
            accessibilityScore: 98,
            violations: [],
            warnings: [],
            limitations: [],
            verificationBreakdown: {
              verifiedPercent: 100,
              communityPercent: 0,
              inferredPercent: 0,
              missingPercent: 0,
            },
          },
        },
      ],
    };

    req.flush(mockResponse);

    expect(result).toBeDefined();
    expect(result?.routes.length).toBe(1);
    expect(result?.routes[0].isPrimary).toBe(true);
    expect(result?.routes[0].evaluation.overallAccessibility).toBe('verified_accessible');
  });

  it('should fall back gracefully to simulation when backend API is unreachable', () => {
    const request: RoutePlanningRequest = {
      start: { lat: 40.7128, lng: -74.006, name: 'Library' },
      destination: { lat: 40.725, lng: -73.996, name: 'Hospital' },
      mobilityProfile: DEFAULT_MOBILITY_PROFILES['manual_wheelchair'],
    };

    let result: RoutePlanningResult | undefined;
    service.planRoute(request).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne('/api/routes/plan');
    req.error(new ProgressEvent('Network error'));

    expect(result).toBeDefined();
    expect(result?.routes.length).toBeGreaterThan(0);
    expect(result?.limitationsDisclaimer).toContain('AccessMap Prototype Routing Notice');
  });

  it('should fetch remote profiles from /api/routes/profiles with fallback', () => {
    let profiles: Record<string, any> | undefined;
    service.getProfiles().subscribe((res) => {
      profiles = res.profiles;
    });

    const req = httpMock.expectOne('/api/routes/profiles');
    req.flush({ profiles: DEFAULT_MOBILITY_PROFILES });

    expect(profiles).toBeDefined();
    expect(profiles?.['manual_wheelchair'].maxSlopePercent).toBe(8.0);
  });
});

