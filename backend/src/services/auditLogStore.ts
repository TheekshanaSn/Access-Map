import mongoose from 'mongoose';
import { AuditLogModel, IAuditLog, IAuditLogDocument, AdminActionType } from '../models/auditLog.model';
import { isDatabaseConnected } from '../config/database';

export interface AuditRecord extends IAuditLog {
  id: string;
  toJSON(): any;
}

const inMemoryAuditLogs: AuditRecord[] = [];

// Seed initial audit trail for demonstration
const defaultAuditLogs: Partial<AuditRecord>[] = [
  {
    action: 'REPORT_APPROVED',
    performedBy: {
      userId: 'admin-1',
      name: 'System Administrator',
      email: 'admin@accessmap.org',
      role: 'admin',
    },
    targetType: 'report',
    targetId: 'dev-report-1',
    targetName: 'National Hospital of Sri Lanka',
    reason: 'Verified entrance ramp slope (1:12) against official facilities documentation.',
    details: { rampConfirmed: true, elevatorConfirmed: true },
    timestamp: new Date(Date.now() - 3600000 * 24 * 2),
  },
  {
    action: 'PLACE_UPDATED',
    performedBy: {
      userId: 'mod-1',
      name: 'Accessibility Lead Moderator',
      email: 'moderator@accessmap.org',
      role: 'moderator',
    },
    targetType: 'place',
    targetId: 'place-central-library',
    targetName: 'Metropolitan Central Library',
    reason: 'Updated door width to 105cm and noted automatic sliding door repairs completed.',
    details: { field: 'amenities.doorWidthCm', oldValue: 95, newValue: 105 },
    timestamp: new Date(Date.now() - 3600000 * 18),
  },
  {
    action: 'REPORT_CORRECTION_REQUESTED',
    performedBy: {
      userId: 'mod-1',
      name: 'Accessibility Lead Moderator',
      email: 'moderator@accessmap.org',
      role: 'moderator',
    },
    targetType: 'report',
    targetId: 'dev-report-2',
    targetName: 'Colombo Public Library',
    reason: 'Please upload a photo of the elevator maintenance placard to confirm estimated completion date.',
    details: { requiredEvidence: 'photo_of_elevator_status' },
    timestamp: new Date(Date.now() - 3600000 * 6),
  },
];

let seeded = false;
export const ensureAuditLogsSeeded = (): void => {
  if (seeded) return;
  seeded = true;
  for (const log of defaultAuditLogs) {
    createAuditRecord({
      id: `audit-${inMemoryAuditLogs.length + 1}`,
      ...log,
    });
  }
};

ensureAuditLogsSeeded();

function createAuditRecord(data: any): AuditRecord {
  const record: AuditRecord = {
    id: data.id || `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action: data.action,
    performedBy: data.performedBy,
    targetType: data.targetType,
    targetId: data.targetId,
    targetName: data.targetName,
    reason: data.reason || '',
    details: data.details || {},
    timestamp: data.timestamp || new Date(),
    toJSON() {
      return {
        id: this.id,
        action: this.action,
        performedBy: this.performedBy,
        targetType: this.targetType,
        targetId: this.targetId,
        targetName: this.targetName,
        reason: this.reason,
        details: this.details,
        timestamp: this.timestamp,
      };
    },
  };
  inMemoryAuditLogs.unshift(record);
  return record;
}

export const recordAuditLog = async (entry: {
  action: AdminActionType;
  performedBy: { userId: string; name: string; email: string; role: string };
  targetType: 'report' | 'place' | 'user' | 'system';
  targetId: string;
  targetName: string;
  reason?: string;
  details?: Record<string, any>;
}): Promise<AuditRecord | IAuditLogDocument> => {
  if (isDatabaseConnected()) {
    try {
      return await AuditLogModel.create({
        ...entry,
        timestamp: new Date(),
      });
    } catch {
      // Fallback
    }
  }

  ensureAuditLogsSeeded();
  const id = new mongoose.Types.ObjectId().toString();
  return createAuditRecord({
    id,
    ...entry,
    timestamp: new Date(),
  });
};

export const findAuditLogsInStore = async (
  query: any = {},
  options: { page?: number; limit?: number } = {}
): Promise<{ logs: (AuditRecord | IAuditLogDocument)[]; total: number; page: number; totalPages: number }> => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
  const skip = (page - 1) * limit;

  if (isDatabaseConnected()) {
    try {
      const mongoQuery: any = {};
      if (query.action) mongoQuery.action = query.action;
      if (query.targetType) mongoQuery.targetType = query.targetType;
      if (query.targetId) mongoQuery.targetId = query.targetId;

      const [logs, total] = await Promise.all([
        AuditLogModel.find(mongoQuery).sort({ timestamp: -1 }).skip(skip).limit(limit),
        AuditLogModel.countDocuments(mongoQuery),
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch {
      // Fallback to in-memory
    }
  }

  ensureAuditLogsSeeded();
  let results = [...inMemoryAuditLogs];

  if (query.action && query.action !== 'all') {
    results = results.filter((l) => l.action === query.action);
  }
  if (query.targetType && query.targetType !== 'all') {
    results = results.filter((l) => l.targetType === query.targetType);
  }
  if (query.targetId) {
    results = results.filter((l) => l.targetId === query.targetId);
  }

  results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const total = results.length;
  const paginated = results.slice(skip, skip + limit);

  return {
    logs: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

