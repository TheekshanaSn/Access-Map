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

export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'rejected' | 'needs_review';

export interface ProposedPlaceDetails {
  name: string;
  address: string;
  city?: string;
  category?: string;
}

export interface AccessibilityReport {
  id: string;
  placeId: string;
  placeName: string;
  isProposedPlace?: boolean;
  proposedPlaceDetails?: ProposedPlaceDetails;
  reporterName: string;
  reporterRole: ReporterRole;
  reporterRoleLabel: string;
  submissionDate: string;
  rating: AccessibilityRating;
  ratingLabel: string;
  // Detailed physical accessibility criteria
  rampStatus?: 'available' | 'too_steep' | 'obstructed' | 'none' | 'not_specified';
  stairsStatus?: 'no_stairs' | 'has_alternative_ramp' | 'unavoidable_stairs' | 'not_specified';
  liftStatus?: 'available' | 'broken_down' | 'single_level' | 'none' | 'not_specified';
  accessibleToiletStatus?: 'available' | 'grab_bars_only' | 'inaccessible' | 'none' | 'not_specified';
  entranceInformation?: 'step_free' | 'ramp_access' | 'steps_only' | 'automatic_door' | 'standard_door' | 'not_specified';
  parkingStatus?: 'accessible_bays' | 'drop_off_only' | 'general_only' | 'none' | 'not_specified';
  surfaceCondition?: 'smooth_paved' | 'cobblestone' | 'gravel_uneven' | 'mixed' | 'not_specified';
  doorWidthCm?: number;
  stepCount?: number;
  // Quick confirmations (backward compatible)
  stepFreeEntranceConfirmed?: boolean;
  rampStatusConfirmed?: 'present_and_usable' | 'too_steep' | 'obstructed' | 'none';
  elevatorStatusConfirmed?: 'operational' | 'broken' | 'not_applicable';
  restroomAccessibleConfirmed?: boolean;
  parkingAvailableConfirmed?: boolean;
  // Obstacles & notes
  hasTemporaryObstacle: boolean;
  temporaryObstacleDetails?: string;
  notes: string;
  // Evidence photos (stored as web URL references)
  evidenceImageReferences?: string[];
  // Status and review workflow
  moderationStatus: ModerationStatus;
  reportStatus?: ModerationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  // Mistake corrections
  isCorrection?: boolean;
  originalReportId?: string;
  correctionNotes?: string;
  isDemoData?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewReportSubmission {
  placeId: string;
  placeName: string;
  isProposedPlace?: boolean;
  proposedPlaceDetails?: ProposedPlaceDetails;
  reporterName: string;
  reporterRole: ReporterRole;
  rating: AccessibilityRating;
  // Physical criteria
  rampStatus: 'available' | 'too_steep' | 'obstructed' | 'none' | 'not_specified';
  stairsStatus: 'no_stairs' | 'has_alternative_ramp' | 'unavoidable_stairs' | 'not_specified';
  liftStatus: 'available' | 'broken_down' | 'single_level' | 'none' | 'not_specified';
  accessibleToiletStatus: 'available' | 'grab_bars_only' | 'inaccessible' | 'none' | 'not_specified';
  entranceInformation: 'step_free' | 'ramp_access' | 'steps_only' | 'automatic_door' | 'standard_door' | 'not_specified';
  parkingStatus: 'accessible_bays' | 'drop_off_only' | 'general_only' | 'none' | 'not_specified';
  surfaceCondition: 'smooth_paved' | 'cobblestone' | 'gravel_uneven' | 'mixed' | 'not_specified';
  doorWidthCm?: number;
  stepCount?: number;
  // Quick confirmations
  stepFreeEntranceConfirmed?: boolean;
  rampStatusConfirmed?: 'present_and_usable' | 'too_steep' | 'obstructed' | 'none';
  elevatorStatusConfirmed?: 'operational' | 'broken' | 'not_applicable';
  restroomAccessibleConfirmed?: boolean;
  parkingAvailableConfirmed?: boolean;
  // Obstacle
  hasTemporaryObstacle: boolean;
  temporaryObstacleDetails?: string;
  notes: string;
  evidenceImageReferences?: string[];
  // Correction
  isCorrection?: boolean;
  originalReportId?: string;
  correctionNotes?: string;
}
