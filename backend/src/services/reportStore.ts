import mongoose from 'mongoose';
import {
  AccessibilityReport,
  IReportDocument,
  ReportModerationStatus,
  IProposedPlaceDetails,
} from '../models/report.model';
import { isDatabaseConnected } from '../config/database';

export interface ReportRecord {
  id: string;
  placeId: string;
  placeName: string;
  isProposedPlace?: boolean;
  proposedPlaceDetails?: IProposedPlaceDetails;
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
  parkingStatus: string;
  surfaceCondition: string;
  doorWidthCm?: number;
  stepCount?: number;
  temporaryObstacle: boolean;
  temporaryObstacleDetails?: string;
  notes?: string;
  evidenceImageReferences: string[];
  reportStatus: ReportModerationStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  isCorrection?: boolean;
  originalReportId?: string;
  correctionNotes?: string;
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

// Seed realistic sample audits for demonstration and offline testing
const defaultReports: Partial<ReportRecord>[] = [
  {
    placeId: 'place-1',
    placeName: 'National Hospital of Sri Lanka',
    submittedBy: {
      userId: 'dev-user-1',
      name: 'Sarah Perera',
      role: 'wheelchair_user',
    },
    rampStatus: 'available',
    stairsStatus: 'avoidable',
    liftStatus: 'available',
    accessibleToiletStatus: 'available',
    entranceInformation: 'wide_automated_sliding',
    parkingStatus: 'accessible_bays',
    surfaceCondition: 'smooth_tile',
    temporaryObstacle: false,
    doorWidthCm: 95,
    notes: 'Main OPD entrance ramp is 1:12 gradient with dual-height handrails. Ground floor accessible restroom is clean and unlocked.',
    evidenceImageReferences: ['/uploads/reports/sample-hospital-ramp.webp'],
    reportStatus: 'approved' as ReportModerationStatus,
    reviewedBy: 'dev-user-2',
    reviewedAt: new Date(Date.now() - 86400000 * 3),
    reviewNotes: 'Verified against ministry standard measurements.',
  },
  {
    placeId: 'place-2',
    placeName: 'Colombo Public Library',
    submittedBy: {
      userId: 'dev-user-1',
      name: 'Jordan Silva',
      role: 'power_chair_user',
    },
    rampStatus: 'available',
    stairsStatus: 'has_alternative_ramp',
    liftStatus: 'broken_down',
    accessibleToiletStatus: 'available',
    entranceInformation: 'push_button_automated',
    parkingStatus: 'drop_off_only',
    surfaceCondition: 'paved_stone',
    temporaryObstacle: true,
    temporaryObstacleDetails: 'West wing lift hydraulic maintenance until Thursday afternoon.',
    notes: 'Ramps to ground floor reading hall are wide, but elevator to reference section is out of service.',
    evidenceImageReferences: [],
    reportStatus: 'pending' as ReportModerationStatus,
  },
  {
    placeId: 'place-3',
    placeName: 'Fort Railway Station',
    submittedBy: {
      userId: 'dev-user-3',
      name: 'Elena Fernando',
      role: 'walker_user',
    },
    rampStatus: 'available',
    stairsStatus: 'avoidable',
    liftStatus: 'available',
    accessibleToiletStatus: 'available',
    entranceInformation: 'wide_doors',
    parkingStatus: 'accessible_bays',
    surfaceCondition: 'smooth_tile',
    temporaryObstacle: false,
    notes: 'Step-free tactile ground paving connects ticket counter 4 directly to platforms 1 through 3.',
    evidenceImageReferences: [],
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
    });
  }
};

ensureReportsSeeded();

function createReportRecord(data: any): ReportRecord {
  const record: ReportRecord = {
    id: data.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    placeId: data.placeId,
    placeName: data.placeName,
    isProposedPlace: !!data.isProposedPlace,
    proposedPlaceDetails: data.proposedPlaceDetails,
    submittedBy: {
      userId: data.submittedBy?.userId,
      name: data.submittedBy?.name || 'Community Auditor',
      role: data.submittedBy?.role || 'community_auditor',
    },
    rampStatus: data.rampStatus || 'not_specified',
    stairsStatus: data.stairsStatus || 'not_specified',
    liftStatus: data.liftStatus || 'not_specified',
    accessibleToiletStatus: data.accessibleToiletStatus || 'not_specified',
    entranceInformation: data.entranceInformation || 'not_specified',
    parkingStatus: data.parkingStatus || 'not_specified',
    surfaceCondition: data.surfaceCondition || 'not_specified',
    doorWidthCm: data.doorWidthCm,
    stepCount: data.stepCount,
    temporaryObstacle: !!data.temporaryObstacle,
    temporaryObstacleDetails: data.temporaryObstacleDetails || '',
    notes: data.notes || '',
    evidenceImageReferences: Array.isArray(data.evidenceImageReferences) ? data.evidenceImageReferences : [],
    reportStatus: data.reportStatus || 'pending',
    reviewedBy: data.reviewedBy,
    reviewedAt: data.reviewedAt,
    reviewNotes: data.reviewNotes || '',
    isCorrection: !!data.isCorrection,
    originalReportId: data.originalReportId,
    correctionNotes: data.correctionNotes || '',
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
        isProposedPlace: this.isProposedPlace,
        proposedPlaceDetails: this.proposedPlaceDetails,
        submittedBy: {
          name: this.submittedBy.name,
          role: this.submittedBy.role,
          // Only show userId if explicitly accessed internally, hide email/phone
          userId: this.submittedBy.userId,
        },
        rampStatus: this.rampStatus,
        stairsStatus: this.stairsStatus,
        liftStatus: this.liftStatus,
        accessibleToiletStatus: this.accessibleToiletStatus,
        entranceInformation: this.entranceInformation,
        parkingStatus: this.parkingStatus,
        surfaceCondition: this.surfaceCondition,
        doorWidthCm: this.doorWidthCm,
        stepCount: this.stepCount,
        temporaryObstacle: this.temporaryObstacle,
        temporaryObstacleDetails: this.temporaryObstacleDetails,
        notes: this.notes,
        evidenceImageReferences: this.evidenceImageReferences,
        reportStatus: this.reportStatus,
        reviewedBy: this.reviewedBy,
        reviewedAt: this.reviewedAt,
        reviewNotes: this.reviewNotes,
        isCorrection: this.isCorrection,
        originalReportId: this.originalReportId,
        correctionNotes: this.correctionNotes,
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
