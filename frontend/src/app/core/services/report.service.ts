import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  AccessibilityReport,
  ModerationStatus,
  NewReportSubmission,
  ReporterRole,
} from '../models/report.model';
import { MOCK_REPORTS } from '../data/mock-reports';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly reportsState = signal<AccessibilityReport[]>(MOCK_REPORTS);
  private readonly myReportsState = signal<AccessibilityReport[]>([]);

  readonly allReports = this.reportsState.asReadonly();
  readonly myReports = this.myReportsState.asReadonly();

  // Filtered reports for admin moderation
  readonly adminFilter = signal<ModerationStatus | 'all'>('all');

  readonly filteredAdminReports = computed(() => {
    const filter = this.adminFilter();
    const reports = this.reportsState();
    if (filter === 'all') {
      return reports;
    }
    return reports.filter((r) => r.moderationStatus === filter || r.reportStatus === filter);
  });

  // Moderation stats
  readonly pendingCount = computed(
    () => this.reportsState().filter((r) => r.moderationStatus === 'pending' || r.reportStatus === 'pending').length
  );
  readonly approvedCount = computed(
    () => this.reportsState().filter((r) => r.moderationStatus === 'approved' || r.reportStatus === 'approved').length
  );
  readonly flaggedCount = computed(
    () => this.reportsState().filter((r) => r.moderationStatus === 'flagged' || r.moderationStatus === 'needs_review').length
  );
  readonly obstacleCount = computed(
    () => this.reportsState().filter((r) => (r.hasTemporaryObstacle || r.temporaryObstacleDetails) && (r.moderationStatus === 'approved' || r.reportStatus === 'approved')).length
  );

  getReportsForPlace(placeId: string): AccessibilityReport[] {
    return this.reportsState().filter(
      (r) => r.placeId === placeId && (r.moderationStatus === 'approved' || r.reportStatus === 'approved')
    );
  }

  /**
   * Upload image evidence files (max 5MB each, JPEG/PNG/WebP)
   */
  uploadEvidencePhotos(files: File[]): Observable<string[]> {
    if (!files || files.length === 0) {
      return of([]);
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append('photos', file, file.name);
    }

    return this.http
      .post<{ message: string; urls: string[]; count: number }>('/api/reports/upload-photos', formData)
      .pipe(
        map((res) => res.urls),
        catchError((err) => {
          console.warn('API upload unavailable, falling back to simulated file references:', err);
          // Fallback simulation for offline testing
          const simulatedUrls = files.map((f, i) => `/uploads/reports/simulated-${Date.now()}-${i}-${f.name}`);
          return of(simulatedUrls);
        })
      );
  }

  /**
   * Submit an accessibility report to the backend API
   */
  submitReport(submission: NewReportSubmission): Observable<AccessibilityReport> {
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

    const fallbackReport: AccessibilityReport = {
      id: `rep-${Date.now()}`,
      placeId: submission.placeId,
      placeName: submission.placeName,
      isProposedPlace: submission.isProposedPlace,
      proposedPlaceDetails: submission.proposedPlaceDetails,
      reporterName: submission.reporterName || 'Community Auditor',
      reporterRole: submission.reporterRole,
      reporterRoleLabel: roleLabels[submission.reporterRole] || 'Community Contributor',
      submissionDate: new Date().toISOString().split('T')[0],
      rating: submission.rating,
      ratingLabel: ratingLabels[submission.rating],
      rampStatus: submission.rampStatus,
      stairsStatus: submission.stairsStatus,
      liftStatus: submission.liftStatus,
      accessibleToiletStatus: submission.accessibleToiletStatus,
      entranceInformation: submission.entranceInformation,
      parkingStatus: submission.parkingStatus,
      surfaceCondition: submission.surfaceCondition,
      doorWidthCm: submission.doorWidthCm,
      stepCount: submission.stepCount,
      stepFreeEntranceConfirmed: submission.stepFreeEntranceConfirmed,
      rampStatusConfirmed: submission.rampStatusConfirmed,
      elevatorStatusConfirmed: submission.elevatorStatusConfirmed,
      restroomAccessibleConfirmed: submission.restroomAccessibleConfirmed,
      parkingAvailableConfirmed: submission.parkingAvailableConfirmed,
      hasTemporaryObstacle: submission.hasTemporaryObstacle,
      temporaryObstacleDetails: submission.temporaryObstacleDetails,
      notes: submission.notes,
      evidenceImageReferences: submission.evidenceImageReferences || [],
      moderationStatus: 'pending',
      reportStatus: 'pending',
      isCorrection: submission.isCorrection,
      originalReportId: submission.originalReportId,
      correctionNotes: submission.correctionNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemoData: true,
    };

    return this.http
      .post<{ message: string; report: any }>('/api/reports', submission)
      .pipe(
        map((res) => {
          const raw = res.report;
          const report: AccessibilityReport = {
            id: raw.id || raw._id || fallbackReport.id,
            placeId: raw.placeId,
            placeName: raw.placeName,
            isProposedPlace: raw.isProposedPlace,
            proposedPlaceDetails: raw.proposedPlaceDetails,
            reporterName: raw.submittedBy?.name || submission.reporterName,
            reporterRole: submission.reporterRole,
            reporterRoleLabel: roleLabels[submission.reporterRole] || 'Community Contributor',
            submissionDate: (raw.createdAt || new Date().toISOString()).split('T')[0],
            rating: submission.rating,
            ratingLabel: ratingLabels[submission.rating],
            rampStatus: raw.rampStatus || submission.rampStatus,
            stairsStatus: raw.stairsStatus || submission.stairsStatus,
            liftStatus: raw.liftStatus || submission.liftStatus,
            accessibleToiletStatus: raw.accessibleToiletStatus || submission.accessibleToiletStatus,
            entranceInformation: raw.entranceInformation || submission.entranceInformation,
            parkingStatus: raw.parkingStatus || submission.parkingStatus,
            surfaceCondition: raw.surfaceCondition || submission.surfaceCondition,
            doorWidthCm: raw.doorWidthCm,
            stepCount: raw.stepCount,
            hasTemporaryObstacle: raw.temporaryObstacle || submission.hasTemporaryObstacle,
            temporaryObstacleDetails: raw.temporaryObstacleDetails || submission.temporaryObstacleDetails,
            notes: raw.notes || submission.notes,
            evidenceImageReferences: raw.evidenceImageReferences || submission.evidenceImageReferences || [],
            moderationStatus: raw.reportStatus || 'pending',
            reportStatus: raw.reportStatus || 'pending',
            reviewNotes: raw.reviewNotes,
            isCorrection: raw.isCorrection,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            isDemoData: false,
          };
          return report;
        }),
        catchError((err) => {
          console.warn('API report creation error, persisting in local store:', err);
          return of(fallbackReport);
        }),
        tap((savedReport) => {
          this.reportsState.update((prev) => [savedReport, ...prev]);
          this.myReportsState.update((prev) => [savedReport, ...prev]);
        })
      );
  }

  /**
   * Fetch current user's submitted reports and track their verification statuses
   */
  fetchMyReports(): Observable<AccessibilityReport[]> {
    return this.http
      .get<{ count: number; reports: any[] }>('/api/reports/my-reports')
      .pipe(
        map((res) => {
          return res.reports.map((raw) => ({
            id: raw.id || raw._id,
            placeId: raw.placeId,
            placeName: raw.placeName,
            isProposedPlace: raw.isProposedPlace,
            proposedPlaceDetails: raw.proposedPlaceDetails,
            reporterName: raw.submittedBy?.name || 'You',
            reporterRole: (raw.submittedBy?.role as ReporterRole) || 'community_auditor',
            reporterRoleLabel: raw.submittedBy?.role || 'Community Auditor',
            submissionDate: (raw.createdAt || new Date().toISOString()).split('T')[0],
            rating: 'fully_accessible' as const,
            ratingLabel: 'Verified Report',
            rampStatus: raw.rampStatus,
            stairsStatus: raw.stairsStatus,
            liftStatus: raw.liftStatus,
            accessibleToiletStatus: raw.accessibleToiletStatus,
            entranceInformation: raw.entranceInformation,
            parkingStatus: raw.parkingStatus,
            surfaceCondition: raw.surfaceCondition,
            doorWidthCm: raw.doorWidthCm,
            stepCount: raw.stepCount,
            hasTemporaryObstacle: raw.temporaryObstacle,
            temporaryObstacleDetails: raw.temporaryObstacleDetails,
            notes: raw.notes,
            evidenceImageReferences: raw.evidenceImageReferences || [],
            moderationStatus: raw.reportStatus || 'pending',
            reportStatus: raw.reportStatus || 'pending',
            reviewedBy: raw.reviewedBy,
            reviewedAt: raw.reviewedAt,
            reviewNotes: raw.reviewNotes,
            isCorrection: raw.isCorrection,
            originalReportId: raw.originalReportId,
            correctionNotes: raw.correctionNotes,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            isDemoData: false,
          }));
        }),
        tap((reports) => {
          this.myReportsState.set(reports);
        }),
        catchError((err) => {
          console.warn('Could not fetch user reports from API, returning local cache:', err);
          return of(this.myReportsState());
        })
      );
  }

  /**
   * Correct mistakes in an existing report
   */
  correctReport(reportId: string, updates: Partial<NewReportSubmission>): Observable<AccessibilityReport> {
    return this.http
      .put<{ message: string; report: any }>(`/api/reports/${reportId}`, updates)
      .pipe(
        map((res) => {
          const raw = res.report;
          const updatedReport: AccessibilityReport = {
            id: raw.id || reportId,
            placeId: raw.placeId,
            placeName: raw.placeName,
            isProposedPlace: raw.isProposedPlace,
            proposedPlaceDetails: raw.proposedPlaceDetails,
            reporterName: raw.submittedBy?.name || 'You',
            reporterRole: 'community_auditor',
            reporterRoleLabel: 'Community Auditor',
            submissionDate: (raw.createdAt || new Date().toISOString()).split('T')[0],
            rating: 'partially_accessible',
            ratingLabel: 'Updated Report',
            rampStatus: raw.rampStatus,
            stairsStatus: raw.stairsStatus,
            liftStatus: raw.liftStatus,
            accessibleToiletStatus: raw.accessibleToiletStatus,
            entranceInformation: raw.entranceInformation,
            parkingStatus: raw.parkingStatus,
            surfaceCondition: raw.surfaceCondition,
            hasTemporaryObstacle: raw.temporaryObstacle,
            temporaryObstacleDetails: raw.temporaryObstacleDetails,
            notes: raw.notes,
            evidenceImageReferences: raw.evidenceImageReferences || [],
            moderationStatus: 'pending',
            reportStatus: 'pending',
            reviewNotes: raw.reviewNotes,
            isCorrection: true,
            correctionNotes: raw.correctionNotes,
            updatedAt: raw.updatedAt,
            isDemoData: false,
          };
          return updatedReport;
        }),
        catchError((err) => {
          console.warn('API report correction error, updating local cache:', err);
          const current = this.myReportsState().find((r) => r.id === reportId);
          if (current) {
            const fallback: AccessibilityReport = {
              ...current,
              ...updates,
              isCorrection: true,
              moderationStatus: 'pending',
              reportStatus: 'pending',
              updatedAt: new Date().toISOString(),
            };
            return of(fallback);
          }
          throw err;
        }),
        tap((updated) => {
          this.reportsState.update((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
          this.myReportsState.update((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
        })
      );
  }

  /**
   * Update report moderation status
   */
  updateModerationStatus(reportId: string, status: ModerationStatus, reviewNotes?: string): void {
    this.http
      .patch<{ message: string; report: any }>(`/api/reports/${reportId}/status`, {
        status,
        reviewNotes,
      })
      .pipe(
        catchError((err) => {
          console.warn('API status update unavailable:', err);
          return of(null);
        })
      )
      .subscribe(() => {
        this.reportsState.update((prev) =>
          prev.map((rep) =>
            rep.id === reportId
              ? { ...rep, moderationStatus: status, reportStatus: status, reviewNotes }
              : rep
          )
        );
      });
  }
}
