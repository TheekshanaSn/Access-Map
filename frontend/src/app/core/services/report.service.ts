import { Injectable, computed, signal } from '@angular/core';
import { AccessibilityReport, ModerationStatus, NewReportSubmission, ReporterRole } from '../models/report.model';
import { MOCK_REPORTS } from '../data/mock-reports';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly reportsState = signal<AccessibilityReport[]>(MOCK_REPORTS);

  readonly allReports = this.reportsState.asReadonly();

  // Filtered reports for admin moderation
  readonly adminFilter = signal<ModerationStatus | 'all'>('all');

  readonly filteredAdminReports = computed(() => {
    const filter = this.adminFilter();
    const reports = this.reportsState();
    if (filter === 'all') {
      return reports;
    }
    return reports.filter((r) => r.moderationStatus === filter);
  });

  // Admin stats
  readonly pendingCount = computed(() => this.reportsState().filter((r) => r.moderationStatus === 'pending').length);
  readonly approvedCount = computed(() => this.reportsState().filter((r) => r.moderationStatus === 'approved').length);
  readonly flaggedCount = computed(() => this.reportsState().filter((r) => r.moderationStatus === 'flagged').length);
  readonly obstacleCount = computed(() => this.reportsState().filter((r) => r.hasTemporaryObstacle && r.moderationStatus === 'approved').length);

  getReportsForPlace(placeId: string): AccessibilityReport[] {
    return this.reportsState().filter((r) => r.placeId === placeId && r.moderationStatus === 'approved');
  }

  submitReport(submission: NewReportSubmission): AccessibilityReport {
    const roleLabels: Record<ReporterRole, string> = {
      wheelchair_user: 'Manual Wheelchair User',
      power_chair_user: 'Power Wheelchair User',
      walker_user: 'Walker / Mobility Aid User',
      elderly_visitor: 'Elderly Visitor',
      caregiver: 'Caregiver / Companion',
      community_auditor: 'Community Auditor',
    };

    const ratingLabels = {
      fully_accessible: 'Fully Accessible',
      partially_accessible: 'Partially Accessible',
      difficult_access: 'Difficult Access',
      inaccessible: 'Inaccessible',
    };

    const newReport: AccessibilityReport = {
      id: `rep-${Date.now()}`,
      placeId: submission.placeId,
      placeName: submission.placeName,
      reporterName: submission.reporterName || 'Anonymous Community Contributor',
      reporterRole: submission.reporterRole,
      reporterRoleLabel: roleLabels[submission.reporterRole] || 'Community Contributor',
      submissionDate: new Date().toISOString().split('T')[0],
      rating: submission.rating,
      ratingLabel: ratingLabels[submission.rating],
      stepFreeEntranceConfirmed: submission.stepFreeEntranceConfirmed,
      rampStatusConfirmed: submission.rampStatusConfirmed,
      elevatorStatusConfirmed: submission.elevatorStatusConfirmed,
      restroomAccessibleConfirmed: submission.restroomAccessibleConfirmed,
      parkingAvailableConfirmed: submission.parkingAvailableConfirmed,
      hasTemporaryObstacle: submission.hasTemporaryObstacle,
      temporaryObstacleDetails: submission.temporaryObstacleDetails,
      notes: submission.notes,
      moderationStatus: 'pending', // Starts in pending moderation
      isDemoData: true,
    };

    this.reportsState.update((prev) => [newReport, ...prev]);
    return newReport;
  }

  updateModerationStatus(reportId: string, status: ModerationStatus): void {
    this.reportsState.update((prev) =>
      prev.map((rep) => (rep.id === reportId ? { ...rep, moderationStatus: status } : rep))
    );
  }
}

