import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { NewReportSubmission } from '../models/report.model';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created and contain initial mock reports', () => {
    expect(service).toBeTruthy();
    expect(service.allReports().length).toBeGreaterThan(0);
  });

  it('should submit a report via POST /api/reports and update reports state', () => {
    const submission: NewReportSubmission = {
      placeId: 'place-test-1',
      placeName: 'Community Clinic',
      reporterName: 'Tester',
      reporterRole: 'wheelchair_user',
      rating: 'fully_accessible',
      rampStatus: 'available',
      stairsStatus: 'no_stairs',
      liftStatus: 'available',
      accessibleToiletStatus: 'available',
      entranceInformation: 'step_free',
      parkingStatus: 'accessible_bays',
      surfaceCondition: 'smooth_paved',
      hasTemporaryObstacle: false,
      notes: 'Fully step-free facility.',
    };

    let resultReport: any;
    service.submitReport(submission).subscribe((res) => {
      resultReport = res;
    });

    const req = httpMock.expectOne('/api/reports');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.placeId).toBe('place-test-1');

    req.flush({
      message: 'Created',
      report: {
        id: 'rep-created-123',
        placeId: 'place-test-1',
        placeName: 'Community Clinic',
        submittedBy: { name: 'Tester', role: 'wheelchair_user' },
        rampStatus: 'available',
        reportStatus: 'pending',
        createdAt: '2026-11-04T00:00:00Z',
      },
    });

    expect(resultReport).toBeTruthy();
    expect(resultReport.id).toBe('rep-created-123');
    expect(service.myReports().some((r) => r.id === 'rep-created-123')).toBe(true);
  });

  it('should upload evidence photos via POST /api/reports/upload-photos', () => {
    const fakeFile = new File(['binary content'], 'ramp.jpg', { type: 'image/jpeg' });

    let uploadedUrls: string[] = [];
    service.uploadEvidencePhotos([fakeFile]).subscribe((urls) => {
      uploadedUrls = urls;
    });

    const req = httpMock.expectOne('/api/reports/upload-photos');
    expect(req.request.method).toBe('POST');
    req.flush({
      message: 'Uploaded',
      urls: ['/uploads/reports/report-1234.jpg'],
      count: 1,
    });

    expect(uploadedUrls).toEqual(['/uploads/reports/report-1234.jpg']);
  });

  it('should fetch user reports via GET /api/reports/my-reports', () => {
    let myReports: any[] = [];
    service.fetchMyReports().subscribe((reports) => {
      myReports = reports;
    });

    const req = httpMock.expectOne('/api/reports/my-reports');
    expect(req.request.method).toBe('GET');

    req.flush({
      count: 1,
      reports: [
        {
          id: 'rep-my-1',
          placeId: 'place-1',
          placeName: 'National Hospital',
          submittedBy: { name: 'Me', role: 'wheelchair_user' },
          reportStatus: 'pending',
          rampStatus: 'available',
          createdAt: '2026-11-04T00:00:00Z',
        },
      ],
    });

    expect(myReports.length).toBe(1);
    expect(myReports[0].id).toBe('rep-my-1');
    expect(service.myReports().length).toBe(1);
  });
});

