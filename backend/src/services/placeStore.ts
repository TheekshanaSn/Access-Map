import mongoose from 'mongoose';
import { PlaceModel, IPlace, IPlaceDocument, PlaceCategory, VerifiedStatus } from '../models/place.model';
import { isDatabaseConnected } from '../config/database';

export interface PlaceRecord extends IPlace {
  id: string;
  save(): Promise<void>;
  toJSON(): any;
}

const inMemoryPlaces: PlaceRecord[] = [];

// Realistic catalog of accessible places
const defaultPlaces: Partial<PlaceRecord>[] = [
  {
    id: 'place-central-library',
    name: 'Metropolitan Central Library',
    category: 'culture',
    categoryLabel: 'Cultural & Library',
    address: {
      street: '100 Civic Center Plaza',
      city: 'Metro City',
      state: 'MC',
      postalCode: '10001',
      landmark: 'Across from City Hall Gardens',
    },
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
    overallRating: 4.9,
    reviewCount: 38,
    verifiedStatus: 'staff_verified',
    lastAuditDate: '2026-10-15',
    amenities: {
      stepFreeEntrance: true,
      ramp: { available: true, slope: 'gentle', hasHandrails: true },
      doorWidthCm: 105,
      automatedDoor: true,
      elevator: { available: true, workingStatus: 'operational', auditoryPrompts: true, brailleButtons: true },
      accessibleRestroom: { available: true, grabBars: true, rollInSink: true, emergencyCord: true, groundFloorOrElevator: true },
      disabledParking: { available: true, bayCount: 6, distanceToEntranceMeters: 18 },
      brailleSignage: true,
      hearingLoop: true,
      quietHoursAvailable: true,
    },
    temporaryObstacles: [],
    shortDescription: 'Modern multi-story municipal library with wide automatic sliding doors and step-free ramps.',
    fullDescription: 'The Metropolitan Central Library is an exemplary accessible public space with zero-threshold doors and braille navigation.',
    transitTips: 'Bus routes 4, 12, and 28 stop directly in front.',
    entranceTips: 'Use the North Plaza entrance for completely flat access.',
    isDemoData: true,
    isDuplicate: false,
  },
  {
    id: 'place-city-hospital',
    name: 'City General Hospital - Main Pavilion',
    category: 'healthcare',
    categoryLabel: 'Hospital & Emergency Care',
    address: {
      street: '550 Health Boulevard',
      city: 'Metro City',
      state: 'MC',
      postalCode: '10022',
      landmark: 'Gate 2 Patient Drop-Off',
    },
    coordinates: {
      lat: 40.7282,
      lng: -73.9942,
    },
    overallRating: 4.8,
    reviewCount: 92,
    verifiedStatus: 'staff_verified',
    lastAuditDate: '2026-10-22',
    amenities: {
      stepFreeEntrance: true,
      ramp: { available: true, slope: 'gentle', hasHandrails: true },
      doorWidthCm: 120,
      automatedDoor: true,
      elevator: { available: true, workingStatus: 'operational', auditoryPrompts: true, brailleButtons: true },
      accessibleRestroom: { available: true, grabBars: true, rollInSink: true, emergencyCord: true, groundFloorOrElevator: true },
      disabledParking: { available: true, bayCount: 16, distanceToEntranceMeters: 10 },
      brailleSignage: true,
      hearingLoop: true,
      quietHoursAvailable: true,
    },
    temporaryObstacles: [],
    shortDescription: 'Full-service acute hospital with 24/7 dedicated wheelchair-accessible emergency intake.',
    fullDescription: 'Features extra-wide 120cm automated sliding doors, step-free tactile paving, and dedicated accessible parking bays.',
    transitTips: 'Subway line B stops at Medical Center Station (fully elevator-accessible).',
    entranceTips: 'Emergency and outpatient clinics have direct zero-threshold street access.',
    isDemoData: true,
    isDuplicate: false,
  },
  {
    id: 'place-grand-station',
    name: 'Grand Central Mobility Transit Hub',
    category: 'transport',
    categoryLabel: 'Public Transit Terminal',
    address: {
      street: '89 Railroad Concourse',
      city: 'Metro City',
      state: 'MC',
      postalCode: '10017',
      landmark: 'Main Train Hall',
    },
    coordinates: {
      lat: 40.7527,
      lng: -73.9772,
    },
    overallRating: 4.6,
    reviewCount: 145,
    verifiedStatus: 'staff_verified',
    lastAuditDate: '2026-10-18',
    amenities: {
      stepFreeEntrance: true,
      ramp: { available: true, slope: 'gentle', hasHandrails: true },
      doorWidthCm: 110,
      automatedDoor: true,
      elevator: { available: true, workingStatus: 'operational', auditoryPrompts: true, brailleButtons: true },
      accessibleRestroom: { available: true, grabBars: true, rollInSink: true, emergencyCord: true, groundFloorOrElevator: true },
      disabledParking: { available: true, bayCount: 8, distanceToEntranceMeters: 25 },
      brailleSignage: true,
      hearingLoop: true,
      quietHoursAvailable: false,
    },
    temporaryObstacles: [
      {
        id: 'obs-transit-1',
        type: 'elevator_out_of_service',
        title: 'Platform 3 Elevator Maintenance',
        description: 'West platform hydraulic lift out of service until Friday. Use staff escort at Gate 4.',
        reportedDate: '2026-10-25',
        severity: 'high',
      },
    ],
    shortDescription: 'Multi-modal transit terminus with direct platform elevators and tactile floor guidance.',
    fullDescription: 'High-traffic train and bus hub with step-free elevators connecting all track levels.',
    transitTips: 'Major hub connecting 8 express bus lines and 4 commuter train lines.',
    entranceTips: 'Avoid the historical East staircase; use the glass elevator tower on 42nd St.',
    isDemoData: true,
    isDuplicate: false,
  },
  {
    id: 'place-city-hall',
    name: 'Metro City Hall & Civic Services',
    category: 'government',
    categoryLabel: 'Civic & Government',
    address: {
      street: '1 City Hall Plaza',
      city: 'Metro City',
      state: 'MC',
      postalCode: '10007',
      landmark: 'Civic Park North',
    },
    coordinates: {
      lat: 40.7128,
      lng: -74.0065,
    },
    overallRating: 4.4,
    reviewCount: 22,
    verifiedStatus: 'community_verified',
    lastAuditDate: '2026-10-10',
    amenities: {
      stepFreeEntrance: true,
      ramp: { available: true, slope: 'gentle', hasHandrails: true },
      doorWidthCm: 90,
      automatedDoor: true,
      elevator: { available: true, workingStatus: 'operational', auditoryPrompts: true, brailleButtons: true },
      accessibleRestroom: { available: true, grabBars: true, rollInSink: true, emergencyCord: true, groundFloorOrElevator: true },
      disabledParking: { available: true, bayCount: 4, distanceToEntranceMeters: 30 },
      brailleSignage: true,
      hearingLoop: false,
      quietHoursAvailable: false,
    },
    temporaryObstacles: [],
    shortDescription: 'Municipal administration offices with accessible permits desk and council chambers.',
    fullDescription: 'Historic government building modernized with a sweeping exterior ramp and power entrance doors.',
    transitTips: 'Civic Center light rail station is 150m south.',
    entranceTips: 'The main front steps are bypassed by the West security pavilion ramp.',
    isDemoData: true,
    isDuplicate: false,
  },
  // Intentional duplicate candidate for testing and demonstrating duplicate detection
  {
    id: 'place-central-library-dup',
    name: 'Metropolitan Central Library - West Wing',
    category: 'culture',
    categoryLabel: 'Cultural & Library',
    address: {
      street: '102 Civic Center Plaza',
      city: 'Metro City',
      state: 'MC',
      postalCode: '10001',
      landmark: 'Next to City Hall Gardens',
    },
    coordinates: {
      lat: 40.713,
      lng: -74.0062, // 30 meters from Metropolitan Central Library
    },
    overallRating: 4.7,
    reviewCount: 5,
    verifiedStatus: 'pending_verification',
    lastAuditDate: '2026-10-20',
    amenities: {
      stepFreeEntrance: true,
      ramp: { available: true, slope: 'gentle', hasHandrails: true },
      doorWidthCm: 100,
      automatedDoor: true,
      elevator: { available: true, workingStatus: 'operational', auditoryPrompts: true, brailleButtons: true },
      accessibleRestroom: { available: true, grabBars: true, rollInSink: true, emergencyCord: true, groundFloorOrElevator: true },
      disabledParking: { available: true, bayCount: 4, distanceToEntranceMeters: 20 },
      brailleSignage: true,
      hearingLoop: true,
      quietHoursAvailable: true,
    },
    temporaryObstacles: [],
    shortDescription: 'Suspected duplicate entry for Central Library West entrance.',
    fullDescription: 'User proposed place that mirrors the main municipal library.',
    transitTips: 'Civic center bus routes.',
    entranceTips: 'West wing ramp.',
    isDemoData: true,
    isDuplicate: false,
  },
];

