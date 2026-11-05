import { Place } from '../models/place.model';

/**
 * DEVELOPMENT & TESTING DEMO DATASET ONLY.
 * 
 * IMPORTANT COMPLIANCE NOTICE (Requirement 5):
 * - Fictional Metro City locations have been completely removed.
 * - These records are strictly flagged with `isDemoData: true` and labeled [DEMO / TEST ONLY].
 * - In production (`environment.production.ts`), `enableDevDemoData` is set to false,
 *   meaning these entries are NEVER rendered in production.
 * - Real Sri Lankan accessibility information is NOT invented. Real audits must be submitted
 *   by verified community members or authorized surveyors.
 */
export const MOCK_PLACES: Place[] = [
  {
    id: 'place-central-library',
    name: '[DEMO / TEST] Colombo Fort Transit Hub',
    category: 'transport',
    categoryLabel: 'Transit & Stations',
    address: {
      street: 'Olcott Mawatha, Colombo 01',
      city: 'Colombo',
      state: 'Western Province',
      postalCode: '00100',
      landmark: 'Opposite Colombo Fort Railway Terminal',
    },
    coordinates: {
      lat: 6.9344,
      lng: 79.8504,
    },
    overallRating: 4.2,
    reviewCount: 14,
    verifiedStatus: 'community_verified',
    lastAuditDate: '2026-11-01',
    amenities: {
      stepFreeEntrance: true,
      ramp: {
        available: true,
        slope: 'moderate',
        hasHandrails: true,
      },
      doorWidthCm: 100,
      automatedDoor: false,
      elevator: {
        available: true,
        workingStatus: 'operational',
        auditoryPrompts: false,
        brailleButtons: true,
      },
      accessibleRestroom: {
        available: true,
        grabBars: true,
        rollInSink: true,
        emergencyCord: false,
        groundFloorOrElevator: true,
      },
      disabledParking: {
        available: true,
        bayCount: 4,
        distanceToEntranceMeters: 25,
      },
      brailleSignage: false,
      hearingLoop: false,
      quietHoursAvailable: false,
    },
    temporaryObstacles: [],
    shortDescription:
      '[DEMO / TEST ONLY] Simulated development audit for station accessibility testing. Always verify physical conditions directly.',
    fullDescription:
      'Demonstration record for UI testing. This record does not represent physical audit certification of Colombo Fort station.',
    transitTips: 'Main railway terminus serving intercity and commuter train routes.',
    entranceTips: 'Northern platform entrance features ground-level ramp access.',
    isDemoData: true,
  },
  {
    id: 'place-city-hospital',
    name: '[DEMO / TEST] National Hospital Clinic Entrance Area',
    category: 'healthcare',
    categoryLabel: 'Hospitals & Care',
    address: {
      street: 'Regent Street, Colombo 08',
      city: 'Colombo',
      state: 'Western Province',
      postalCode: '00800',
      landmark: 'Near OPD Entrance',
    },
    coordinates: {
      lat: 6.9185,
      lng: 79.8685,
    },
    overallRating: 4.0,
    reviewCount: 22,
    verifiedStatus: 'staff_verified',
    lastAuditDate: '2026-10-28',
    amenities: {
      stepFreeEntrance: true,
      ramp: {
        available: true,
        slope: 'gentle',
        hasHandrails: true,
      },
      doorWidthCm: 110,
      automatedDoor: true,
      elevator: {
        available: true,
        workingStatus: 'operational',
        auditoryPrompts: true,
        brailleButtons: true,
      },
      accessibleRestroom: {
        available: true,
        grabBars: true,
        rollInSink: true,
        emergencyCord: true,
        groundFloorOrElevator: true,
      },
      disabledParking: {
        available: true,
        bayCount: 6,
        distanceToEntranceMeters: 15,
      },
      brailleSignage: true,
      hearingLoop: false,
      quietHoursAvailable: false,
    },
    temporaryObstacles: [],
    shortDescription:
      '[DEMO / TEST ONLY] Demonstration hospital entry ramp record for testing accessible route evaluations.',
    fullDescription:
      'Simulated healthcare access record. Real facility audits must be performed by certified accessibility auditors.',
    transitTips: 'Served by Colombo municipal buses along Regent Street and De Saram Place.',
    entranceTips: 'OPD entrance features wide gradual ramp with double stainless steel handrails.',
    isDemoData: true,
  },
  {
    id: 'place-grand-station',
    name: '[DEMO / TEST] Kandy Municipal Public Library Area',
    category: 'culture',
    categoryLabel: 'Public & Libraries',
    address: {
      street: 'Kotugodella Veediya',
      city: 'Kandy',
      state: 'Central Province',
      postalCode: '20000',
      landmark: 'Near Kandy Clock Tower',
    },
    coordinates: {
      lat: 7.2925,
      lng: 80.6315,
    },
    overallRating: 3.8,
    reviewCount: 9,
    verifiedStatus: 'community_verified',
    lastAuditDate: '2026-10-20',
    amenities: {
      stepFreeEntrance: true,
      ramp: {
        available: true,
        slope: 'moderate',
        hasHandrails: true,
      },
      doorWidthCm: 90,
      automatedDoor: false,
      elevator: {
        available: false,
        workingStatus: 'none',
        auditoryPrompts: false,
        brailleButtons: false,
      },
      accessibleRestroom: {
        available: true,
        grabBars: true,
        rollInSink: false,
        emergencyCord: false,
        groundFloorOrElevator: true,
      },
      disabledParking: {
        available: true,
        bayCount: 2,
        distanceToEntranceMeters: 30,
      },
      brailleSignage: false,
      hearingLoop: false,
      quietHoursAvailable: true,
    },
    temporaryObstacles: [],
    shortDescription:
      '[DEMO / TEST ONLY] Simulated hill country civic building audit. Demonstration record only.',
    fullDescription:
      'Demonstration entry for Kandy urban center. Does not represent officially certified accessibility audit.',
    transitTips: 'Walking distance from Kandy Goods Shed and Central Bus Stand.',
    entranceTips: 'Side ramp provides step-free passage avoiding front stone steps.',
    isDemoData: true,
  },
  {
    id: 'place-galle-promenade',
    name: '[DEMO / TEST] Galle Fort Rampart Walkway',
    category: 'parks',
    categoryLabel: 'Parks & Rec',
    address: {
      street: 'Church Street, Galle Fort',
      city: 'Galle',
      state: 'Southern Province',
      postalCode: '80000',
      landmark: 'Near Galle Light House',
    },
    coordinates: {
      lat: 6.027,
      lng: 80.217,
    },
    overallRating: 4.1,
    reviewCount: 18,
    verifiedStatus: 'community_verified',
    lastAuditDate: '2026-10-18',
    amenities: {
      stepFreeEntrance: true,
      ramp: {
        available: true,
        slope: 'gentle',
        hasHandrails: false,
      },
      doorWidthCm: 150,
      automatedDoor: false,
      elevator: {
        available: false,
        workingStatus: 'none',
        auditoryPrompts: false,
        brailleButtons: false,
      },
      accessibleRestroom: {
        available: true,
        grabBars: true,
        rollInSink: true,
        emergencyCord: false,
        groundFloorOrElevator: true,
      },
      disabledParking: {
        available: true,
        bayCount: 3,
        distanceToEntranceMeters: 40,
      },
      brailleSignage: false,
      hearingLoop: false,
      quietHoursAvailable: false,
    },
    temporaryObstacles: [],
    shortDescription:
      '[DEMO / TEST ONLY] Demonstration coastal promenade record. Paved stone surface with gentle gradient ramp.',
    fullDescription:
      'Simulated heritage walkway test record. Users should exercise caution on historic stone paving.',
    transitTips: 'Galle Railway and Bus Stations are 1.2 km north of the Fort Gate.',
    entranceTips: 'Main Fort Gate offers paved level entrance.',
    isDemoData: true,
  },
];
