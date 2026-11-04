import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminComponent } from './admin.component';
import { ReportService } from '../../core/services/report.service';
import { PlaceService } from '../../core/services/place.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ReportService,
        PlaceService,
        AuthService,
        AdminService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the admin dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize on overview tab and load metrics', () => {
    expect(component.activeTab()).toBe('overview');
    expect(component.allPlaces().length).toBeGreaterThan(0);
  });

  it('should switch tabs between moderation, places, duplicates, and audit-trail', () => {
    component.setActiveTab('moderation');
    expect(component.activeTab()).toBe('moderation');

    component.setActiveTab('places');
    expect(component.activeTab()).toBe('places');

    component.setActiveTab('duplicates');
    expect(component.activeTab()).toBe('duplicates');

    component.setActiveTab('audit-trail');
    expect(component.activeTab()).toBe('audit-trail');
  });

  it('should require a reason when opening decision modal for rejection or correction', () => {
    const fakeReport: any = {
      id: 'rep-test-1',
      placeName: 'City Library',
      reportStatus: 'pending',
    };

    component.openDecisionModal(fakeReport, 'rejected');
    expect(component.activeDecisionModal()).toBe(fakeReport);
    expect(component.decisionStatus()).toBe('rejected');

    // Attempt submitting without reason
    component.decisionReason = '';
    component.submitDecision();
    expect(component.decisionError()).toContain('A specific reason or instruction is required');
  });

  it('should open edit place modal with prefilled data', () => {
    const samplePlace = component.allPlaces()[0];
    component.openEditPlaceModal(samplePlace);

    expect(component.editingPlace()).toBe(samplePlace);
    expect(component.editPlaceForm.name).toBe(samplePlace.name);
    expect(component.editPlaceForm.street).toBe(samplePlace.address.street);
  });
});

