import mongoose, { Document, Schema, Model } from 'mongoose';

export type ReportModerationStatus = 'pending' | 'approved' | 'rejected';

export interface IAccessibilityReport {
  placeId: string;
  placeName: string;
  submittedBy: {
    userId?: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };
  rampStatus: string;
  stairsStatus: string;
  liftStatus: string;
  accessibleToiletStatus: string;
  entranceInformation: string;
  surfaceCondition: string;
  temporaryObstacle: boolean;
  temporaryObstacleDetails?: string;
  notes?: string;
  evidenceImageReferences: string[];
  reportStatus: ReportModerationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
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
      default: 'standard_door',
    },
    surfaceCondition: {
      type: String,
      default: 'paved',
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
      maxlength: 1000,
    },
    evidenceImageReferences: {
      type: [String],
      default: [],
    },
    reportStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
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
