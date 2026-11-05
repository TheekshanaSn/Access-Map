import { PathSegment } from '../../models/route.model';

export interface NetworkNode {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
}

export const TEST_AREA_INFO = {
  name: 'Metro City Civic & Healthcare Pedestrian District',
  description: 'Initial mapped pedestrian network testbed with verified sidewalk segments, curb ramp surveys, and tactile gradients.',
  bounds: {
    north: 40.735,
    south: 40.710,
    east: -73.990,
    west: -74.010,
  },
};

export const PEDESTRIAN_NODES: Record<string, NetworkNode> = {
  'node-library': {
    id: 'node-library',
    name: 'Metropolitan Central Library Entrance',
    coordinates: [40.7128, -74.006],
  },
  'node-plaza-west': {
    id: 'node-plaza-west',
    name: 'Civic Plaza West Accessible Ramp',
    coordinates: [40.7138, -74.0048],
  },
  'node-plaza-north-top': {
    id: 'node-plaza-north-top',
    name: 'North Plaza Upper Promenade',
    coordinates: [40.7148, -74.004],
  },
  'node-plaza-north-bottom': {
    id: 'node-plaza-north-bottom',
    name: 'North Plaza Lower Basin (Foot of Steps)',
    coordinates: [40.7154, -74.0034],
  },
  'node-civic-esplanade': {
    id: 'node-civic-esplanade',
    name: 'Civic Center Step-Free Esplanade',
    coordinates: [40.7165, -74.0022],
  },
  'node-market-south': {
    id: 'node-market-south',
    name: 'Historical Market South Gateway',
    coordinates: [40.7162, -74.0048],
  },
  'node-market-north': {
    id: 'node-market-north',
    name: 'Historical Market North Archway',
    coordinates: [40.7198, -74.0026],
  },
  'node-hill-bottom': {
    id: 'node-hill-bottom',
    name: 'Civic Hill Foot',
    coordinates: [40.7172, -74.0008],
  },
  'node-hill-top': {
    id: 'node-hill-top',
    name: 'Civic Hill Crest',
    coordinates: [40.7192, -73.9988],
  },
  'node-5th-ave-crossing': {
    id: 'node-5th-ave-crossing',
    name: '5th Avenue & Health Way Junction',
    coordinates: [40.722, -73.998],
  },
  'node-hospital-west': {
    id: 'node-hospital-west',
    name: 'City Hospital West Service Gate',
    coordinates: [40.7252, -73.9962],
  },
  'node-hospital-main': {
    id: 'node-hospital-main',
    name: 'City General Hospital Main OPD Pavilion',
    coordinates: [40.7282, -73.9942],
  },
  'node-isolated-island': {
    id: 'node-isolated-island',
    name: 'Isolated Offshore River Lookout',
    coordinates: [40.745, -73.975],
  },
};

