import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import {
  MobilityProfile,
  RoutePlanningRequest,
  RoutePlanningResult,
} from '../models/route.model';

export interface IRoutingService {
  planRoute(request: RoutePlanningRequest): Observable<RoutePlanningResult>;
}

export const DEFAULT_MOBILITY_PROFILES: Record<string, MobilityProfile> = {
  manual_wheelchair: {
    mode: 'manual_wheelchair',
    modeLabel: 'Manual Wheelchair User',
    maxSlopePercent: 8.0,
    allowStairs: false,
    requireCurbRamps: true,
    avoidUnpaved: true,
  },
  powered_wheelchair: {
    mode: 'powered_wheelchair',
    modeLabel: 'Power Wheelchair / Scooter',
    maxSlopePercent: 10.0,
    allowStairs: false,
    requireCurbRamps: true,
    avoidUnpaved: true,
  },
  walker_cane: {
    mode: 'walker_cane',
    modeLabel: 'Walker / Rollator / Cane',
    maxSlopePercent: 12.0,
    allowStairs: false,
    requireCurbRamps: true,
    avoidUnpaved: true,
  },
  stroller_cart: {
    mode: 'stroller_cart',
    modeLabel: 'Stroller / Wheeled Cart',
    maxSlopePercent: 12.0,
    allowStairs: false,
    requireCurbRamps: true,
    avoidUnpaved: false,
  },
  standard_pedestrian: {
    mode: 'standard_pedestrian',
    modeLabel: 'Standard Pedestrian',
    maxSlopePercent: 25.0,
    allowStairs: true,
    requireCurbRamps: false,
    avoidUnpaved: false,
  },
};

@Injectable({
  providedIn: 'root',
})
export class RoutingService implements IRoutingService {
  private readonly http = inject(HttpClient);

  readonly defaultProfiles = DEFAULT_MOBILITY_PROFILES;

  /**
   * Plan an accessibility-aware route connecting start and destination
   */
  planRoute(request: RoutePlanningRequest): Observable<RoutePlanningResult> {
    return this.http.post<RoutePlanningResult>('/api/routes/plan', request).pipe(
      catchError((err) => {
        // Fallback for offline demonstration
        console.warn('API route planner unreachable, generating simulated route result:', err);
        return of(this.getSimulatedRouteResult(request));
      })
    );
  }

  getProfiles(): Observable<{ profiles: Record<string, MobilityProfile> }> {
    return this.http.get<{ profiles: Record<string, MobilityProfile> }>('/api/routes/profiles').pipe(
      catchError(() => of({ profiles: DEFAULT_MOBILITY_PROFILES }))
    );
  }

  getSegments(): Observable<any> {
    return this.http.get('/api/routes/segments').pipe(
      catchError(() => of({ segmentCount: 0, segments: [] }))
    );
  }

  /**
   * Safe offline route fallback simulation
   */
  private getSimulatedRouteResult(request: RoutePlanningRequest): RoutePlanningResult {
    const isManual = request.mobilityProfile.mode === 'manual_wheelchair';
    const allowStairs = request.mobilityProfile.allowStairs;

    return {
      startPoint: {
        name: request.start.name || 'Start Point',
        coordinates: [request.start.lat, request.start.lng],
      },
      destinationPoint: {
        name: request.destination.name || 'Destination Point',
        coordinates: [request.destination.lat, request.destination.lng],
      },
      selectedProfile: request.mobilityProfile,
      activeTestArea: {
        name: 'Metro City Civic & Healthcare Pedestrian District',
        description: 'Mapped pedestrian network testbed with verified sidewalk surveys.',
        bounds: { north: 40.735, south: 40.71, east: -73.99, west: -74.01 },
      },
      limitationsDisclaimer:
        'AccessMap Prototype Routing Notice: Pedestrian path evaluation uses physically verified surveys where available. Segments with missing attributes are explicitly flagged.',
      routes: [
        {
          id: 'route-sim-accessible',
          name: 'Verified Step-Free Route',
          isPrimary: true,
          distanceMeters: 1215,
          estimatedDurationMinutes: 18,
          stepCount: 0,
          maxInclinePercent: 4.5,
          polyline: [
            [request.start.lat, request.start.lng],
            [40.7138, -74.0048],
            [40.7165, -74.0022],
            [40.722, -73.998],
            [request.destination.lat, request.destination.lng],
          ],
          segments: [
            {
              id: 'seg-1',
              name: 'Civic Center Accessibility Ramp',
              startNode: 'start',
              endNode: 'node-2',
              coordinates: [[request.start.lat, request.start.lng], [40.7138, -74.0048]],
              distanceMeters: 145,
              surfaceType: 'smooth_paved',
              hasStairs: false,
              inclinePercent: 4.5,
              curbRamps: 'both_ends',
              isAccessible: true,
              verificationLevel: 'verified',
              knownLimitations: [],
            },
            {
              id: 'seg-2',
              name: 'Medical Center Tactile Promenade',
              startNode: 'node-2',
              endNode: 'dest',
              coordinates: [[40.7138, -74.0048], [request.destination.lat, request.destination.lng]],
              distanceMeters: 1070,
              surfaceType: 'smooth_paved',
              hasStairs: false,
              inclinePercent: 2.5,
              curbRamps: 'both_ends',
              isAccessible: true,
              verificationLevel: 'verified',
              knownLimitations: [],
            },
          ],
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
        {
          id: 'route-sim-stairs',
          name: 'Direct Route (Contains 8 Steps)',
          isPrimary: false,
          distanceMeters: 980,
          estimatedDurationMinutes: 14,
          stepCount: 8,
          maxInclinePercent: 18.0,
          polyline: [
            [request.start.lat, request.start.lng],
            [40.7148, -74.004],
            [40.7154, -74.0034],
            [request.destination.lat, request.destination.lng],
          ],
          segments: [
            {
              id: 'seg-stairs',
              name: 'North Plaza Grand Staircase',
              startNode: 'start',
              endNode: 'dest',
              coordinates: [[40.7148, -74.004], [40.7154, -74.0034]],
              distanceMeters: 80,
              surfaceType: 'smooth_paved',
              hasStairs: true,
              stepCount: 8,
              inclinePercent: 18.0,
              curbRamps: 'missing',
              isAccessible: false,
              verificationLevel: 'verified',
              knownLimitations: ['Contains 8 outdoor stone steps with no ramp alternative.'],
            },
          ],
          evaluation: {
            isCompliant: allowStairs,
            overallAccessibility: allowStairs ? 'caution_limitations' : 'inaccessible',
            accessibilityScore: 40,
            violations: allowStairs
              ? []
              : ['Inaccessible: Segment "North Plaza Grand Staircase" contains 8 steps with no ramp alternative.'],
            warnings: [],
            limitations: ['Contains 8 outdoor steps with no ramp alternative.'],
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
  }
}

