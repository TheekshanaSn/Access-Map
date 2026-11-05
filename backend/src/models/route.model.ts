export type MobilityMode =
  | 'manual_wheelchair'
  | 'powered_wheelchair'
  | 'walker_cane'
  | 'stroller_cart'
  | 'standard_pedestrian';

export type SurfaceType =
  | 'smooth_paved'
  | 'asphalt'
  | 'cobblestone'
  | 'gravel'
  | 'unpaved'
  | 'unknown';

export type CurbRampStatus =
  | 'both_ends'
  | 'one_end'
  | 'missing'
  | 'unknown';

export type DataVerificationLevel =
  | 'verified'
  | 'community'
  | 'inferred'
  | 'missing';

export type RouteAccessibilityStatus =
  | 'verified_accessible'
  | 'partially_unverified'
  | 'caution_limitations'
  | 'inaccessible';

export interface MobilityProfile {
  mode: MobilityMode;
  modeLabel?: string;
  maxSlopePercent: number; // e.g. 8 for manual wheelchair
  allowStairs: boolean;
  requireCurbRamps: boolean;
  avoidUnpaved: boolean;
}

export interface PathSegment {
  id: string;
  name: string;
  startNode: string;
  endNode: string;
  coordinates: [number, number][]; // [lat, lng] array
  distanceMeters: number;
  surfaceType: SurfaceType;
  hasStairs: boolean;
  stepCount?: number;
  inclinePercent: number; // Slope in percentage (e.g. 5 = 5%)
  curbRamps: CurbRampStatus;
  isAccessible: boolean;
  verificationLevel: DataVerificationLevel;
  knownLimitations: string[];
  temporaryObstacles?: string[];
}

export interface RouteEvaluation {
  isCompliant: boolean;
  overallAccessibility: RouteAccessibilityStatus;
  accessibilityScore: number; // 0 - 100
  violations: string[]; // Reasons why route does not meet selected profile
  warnings: string[]; // Cautions regarding unverified or missing data
  limitations: string[];
  verificationBreakdown: {
    verifiedPercent: number;
    communityPercent: number;
    inferredPercent: number;
    missingPercent: number;
  };
}

export interface PlannedRoute {
  id: string;
  name: string;
  isPrimary: boolean;
  distanceMeters: number;
  estimatedDurationMinutes: number;
  stepCount: number;
  maxInclinePercent: number;
  segments: PathSegment[];
  polyline: [number, number][];
  evaluation: RouteEvaluation;
}

export interface RoutePlanningRequest {
  start: {
    lat: number;
    lng: number;
    name?: string;
  };
  destination: {
    lat: number;
    lng: number;
    name?: string;
  };
  mobilityProfile: MobilityProfile;
}

export interface RoutePlanningResult {
  startPoint: {
    name: string;
    coordinates: [number, number];
  };
  destinationPoint: {
    name: string;
    coordinates: [number, number];
  };
  selectedProfile: MobilityProfile;
  routes: PlannedRoute[];
  activeTestArea: {
    name: string;
    description: string;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  limitationsDisclaimer: string;
}

