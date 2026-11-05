export type PlaceCategory =
  | 'healthcare'
  | 'transport'
  | 'dining'
  | 'parks'
  | 'shopping'
  | 'culture'
  | 'restroom'
  | 'education';

export type VerifiedStatus =
  | 'community_verified'
  | 'staff_verified'
  | 'pending_verification';

export interface PlaceAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
}

export interface PlaceCoordinates {
  lat: number;
  lng: number;
}

export interface RampDetails {
  available: boolean;
  slope: 'gentle' | 'moderate' | 'steep' | 'none';
  hasHandrails: boolean;
}

export interface ElevatorDetails {
  available: boolean;
  workingStatus: 'operational' | 'intermittent' | 'out_of_service' | 'none';
  auditoryPrompts: boolean;
  brailleButtons: boolean;
}

export interface RestroomDetails {
  available: boolean;
  grabBars: boolean;
  rollInSink: boolean;
  emergencyCord: boolean;
  groundFloorOrElevator: boolean;
}

export interface ParkingDetails {
  available: boolean;
  bayCount: number;
  distanceToEntranceMeters: number;
}

export interface PlaceAmenities {
  stepFreeEntrance: boolean;
  ramp: RampDetails;
  doorWidthCm: number;
  automatedDoor: boolean;
  elevator: ElevatorDetails;
  accessibleRestroom: RestroomDetails;
  disabledParking: ParkingDetails;
  brailleSignage: boolean;
  hearingLoop: boolean;
  quietHoursAvailable: boolean;
}

export interface TemporaryObstacle {
  id: string;
  type: 'elevator_out_of_service' | 'ramp_maintenance' | 'construction' | 'blocked_sidewalk';
  title: string;
  description: string;
  reportedDate: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  categoryLabel: string;
  address: PlaceAddress;
  coordinates: PlaceCoordinates;
  overallRating: number; // 1.0 to 5.0
  reviewCount: number;
  verifiedStatus: VerifiedStatus;
  lastAuditDate: string;
  amenities: PlaceAmenities;
  temporaryObstacles: TemporaryObstacle[];
  shortDescription: string;
  fullDescription: string;
  transitTips: string;
  entranceTips: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  isDemoData: boolean;
}

export interface PlaceFilterCriteria {
  searchQuery: string;
  category: string; // 'all' or PlaceCategory
  mustHaveStepFree: boolean;
  mustHaveRamp: boolean;
  mustHaveElevator: boolean;
  mustHaveRestroom: boolean;
  mustHaveParking: boolean;
}

