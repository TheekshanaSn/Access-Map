import mongoose, { Document, Schema } from 'mongoose';

export type ReportModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

export interface IProposedPlaceDetails {
  name: string;
  address: string;
  city?: string;
  category?: string;
}

export interface IAccessibilityReport {
  placeId: string;
  placeName: string;
  isProposedPlace: boolean;
  proposedPlaceDetails?: IProposedPlaceDetails;
  submittedBy: {
    userId?: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };
  // Core physical accessibility audit dimensions
  rampStatus: string;
  stairsStatus: string;
  liftStatus: string;
  accessibleToiletStatus: string;
  entranceInformation: string;
  parkingStatus: string;
  surfaceCondition: string;
  doorWidthCm?: number;
  stepCount?: number;
  // Obstacles & Notes
  temporaryObstacle: boolean;
  temporaryObstacleDetails?: string;
  notes?: string;
  // Photos - stored as file references/URLs, NEVER raw binary in DB
  evidenceImageReferences: string[];
  // Moderation & Review Workflow
  reportStatus: ReportModerationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  // Mistake corrections / updates
  isCorrection?: boolean;
  originalReportId?: string;
  correctionNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportDocument extends IAccessibilityReport, Document {}

const reportSchema = new Schema<IReportDocument>(
  {
    placeId: {
      type: String,
      required: [true, 'Place ID is required'],
      index: true,
    },
    placeName: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
    },
    isProposedPlace: {
      type: Boolean,
      default: false,
    },
    proposedPlaceDetails: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true, default: 'Colombo' },
      category: { type: String, trim: true, default: 'other' },
    },
    submittedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      role: {
        type: String,
        default: 'community_auditor',
      },
    },
    // Accessibility criteria (defaults to 'not_specified' — never assume absence means existence)
    rampStatus: {
      type: String,
      default: 'not_specified',
    },
    stairsStatus: {
      type: String,
      default: 'not_specified',
    },
    liftStatus: {
      type: String,
      default: 'not_specified',
    },
    accessibleToiletStatus: {
      type: String,
      default: 'not_specified',
    },
    entranceInformation: {
      type: String,
      default: 'not_specified',
    },
    parkingStatus: {
      type: String,
      default: 'not_specified',
    },
    surfaceCondition: {
      type: String,
      default: 'not_specified',
    },
    doorWidthCm: {
      type: Number,
      required: false,
    },
    stepCount: {
      type: Number,
      required: false,
    },
    temporaryObstacle: {
      type: Boolean,
      default: false,
    },
    temporaryObstacleDetails: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    evidenceImageReferences: {
      type: [String],
      default: [],
    },
    reportStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_review'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    isCorrection: {
      type: Boolean,
      default: false,
    },
    originalReportId: {
      type: String,
      default: null,
    },
    correctionNotes: {
      type: String,
      default: '',
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

export const AccessibilityReport = mongoose.model<IReportDocument>('AccessibilityReport', reportSchema);
