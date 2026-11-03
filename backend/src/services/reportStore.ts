import mongoose from 'mongoose';
import { AccessibilityReport, IReportDocument, ReportModerationStatus } from '../models/report.model';
import { isDatabaseConnected } from '../config/database';

export interface ReportRecord {
  id: string;
  placeId: string;
  placeName: string;
  submittedBy: {
    userId?: string;
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
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
  toJSON(): any;
}

export const defaultReportFindById = AccessibilityReport.findById;
export const defaultReportFind = AccessibilityReport.find;
export const defaultReportCountDocuments = AccessibilityReport.countDocuments;
export const defaultReportCreate = AccessibilityReport.create;

const inMemoryReports: ReportRecord[] = [];

// Seed sample audits for instant local testing without DB
const defaultReports = [
  {
    placeId: 'place-1',
    placeName: 'City General Hospital',
    submittedBy: {
      name: 'Sarah Wheelchair User',
      role: 'wheelchair_user',
    },
    rampStatus: 'available',
    stairsStatus: 'avoidable',
    liftStatus: 'available',
    accessibleToiletStatus: 'available',
    entranceInformation: 'wide_automated_sliding',
    surfaceCondition: 'smooth_tile',
    temporaryObstacle: false,
    notes: 'Main entrance ramp is 1:12 gradient with bilateral handrails. Excellent accessibility.',
    reportStatus: 'approved' as ReportModerationStatus,
    reviewedBy: 'dev-user-2',
    reviewedAt: new Date(Date.now() - 86400000 * 2),
    reviewNotes: 'Verified against on-site measurements.',
  },
  {
    placeId: 'place-2',
    placeName: 'Central Public Library',
    submittedBy: {
      name: 'Jordan Powerchair User',
      role: 'power_chair_user',
    },
    rampStatus: 'available',
    stairsStatus: 'has_alternative_ramp',
    liftStatus: 'broken_down',
    accessibleToiletStatus: 'available',
    entranceInformation: 'push_button_automated',
    surfaceCondition: 'paved_stone',
    temporaryObstacle: true,
    temporaryObstacleDetails: 'West elevator under hydraulic valve maintenance until Friday.',
    notes: 'Ramps are wide, but west wing lift is currently out of service.',
    reportStatus: 'pending' as ReportModerationStatus,
  },
  {
    placeId: 'place-3',
    placeName: 'Grand Central Station',
    submittedBy: {
      name: 'Elena Walker User',
      role: 'walker_user',
    },
    rampStatus: 'available',
    stairsStatus: 'avoidable',
    liftStatus: 'available',
    accessibleToiletStatus: 'available',
    entranceInformation: 'revolving_with_side_accessible_door',
    surfaceCondition: 'polished_granite',
    temporaryObstacle: false,
    notes: 'Step-free tactile pathways lead to all train platforms and accessible ticket counters.',
    reportStatus: 'approved' as ReportModerationStatus,
  },
];

let reportsSeeded = false;
export const ensureReportsSeeded = (): void => {
  if (reportsSeeded) return;
  reportsSeeded = true;
  for (const r of defaultReports) {
    createReportRecord({
      id: `dev-report-${inMemoryReports.length + 1}`,
      ...r,
      evidenceImageReferences: [],
    });
  }
};

ensureReportsSeeded();

function createReportRecord(data: any): ReportRecord {
  const record: ReportRecord = {
    ...data,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    async save() {
      this.updatedAt = new Date();
    },
    toJSON() {
      return {
        id: this.id,
        placeId: this.placeId,
        placeName: this.placeName,
        submittedBy: this.submittedBy,
        rampStatus: this.rampStatus,
        stairsStatus: this.stairsStatus,
        liftStatus: this.liftStatus,
        accessibleToiletStatus: this.accessibleToiletStatus,
        entranceInformation: this.entranceInformation,
        surfaceCondition: this.surfaceCondition,
        temporaryObstacle: this.temporaryObstacle,
        temporaryObstacleDetails: this.temporaryObstacleDetails,
        notes: this.notes,
        evidenceImageReferences: this.evidenceImageReferences,
        reportStatus: this.reportStatus,
        reviewedBy: this.reviewedBy,
        reviewedAt: this.reviewedAt,
        reviewNotes: this.reviewNotes,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    },
  };
  inMemoryReports.push(record);
  return record;
}

export const createReportInStore = async (data: any): Promise<ReportRecord | IReportDocument> => {
  if (isDatabaseConnected() || AccessibilityReport.create !== defaultReportCreate) {
    return AccessibilityReport.create(data);
  }

  ensureReportsSeeded();
  const newId = new mongoose.Types.ObjectId().toString();
  return createReportRecord({
    id: newId,
    ...data,
  });
};

export const findReportById = async (id: string): Promise<ReportRecord | IReportDocument | null> => {
  if (isDatabaseConnected() || AccessibilityReport.findById !== defaultReportFindById) {
    return AccessibilityReport.findById(id);
  }

  ensureReportsSeeded();
  const found = inMemoryReports.find((r) => r.id === id);
  return found || null;
};

export const findReportsInStore = async (query: any): Promise<Array<ReportRecord | IReportDocument>> => {
  if (isDatabaseConnected() || AccessibilityReport.find !== defaultReportFind) {
    const q: any = AccessibilityReport.find(query);
    if (q && typeof q.sort === 'function') {
      const sorted = q.sort({ createdAt: -1 });
      return sorted && typeof sorted.limit === 'function' ? sorted.limit(100) : sorted;
    }
    return q;
  }

  ensureReportsSeeded();
  let results = [...inMemoryReports];

  if (query['submittedBy.userId']) {
    results = results.filter((r) => r.submittedBy.userId === query['submittedBy.userId']);
  }
  if (query.reportStatus) {
    results = results.filter((r) => r.reportStatus === query.reportStatus);
  }
  if (query.placeId) {
    results = results.filter((r) => r.placeId === query.placeId);
  }

  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return results;
};

export const countReportsInStore = async (query: any): Promise<number> => {
  if (isDatabaseConnected() || AccessibilityReport.countDocuments !== defaultReportCountDocuments) {
    return AccessibilityReport.countDocuments(query);
  }

  ensureReportsSeeded();
  let results = [...inMemoryReports];

  if (query.reportStatus) {
    results = results.filter((r) => r.reportStatus === query.reportStatus);
  }
  if (query.temporaryObstacle) {
    results = results.filter((r) => !!r.temporaryObstacle);
  }

  return results.length;
};
