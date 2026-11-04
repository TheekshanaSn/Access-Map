import mongoose, { Document, Schema } from 'mongoose';

export type AdminActionType =
  | 'REPORT_APPROVED'
  | 'REPORT_REJECTED'
  | 'REPORT_CORRECTION_REQUESTED'
  | 'PLACE_CREATED'
  | 'PLACE_UPDATED'
  | 'PLACE_DUPLICATE_RESOLVED'
  | 'USER_ROLE_CHANGED';

export interface IAuditLog {
  action: AdminActionType;
  performedBy: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  targetType: 'report' | 'place' | 'user' | 'system';
  targetId: string;
  targetName: string;
  reason?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    performedBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    targetType: {
      type: String,
      required: true,
      enum: ['report', 'place', 'user', 'system'],
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    bufferCommands: false,
    timestamps: false,
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

export const AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);
