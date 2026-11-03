export type ReporterRole =
  | 'wheelchair_user'
  | 'power_chair_user'
  | 'walker_user'
  | 'elderly_visitor'
  | 'caregiver'
  | 'community_auditor';

export type AccessibilityRating =
  | 'fully_accessible'
  | 'partially_accessible'
  | 'difficult_access'
  | 'inaccessible';

export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'rejected';

export interface AccessibilityReport {
  id: string;
  placeId: string;
  placeName: string;
  reporterName: string;
  reporterRole: ReporterRole;
  reporterRoleLabel: string;
  submissionDate: string;
  rating: AccessibilityRating;
  ratingLabel: string;
  stepFreeEntranceConfirmed: boolean;
  rampStatusConfirmed: 'present_and_usable' | 'too_steep' | 'obstructed' | 'none';
  elevatorStatusConfirmed: 'operational' | 'broken' | 'not_applicable';
  restroomAccessibleConfirmed: boolean;
  parkingAvailableConfirmed: boolean;
  hasTemporaryObstacle: boolean;
  temporaryObstacleDetails?: string;
  notes: string;
  moderationStatus: ModerationStatus;
  isDemoData: boolean;
}

export interface NewReportSubmission {
  placeId: string;
  placeName: string;
  reporterName: string;
  reporterRole: ReporterRole;
  rating: AccessibilityRating;
  stepFreeEntranceConfirmed: boolean;
  rampStatusConfirmed: 'present_and_usable' | 'too_steep' | 'obstructed' | 'none';
  elevatorStatusConfirmed: 'operational' | 'broken' | 'not_applicable';
  restroomAccessibleConfirmed: boolean;
  parkingAvailableConfirmed: boolean;
  hasTemporaryObstacle: boolean;
  temporaryObstacleDetails?: string;
  notes: string;
}

