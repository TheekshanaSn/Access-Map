import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SubmitReportComponent } from './submit-report.component';
import { PlaceService } from '../../core/services/place.service';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';

describe('SubmitReportComponent', () => {
  let component: SubmitReportComponent;
  let fixture: ComponentFixture<SubmitReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitReportComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        PlaceService,
        ReportService,
        AuthService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the submit report component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default physical accessibility settings', () => {
    expect(component.rampStatus).toBe('available');
    expect(component.stairsStatus).toBe('no_stairs');
    expect(component.liftStatus).toBe('available');
    expect(component.accessibleToiletStatus).toBe('available');
    expect(component.entranceInformation).toBe('step_free');
    expect(component.parkingStatus).toBe('accessible_bays');
    expect(component.surfaceCondition).toBe('smooth_paved');
    expect(component.activeTab()).toBe('form');
  });

  it('should validate venue selection on submit and set formError', () => {
    component.selectedPlaceId = '';
    component.onSubmit();
    expect(component.formError()).toContain('Please select an existing venue or propose a new unlisted location');
  });

  it('should validate unlisted venue fields when proposing a new place', () => {
    component.selectedPlaceId = 'new_custom_venue';
    component.customVenueName = '';
    component.onSubmit();
    expect(component.formError()).toContain('Please enter the name of the proposed unlisted venue');

    component.customVenueName = 'City Clinic';
    component.customVenueAddress = '';
    component.onSubmit();
    expect(component.formError()).toContain('Please provide the street address or landmark');
  });

  it('should validate temporary obstacle details if obstacle is checked', () => {
    component.selectedPlaceId = 'place-1';
    component.hasTemporaryObstacle = true;
    component.temporaryObstacleDetails = '';
    component.onSubmit();
    expect(component.formError()).toContain('Please provide details for the temporary obstacle');
  });

  it('should allow switching to the history tab', () => {
    component.switchToMyReports();
    expect(component.activeTab()).toBe('history');
  });
});

