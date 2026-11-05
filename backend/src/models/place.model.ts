import mongoose, { Document, Schema } from 'mongoose';

export type PlaceCategory =
  | 'healthcare'
  | 'transport'
  | 'dining'
  | 'parks'
  | 'shopping'
  | 'culture'
  | 'restroom'
  | 'education'
  | 'government'
  | 'other';

export type VerifiedStatus =
  | 'community_verified'
  | 'staff_verified'
  | 'pending_verification';

export interface IPlaceAddress {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
}

export interface IPlaceCoordinates {
  lat: number;
  lng: number;
}

export interface IGeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] in GeoJSON format
}

export interface ITemporaryObstacle {
  id: string;
  type: 'elevator_out_of_service' | 'ramp_maintenance' | 'construction' | 'blocked_sidewalk';
  title: string;
  description: string;
  reportedDate: string;
  severity: 'high' | 'medium' | 'low';
}

export interface IPlace {
  name: string;
  category: PlaceCategory;
  categoryLabel: string;
  address: IPlaceAddress;
  coordinates: IPlaceCoordinates;
  location?: IGeoJsonPoint;
  overallRating: number;
  reviewCount: number;
  verifiedStatus: VerifiedStatus;
  lastAuditDate: string;
  amenities: {
    stepFreeEntrance: boolean;
    ramp: {
      available: boolean;
      slope: 'gentle' | 'moderate' | 'steep' | 'none';
      hasHandrails: boolean;
    };
    doorWidthCm: number;
    automatedDoor: boolean;
    elevator: {
      available: boolean;
      workingStatus: 'operational' | 'intermittent' | 'out_of_service' | 'none';
      auditoryPrompts: boolean;
      brailleButtons: boolean;
    };
    accessibleRestroom: {
      available: boolean;
      grabBars: boolean;
      rollInSink: boolean;
      emergencyCord: boolean;
      groundFloorOrElevator: boolean;
    };
    disabledParking: {
      available: boolean;
      bayCount: number;
      distanceToEntranceMeters: number;
    };
    brailleSignage: boolean;
    hearingLoop: boolean;
    quietHoursAvailable: boolean;
  };
  temporaryObstacles: ITemporaryObstacle[];
  shortDescription: string;
  fullDescription: string;
  transitTips: string;
  entranceTips: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  isDemoData?: boolean;
  osmId?: string;
  osmType?: 'node' | 'way' | 'relation';
  osmTags?: Record<string, string>;
  dataSource?: 'osm' | 'community' | 'official' | 'manual';
  sourceAttribution?: string;
  importBatchId?: string;
  lastImportDate?: Date | string;
  accessibilityAuditStatus?: 'unverified_osm' | 'community_reported' | 'staff_verified';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPlaceDocument extends IPlace, Document {}

const placeSchema = new Schema<IPlaceDocument>(
  {
    name: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['healthcare', 'transport', 'dining', 'parks', 'shopping', 'culture', 'restroom', 'education', 'government', 'other'],
      index: true,
    },
    categoryLabel: {
      type: String,
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      landmark: { type: String, default: '' },
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [80.7718, 7.8731],
      },
    },
    osmId: {
      type: String,
      default: null,
    },
    osmType: {
      type: String,
      enum: ['node', 'way', 'relation'],
      default: null,
    },
    osmTags: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    dataSource: {
      type: String,
      enum: ['osm', 'community', 'official', 'manual'],
      default: 'community',
      index: true,
    },
    sourceAttribution: {
      type: String,
      default: '© OpenStreetMap contributors, ODbL 1.0',
    },
    importBatchId: {
      type: String,
      default: null,
    },
    lastImportDate: {
      type: Date,
      default: null,
    },
    accessibilityAuditStatus: {
      type: String,
      enum: ['unverified_osm', 'community_reported', 'staff_verified'],
      default: 'unverified_osm',
    },
    overallRating: {
      type: Number,
      default: 4.0,
      min: 1.0,
      max: 5.0,
    },
    reviewCount: {
      type: Number,
      default: 1,
    },
    verifiedStatus: {
      type: String,
      enum: ['community_verified', 'staff_verified', 'pending_verification'],
      default: 'pending_verification',
      index: true,
    },
    lastAuditDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    amenities: {
      type: Schema.Types.Mixed,
      required: true,
    },
    temporaryObstacles: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    shortDescription: {
      type: String,
      default: '',
    },
    fullDescription: {
      type: String,
      default: '',
    },
    transitTips: {
      type: String,
      default: '',
    },
    entranceTips: {
      type: String,
      default: '',
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    duplicateOf: {
      type: String,
      default: null,
    },
    isDemoData: {
      type: Boolean,
      default: true,
    },
  },
  {
    bufferCommands: false,
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret['id'] = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-synchronize GeoJSON location from coordinates before validation
placeSchema.pre('validate', function (next) {
  if (this.coordinates && typeof this.coordinates.lng === 'number' && typeof this.coordinates.lat === 'number') {
    if (!this.location || !Array.isArray(this.location.coordinates) || this.location.coordinates.length < 2) {
      this.location = {
        type: 'Point',
        coordinates: [this.coordinates.lng, this.coordinates.lat],
      };
    }
  }
  next();
});

// Geospatial 2dsphere index for spatial proximity queries ($near, $geoWithin)
placeSchema.index({ location: '2dsphere' });

// Sparse unique index to prevent duplicate OSM imports
placeSchema.index({ osmId: 1 }, { unique: true, sparse: true });

// Compound index for high-performance localized queries
placeSchema.index({ 'address.city': 1, category: 1 });

export const PlaceModel = mongoose.model<IPlaceDocument>('Place', placeSchema);
