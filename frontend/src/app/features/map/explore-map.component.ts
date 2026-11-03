import {
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlaceService } from '../../core/services/place.service';
import { Place, PlaceCategory } from '../../core/models/place.model';
import { MapComponent } from '../../shared/components/map/map.component';
import { AccessibilityBadgeComponent } from '../../shared/components/accessibility-badge/accessibility-badge.component';

export interface LocationAlert {
  type: 'error' | 'info' | 'success';
  message: string;
}

@Component({
  selector: 'app-explore-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapComponent, AccessibilityBadgeComponent],
  template: `
    <div class="flex flex-col h-[calc(100vh-5rem)] bg-slate-100 overflow-hidden">
      
      <!-- Top Accessibility Filter & Search Bar -->
      <section class="bg-white border-b border-slate-200 px-4 py-3 shadow-xs shrink-0 z-30" aria-label="Map Search and Accessibility Filters">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <!-- Search input, Category Selector & Mobile Mode Toggle -->
          <div class="flex items-center gap-2 flex-1">
            
            <!-- Search Input -->
            <div class="relative flex-1 max-w-sm">
              <label for="map-search-input" class="sr-only">Search accessible places on the map</label>
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" aria-hidden="true">
                🔍
              </div>
              <input
                id="map-search-input"
                type="search"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                placeholder="Search venues, streets, or keywords..."
                class="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <!-- Category Dropdown Filter -->
            <div class="relative shrink-0">
              <label for="category-select" class="sr-only">Filter by category</label>
              <select
                id="category-select"
                [ngModel]="selectedCategory()"
                (ngModelChange)="onCategoryChange($event)"
                class="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer min-h-[38px]"
              >
                <option value="all">🏢 All Categories</option>
                <option value="healthcare">🏥 Hospitals & Care</option>
                <option value="culture">🏛️ Public & Libraries</option>
                <option value="transport">🚆 Transit & Stations</option>
                <option value="restroom">🚻 Accessible Toilets</option>
                <option value="dining">☕ Cafes & Dining</option>
                <option value="parks">🌳 Parks & Rec</option>
                <option value="shopping">🛒 Grocery & Markets</option>
              </select>
            </div>

            <!-- Locate Me GPS Button (Explicit permission only) -->
            <button
              type="button"
              (click)="requestUserLocation()"
              [disabled]="isLocating()"
              [title]="isLocating() ? 'Acquiring GPS location...' : 'Locate my position (requests permission)'"
              aria-label="Find my current location"
              class="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 min-h-[38px] cursor-pointer"
              [class.bg-teal-50]="userLocation() !== null"
              [class.border-teal-500]="userLocation() !== null"
              [class.text-teal-800]="userLocation() !== null"
              [class.bg-white]="userLocation() === null"
              [class.text-slate-700]="userLocation() === null"
            >
              @if (isLocating()) {
                <span class="w-3.5 h-3.5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></span>
                <span class="hidden sm:inline">Locating...</span>
              } @else {
                <span>📍</span>
                <span class="hidden sm:inline">Find Me</span>
              }
            </button>

            <!-- Mobile View Mode Toggle (Map vs List) -->
            <div class="flex items-center lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 ml-auto">
              <button
                type="button"
                (click)="viewMode.set('map')"
                [class.bg-white]="viewMode() === 'map'"
                [class.shadow-xs]="viewMode() === 'map'"
                [class.font-bold]="viewMode() === 'map'"
                class="px-3 py-1.5 text-xs rounded-lg text-slate-800 transition-colors"
                aria-label="Switch to map view"
              >
                Map
              </button>
              <button
                type="button"
                (click)="viewMode.set('list')"
                [class.bg-white]="viewMode() === 'list'"
                [class.shadow-xs]="viewMode() === 'list'"
                [class.font-bold]="viewMode() === 'list'"
                class="px-3 py-1.5 text-xs rounded-lg text-slate-800 transition-colors"
                aria-label="Switch to list view"
              >
                List ({{ filteredPlaces().length }})
              </button>
            </div>
          </div>

          <!-- Fast Accessibility Criteria Toggles -->
          <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="toolbar" aria-label="Accessibility criteria filters">
            <button
              type="button"
              (click)="toggleStepFree()"
              [class.bg-teal-700]="filterCriteria().mustHaveStepFree"
              [class.text-white]="filterCriteria().mustHaveStepFree"
              [class.border-teal-700]="filterCriteria().mustHaveStepFree"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
              [attr.aria-pressed]="filterCriteria().mustHaveStepFree"
            >
              <span>🚶‍♂️</span>
              <span>Step-Free</span>
            </button>

            <button
              type="button"
              (click)="toggleRamp()"
              [class.bg-teal-700]="filterCriteria().mustHaveRamp"
              [class.text-white]="filterCriteria().mustHaveRamp"
              [class.border-teal-700]="filterCriteria().mustHaveRamp"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
              [attr.aria-pressed]="filterCriteria().mustHaveRamp"
            >
              <span>📐</span>
              <span>Ramp</span>
            </button>

            <button
              type="button"
              (click)="toggleElevator()"
              [class.bg-teal-700]="filterCriteria().mustHaveElevator"
              [class.text-white]="filterCriteria().mustHaveElevator"
              [class.border-teal-700]="filterCriteria().mustHaveElevator"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
              [attr.aria-pressed]="filterCriteria().mustHaveElevator"
            >
              <span>🛗</span>
              <span>Lift</span>
            </button>

            <button
              type="button"
              (click)="toggleRestroom()"
              [class.bg-teal-700]="filterCriteria().mustHaveRestroom"
              [class.text-white]="filterCriteria().mustHaveRestroom"
              [class.border-teal-700]="filterCriteria().mustHaveRestroom"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
              [attr.aria-pressed]="filterCriteria().mustHaveRestroom"
            >
              <span>🚻</span>
              <span>Toilet</span>
            </button>

            <button
              type="button"
              (click)="toggleParking()"
              [class.bg-teal-700]="filterCriteria().mustHaveParking"
              [class.text-white]="filterCriteria().mustHaveParking"
              [class.border-teal-700]="filterCriteria().mustHaveParking"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px]"
              [attr.aria-pressed]="filterCriteria().mustHaveParking"
            >
              <span>🅿️</span>
              <span>Parking</span>
            </button>

            @if (activeFilterCount() > 0 || searchQuery.trim() || selectedCategory() !== 'all') {
              <button
                type="button"
                (click)="resetFilters()"
                class="px-2 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer min-h-[36px]"
                aria-label="Clear all active map filters"
              >
                Reset
              </button>
            }
          </div>

        </div>
      </section>

      <!-- Geolocation Notice Banner (Graceful feedback if denied or unavailable) -->
      @if (locationAlert(); as alert) {
        <div
          class="px-4 py-2 text-xs flex items-center justify-between z-20 shrink-0 border-b"
          [class.bg-amber-50]="alert.type === 'error'"
          [class.border-amber-200]="alert.type === 'error'"
          [class.text-amber-900]="alert.type === 'error'"
          [class.bg-emerald-50]="alert.type === 'success'"
          [class.border-emerald-200]="alert.type === 'success'"
          [class.text-emerald-900]="alert.type === 'success'"
          role="alert"
        >
          <div class="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <span aria-hidden="true">{{ alert.type === 'error' ? '⚠️' : '📍' }}</span>
            <span class="font-medium">{{ alert.message }}</span>
            <button
              type="button"
              (click)="dismissLocationAlert()"
              class="ml-auto font-bold text-xs underline cursor-pointer"
              aria-label="Dismiss alert"
            >
              Dismiss
            </button>
          </div>
        </div>
      }

      <!-- Main Map & Split Panel Layout -->
      <div class="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        
        <!-- Left Side Places List & Details Panel (Desktop side panel and mobile list tab) -->
        <aside
          [class.hidden]="viewMode() === 'map'"
          class="lg:block w-full lg:w-[420px] bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 h-full overflow-hidden"
          aria-label="Places directory and accessibility inspector"
        >
          <!-- Results Header & Active Filter Count -->
          <div class="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div>
              <span class="text-xs font-bold text-slate-800">
                Found {{ filteredPlaces().length }} places
              </span>
              <p class="text-[10px] text-slate-500">
                Click any venue to highlight on the map
              </p>
            </div>
            <span class="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Interactive Pins
            </span>
          </div>

          <!-- Places Scrollable List -->
          <div class="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-2.5">
            @if (filteredPlaces().length === 0) {
              <div class="p-8 text-center space-y-3">
                <span class="text-3xl" aria-hidden="true">🔍</span>
                <p class="text-sm font-bold text-slate-800">No places match your filters</p>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Try unchecking some accessibility restrictions or clearing your search keywords.
                </p>
                <button
                  type="button"
                  (click)="resetFilters()"
                  class="mt-2 px-4 py-2 text-xs font-bold text-teal-800 bg-teal-50 rounded-xl border border-teal-200 hover:bg-teal-100 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            } @else {
              @for (place of filteredPlaces(); track place.id) {
                <div
                  (click)="selectPlace(place)"
                  (keydown.enter)="selectPlace(place)"
                  tabindex="0"
                  role="button"
                  [attr.aria-pressed]="selectedPlace()?.id === place.id"
                  [class.ring-2]="selectedPlace()?.id === place.id"
                  [class.ring-teal-600]="selectedPlace()?.id === place.id"
                  [class.bg-teal-50/40]="selectedPlace()?.id === place.id"
                  class="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-white transition-all cursor-pointer text-left focus:outline-none shadow-xs"
                >
                  <!-- Category Badge & Rating -->
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {{ place.categoryLabel }}
                    </span>
                    <span class="text-xs font-bold text-amber-700 flex items-center gap-0.5">
                      ★ {{ place.overallRating }}
                    </span>
                  </div>

                  <!-- Venue Name -->
                  <h3 class="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                    {{ place.name }}
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {{ place.address.street }}, {{ place.address.city }}
                  </p>

                  <!-- Temporary Obstacle Alert if any -->
                  @if (place.temporaryObstacles.length > 0) {
                    <div class="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span class="font-bold line-clamp-1">{{ place.temporaryObstacles[0].title }}</span>
                    </div>
                  }

                  <!-- Key Amenities Badges -->
                  <div class="mt-2.5 flex flex-wrap gap-1">
                    @if (place.amenities.stepFreeEntrance) {
                      <span class="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                        Step-Free
                      </span>
                    }
                    @if (place.amenities.ramp.available) {
                      <span class="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                        Ramp ({{ place.amenities.ramp.slope }})
                      </span>
                    }
                    @if (place.amenities.elevator.available && place.amenities.elevator.workingStatus === 'operational') {
                      <span class="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                        🛗 Lift
                      </span>
                    }
                    @if (place.amenities.accessibleRestroom.available) {
                      <span class="text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded">
                        Restroom
                      </span>
                    }
                    @if (place.amenities.disabledParking.available) {
                      <span class="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                        🅿️ {{ place.amenities.disabledParking.bayCount }} bays
                      </span>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </aside>

        <!-- Main Map Area (Leaflet Component Wrapper) -->
        <main
          [class.hidden]="viewMode() === 'list'"
          class="lg:block flex-1 relative h-full w-full"
          aria-label="Interactive Leaflet Map Canvas"
        >
          <!-- Reusable Leaflet Map Component -->
          <app-map
            #leafletMap
            [places]="filteredPlaces()"
            [selectedPlace]="selectedPlace()"
            [userLocation]="userLocation()"
            (placeSelect)="onPlaceSelectedFromMap($event)"
            class="w-full h-full"
          ></app-map>

          <!-- Floating Selected Place Detail Drawer / Bottom Card (Mobile & Desktop) -->
          @if (selectedPlace(); as place) {
            <section
              class="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-5 z-[500] space-y-3.5"
              aria-labelledby="preview-title"
              role="region"
            >
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-3">
                <div>
                  <span class="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {{ place.categoryLabel }}
                  </span>
                  <h3 id="preview-title" class="text-base font-bold text-slate-900 mt-1">
                    {{ place.name }}
                  </h3>
                  <p class="text-xs text-slate-600">
                    {{ place.address.street }}, {{ place.address.city }}
                  </p>
                </div>
                <button
                  type="button"
                  (click)="selectedPlace.set(null)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  aria-label="Close place preview card"
                >
                  ✕
                </button>
              </div>

              <!-- Temporary Obstacle Alert if present -->
              @if (place.temporaryObstacles.length > 0) {
                <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <span aria-hidden="true" class="text-base">⚠️</span>
                  <div>
                    <strong class="block">{{ place.temporaryObstacles[0].title }}</strong>
                    <span class="text-[11px] text-amber-800">{{ place.temporaryObstacles[0].description }}</span>
                  </div>
                </div>
              }

              <!-- Doorway & Key Dimensions Pill -->
              <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 grid grid-cols-2 gap-2">
                <div>
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Doorway Width</span>
                  <span class="font-bold text-slate-900">{{ place.amenities.doorWidthCm }} cm</span>
                  <span class="text-[10px] text-slate-500"> ({{ place.amenities.automatedDoor ? 'Automatic' : 'Manual' }})</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Ramp Incline</span>
                  <span class="font-bold text-slate-900">
                    {{ place.amenities.ramp.available ? place.amenities.ramp.slope : 'No ramp' }}
                  </span>
                </div>
              </div>

              <!-- Accessibility Feature Badges -->
              <div class="flex flex-wrap gap-1.5 pt-0.5">
                @if (place.amenities.stepFreeEntrance) {
                  <app-accessibility-badge type="step-free"></app-accessibility-badge>
                }
                @if (place.amenities.ramp.available) {
                  <app-accessibility-badge type="ramp"></app-accessibility-badge>
                }
                @if (place.amenities.elevator.available) {
                  <app-accessibility-badge type="elevator"></app-accessibility-badge>
                }
                @if (place.amenities.accessibleRestroom.available) {
                  <app-accessibility-badge type="restroom"></app-accessibility-badge>
                }
              </div>

              <!-- Card Action Buttons -->
              <div class="pt-1 flex items-center gap-2">
                <a
                  [routerLink]="['/places', place.id]"
                  class="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>View Full Accessibility Details</span>
                  <span aria-hidden="true">→</span>
                </a>

                <a
                  [routerLink]="['/submit-report']"
                  [queryParams]="{ placeId: place.id }"
                  class="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center transition-colors"
                  title="Submit audit update"
                >
                  <span>Audit</span>
                </a>
              </div>
            </section>
          }

          <!-- Floating Map Legend Card -->
          <div class="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-slate-200 p-3 text-xs text-slate-700 space-y-2 hidden md:block max-w-[210px]">
            <p class="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
              <span>Category Pins</span>
              <span class="text-[10px] text-teal-700 font-semibold">OSM</span>
            </p>
            <div class="space-y-1.5 text-[11px]">
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded-full bg-rose-600 inline-block shrink-0"></span>
                <span>🏥 Hospitals / Health</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded-full bg-indigo-600 inline-block shrink-0"></span>
                <span>🏛️ Public & Libraries</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded-full bg-sky-600 inline-block shrink-0"></span>
                <span>🚆 Transit Stations</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded-full bg-cyan-600 inline-block shrink-0"></span>
                <span>🚻 Public Toilets</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3.5 h-3.5 rounded-full bg-amber-600 inline-block shrink-0"></span>
                <span>⚠️ Obstacle / Alert</span>
              </div>
            </div>
            <p class="text-[9px] text-slate-400 border-t border-slate-100 pt-1">
              Pins show physical venue locations. Check audit rating for verified access.
            </p>
          </div>
        </main>

      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ExploreMapComponent implements OnInit {
  @ViewChild('leafletMap') mapComponentRef?: MapComponent;

  private readonly placeService = inject(PlaceService);

  readonly filteredPlaces = this.placeService.filteredPlaces;
  readonly filterCriteria = this.placeService.filterCriteria;
  readonly activeFilterCount = this.placeService.activeFilterCount;

  readonly selectedPlace = signal<Place | null>(null);
  readonly viewMode = signal<'map' | 'list'>('map');
  readonly userLocation = signal<[number, number] | null>(null);
  readonly isLocating = signal<boolean>(false);
  readonly locationAlert = signal<LocationAlert | null>(null);

  searchQuery = '';
  selectedCategory = computed(() => this.filterCriteria().category);

  ngOnInit(): void {
    this.searchQuery = this.filterCriteria().searchQuery;
  }

  onSearchChange(val: string): void {
    this.placeService.setSearchQuery(val);
  }

  onCategoryChange(cat: string): void {
    this.placeService.setCategory(cat as PlaceCategory | 'all');
  }

  toggleStepFree(): void {
    this.placeService.toggleStepFree();
  }

  toggleRamp(): void {
    this.placeService.toggleRamp();
  }

  toggleElevator(): void {
    this.placeService.toggleElevator();
  }

  toggleRestroom(): void {
    this.placeService.toggleRestroom();
  }

  toggleParking(): void {
    this.placeService.toggleParking();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.placeService.resetFilters();
    this.placeService.setCategory('all');
  }

  selectPlace(place: Place): void {
    this.selectedPlace.set(place);
    this.viewMode.set('map'); // Switch to map if viewing on mobile
    if (this.mapComponentRef) {
      this.mapComponentRef.flyToLocation(place.coordinates.lat, place.coordinates.lng, 16);
      setTimeout(() => this.mapComponentRef?.invalidateSize(), 100);
    }
  }

  onPlaceSelectedFromMap(place: Place): void {
    this.selectedPlace.set(place);
  }

  /**
   * Request user's current GPS location strictly upon explicit user interaction.
   * Handles permission denial, unavailable GPS, and timeouts gracefully without throwing.
   */
  requestUserLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.locationAlert.set({
        type: 'error',
        message: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    this.isLocating.set(true);
    this.locationAlert.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isLocating.set(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.userLocation.set([lat, lng]);

        this.locationAlert.set({
          type: 'success',
          message: 'Found your current location. Panning map to your position.',
        });

        // Fly to user coordinates
        if (this.mapComponentRef) {
          this.mapComponentRef.flyToLocation(lat, lng, 15);
        }

        // Auto dismiss success notice after 5 seconds
        setTimeout(() => {
          if (this.locationAlert()?.type === 'success') {
            this.dismissLocationAlert();
          }
        }, 5000);
      },
      (error) => {
        this.isLocating.set(false);
        let errorMsg = 'Could not retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission was denied. You can search places manually or browse the map.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'GPS signal or location service unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out. Please try again.';
            break;
        }
        this.locationAlert.set({
          type: 'error',
          message: errorMsg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  dismissLocationAlert(): void {
    this.locationAlert.set(null);
  }
}
