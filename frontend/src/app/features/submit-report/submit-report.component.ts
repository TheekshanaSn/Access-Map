import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlaceService } from '../../core/services/place.service';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import {
  AccessibilityRating,
  AccessibilityReport,
  NewReportSubmission,
  ReporterRole,
} from '../../core/models/report.model';

@Component({
  selector: 'app-submit-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      <!-- Page Header -->
      <header class="space-y-2 border-b border-slate-200 pb-6">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
          <span>📢 Community Accessibility Audit & Verification</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Accessibility Reporting System
            </h1>
            <p class="text-sm sm:text-base text-slate-600 leading-relaxed mt-1">
              Document real-world ramps, entrances, elevators, and toilets. Every audit helps mobility travelers navigate with confidence.
            </p>
          </div>

          <!-- Tab Navigation -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
            <button
              type="button"
              (click)="activeTab.set('form')"
              [class.bg-white]="activeTab() === 'form'"
              [class.font-bold]="activeTab() === 'form'"
              [class.shadow-xs]="activeTab() === 'form'"
              [class.text-teal-900]="activeTab() === 'form'"
              class="px-4 py-2 text-xs sm:text-sm rounded-lg text-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{{ editingReportId ? '✏️ Correct Report' : '📝 Submit Audit' }}</span>
            </button>
            <button
              type="button"
              (click)="switchToMyReports()"
              [class.bg-white]="activeTab() === 'history'"
              [class.font-bold]="activeTab() === 'history'"
              [class.shadow-xs]="activeTab() === 'history'"
              [class.text-teal-900]="activeTab() === 'history'"
              class="px-4 py-2 text-xs sm:text-sm rounded-lg text-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>My Reports</span>
              @if (myReports().length > 0) {
                <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                  {{ myReports().length }}
                </span>
              }
            </button>
          </div>
        </div>
      </header>

      <!-- Authentication Alert Banner (if not logged in) -->
      @if (!isAuthenticated()) {
        <aside
          class="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
          role="region"
          aria-label="Authentication Required Notice"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl" aria-hidden="true">🔒</span>
            <div>
              <h2 class="font-bold text-sm sm:text-base text-amber-950">Authentication Required for Submissions</h2>
              <p class="text-xs sm:text-sm text-amber-900/90 mt-0.5">
                To maintain audit integrity and avoid anonymous spam, please sign in to log accessibility reports or view your verification history.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a
              routerLink="/login"
              class="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition-colors text-center"
            >
              Sign In to Continue
            </a>
          </div>
        </aside>
      }

      <!-- TAB 1: SUBMISSION / CORRECTION FORM -->
      @if (activeTab() === 'form') {

        <!-- Submission Success State -->
        @if (submissionSuccess()) {
          <section
            class="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs"
            role="region"
            aria-live="polite"
          >
            <div class="flex items-center gap-3 text-emerald-900">
              <span class="w-12 h-12 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-2xl font-bold" aria-hidden="true">
                ✓
              </span>
              <div>
                <h2 class="text-xl sm:text-2xl font-black">
                  {{ editingReportId ? 'Audit Corrected Successfully!' : 'Accessibility Report Queued for Review!' }}
                </h2>
                <p class="text-xs sm:text-sm text-emerald-800">
                  Your observations have been logged. Independent moderators will review the evidence before public publication.
                </p>
              </div>
            </div>

            <div class="p-4 sm:p-5 bg-white rounded-xl border border-emerald-200 text-xs sm:text-sm text-slate-800 space-y-2">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-base font-bold text-slate-900">{{ submittedReport()?.placeName }}</p>
                  <p class="text-xs text-slate-500">
                    Contributed by {{ submittedReport()?.reporterName }} ({{ submittedReport()?.reporterRoleLabel }})
                  </p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  ⏳ Verification Pending
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div class="p-2 bg-slate-50 rounded-lg text-center">
                  <span class="block text-[10px] text-slate-500 uppercase font-semibold">Ramp</span>
                  <span class="text-xs font-bold text-slate-800">{{ submittedReport()?.rampStatus || 'Not specified' }}</span>
                </div>
                <div class="p-2 bg-slate-50 rounded-lg text-center">
                  <span class="block text-[10px] text-slate-500 uppercase font-semibold">Elevator</span>
                  <span class="text-xs font-bold text-slate-800">{{ submittedReport()?.liftStatus || 'Not specified' }}</span>
                </div>
                <div class="p-2 bg-slate-50 rounded-lg text-center">
                  <span class="block text-[10px] text-slate-500 uppercase font-semibold">Restroom</span>
                  <span class="text-xs font-bold text-slate-800">{{ submittedReport()?.accessibleToiletStatus || 'Not specified' }}</span>
                </div>
                <div class="p-2 bg-slate-50 rounded-lg text-center">
                  <span class="block text-[10px] text-slate-500 uppercase font-semibold">Entrance</span>
                  <span class="text-xs font-bold text-slate-800">{{ submittedReport()?.entranceInformation || 'Not specified' }}</span>
                </div>
              </div>

              @if (submittedReport()?.hasTemporaryObstacle) {
                <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️ Active Obstacle Alert:</span>
                  <span>{{ submittedReport()?.temporaryObstacleDetails }}</span>
                </div>
              }

              @if (submittedReport()?.evidenceImageReferences?.length) {
                <p class="text-xs text-teal-800 font-semibold pt-1">
                  📸 {{ submittedReport()?.evidenceImageReferences?.length }} photo evidence attached
                </p>
              }
            </div>

            <div class="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                (click)="switchToMyReports()"
                class="min-h-[44px] px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Track in My Reports</span>
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                (click)="resetForm()"
                class="min-h-[44px] px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors border border-slate-300 cursor-pointer"
              >
                Submit Another Venue
              </button>
            </div>
          </section>
        } @else {

          <!-- Form Editing Correction Notification -->
          @if (editingReportId) {
            <div class="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4">
              <div class="flex items-center gap-2 text-blue-900">
                <span class="text-xl">✏️</span>
                <div>
                  <h3 class="text-sm font-bold">Editing Existing Report</h3>
                  <p class="text-xs text-blue-700">Updating report data for {{ customVenueName || selectedPlaceName() }}. Corrections are logged for audit safety.</p>
                </div>
              </div>
              <button
                type="button"
                (click)="cancelEditing()"
                class="text-xs font-bold text-blue-800 hover:underline cursor-pointer"
              >
                Cancel Edit
              </button>
            </div>
          }

          <!-- Audit Submission Form -->
          <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs" novalidate>
            
            <!-- SECTION 1: VENUE SELECTION -->
            <fieldset class="space-y-4">
              <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full flex items-center justify-between">
                <span>1. Venue Information</span>
                <span class="text-xs text-slate-500 font-normal">Select existing or propose new</span>
              </legend>

              <div class="space-y-1.5">
                <label for="venue-select" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Place from Directory *
                </label>
                <select
                  id="venue-select"
                  [(ngModel)]="selectedPlaceId"
                  name="selectedPlaceId"
                  (ngModelChange)="onPlaceChange($event)"
                  [disabled]="!!editingReportId"
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[48px]"
                  required
                >
                  <option value="" disabled>-- Select a venue from catalog --</option>
                  @for (place of places(); track place.id) {
                    <option [value]="place.id">
                      {{ place.name }} ({{ place.categoryLabel }}) — {{ place.address.city }}
                    </option>
                  }
                  <option value="new_custom_venue">➕ Propose an unlisted new venue...</option>
                </select>
              </div>

              <!-- Unlisted Venue Details Form -->
              @if (selectedPlaceId === 'new_custom_venue') {
                <div class="p-5 rounded-xl bg-teal-50/60 border border-teal-200 space-y-4">
                  <div class="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                    <span>📍 Propose New Unlisted Location</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="custom-venue-name" class="block text-xs font-bold text-slate-700 mb-1">
                        Venue Name *
                      </label>
                      <input
                        id="custom-venue-name"
                        name="customVenueName"
                        type="text"
                        [(ngModel)]="customVenueName"
                        placeholder="e.g. Apollo Diagnostics Center"
                        class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                        required
                      />
                    </div>

                    <div>
                      <label for="custom-venue-category" class="block text-xs font-bold text-slate-700 mb-1">
                        Venue Category *
                      </label>
                      <select
                        id="custom-venue-category"
                        name="customVenueCategory"
                        [(ngModel)]="customVenueCategory"
                        class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 min-h-[42px]"
                      >
                        <option value="healthcare">Hospital / Healthcare Clinic</option>
                        <option value="public_transit">Public Transit / Train Station</option>
                        <option value="government">Government Office / Civic Building</option>
                        <option value="restroom">Public Restroom Facility</option>
                        <option value="shopping">Shopping Mall / Retail Store</option>
                        <option value="dining">Restaurant / Cafe</option>
                        <option value="education">University / School</option>
                        <option value="other">Other Public Location</option>
                      </select>
                    </div>

                    <div class="sm:col-span-2">
                      <label for="custom-venue-address" class="block text-xs font-bold text-slate-700 mb-1">
                        Street Address & Landmark *
                      </label>
                      <input
                        id="custom-venue-address"
                        name="customVenueAddress"
                        type="text"
                        [(ngModel)]="customVenueAddress"
                        placeholder="e.g. 102 Galle Road, Bambalapitiya"
                        class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                        required
                      />
                    </div>
                  </div>
                </div>
              }
            </fieldset>

            <!-- SECTION 2: REPORTER MOBILITY PERSPECTIVE -->
            <fieldset class="space-y-4">
              <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
                2. Your Mobility Perspective
              </legend>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="reporter-name" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    id="reporter-name"
                    name="reporterName"
                    type="text"
                    [(ngModel)]="reporterName"
                    placeholder="e.g. Sarah P. or Leave blank for anonymity"
                    class="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600"
                  />
                  <p class="text-[11px] text-slate-500 mt-1">Your email is kept private and never exposed publicly.</p>
                </div>

                <div>
                  <label for="reporter-role" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Navigating as: *
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

            <!-- SECTION 3: OVERALL ACCESSIBILITY RATING -->
            <fieldset class="space-y-4">
              <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
                3. Overall Usability Assessment *
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
                    <span class="text-xs text-slate-500">Step-free access, wide doors, compliant facilities</span>
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
                    <span class="text-xs text-slate-500">Usable with slight manual assistance or mild slope</span>
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
                    <span class="text-xs text-slate-500">Steep threshold, heavy door, or tight restroom</span>
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
                    <span class="text-xs text-slate-500">Flights of stairs with zero ramp or elevator</span>
                  </div>
                </label>
              </div>
            </fieldset>

            <!-- SECTION 4: PHYSICAL ACCESSIBILITY CRITERIA -->
            <fieldset class="space-y-5">
              <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full flex items-center justify-between">
                <span>4. Physical Accessibility Audit</span>
                <span class="text-xs text-slate-500 font-normal">Detailed facility breakdown</span>
              </legend>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- Ramp Status -->
                <div class="space-y-1">
                  <label for="ramp-status" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Ramp Status
                  </label>
                  <select
                    id="ramp-status"
                    name="rampStatus"
                    [(ngModel)]="rampStatus"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="available">Present & Fully Usable</option>
                    <option value="too_steep">Too Steep for Independent Use</option>
                    <option value="obstructed">Obstructed / Damaged</option>
                    <option value="none">No Ramp Present</option>
                    <option value="not_specified">Not Specified / Not Checked</option>
                  </select>
                </div>

                <!-- Stairs Status -->
                <div class="space-y-1">
                  <label for="stairs-status" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Stairs & Steps
                  </label>
                  <select
                    id="stairs-status"
                    name="stairsStatus"
                    [(ngModel)]="stairsStatus"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="no_stairs">Step-Free / Zero Steps</option>
                    <option value="has_alternative_ramp">Steps Present with Alternative Ramp</option>
                    <option value="unavoidable_stairs">Unavoidable Flight of Steps</option>
                    <option value="not_specified">Not Specified / Not Checked</option>
                  </select>
                </div>

                <!-- Elevator / Lift Status -->
                <div class="space-y-1">
                  <label for="lift-status" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Elevator / Lift Status
                  </label>
                  <select
                    id="lift-status"
                    name="liftStatus"
                    [(ngModel)]="liftStatus"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="available">Operational & Wheelchair Sized</option>
                    <option value="broken_down">Broken Down / Temporarily Out</option>
                    <option value="single_level">Single-Level Facility (No Lift Needed)</option>
                    <option value="none">Multi-Story with No Lift</option>
                    <option value="not_specified">Not Specified / Not Checked</option>
                  </select>
                </div>

                <!-- Accessible Toilet Status -->
                <div class="space-y-1">
                  <label for="toilet-status" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Accessible Restroom
                  </label>
                  <select
                    id="toilet-status"
                    name="accessibleToiletStatus"
                    [(ngModel)]="accessibleToiletStatus"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="available">Wheelchair Accessible with Grab Bars</option>
                    <option value="grab_bars_only">Grab Bars present but narrow entrance</option>
                    <option value="inaccessible">Standard Restroom (Inaccessible)</option>
                    <option value="none">No Public Restrooms</option>
                    <option value="not_specified">Not Specified / Not Checked</option>
                  </select>
                </div>

                <!-- Entrance Information -->
                <div class="space-y-1">
                  <label for="entrance-info" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Main Entrance Transition
                  </label>
                  <select
                    id="entrance-info"
                    name="entranceInformation"
                    [(ngModel)]="entranceInformation"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="step_free">Flush Zero-Threshold Entrance</option>
                    <option value="ramp_access">Ramp Access at Main Entry</option>
                    <option value="automatic_door">Automated / Sensor Sliding Door</option>
                    <option value="standard_door">Standard Manual Door</option>
                    <option value="steps_only">Steps Only (No Accessible Entry)</option>
                    <option value="not_specified">Not Specified / Not Checked</option>
                  </select>
                </div>

                <!-- Parking Status -->
                <div class="space-y-1">
                  <label for="parking-status" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Disabled Parking
                  </label>
                  <select
                    id="parking-status"
                    name="parkingStatus"
                    [(ngModel)]="parkingStatus"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="accessible_bays">Designated Blue-Badge Bays Present</option>
                    <option value="drop_off_only">Drop-Off / Loading Zone Only</option>
                    <option value="general_only">Standard Parking (No Dedicated Bays)</option>
                    <option value="none">No Parking Available</option>
                    <option value="not_specified">Not Specified / Not Checked</option>
                  </select>
                </div>

                <!-- Surface Condition -->
                <div class="space-y-1">
                  <label for="surface-condition" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Ground Surface
                  </label>
                  <select
                    id="surface-condition"
                    name="surfaceCondition"
                    [(ngModel)]="surfaceCondition"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    <option value="smooth_paved">Smooth Paved / Ceramic Tile</option>
                    <option value="cobblestone">Cobblestone / Uneven Pavers</option>
                    <option value="gravel_uneven">Gravel / Loose Sand / Grass</option>
                    <option value="mixed">Mixed Terrain</option>
                    <option value="not_specified">Not Specified / Not Checked</option>
                  </select>
                </div>

                <!-- Door Width / Measurements -->
                <div class="space-y-1">
                  <label for="door-width" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Door Width (Optional, cm)
                  </label>
                  <input
                    id="door-width"
                    name="doorWidthCm"
                    type="number"
                    min="40"
                    max="300"
                    [(ngModel)]="doorWidthCm"
                    placeholder="e.g. 85 cm (Standard accessible >= 80cm)"
                    class="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg min-h-[44px]"
                  />
                </div>

              </div>
            </fieldset>

            <!-- SECTION 5: TEMPORARY OBSTACLE ALERT -->
            <fieldset class="space-y-4">
              <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">
                5. Temporary Obstacle Warning
              </legend>

              <label class="flex items-center gap-3 p-4 rounded-xl bg-amber-50/80 border border-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasTemporaryObstacle"
                  [(ngModel)]="hasTemporaryObstacle"
                  class="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded cursor-pointer"
                />
                <div>
                  <span class="text-sm font-bold text-amber-950">Report an Active Temporary Obstacle at this Location</span>
                  <p class="text-xs text-amber-900/80">Check this if a lift is out of order, scaffolding blocks the entrance, or ramp repairs are in progress</p>
                </div>
              </label>

              @if (hasTemporaryObstacle) {
                <div class="space-y-1.5 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <label for="obstacle-details" class="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Obstacle Details & Alternative Instructions *
                  </label>
                  <input
                    id="obstacle-details"
                    name="temporaryObstacleDetails"
                    type="text"
                    [(ngModel)]="temporaryObstacleDetails"
                    placeholder="e.g. West entrance elevator undergoing maintenance; use East service ramp"
                    class="w-full px-3 py-2.5 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              }
            </fieldset>

            <!-- SECTION 6: EVIDENCE PHOTOS UPLOAD -->
            <fieldset class="space-y-4">
              <legend class="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 w-full flex items-center justify-between">
                <span>6. Photo Evidence (Optional)</span>
                <span class="text-xs text-slate-500 font-normal">Max 5 images, 5MB each (JPEG, PNG, WebP)</span>
              </legend>

              <div class="p-5 border-2 border-dashed border-slate-300 rounded-2xl hover:border-teal-500 transition-colors bg-slate-50/50">
                <div class="flex flex-col items-center justify-center text-center space-y-2">
                  <span class="text-3xl" aria-hidden="true">📸</span>
                  <label for="evidence-photos" class="cursor-pointer font-bold text-teal-700 hover:text-teal-800 text-sm">
                    <span>Click to choose photos</span>
                    <input
                      id="evidence-photos"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      (change)="onFilesSelected($event)"
                      class="sr-only"
                    />
                  </label>
                  <p class="text-xs text-slate-500">
                    Ramps, doorway thresholds, elevators, or restroom grab bars. Photos are stored securely.
                  </p>
                </div>
              </div>

              <!-- Selected Photos Preview Gallery -->
              @if (selectedFiles.length > 0) {
                <div class="space-y-2">
                  <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Selected Photos ({{ selectedFiles.length }}/5):</span>
                  <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    @for (file of selectedFiles; track file.name; let idx = $index) {
                      <div class="relative group rounded-xl border border-slate-200 overflow-hidden bg-white p-2 shadow-xs">
                        <div class="aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-xs font-medium text-slate-600 text-center p-1 break-all">
                          {{ file.name }}
                        </div>
                        <div class="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{{ formatFileSize(file.size) }}</span>
                          <button
                            type="button"
                            (click)="removeFile(idx)"
                            class="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </fieldset>

            <!-- SECTION 7: DETAILED NOTES -->
            <div class="space-y-2">
              <label for="detailed-notes" class="block text-sm font-bold text-slate-900">
                7. Field Notes & Mobility Tips
              </label>
              <textarea
                id="detailed-notes"
                name="notes"
                [(ngModel)]="notes"
                rows="4"
                placeholder="Mention door heaviness, turning radius in restrooms, lighting, staff helpfulness, or nearest drop-off curb cut..."
                class="w-full p-4 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white"
              ></textarea>
            </div>

            <!-- Correction Notes (When editing) -->
            @if (editingReportId) {
              <div class="space-y-2 p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                <label for="correction-notes" class="block text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Summary of Corrections Made *
                </label>
                <input
                  id="correction-notes"
                  name="correctionNotes"
                  type="text"
                  [(ngModel)]="correctionNotes"
                  placeholder="e.g. Corrected ramp status after re-testing entrance width"
                  class="w-full px-3.5 py-2.5 text-sm bg-white border border-blue-300 rounded-lg"
                  required
                />
              </div>
            }

            <!-- Error Feedback Alert -->
            @if (formError()) {
              <div class="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-medium flex items-center gap-2" role="alert">
                <span aria-hidden="true">⚠️</span>
                <span>{{ formError() }}</span>
              </div>
            }

            <!-- Form Actions -->
            <div class="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p class="text-xs text-slate-500">
                Audits undergo peer review by certified accessibility moderators.
              </p>

              <div class="flex items-center gap-3 w-full sm:w-auto">
                @if (editingReportId) {
                  <button
                    type="button"
                    (click)="cancelEditing()"
                    class="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                }

                <button
                  type="submit"
                  [disabled]="isSubmitting()"
                  class="w-full sm:w-auto min-h-[50px] px-8 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white font-black text-sm sm:text-base transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  @if (isSubmitting()) {
                    <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  } @else {
                    <span>{{ editingReportId ? 'Save Corrected Audit' : 'Submit Accessibility Audit' }}</span>
                    <span aria-hidden="true">→</span>
                  }
                </button>
              </div>
            </div>

          </form>
        }
      }

      <!-- TAB 2: MY SUBMITTED REPORTS & VERIFICATION STATUS -->
      @if (activeTab() === 'history') {
        <section class="space-y-6" aria-labelledby="history-heading">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 id="history-heading" class="text-2xl font-black text-slate-900">
                My Submitted Audits
              </h2>
              <p class="text-xs sm:text-sm text-slate-600">
                Track your audit submissions, see moderation review decisions, and amend any corrections.
              </p>
            </div>

            <button
              type="button"
              (click)="resetForm(); activeTab.set('form')"
              class="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              + Submit New Audit
            </button>
          </div>

          @if (myReports().length === 0) {
            <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <span class="text-4xl block">📋</span>
              <h3 class="text-base font-bold text-slate-800">No Audits Submitted Yet</h3>
              <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                You haven't logged any venue accessibility reports under this account. Help travelers by reviewing a nearby venue.
              </p>
              <button
                type="button"
                (click)="activeTab.set('form')"
                class="mt-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                Submit First Audit
              </button>
            </div>
          } @else {
            <div class="space-y-4">
              @for (rep of myReports(); track rep.id) {
                <article class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
                  
                  <!-- Card Header -->
                  <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-lg font-black text-slate-900">{{ rep.placeName }}</h3>
                        @if (rep.isProposedPlace) {
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Unlisted Venue
                          </span>
                        }
                        @if (rep.isCorrection) {
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Amended
                          </span>
                        }
                      </div>
                      <p class="text-xs text-slate-500 mt-0.5">
                        Submitted on {{ rep.submissionDate }} • Navigating as: {{ rep.reporterRoleLabel || rep.reporterRole }}
                      </p>
                    </div>

                    <!-- Status Badges -->
                    <div>
                      @switch (rep.moderationStatus || rep.reportStatus) {
                        @case ('approved') {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span>✓</span>
                            <span>Verified & Published</span>
                          </span>
                        }
                        @case ('needs_review') {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <span>ℹ</span>
                            <span>Needs Additional Info</span>
                          </span>
                        }
                        @case ('rejected') {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span>✕</span>
                            <span>Rejected by Moderator</span>
                          </span>
                        }
                        @default {
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <span>⏳</span>
                            <span>Pending Moderator Review</span>
                          </span>
                        }
                      }
                    </div>
                  </div>

                  <!-- Physical Parameters Summary -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Ramp</span>
                      <span class="font-bold text-slate-800">{{ rep.rampStatus || 'not_specified' }}</span>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Lift / Elevator</span>
                      <span class="font-bold text-slate-800">{{ rep.liftStatus || 'not_specified' }}</span>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Accessible Toilet</span>
                      <span class="font-bold text-slate-800">{{ rep.accessibleToiletStatus || 'not_specified' }}</span>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Disabled Parking</span>
                      <span class="font-bold text-slate-800">{{ rep.parkingStatus || 'not_specified' }}</span>
                    </div>
                  </div>

                  <!-- Temporary Obstacle Alert -->
                  @if (rep.hasTemporaryObstacle) {
                    <div class="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                      <span class="font-bold">⚠️ Reported Obstacle:</span> {{ rep.temporaryObstacleDetails }}
                    </div>
                  }

                  <!-- Contributor Notes -->
                  @if (rep.notes) {
                    <p class="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg">
                      "{{ rep.notes }}"
                    </p>
                  }

                  <!-- Moderator Feedback (if any) -->
                  @if (rep.reviewNotes) {
                    <div class="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1">
                      <span class="font-bold uppercase tracking-wider text-[10px] text-teal-700">Moderator Review Feedback:</span>
                      <p>{{ rep.reviewNotes }}</p>
                    </div>
                  }

                  <!-- Card Action Footer -->
                  <div class="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span class="text-[11px] text-slate-400">
                      Report ID: {{ rep.id }}
                    </span>

                    <button
                      type="button"
                      (click)="startEditingReport(rep)"
                      class="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>✏️ Correct / Edit Report</span>
                    </button>
                  </div>

                </article>
              }
            </div>
          }
        </section>
      }

    </div>
  `,
})
export class SubmitReportComponent implements OnInit {
  private readonly placeService = inject(PlaceService);
  private readonly reportService = inject(ReportService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly places = this.placeService.allPlaces;
  readonly myReports = this.reportService.myReports;
  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;

  // View state
  activeTab = signal<'form' | 'history'>('form');
  editingReportId: string | null = null;
  isSubmitting = signal<boolean>(false);
  submissionSuccess = signal<boolean>(false);
  submittedReport = signal<AccessibilityReport | null>(null);
  formError = signal<string | null>(null);

  // Form Fields
  selectedPlaceId = '';
  customVenueName = '';
  customVenueAddress = '';
  customVenueCategory = 'other';
  reporterName = '';
  reporterRole: ReporterRole = 'wheelchair_user';
  rating: AccessibilityRating = 'fully_accessible';

  // Physical Criteria
  rampStatus: 'available' | 'too_steep' | 'obstructed' | 'none' | 'not_specified' = 'available';
  stairsStatus: 'no_stairs' | 'has_alternative_ramp' | 'unavoidable_stairs' | 'not_specified' = 'no_stairs';
  liftStatus: 'available' | 'broken_down' | 'single_level' | 'none' | 'not_specified' = 'available';
  accessibleToiletStatus: 'available' | 'grab_bars_only' | 'inaccessible' | 'none' | 'not_specified' = 'available';
  entranceInformation: 'step_free' | 'ramp_access' | 'steps_only' | 'automatic_door' | 'standard_door' | 'not_specified' = 'step_free';
  parkingStatus: 'accessible_bays' | 'drop_off_only' | 'general_only' | 'none' | 'not_specified' = 'accessible_bays';
  surfaceCondition: 'smooth_paved' | 'cobblestone' | 'gravel_uneven' | 'mixed' | 'not_specified' = 'smooth_paved';
  doorWidthCm?: number;

  // Obstacle & Notes
  hasTemporaryObstacle = false;
  temporaryObstacleDetails = '';
  notes = '';
  correctionNotes = '';

  // Evidence Photos
  selectedFiles: File[] = [];

  ngOnInit(): void {
    // Prefill user details if signed in
    const user = this.currentUser();
    if (user) {
      this.reporterName = user.name;
    }

    // Prefill venue if placeId queryParam is present
    this.route.queryParams.subscribe((params) => {
      if (params['placeId']) {
        const found = this.placeService.getPlaceById(params['placeId']);
        if (found) {
          this.selectedPlaceId = found.id;
        }
      }
      if (params['tab'] === 'history') {
        this.switchToMyReports();
      }
    });

    // Load user's submitted reports
    if (this.isAuthenticated()) {
      this.reportService.fetchMyReports().subscribe();
    }
  }

  switchToMyReports(): void {
    this.activeTab.set('history');
    if (this.isAuthenticated()) {
      this.reportService.fetchMyReports().subscribe();
    }
  }

  selectedPlaceName(): string {
    const place = this.placeService.getPlaceById(this.selectedPlaceId);
    return place?.name || 'Selected Venue';
  }

  onPlaceChange(val: string): void {
    this.selectedPlaceId = val;
    this.formError.set(null);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];

      if (!allowedMimes.includes(file.type)) {
        this.formError.set(`File "${file.name}" is not an accepted image type (JPEG, PNG, WebP only).`);
        return;
      }

      if (file.size > maxSizeBytes) {
        this.formError.set(`File "${file.name}" exceeds the 5 MB limit.`);
        return;
      }

      if (this.selectedFiles.length < 5) {
        this.selectedFiles.push(file);
      } else {
        this.formError.set('A maximum of 5 evidence photos can be uploaded per report.');
        break;
      }
    }

    this.formError.set(null);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  startEditingReport(report: AccessibilityReport): void {
    this.editingReportId = report.id;
    this.activeTab.set('form');
    this.submissionSuccess.set(false);
    this.submittedReport.set(null);
    this.formError.set(null);

    // Populate form with report data
    this.selectedPlaceId = report.placeId;
    if (report.isProposedPlace && report.proposedPlaceDetails) {
      this.selectedPlaceId = 'new_custom_venue';
      this.customVenueName = report.proposedPlaceDetails.name || report.placeName;
      this.customVenueAddress = report.proposedPlaceDetails.address || '';
      this.customVenueCategory = report.proposedPlaceDetails.category || 'other';
    }

    this.reporterName = report.reporterName;
    this.reporterRole = report.reporterRole;
    this.rating = report.rating;
    this.rampStatus = report.rampStatus || 'available';
    this.stairsStatus = report.stairsStatus || 'no_stairs';
    this.liftStatus = report.liftStatus || 'available';
    this.accessibleToiletStatus = report.accessibleToiletStatus || 'available';
    this.entranceInformation = report.entranceInformation || 'step_free';
    this.parkingStatus = report.parkingStatus || 'accessible_bays';
    this.surfaceCondition = report.surfaceCondition || 'smooth_paved';
    this.doorWidthCm = report.doorWidthCm;
    this.hasTemporaryObstacle = report.hasTemporaryObstacle;
    this.temporaryObstacleDetails = report.temporaryObstacleDetails || '';
    this.notes = report.notes || '';
    this.correctionNotes = report.correctionNotes || 'Corrected field measurements';
  }

  cancelEditing(): void {
    this.editingReportId = null;
    this.resetForm();
  }

  onSubmit(): void {
    this.formError.set(null);

    if (!this.selectedPlaceId) {
      this.formError.set('Please select an existing venue or propose a new unlisted location.');
      return;
    }

    let isProposed = false;
    let placeName = '';
    let finalPlaceId = this.selectedPlaceId;
    let proposedDetails = undefined;

    if (this.selectedPlaceId === 'new_custom_venue') {
      if (!this.customVenueName.trim()) {
        this.formError.set('Please enter the name of the proposed unlisted venue.');
        return;
      }
      if (!this.customVenueAddress.trim()) {
        this.formError.set('Please provide the street address or landmark of the unlisted venue.');
        return;
      }
      isProposed = true;
      placeName = this.customVenueName.trim();
      finalPlaceId = `proposed-${Date.now()}`;
      proposedDetails = {
        name: this.customVenueName.trim(),
        address: this.customVenueAddress.trim(),
        city: 'Colombo',
        category: this.customVenueCategory,
      };
    } else {
      const place = this.placeService.getPlaceById(this.selectedPlaceId);
      placeName = place?.name || 'Selected Venue';
    }

    if (this.hasTemporaryObstacle && !this.temporaryObstacleDetails.trim()) {
      this.formError.set('Please provide details for the temporary obstacle you reported.');
      return;
    }

    this.isSubmitting.set(true);

    // 1. Upload photos if any
    const upload$ = this.selectedFiles.length > 0
      ? this.reportService.uploadEvidencePhotos(this.selectedFiles)
      : this.reportService.uploadEvidencePhotos([]);

    upload$.subscribe({
      next: (photoUrls) => {
        const payload: NewReportSubmission = {
          placeId: finalPlaceId,
          placeName,
          isProposedPlace: isProposed,
          proposedPlaceDetails: proposedDetails,
          reporterName: this.reporterName.trim() || 'Community Contributor',
          reporterRole: this.reporterRole,
          rating: this.rating,
          rampStatus: this.rampStatus,
          stairsStatus: this.stairsStatus,
          liftStatus: this.liftStatus,
          accessibleToiletStatus: this.accessibleToiletStatus,
          entranceInformation: this.entranceInformation,
          parkingStatus: this.parkingStatus,
          surfaceCondition: this.surfaceCondition,
          doorWidthCm: this.doorWidthCm,
          hasTemporaryObstacle: this.hasTemporaryObstacle,
          temporaryObstacleDetails: this.hasTemporaryObstacle ? this.temporaryObstacleDetails.trim() : undefined,
          notes: this.notes.trim() || 'Observations verified during physical visit.',
          evidenceImageReferences: photoUrls,
          isCorrection: !!this.editingReportId,
          originalReportId: this.editingReportId || undefined,
          correctionNotes: this.editingReportId ? this.correctionNotes.trim() : undefined,
        };

        if (this.editingReportId) {
          // Update / Correct existing report
          this.reportService.correctReport(this.editingReportId, payload).subscribe({
            next: (saved) => {
              this.isSubmitting.set(false);
              this.submittedReport.set(saved);
              this.submissionSuccess.set(true);
              this.editingReportId = null;
            },
            error: (err) => {
              this.isSubmitting.set(false);
              this.formError.set(err.error?.message || 'Failed to update report.');
            },
          });
        } else {
          // Submit new report
          this.reportService.submitReport(payload).subscribe({
            next: (saved) => {
              this.isSubmitting.set(false);
              this.submittedReport.set(saved);
              this.submissionSuccess.set(true);
            },
            error: (err) => {
              this.isSubmitting.set(false);
              this.formError.set(err.error?.message || 'Failed to submit report.');
            },
          });
        }
      },
      error: (uploadErr) => {
        this.isSubmitting.set(false);
        this.formError.set(uploadErr.error?.message || 'Failed to upload photo evidence.');
      },
    });
  }

  resetForm(): void {
    this.selectedPlaceId = '';
    this.customVenueName = '';
    this.customVenueAddress = '';
    this.customVenueCategory = 'other';
    this.notes = '';
    this.correctionNotes = '';
    this.hasTemporaryObstacle = false;
    this.temporaryObstacleDetails = '';
    this.selectedFiles = [];
    this.editingReportId = null;
    this.submissionSuccess.set(false);
    this.submittedReport.set(null);
    this.formError.set(null);
    this.isSubmitting.set(false);
  }
}