export const PEDESTRIAN_SEGMENTS: PathSegment[] = [
  // Segment 1: Library to Plaza West (Verified step-free gentle ramp)
  {
    id: 'seg-lib-plaza-west',
    name: 'Central Library West Accessibility Ramp',
    startNode: 'node-library',
    endNode: 'node-plaza-west',
    coordinates: [
      [40.7128, -74.006],
      [40.7133, -74.0054],
      [40.7138, -74.0048],
    ],
    distanceMeters: 145,
    surfaceType: 'smooth_paved',
    hasStairs: false,
    inclinePercent: 4.5, // 1:22 gradient, well below 8%
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'verified',
    knownLimitations: [],
  },

  // Segment 2: Plaza West to Civic Esplanade (Verified step-free path)
  {
    id: 'seg-plaza-esplanade',
    name: 'Civic Center Wide Shared Path',
    startNode: 'node-plaza-west',
    endNode: 'node-civic-esplanade',
    coordinates: [
      [40.7138, -74.0048],
      [40.7152, -74.0035],
      [40.7165, -74.0022],
    ],
    distanceMeters: 290,
    surfaceType: 'smooth_paved',
    hasStairs: false,
    inclinePercent: 2.0,
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'verified',
    knownLimitations: [],
  },

  // Segment 3: Plaza West to North Plaza Upper
  {
    id: 'seg-plaza-north-top',
    name: 'Plaza Upper Walkway',
    startNode: 'node-plaza-west',
    endNode: 'node-plaza-north-top',
    coordinates: [
      [40.7138, -74.0048],
      [40.7148, -74.004],
    ],
    distanceMeters: 130,
    surfaceType: 'smooth_paved',
    hasStairs: false,
    inclinePercent: 3.0,
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'verified',
    knownLimitations: [],
  },

  // Segment 4: North Plaza Staircase (STAIRS TEST CASE — 8 steps, no ramp)
  {
    id: 'seg-north-staircase',
    name: 'North Plaza Grand Staircase',
    startNode: 'node-plaza-north-top',
    endNode: 'node-plaza-north-bottom',
    coordinates: [
      [40.7148, -74.004],
      [40.7154, -74.0034],
    ],
    distanceMeters: 80,
    surfaceType: 'smooth_paved',
    hasStairs: true,
    stepCount: 8,
    inclinePercent: 18.0,
    curbRamps: 'missing',
    isAccessible: false,
    verificationLevel: 'verified',
    knownLimitations: [
      'Contains 8 outdoor stone steps with no ramp alternative.',
      'Inaccessible to wheelchairs and wheeled mobility aids.',
    ],
  },

  // Segment 5: North Plaza Bottom to Civic Esplanade
  {
    id: 'seg-north-bottom-esplanade',
    name: 'Lower Fountain Paved Link',
    startNode: 'node-plaza-north-bottom',
    endNode: 'node-civic-esplanade',
    coordinates: [
      [40.7154, -74.0034],
      [40.7165, -74.0022],
    ],
    distanceMeters: 135,
    surfaceType: 'smooth_paved',
    hasStairs: false,
    inclinePercent: 1.5,
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'verified',
    knownLimitations: [],
  },

  // Segment 6: Civic Esplanade to 5th Ave Crossing (Direct step-free arterial)
  {
    id: 'seg-esplanade-5th',
    name: 'Civic Boulevard Pedestrian Way',
    startNode: 'node-civic-esplanade',
    endNode: 'node-5th-ave-crossing',
    coordinates: [
      [40.7165, -74.0022],
      [40.7192, -74.0001],
      [40.722, -73.998],
    ],
    distanceMeters: 380,
    surfaceType: 'smooth_paved',
    hasStairs: false,
    inclinePercent: 2.8,
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'verified',
    knownLimitations: [],
  },

  // Segment 7: Plaza West to Market South (Connection to old market)
  {
    id: 'seg-plaza-market-south',
    name: 'Market South Approach',
    startNode: 'node-plaza-west',
    endNode: 'node-market-south',
    coordinates: [
      [40.7138, -74.0048],
      [40.7162, -74.0048],
    ],
    distanceMeters: 260,
    surfaceType: 'asphalt',
    hasStairs: false,
    inclinePercent: 3.0,
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'community',
    knownLimitations: [],
  },

  // Segment 8: Old Market Alley (SURFACE TEST CASE — Cobblestone with high vibration)
  {
    id: 'seg-market-cobblestone',
    name: 'Historic Old Market Cobblestone Way',
    startNode: 'node-market-south',
    endNode: 'node-market-north',
    coordinates: [
      [40.7162, -74.0048],
      [40.718, -74.0037],
      [40.7198, -74.0026],
    ],
    distanceMeters: 420,
    surfaceType: 'cobblestone',
    hasStairs: false,
    inclinePercent: 3.5,
    curbRamps: 'one_end',
    isAccessible: false, // Inconvenient/difficult for manual wheelchairs
    verificationLevel: 'community',
    knownLimitations: [
      'Historic cobblestone surface generates severe rolling vibration for manual wheelchairs and rollators.',
      'North exit has a 6cm vertical curb lip with no ramp cutout.',
    ],
  },

  // Segment 9: Market North to 5th Ave Crossing
  {
    id: 'seg-market-5th',
    name: 'North Market Connector',
    startNode: 'node-market-north',
    endNode: 'node-5th-ave-crossing',
    coordinates: [
      [40.7198, -74.0026],
      [40.722, -73.998],
    ],
    distanceMeters: 310,
    surfaceType: 'asphalt',
    hasStairs: false,
    inclinePercent: 2.5,
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'inferred',
    knownLimitations: [],
  },

  // Segment 10: Civic Hill Incline (INCLINE TEST CASE — 12% slope, exceeds 8% wheelchair limit)
  {
    id: 'seg-civic-hill-steep',
    name: 'Civic Hill Scenic Incline',
    startNode: 'node-hill-bottom',
    endNode: 'node-hill-top',
    coordinates: [
      [40.7172, -74.0008],
      [40.7182, -73.9998],
      [40.7192, -73.9988],
    ],
    distanceMeters: 260,
    surfaceType: 'asphalt',
    hasStairs: false,
    inclinePercent: 12.0, // 12% slope!
    curbRamps: 'both_ends',
    isAccessible: false, // Too steep for manual wheelchair
    verificationLevel: 'verified',
    knownLimitations: [
      'Incline reaches 12.0%, significantly exceeding ADA/standard 8.33% (1:12) wheelchair limit.',
      'Hazardous for unassisted manual wheelchair users without anti-tip wheels.',
    ],
  },

  // Segment 11: 5th Ave Crossing to Hospital West (OBSTACLE TEST CASE — Construction scaffolding)
  {
    id: 'seg-hospital-west-obstacle',
    name: 'Hospital West Access Avenue',
    startNode: 'node-5th-ave-crossing',
    endNode: 'node-hospital-west',
    coordinates: [
      [40.722, -73.998],
      [40.7236, -73.9971],
      [40.7252, -73.9962],
    ],
    distanceMeters: 370,
    surfaceType: 'smooth_paved',
    hasStairs: false,
    inclinePercent: 2.0,
    curbRamps: 'both_ends',
    isAccessible: false,
    verificationLevel: 'verified',
    knownLimitations: [
      'Sidewalk fully obstructed by construction scaffolding until next month.',
    ],
    temporaryObstacles: ['Active construction scaffolding blocks pedestrian path at Gate 2'],
  },

  // Segment 12: 5th Ave Crossing to Hospital Main Direct (MISSING DATA TEST CASE)
  // CRITICAL REQUIREMENT: Do not silently treat missing attributes as accessible!
  {
    id: 'seg-hospital-direct-unverified',
    name: 'North Health Corridor Extension',
    startNode: 'node-5th-ave-crossing',
    endNode: 'node-hospital-main',
    coordinates: [
      [40.722, -73.998],
      [40.7251, -73.9961],
      [40.7282, -73.9942],
    ],
    distanceMeters: 740,
    surfaceType: 'unknown', // Missing surface data!
    hasStairs: false,
    inclinePercent: 0,
    curbRamps: 'unknown', // Missing curb ramp data!
    isAccessible: true, // Unknown if truly accessible
    verificationLevel: 'missing', // Unverified!
    knownLimitations: [
      'Surface material and curb ramp presence have not been physically audited.',
      'Cannot guarantee step-free transition or rolling smoothness.',
    ],
  },

  // Segment 13: 5th Ave Crossing to Hospital Main Promenade (VERIFIED STEP-FREE PROMENADE)
  {
    id: 'seg-hospital-main-promenade',
    name: 'Medical Center Step-Free Tactile Promenade',
    startNode: 'node-5th-ave-crossing',
    endNode: 'node-hospital-main',
    coordinates: [
      [40.722, -73.998],
      [40.7235, -73.9958],
      [40.726, -73.9948],
      [40.7282, -73.9942],
    ],
    distanceMeters: 780,
    surfaceType: 'smooth_paved',
    hasStairs: false,
    inclinePercent: 2.5,
    curbRamps: 'both_ends',
    isAccessible: true,
    verificationLevel: 'verified',
    knownLimitations: [],
  },
];