let placesSeeded = false;
export const ensurePlacesSeeded = (): void => {
  if (placesSeeded) return;
  placesSeeded = true;
  for (const p of defaultPlaces) {
    createPlaceRecord(p);
  }
};

ensurePlacesSeeded();

function createPlaceRecord(data: any): PlaceRecord {
  const record: PlaceRecord = {
    id: data.id || `place-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: data.name,
    category: data.category,
    categoryLabel: data.categoryLabel || data.category,
    address: data.address,
    coordinates: data.coordinates,
    overallRating: data.overallRating || 4.0,
    reviewCount: data.reviewCount || 1,
    verifiedStatus: data.verifiedStatus || 'pending_verification',
    lastAuditDate: data.lastAuditDate || new Date().toISOString().split('T')[0],
    amenities: data.amenities || {
      stepFreeEntrance: true,
      ramp: { available: true, slope: 'gentle', hasHandrails: true },
      doorWidthCm: 90,
      automatedDoor: true,
      elevator: { available: true, workingStatus: 'operational', auditoryPrompts: false, brailleButtons: false },
      accessibleRestroom: { available: true, grabBars: true, rollInSink: true, emergencyCord: false, groundFloorOrElevator: true },
      disabledParking: { available: true, bayCount: 2, distanceToEntranceMeters: 30 },
      brailleSignage: false,
      hearingLoop: false,
      quietHoursAvailable: false,
    },
    temporaryObstacles: data.temporaryObstacles || [],
    shortDescription: data.shortDescription || '',
    fullDescription: data.fullDescription || '',
    transitTips: data.transitTips || '',
    entranceTips: data.entranceTips || '',
    isDuplicate: !!data.isDuplicate,
    duplicateOf: data.duplicateOf,
    isDemoData: data.isDemoData !== false,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    async save() {
      this.updatedAt = new Date();
    },
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        category: this.category,
        categoryLabel: this.categoryLabel,
        address: this.address,
        coordinates: this.coordinates,
        overallRating: this.overallRating,
        reviewCount: this.reviewCount,
        verifiedStatus: this.verifiedStatus,
        lastAuditDate: this.lastAuditDate,
        amenities: this.amenities,
        temporaryObstacles: this.temporaryObstacles,
        shortDescription: this.shortDescription,
        fullDescription: this.fullDescription,
        transitTips: this.transitTips,
        entranceTips: this.entranceTips,
        isDuplicate: this.isDuplicate,
        duplicateOf: this.duplicateOf,
        isDemoData: this.isDemoData,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
  };
  inMemoryPlaces.push(record);
  return record;
}

export const createPlaceInStore = async (data: any): Promise<PlaceRecord | IPlaceDocument> => {
  if (isDatabaseConnected()) {
    try {
      return await PlaceModel.create(data);
    } catch {
      // Fallback
    }
  }

  ensurePlacesSeeded();
  return createPlaceRecord(data);
};

export const findPlaceById = async (id: string): Promise<PlaceRecord | IPlaceDocument | null> => {
  if (isDatabaseConnected()) {
    try {
      const doc = await PlaceModel.findById(id);
      if (doc) return doc;
    } catch {
      // Fallback
    }
  }

  ensurePlacesSeeded();
  const found = inMemoryPlaces.find((p) => p.id === id);
  return found || null;
};

export const updatePlaceInStore = async (
  id: string,
  updates: Partial<IPlace>
): Promise<PlaceRecord | IPlaceDocument | null> => {
  if (isDatabaseConnected()) {
    try {
      const doc = await PlaceModel.findByIdAndUpdate(id, updates, { new: true });
      if (doc) return doc;
    } catch {
      // Fallback
    }
  }

  ensurePlacesSeeded();
  const place = inMemoryPlaces.find((p) => p.id === id);
  if (!place) return null;

  Object.assign(place, updates);
  place.updatedAt = new Date();
  return place;
};

export const findPlacesInStore = async (
  filter: any = {},
  options: { page?: number; limit?: number; search?: string } = {}
): Promise<{ places: (PlaceRecord | IPlaceDocument)[]; total: number; page: number; totalPages: number }> => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  if (isDatabaseConnected()) {
    try {
      const mongoQuery: any = { isDuplicate: { $ne: true } };
      if (filter.category && filter.category !== 'all') mongoQuery.category = filter.category;
      if (filter.verifiedStatus && filter.verifiedStatus !== 'all') mongoQuery.verifiedStatus = filter.verifiedStatus;
      if (options.search) {
        mongoQuery.$or = [
          { name: { $regex: options.search, $options: 'i' } },
          { 'address.street': { $regex: options.search, $options: 'i' } },
          { 'address.city': { $regex: options.search, $options: 'i' } },
        ];
      }

      const [places, total] = await Promise.all([
        PlaceModel.find(mongoQuery).sort({ name: 1 }).skip(skip).limit(limit),
        PlaceModel.countDocuments(mongoQuery),
      ]);

      return {
        places,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch {
      // Fallback to in-memory
    }
  }

  ensurePlacesSeeded();
  let results = inMemoryPlaces.filter((p) => !p.isDuplicate);

  if (filter.category && filter.category !== 'all') {
    results = results.filter((p) => p.category === filter.category);
  }
  if (filter.verifiedStatus && filter.verifiedStatus !== 'all') {
    results = results.filter((p) => p.verifiedStatus === filter.verifiedStatus);
  }
  if (options.search) {
    const s = options.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.address.street.toLowerCase().includes(s) ||
        p.address.city.toLowerCase().includes(s)
    );
  }

  const total = results.length;
  const paginated = results.slice(skip, skip + limit);

  return {
    places: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const countPlacesInStore = async (filter: any = {}): Promise<number> => {
  if (isDatabaseConnected()) {
    try {
      return await PlaceModel.countDocuments(filter);
    } catch {
      // Fallback
    }
  }

  ensurePlacesSeeded();
  let count = inMemoryPlaces.length;
  if (filter.verifiedStatus) {
    count = inMemoryPlaces.filter((p) => p.verifiedStatus === filter.verifiedStatus).length;
  }
  return count;
};

/**
 * Calculates geographic distance in meters between two lat/lng coordinates (Haversine Formula)
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * String similarity ratio (Dice's coefficient / Bigram similarity)
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const clean1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean1 === clean2) return 1.0;
  if (clean1.length < 2 || clean2.length < 2) return 0.0;

  const bigrams1 = new Set<string>();
  for (let i = 0; i < clean1.length - 1; i++) {
    bigrams1.add(clean1.slice(i, i + 2));
  }

  let intersection = 0;
  for (let i = 0; i < clean2.length - 1; i++) {
    if (bigrams1.has(clean2.slice(i, i + 2))) {
      intersection++;
    }
  }

  return (2.0 * intersection) / (clean1.length - 1 + clean2.length - 1);
}

export interface DuplicatePlacePair {
  pairId: string;
  placeA: any;
  placeB: any;
  similarityScore: number; // 0 to 1
  distanceMeters?: number;
  reasons: string[];
}

/**
 * Detect possible duplicate places using geographic proximity and name/address similarity
 */
export const detectDuplicatePlacesInStore = async (): Promise<DuplicatePlacePair[]> => {
  ensurePlacesSeeded();
  const places = inMemoryPlaces.filter((p) => !p.isDuplicate);
  const duplicates: DuplicatePlacePair[] = [];

  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const p1 = places[i];
      const p2 = places[j];

      const reasons: string[] = [];
      let score = 0;

      // 1. Geographic distance check
      let dist = -1;
      if (p1.coordinates && p2.coordinates) {
        dist = calculateDistanceMeters(
          p1.coordinates.lat,
          p1.coordinates.lng,
          p2.coordinates.lat,
          p2.coordinates.lng
        );

        if (dist <= 100) {
          reasons.push(`Close proximity: Only ${dist}m apart`);
          score += 0.5;
        } else if (dist <= 300) {
          reasons.push(`Nearby vicinity: Within ${dist}m`);
          score += 0.25;
        }
      }

      // 2. Name similarity check
      const nameSim = calculateStringSimilarity(p1.name, p2.name);
      if (nameSim >= 0.7) {
        reasons.push(`High name similarity: ${Math.round(nameSim * 100)}% match`);
        score += 0.5;
      } else if (
        p1.name.toLowerCase().includes(p2.name.toLowerCase()) ||
        p2.name.toLowerCase().includes(p1.name.toLowerCase())
      ) {
        reasons.push(`Substring name overlap`);
        score += 0.35;
      }

      // 3. Address match
      if (
        p1.address.street &&
        p2.address.street &&
        calculateStringSimilarity(p1.address.street, p2.address.street) > 0.8
      ) {
        reasons.push(`Matching street address: "${p1.address.street}"`);
        score += 0.3;
      }

      // If combined confidence score >= 0.65 or (very close < 80m and same category)
      if (score >= 0.65 || (dist >= 0 && dist < 80 && p1.category === p2.category)) {
        duplicates.push({
          pairId: `${p1.id}_${p2.id}`,
          placeA: p1.toJSON(),
          placeB: p2.toJSON(),
          similarityScore: Math.min(1.0, Math.round(score * 100) / 100),
          distanceMeters: dist >= 0 ? dist : undefined,
          reasons,
        });
      }
    }
  }

  return duplicates;
};

/**
 * Merge or mark duplicate place
 */
export const resolveDuplicatePlaceInStore = async (
  primaryId: string,
  duplicateId: string,
  action: 'mark_duplicate' | 'dismiss'
): Promise<boolean> => {
  ensurePlacesSeeded();
  if (action === 'dismiss') {
    return true;
  }

  const dup = inMemoryPlaces.find((p) => p.id === duplicateId);
  if (!dup) return false;

  dup.isDuplicate = true;
  dup.duplicateOf = primaryId;
  dup.updatedAt = new Date();
  return true;
};

