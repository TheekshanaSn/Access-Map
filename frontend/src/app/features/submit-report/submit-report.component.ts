import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlaceService } from '../../core/services/place.service';
import { ReportService } from '../../core/services/report.service';
import { AccessibilityRating, NewReportSubmission, ReporterRole } from '../../core/models/report.model';

@Component({
  selector: 'app-submit-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      <!-- Page Header -->
      <header class="space-y-2 border-b border-slate-200 pb-6">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
          <span>📢 Community Accessibility Audit</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Submit Accessibility Report
        </h1>
        <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
          Share your real-world observations on ramps, doorways, elevators, and toilets. Your audits help wheelchair users and mobility travelers avoid obstacles.
        </p>
      </header>

      <!-- Submission Success State -->
      @if (submissionSuccess()) {
        <section
          class="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs"
          role="region"
          aria-live="polite"
        >
          <div class="flex items-center gap-3 text-emerald-900">
            <span class="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xl font-bold" aria-hidden="true">
              ✓
            </span>
            <div>
              <h2 class="text-xl font-black">Audit Submitted Successfully!</h2>
              <p class="text-xs sm:text-sm text-emerald-800">
                Your report has been queued for verification and logged in the AccessMap demonstration store.
              </p>
            </div>
          </div>

          <div class="p-4 bg-white rounded-xl border border-emerald-200 text-xs sm:text-sm text-slate-700 space-y-1.5">
            <p><strong>Venue:</strong> {{ submittedReport()?.placeName }}</p>
            <p><strong>Contributor:</strong> {{ submittedReport()?.reporterName }} ({{ submittedReport()?.reporterRoleLabel }})</p>
            <p><strong>Rating:</strong> {{ submittedReport()?.ratingLabel }}</p>
            @if (submittedReport()?.hasTemporaryObstacle) {
              <p class="text-amber-700 font-semibold">
                ⚠️ Obstacle Alert Recorded: {{ submittedReport()?.temporaryObstacleDetails }}
              </p>
            }
          </div>

          <div class="pt-2 flex flex-wrap gap-3">
            @if (submittedReport()?.placeId; as placeId) {
              <a
                [routerLink]="['/places', placeId]"
                class="min-h-[44px] px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center"
              >
                View Place Details
              </a>
            }
            <button
              type="button"
              (click)="resetForm()"
              class="min-h-[44px] px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors border border-slate-300 cursor-pointer"
            >
              Submit Another Report
            </button>
            <a
              routerLink="/admin"
              class="min-h-[44px] px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-teal-300 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center ml-auto"
            >
              Check Moderation Queue
            </a>
          </div>
        </section>
      } @else {
        <!-- Audit Submission Form -->
        <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs" novalidate>
          
          <!-- Section 1: Venue Selection -->
          <fieldset class="space-y-4">
            <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
              1. Venue Information
            </legend>

            <div class="space-y-1.5">
              <label for="venue-select" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Existing Public Place *
              </label>
              <select
                id="venue-select"
                [(ngModel)]="selectedPlaceId"
                name="selectedPlaceId"
                (ngModelChange)="onPlaceChange($event)"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[48px]"
                required
              >
                <option value="" disabled>-- Select a venue from database --</option>
                @for (place of places(); track place.id) {
                  <option [value]="place.id">
                    {{ place.name }} ({{ place.categoryLabel }}) - {{ place.address.city }}
                  </option>
                }
                <option value="new_custom_venue">➕ Report an unlisted venue...</option>
              </select>
            </div>

            @if (selectedPlaceId === 'new_custom_venue') {
              <div class="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-3">
                <div>
                  <label for="custom-venue-name" class="block text-xs font-bold text-slate-700">
                    Unlisted Venue Name *
                  </label>
                  <input
                    id="custom-venue-name"
                    name="customVenueName"
                    type="text"
                    [(ngModel)]="customVenueName"
                    placeholder="e.g. City Plaza Pharmacy"
                    class="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
                <div>
                  <label for="custom-venue-address" class="block text-xs font-bold text-slate-700">
                    Street Address & Landmark *
                  </label>
                  <input
                    id="custom-venue-address"
                    name="customVenueAddress"
                    type="text"
                    [(ngModel)]="customVenueAddress"
                    placeholder="e.g. 124 Main Street, Metro City"
                    class="mt-1 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>
            }
          </fieldset>

          <!-- Section 2: Reporter Profile -->
          <fieldset class="space-y-4">
            <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
              2. Your Mobility Perspective
            </legend>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="reporter-name" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Name (Optional)
                </label>
                <input
                  id="reporter-name"
                  name="reporterName"
                  type="text"
                  [(ngModel)]="reporterName"
                  placeholder="Leave blank for anonymous audit"
                  class="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label for="reporter-role" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  I am navigating as: *
                </label>
                <select
                  id="reporter-role"
                  name="reporterRole"
                  [(ngModel)]="reporterRole"
                  class="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 min-h-[44px]"
                  required
                >
                  <option value="wheelchair_user">Manual Wheelchair User</option>
                  <option value="power_chair_user">Power Wheelchair / Scooter User</option>
                  <option value="walker_user">Walker / Rollator / Cane User</option>
                  <option value="elderly_visitor">Senior / Elderly Citizen</option>
                  <option value="caregiver">Caregiver / Family Companion</option>
                  <option value="community_auditor">Accessibility Auditor / Volunteer</option>
                </select>
              </div>
            </div>
          </fieldset>

          <!-- Section 3: Overall Accessibility Assessment -->
          <fieldset class="space-y-4">
            <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
              3. Overall Experience *
            </legend>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Overall accessibility rating">
              <label
                class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                [class.border-teal-600]="rating === 'fully_accessible'"
                [class.bg-teal-50]="rating === 'fully_accessible'"
              >
                <input
                  type="radio"
                  name="rating"
                  value="fully_accessible"
                  [(ngModel)]="rating"
                  class="w-4 h-4 text-teal-700 focus:ring-teal-600"
                />
                <div>
                  <span class="block text-sm font-bold text-slate-900">🟢 Fully Accessible</span>
                  <span class="text-xs text-slate-500">Step-free, wide doorways, excellent facilities</span>
                </div>
              </label>

              <label
                class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                [class.border-teal-600]="rating === 'partially_accessible'"
                [class.bg-teal-50]="rating === 'partially_accessible'"
              >
                <input
                  type="radio"
                  name="rating"
                  value="partially_accessible"
                  [(ngModel)]="rating"
                  class="w-4 h-4 text-teal-700 focus:ring-teal-600"
                />
                <div>
                  <span class="block text-sm font-bold text-slate-900">🟡 Partially Accessible</span>
                  <span class="text-xs text-slate-500">Usable with slight difficulty or manual assist</span>
                </div>
              </label>

              <label
                class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                [class.border-teal-600]="rating === 'difficult_access'"
                [class.bg-teal-50]="rating === 'difficult_access'"
              >
                <input
                  type="radio"
                  name="rating"
                  value="difficult_access"
                  [(ngModel)]="rating"
                  class="w-4 h-4 text-teal-700 focus:ring-teal-600"
                />
                <div>
                  <span class="block text-sm font-bold text-slate-900">🟠 Difficult Access</span>
                  <span class="text-xs text-slate-500">High thresholds, steep slopes, or cramped restrooms</span>
                </div>
              </label>

              <label
                class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                [class.border-teal-600]="rating === 'inaccessible'"
                [class.bg-teal-50]="rating === 'inaccessible'"
              >
                <input
                  type="radio"
                  name="rating"
                  value="inaccessible"
                  [(ngModel)]="rating"
                  class="w-4 h-4 text-teal-700 focus:ring-teal-600"
                />
                <div>
                  <span class="block text-sm font-bold text-slate-900">🔴 Inaccessible</span>
                  <span class="text-xs text-slate-500">Flight of stairs with no ramp or elevator</span>
                </div>
              </label>
            </div>
          </fieldset>

          <!-- Section 4: Physical Amenities Checklist -->
          <fieldset class="space-y-4">
            <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
              4. Verified Amenities Checklist
            </legend>

            <div class="space-y-3">
              <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  name="stepFreeEntranceConfirmed"
                  [(ngModel)]="stepFreeEntranceConfirmed"
                  class="w-5 h-5 rounded text-teal-700 focus:ring-teal-600"
                />
                <div>
                  <span class="text-sm font-bold text-slate-900">Step-Free Ground Entrance</span>
                  <p class="text-xs text-slate-500">Zero threshold entry or flush sidewalk transition</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  name="restroomAccessibleConfirmed"
                  [(ngModel)]="restroomAccessibleConfirmed"
                  class="w-5 h-5 rounded text-teal-700 focus:ring-teal-600"
                />
                <div>
                  <span class="text-sm font-bold text-slate-900">Accessible Restroom Present & Usable</span>
                  <p class="text-xs text-slate-500">Grab bars, roll-in clearance, and unlocked/staff-accessible door</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  name="parkingAvailableConfirmed"
                  [(ngModel)]="parkingAvailableConfirmed"
                  class="w-5 h-5 rounded text-teal-700 focus:ring-teal-600"
                />
                <div>
                  <span class="text-sm font-bold text-slate-900">Designated Disabled Parking Spaces</span>
                  <p class="text-xs text-slate-500">Wide bays marked with international symbol within rolling distance</p>
                </div>
              </label>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label for="ramp-status" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ramp Status
                </label>
                <select
                  id="ramp-status"
                  name="rampStatusConfirmed"
                  [(ngModel)]="rampStatusConfirmed"
                  class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                >
                  <option value="present_and_usable">Present & Fully Usable</option>
                  <option value="too_steep">Too Steep for Independent Use</option>
                  <option value="obstructed">Obstructed / In Need of Repair</option>
                  <option value="none">No Ramp Present</option>
                </select>
              </div>

              <div>
                <label for="elevator-status" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Elevator / Lift Status
                </label>
                <select
                  id="elevator-status"
                  name="elevatorStatusConfirmed"
                  [(ngModel)]="elevatorStatusConfirmed"
                  class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                >
                  <option value="operational">Operational & Accessible</option>
                  <option value="broken">Broken / Temporarily Out of Service</option>
                  <option value="not_applicable">Not Applicable (Single Level)</option>
                </select>
              </div>
            </div>
          </fieldset>

          <!-- Section 5: Temporary Obstacle Alert -->
          <fieldset class="space-y-4">
            <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
              5. Temporary Obstacle Warning
            </legend>

            <label class="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 cursor-pointer">
              <input
                type="checkbox"
                name="hasTemporaryObstacle"
                [(ngModel)]="hasTemporaryObstacle"
                class="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
              />
              <div>
                <span class="text-sm font-bold text-amber-950">Report a Temporary Obstacle at this Location</span>
                <p class="text-xs text-amber-900/80">Check this if a lift is undergoing repair, a ramp is iced over, or construction blocks the entrance</p>
              </div>
            </label>

            @if (hasTemporaryObstacle) {
              <div class="space-y-1.5 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <label for="obstacle-details" class="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Obstacle Description & Estimated Impact *
                </label>
                <input
                  id="obstacle-details"
                  name="temporaryObstacleDetails"
                  type="text"
                  [(ngModel)]="temporaryObstacleDetails"
                  placeholder="e.g. North concourse lift broken; use staff shuttle at West gate"
                  class="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            }
          </fieldset>

          <!-- Section 6: Notes & Tips -->
          <div class="space-y-2">
            <label for="detailed-notes" class="block text-sm font-bold text-slate-900">
              Detailed Notes & Advice for Mobility Users
            </label>
            <textarea
              id="detailed-notes"
              name="notes"
              [(ngModel)]="notes"
              rows="4"
              placeholder="Describe door heaviness, bathroom transfer space, nearby curb cuts, or helpful staff..."
              class="w-full p-4 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
            ></textarea>
          </div>

          <!-- Error Feedback Alert if form is invalid -->
          @if (formError()) {
            <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-medium flex items-center gap-2" role="alert">
              <span aria-hidden="true">⚠️</span>
              <span>{{ formError() }}</span>
            </div>
          }

          <!-- Form Submit Button -->
          <div class="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-xs text-slate-500">
              Audits are peer-reviewed before public publication.
            </p>

            <button
              type="submit"
              class="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-base transition-colors shadow-sm cursor-pointer focus:ring-4 focus:ring-teal-300 flex items-center justify-center gap-2"
            >
              <span>Submit Accessibility Audit</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

        </form>
      }

    </div>
  `,
})
export class SubmitReportComponent implements OnInit {
  private readonly placeService = inject(PlaceService);
  private readonly reportService = inject(ReportService);
  private readonly route = inject(ActivatedRoute);

  readonly places = this.placeService.allPlaces;

  // Form Fields
  selectedPlaceId = '';
  customVenueName = '';
  customVenueAddress = '';
  reporterName = '';
  reporterRole: ReporterRole = 'wheelchair_user';
  rating: AccessibilityRating = 'fully_accessible';
  stepFreeEntranceConfirmed = true;
  restroomAccessibleConfirmed = true;
  parkingAvailableConfirmed = true;
  rampStatusConfirmed: 'present_and_usable' | 'too_steep' | 'obstructed' | 'none' = 'present_and_usable';
  elevatorStatusConfirmed: 'operational' | 'broken' | 'not_applicable' = 'operational';
  hasTemporaryObstacle = false;
  temporaryObstacleDetails = '';
  notes = '';

  // Submission State
  submissionSuccess = signal<boolean>(false);
  submittedReport = signal<any>(null);
  formError = signal<string | null>(null);

  ngOnInit(): void {
    // If a placeId queryParam was passed (e.g. from a place card), pre-select it
    this.route.queryParams.subscribe((params) => {
      if (params['placeId']) {
        const found = this.placeService.getPlaceById(params['placeId']);
        if (found) {
          this.selectedPlaceId = found.id;
        }
      }
    });
  }

  onPlaceChange(val: string): void {
    this.selectedPlaceId = val;
    this.formError.set(null);
  }

  onSubmit(): void {
    this.formError.set(null);

    if (!this.selectedPlaceId) {
      this.formError.set('Please select a venue to review.');
      return;
    }

    let placeName = '';
    let finalPlaceId = this.selectedPlaceId;

    if (this.selectedPlaceId === 'new_custom_venue') {
      if (!this.customVenueName.trim()) {
        this.formError.set('Please enter the name of the new venue.');
        return;
      }
      placeName = this.customVenueName.trim();
      finalPlaceId = `custom-${Date.now()}`;
    } else {
      const place = this.placeService.getPlaceById(this.selectedPlaceId);
      placeName = place?.name || 'Selected Venue';
    }

    if (this.hasTemporaryObstacle && !this.temporaryObstacleDetails.trim()) {
      this.formError.set('Please describe the temporary obstacle you reported.');
      return;
    }

    const payload: NewReportSubmission = {
      placeId: finalPlaceId,
      placeName,
      reporterName: this.reporterName.trim() || 'Anonymous Mobility Advocate',
      reporterRole: this.reporterRole,
      rating: this.rating,
      stepFreeEntranceConfirmed: this.stepFreeEntranceConfirmed,
      rampStatusConfirmed: this.rampStatusConfirmed,
      elevatorStatusConfirmed: this.elevatorStatusConfirmed,
      restroomAccessibleConfirmed: this.restroomAccessibleConfirmed,
      parkingAvailableConfirmed: this.parkingAvailableConfirmed,
      hasTemporaryObstacle: this.hasTemporaryObstacle,
      temporaryObstacleDetails: this.hasTemporaryObstacle ? this.temporaryObstacleDetails.trim() : undefined,
      notes: this.notes.trim() || 'Verified step-free access and physical amenities during in-person visit.',
    };

    const newReport = this.reportService.submitReport(payload);
    this.submittedReport.set(newReport);
    this.submissionSuccess.set(true);
  }

  resetForm(): void {
    this.selectedPlaceId = '';
    this.customVenueName = '';
    this.customVenueAddress = '';
    this.reporterName = '';
    this.notes = '';
    this.hasTemporaryObstacle = false;
    this.temporaryObstacleDetails = '';
    this.submissionSuccess.set(false);
    this.submittedReport.set(null);
    this.formError.set(null);
  }
}

