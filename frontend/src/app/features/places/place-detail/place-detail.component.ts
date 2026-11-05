import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlaceService } from '../../../core/services/place.service';
import { ReportService } from '../../../core/services/report.service';
import { Place } from '../../../core/models/place.model';
import { AccessibilityReport } from '../../../core/models/report.model';
import { MapComponent } from '../../../shared/components/map/map.component';

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MapComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      <!-- Back Navigation Breadcrumb -->
      <nav aria-label="Breadcrumb" class="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
        <a routerLink="/places" class="hover:text-teal-700 font-semibold focus:underline">
          ← Back to Accessible Places
        </a>
        <span aria-hidden="true">/</span>
        <span class="text-slate-800 font-medium truncate max-w-xs sm:max-w-md">
          {{ place()?.name || 'Place Details' }}
        </span>
      </nav>

      <!-- Place Not Found State -->
      @if (!place()) {
        <div class="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs" role="alert">
          <div class="w-16 h-16 rounded-full bg-rose-50 text-3xl flex items-center justify-center mx-auto text-rose-600" aria-hidden="true">
            ⚠️
          </div>
          <div class="space-y-1">
            <h1 class="text-2xl font-black text-slate-900">Place Not Found</h1>
            <p class="text-sm text-slate-600">
              The requested venue does not exist in our demo dataset or may have been removed.
            </p>
          </div>
          <div class="pt-2">
            <a
              routerLink="/places"
              class="inline-flex items-center min-h-[44px] px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm"
            >
              Return to Places Directory
            </a>
          </div>
        </div>
      } @else {
        <!-- Loaded Place Content -->
        @if (place(); as p) {
          <!-- Header Banner -->
          <header class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {{ p.categoryLabel }}
              </span>

              <div class="flex items-center gap-2">
                @if (p.verifiedStatus === 'community_verified') {
                  <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <span aria-hidden="true">✓</span> Community Verified
                  </span>
                } @else if (p.verifiedStatus === 'staff_verified') {
                  <span class="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                    <span aria-hidden="true">★</span> Official Staff Audit
                  </span>
                }

                <span class="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <span class="text-amber-500" aria-hidden="true">★</span> {{ p.overallRating }}
                  <span class="text-slate-500 font-normal">({{ p.reviewCount }} audits)</span>
                </span>
              </div>
            </div>

            <div>
              <h1 class="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {{ p.name }}
              </h1>
              <p class="text-sm sm:text-base text-slate-600 mt-2 flex items-center gap-2">
                <span class="text-slate-400" aria-hidden="true">📍</span>
                <span>{{ p.address.street }}, {{ p.address.city }}, {{ p.address.state }} {{ p.address.postalCode }}</span>
              </p>
              @if (p.address.landmark) {
                <p class="text-xs sm:text-sm text-slate-500 italic mt-0.5 ml-6">
                  Landmark: {{ p.address.landmark }}
                </p>
              }
            </div>

            <!-- Action buttons header -->
            <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <a
                [routerLink]="['/submit-report']"
                [queryParams]="{ placeId: p.id }"
                class="min-h-[48px] px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer focus:ring-4 focus:ring-teal-200"
              >
                <span aria-hidden="true">📝</span>
                <span>Submit Accessibility Update</span>
              </a>

              <a
                routerLink="/explore-map"
                class="min-h-[48px] px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center gap-2 border border-slate-200"
              >
                <span aria-hidden="true">🗺️</span>
                <span>View On Map</span>
              </a>

              <a
                routerLink="/plan-route"
                [queryParams]="{ destId: p.id, mode: 'route' }"
                class="min-h-[48px] px-5 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-sm transition-colors flex items-center gap-2 border border-teal-200"
              >
                <span aria-hidden="true">🧭</span>
                <span>Plan Route Here</span>
              </a>

              <span class="text-xs text-slate-500 ml-auto font-medium">
                Last Physical Audit: {{ p.lastAuditDate }}
              </span>
            </div>
          </header>

          <!-- Temporary Obstacle Alert if present -->
          @if (p.temporaryObstacles.length > 0) {
            <section
              class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 text-amber-950 space-y-2 shadow-xs"
              role="alert"
              aria-labelledby="obstacle-alert-heading"
            >
              <div class="flex items-center gap-2 font-bold text-base text-amber-900">
                <span class="text-xl" aria-hidden="true">⚠️</span>
                <h2 id="obstacle-alert-heading">Active Obstacle Notice</h2>
                <span class="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black uppercase tracking-wider ml-auto">
                  {{ p.temporaryObstacles[0].severity }} Severity
                </span>
              </div>
              <h3 class="text-sm font-bold text-amber-900">
                {{ p.temporaryObstacles[0].title }}
              </h3>
              <p class="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                {{ p.temporaryObstacles[0].description }}
              </p>
              <p class="text-[11px] text-amber-800 font-semibold pt-1">
                Reported by community member on {{ p.temporaryObstacles[0].reportedDate }}
              </p>
            </section>
          }

          <!-- Detailed Accessibility Specifications Grid -->
          <section class="space-y-4" aria-labelledby="specs-heading">
            <h2 id="specs-heading" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Physical Accessibility Specifications
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- 1. Entrance & Doors -->
              <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
                <div class="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <span class="text-2xl" aria-hidden="true">🚪</span>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Entrance & Doorways</h3>
                    <p class="text-xs text-slate-500">Threshold & doorway clearance</p>
                  </div>
                </div>

                <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li class="flex items-center justify-between">
                    <span>Step-Free Ground Access:</span>
                    <span class="font-bold" [class.text-emerald-700]="p.amenities.stepFreeEntrance" [class.text-rose-700]="!p.amenities.stepFreeEntrance">
                      {{ p.amenities.stepFreeEntrance ? 'Yes (Zero Threshold)' : 'No (Steps Present)' }}
                    </span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Main Door Clear Width:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.doorWidthCm }} cm</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Automated Power Doors:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.automatedDoor ? 'Yes (Motion Sensor / Push Pad)' : 'Manual Pull/Push' }}</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Curb Cut at Entrance:</span>
                    <span class="font-bold text-emerald-700">Level curb cutout</span>
                  </li>
                </ul>

                @if (p.entranceTips) {
                  <div class="mt-2 p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 border border-slate-200">
                    <strong class="text-slate-800">Entrance Tip:</strong> {{ p.entranceTips }}
                  </div>
                }
              </div>

              <!-- 2. Ramps & Slopes -->
              <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
                <div class="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <span class="text-2xl" aria-hidden="true">📐</span>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Ramps & Incline</h3>
                    <p class="text-xs text-slate-500">Gradients and handrails</p>
                  </div>
                </div>

                <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li class="flex items-center justify-between">
                    <span>Ramp Available:</span>
                    <span class="font-bold" [class.text-emerald-700]="p.amenities.ramp.available">
                      {{ p.amenities.ramp.available ? 'Yes' : 'None Required / Flat' }}
                    </span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Slope Gradient:</span>
                    <span class="font-bold capitalize text-slate-900">{{ p.amenities.ramp.slope }} (Wheelchair Compliant)</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Continuous Handrails:</span>
                    <span class="font-bold" [class.text-emerald-700]="p.amenities.ramp.hasHandrails">
                      {{ p.amenities.ramp.hasHandrails ? 'Both Sides (90cm height)' : 'No' }}
                    </span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Surface Texture:</span>
                    <span class="font-bold text-slate-900">Non-slip textured surface</span>
                  </li>
                </ul>
              </div>

              <!-- 3. Elevators & Vertical Transport -->
              <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
                <div class="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <span class="text-2xl" aria-hidden="true">🛗</span>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Elevator & Multi-Level Lift</h3>
                    <p class="text-xs text-slate-500">Cab dimensions and sensory cues</p>
                  </div>
                </div>

                <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li class="flex items-center justify-between">
                    <span>Elevator Access:</span>
                    <span class="font-bold" [class.text-emerald-700]="p.amenities.elevator.available">
                      {{ p.amenities.elevator.available ? 'Yes (All Floors)' : 'Single Level Facility' }}
                    </span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Current Operating Status:</span>
                    <span class="font-bold"
                      [class.text-emerald-700]="p.amenities.elevator.workingStatus === 'operational'"
                      [class.text-rose-700]="p.amenities.elevator.workingStatus === 'out_of_service'">
                      {{ p.amenities.elevator.workingStatus === 'operational' ? 'Operational' : (p.amenities.elevator.workingStatus === 'out_of_service' ? 'Out of Service' : 'N/A') }}
                    </span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Auditory Floor Chimes:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.elevator.auditoryPrompts ? 'Yes' : 'No' }}</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Braille & Low Tactile Buttons:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.elevator.brailleButtons ? 'Yes (90-110cm height)' : 'No' }}</span>
                  </li>
                </ul>
              </div>

              <!-- 4. Accessible Restrooms -->
              <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
                <div class="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <span class="text-2xl" aria-hidden="true">🚻</span>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Accessible Toilet Facilities</h3>
                    <p class="text-xs text-slate-500">Grab bars and turning diameter</p>
                  </div>
                </div>

                <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li class="flex items-center justify-between">
                    <span>Dedicated Accessible Washroom:</span>
                    <span class="font-bold" [class.text-emerald-700]="p.amenities.accessibleRestroom.available">
                      {{ p.amenities.accessibleRestroom.available ? 'Yes (Unisex / Family)' : 'Standard Only' }}
                    </span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Sturdy Grab Bars:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.accessibleRestroom.grabBars ? 'Both Horizontal & Fold-down' : 'No' }}</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Roll-In Knee Clearance Sink:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.accessibleRestroom.rollInSink ? 'Yes (70cm clearance)' : 'No' }}</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Floor Level Emergency Pull Cord:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.accessibleRestroom.emergencyCord ? 'Yes (Connected to front desk)' : 'No' }}</span>
                  </li>
                </ul>
              </div>

              <!-- 5. Parking & Public Transit -->
              <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
                <div class="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <span class="text-2xl" aria-hidden="true">🅿️</span>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Parking & Public Transit</h3>
                    <p class="text-xs text-slate-500">Designated bays and transfer zones</p>
                  </div>
                </div>

                <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li class="flex items-center justify-between">
                    <span>Designated Blue-Badge Bays:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.disabledParking.available ? p.amenities.disabledParking.bayCount + ' Marked Spaces' : 'Street Only' }}</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Distance to Main Entrance:</span>
                    <span class="font-bold text-teal-800">{{ p.amenities.disabledParking.distanceToEntranceMeters }} meters (Level Paved Path)</span>
                  </li>
                </ul>

                @if (p.transitTips) {
                  <div class="mt-2 p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600 border border-slate-200">
                    <strong class="text-slate-800">Transit Tip:</strong> {{ p.transitTips }}
                  </div>
                }
              </div>

              <!-- 6. Additional Sensory & Auditory Aids -->
              <div class="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
                <div class="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <span class="text-2xl" aria-hidden="true">👁️</span>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Sensory & Auditory Features</h3>
                    <p class="text-xs text-slate-500">Vision, hearing, and neurodivergent accommodations</p>
                  </div>
                </div>

                <ul class="space-y-2 text-xs sm:text-sm text-slate-700">
                  <li class="flex items-center justify-between">
                    <span>Braille & Tactile Wayfinding:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.brailleSignage ? 'Installed at key rooms' : 'Standard visual' }}</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Hearing Induction Loop:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.hearingLoop ? 'Available at reception desk' : 'No' }}</span>
                  </li>
                  <li class="flex items-center justify-between">
                    <span>Low-Stimulus / Quiet Hours:</span>
                    <span class="font-bold text-slate-900">{{ p.amenities.quietHoursAvailable ? 'Yes (Weekly schedule)' : 'None' }}</span>
                  </li>
                </ul>
              </div>

            </div>
          </section>

          <!-- Place Full Description -->
          <section class="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <h2 class="text-lg font-bold text-slate-900">Venue Overview & Accessibility Notes</h2>
            <p class="text-sm text-slate-700 leading-relaxed">
              {{ p.fullDescription }}
            </p>
          </section>

          <!-- Interactive Venue Map Location (Reusable Map Component) -->
          <section class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs" aria-labelledby="map-location-heading">
            <div class="flex items-center justify-between">
              <div>
                <h2 id="map-location-heading" class="text-lg font-bold text-slate-900">
                  Venue Location & Map
                </h2>
                <p class="text-xs text-slate-500">
                  {{ p.address.street }}, {{ p.address.city }} • Coordinates: {{ p.coordinates.lat }}, {{ p.coordinates.lng }}
                </p>
              </div>
              <a
                routerLink="/explore-map"
                class="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 flex items-center gap-1.5 transition-colors"
              >
                <span>🗺️</span>
                <span>Open in Explore Map</span>
              </a>
            </div>

            <div class="h-80 w-full rounded-xl overflow-hidden border border-slate-200">
              <app-map
                [places]="[p]"
                [selectedPlace]="p"
                [center]="[p.coordinates.lat, p.coordinates.lng]"
                [zoom]="16"
              ></app-map>
            </div>
          </section>

          <!-- Community Audit History Feed -->
          <section class="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs" aria-labelledby="community-audits-heading">
            <div class="flex items-center justify-between">
              <div>
                <h2 id="community-audits-heading" class="text-lg font-bold text-slate-900">
                  Community Accessibility Audits ({{ placeReports().length }})
                </h2>
                <p class="text-xs text-slate-500">Real feedback submitted by wheelchair users, companions, and auditors</p>
              </div>

              <a
                [routerLink]="['/submit-report']"
                [queryParams]="{ placeId: p.id }"
                class="px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200"
              >
                + Add Your Audit
              </a>
            </div>

            @if (placeReports().length === 0) {
              <div class="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p class="text-sm font-semibold text-slate-700">No community audits recorded yet for this venue.</p>
                <p class="text-xs text-slate-500">Be the first person to verify door widths, ramps, and restroom conditions!</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (rep of placeReports(); track rep.id) {
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-900">{{ rep.reporterName }}</span>
                        <span class="text-[11px] font-medium bg-teal-100 text-teal-900 px-2 py-0.5 rounded">
                          {{ rep.reporterRoleLabel }}
                        </span>
                      </div>
                      <span class="text-xs text-slate-400">{{ rep.submissionDate }}</span>
                    </div>

                    <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {{ rep.notes }}
                    </p>

                    @if (rep.hasTemporaryObstacle) {
                      <div class="p-2 rounded bg-amber-100/70 border border-amber-300 text-amber-950 text-xs font-medium">
                        ⚠️ <strong>Noted Obstacle:</strong> {{ rep.temporaryObstacleDetails }}
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </section>
        }
      }

    </div>
  `,
})
export class PlaceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly placeService = inject(PlaceService);
  private readonly reportService = inject(ReportService);

  readonly place = signal<Place | undefined>(undefined);
  readonly placeReports = signal<AccessibilityReport[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        const found = this.placeService.getPlaceById(id);
        this.place.set(found);
        if (found) {
          this.placeReports.set(this.reportService.getReportsForPlace(found.id));
        }
      }
    });
  }
}
