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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlaceService } from '../../core/services/place.service';
import { Place, PlaceCategory } from '../../core/models/place.model';
import { MapComponent } from '../../shared/components/map/map.component';
import { AccessibilityBadgeComponent } from '../../shared/components/accessibility-badge/accessibility-badge.component';
import { RoutingService, DEFAULT_MOBILITY_PROFILES } from '../../core/services/routing.service';
import { DeviceLocationService } from '../../core/services/device-location.service';
import { DeviceHapticsService } from '../../core/services/device-haptics.service';
import {
  MobilityMode,
  MobilityProfile,
  PlannedRoute,
  RoutePlanningRequest,
  RoutePlanningResult,
  PathSegment,
} from '../../core/models/route.model';

export interface LocationAlert {
  type: 'error' | 'info' | 'success';
  message: string;
}

export type MapMode = 'explore' | 'route';

@Component({
  selector: 'app-explore-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapComponent, AccessibilityBadgeComponent],
  template: `
    <div class="flex flex-col h-[calc(100vh-5rem)] bg-slate-100 overflow-hidden">
      
      <!-- Top Mode Selector & Accessibility Toolbar -->
      <section class="bg-white border-b border-slate-200 px-4 py-2.5 shadow-xs shrink-0 z-30" aria-label="Map Mode and Filters">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <!-- Mode Tabs (Explore Directory vs Plan Accessible Route) -->
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                (click)="switchMode('explore')"
                [class.bg-white]="mode() === 'explore'"
                [class.text-teal-900]="mode() === 'explore'"
                [class.font-bold]="mode() === 'explore'"
                [class.shadow-xs]="mode() === 'explore'"
                class="px-3.5 py-1.5 text-xs rounded-lg text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                aria-label="Switch to directory explore mode"
              >
                <span>🗺️</span>
                <span>Explore Directory</span>
              </button>

              <button
                type="button"
                (click)="switchMode('route')"
                [class.bg-white]="mode() === 'route'"
                [class.text-teal-900]="mode() === 'route'"
                [class.font-bold]="mode() === 'route'"
                [class.shadow-xs]="mode() === 'route'"
                class="px-3.5 py-1.5 text-xs rounded-lg text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                aria-label="Switch to route planning mode"
              >
                <span>🧭</span>
                <span>Plan Route</span>
                <span class="text-[9px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded-full ml-0.5">
                  Step 8
                </span>
              </button>
            </div>

            <!-- Locate Me GPS Button -->
            <button
              type="button"
              (click)="requestUserLocation()"
              [disabled]="isLocating()"
              [title]="isLocating() ? 'Acquiring GPS location...' : 'Locate my position (requests permission)'"
              aria-label="Find my current location"
              class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 min-h-[36px] cursor-pointer"
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

            <!-- Mobile View Mode Toggle (Map vs List/Sidebar) -->
            <div class="flex items-center lg:hidden bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 ml-auto">
              <button
                type="button"
                (click)="viewMode.set('map')"
                [class.bg-white]="viewMode() === 'map'"
                [class.shadow-xs]="viewMode() === 'map'"
                [class.font-bold]="viewMode() === 'map'"
                class="px-3 py-1 text-xs rounded-lg text-slate-800 transition-colors"
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
                class="px-3 py-1 text-xs rounded-lg text-slate-800 transition-colors"
                aria-label="Switch to list view"
              >
                {{ mode() === 'explore' ? 'Places (' + filteredPlaces().length + ')' : 'Planner' }}
              </button>
            </div>
          </div>

          <!-- Explore Mode Filters (Only shown when mode === 'explore') -->
          @if (mode() === 'explore') {
            <div class="flex flex-wrap items-center gap-2 flex-1 justify-end">
              <!-- Search Input -->
              <div class="relative flex-1 max-w-xs">
                <label for="map-search-input" class="sr-only">Search accessible places on the map</label>
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" aria-hidden="true">
                  🔍
                </div>
                <input
                  id="map-search-input"
                  type="search"
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="onSearchChange($event)"
                  placeholder="Search venues, streets..."
                  class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              <!-- Category Dropdown Filter -->
              <div class="relative shrink-0">
                <label for="category-select" class="sr-only">Filter by category</label>
                <select
                  id="category-select"
                  [ngModel]="selectedCategory()"
                  (ngModelChange)="onCategoryChange($event)"
                  class="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer min-h-[34px]"
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

              <!-- Fast Accessibility Criteria Toggles -->
              <div class="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  (click)="toggleStepFree()"
                  [class.bg-teal-700]="filterCriteria().mustHaveStepFree"
                  [class.text-white]="filterCriteria().mustHaveStepFree"
                  class="px-2 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Step-Free
                </button>
                <button
                  type="button"
                  (click)="toggleRamp()"
                  [class.bg-teal-700]="filterCriteria().mustHaveRamp"
                  [class.text-white]="filterCriteria().mustHaveRamp"
                  class="px-2 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Ramp
                </button>
                <button
                  type="button"
                  (click)="toggleElevator()"
                  [class.bg-teal-700]="filterCriteria().mustHaveElevator"
                  [class.text-white]="filterCriteria().mustHaveElevator"
                  class="px-2 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Lift
                </button>
                @if (activeFilterCount() > 0 || searchQuery.trim() || selectedCategory() !== 'all') {
                  <button
                    type="button"
                    (click)="resetFilters()"
                    class="px-2 py-1 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                  >
                    Reset
                  </button>
                }
              </div>
            </div>
          } @else {
            <!-- Route Mode Header Indicator -->
            <div class="flex items-center gap-2 text-xs text-slate-600 ml-auto hidden sm:flex">
              <span class="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              <span class="font-medium">Active Testbed: Metro City Civic & Healthcare District</span>
            </div>
          }

        </div>
      </section>

      <!-- Geolocation Notice Banner -->
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

      <!-- Main Content Layout (Sidebar + Map) -->
      <div class="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        
        <!-- ======================= LEFT SIDEBAR ======================= -->
        
        <!-- 1. EXPLORE MODE SIDEBAR -->
        @if (mode() === 'explore') {
          <aside
            [class.hidden]="viewMode() === 'map'"
            class="lg:block w-full lg:w-[420px] bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 h-full overflow-hidden"
            aria-label="Places directory"
          >
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
                    <div class="flex items-start justify-between gap-2">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {{ place.categoryLabel }}
                      </span>
                      <span class="text-xs font-bold text-amber-700 flex items-center gap-0.5">
                        ★ {{ place.overallRating }}
                      </span>
                    </div>

                    <h3 class="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                      {{ place.name }}
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {{ place.address.street }}, {{ place.address.city }}
                    </p>

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
                      @if (place.amenities.elevator.available) {
                        <span class="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                          🛗 Lift
                        </span>
                      }
                      @if (place.amenities.accessibleRestroom.available) {
                        <span class="text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded">
                          Restroom
                        </span>
                      }
                    </div>

                    <!-- Action to plan route to this place -->
                    <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        (click)="planRouteToPlace(place, $event)"
                        class="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>🧭 Route Here</span>
                      </button>
                      <a
                        [routerLink]="['/places', place.id]"
                        (click)="$event.stopPropagation()"
                        class="text-[11px] text-slate-500 hover:text-slate-800 underline"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                }
              }
            </div>
          </aside>
        }

        <!-- 2. ROUTE PLANNING SIDEBAR -->
        @if (mode() === 'route') {
          <aside
            [class.hidden]="viewMode() === 'map'"
            class="lg:block w-full lg:w-[460px] bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 h-full overflow-hidden shadow-sm"
            aria-label="Route Planner and Itinerary"
          >
            <!-- Planner Top Header -->
            <div class="p-4 border-b border-slate-200 bg-slate-50 shrink-0 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                    🧭
                  </span>
                  <div>
                    <h2 class="text-sm font-black text-slate-900">
                      Accessible Route Planner
                    </h2>
                    <p class="text-[11px] text-slate-500">
                      Evaluates sidewalk inclines, curb ramps & steps
                    </p>
                  </div>
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  Testbed
                </span>
              </div>
            </div>

            <!-- Route Planning Form & Results (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              
              <!-- Start & Destination Card -->
              <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <!-- Origin (Start Point) -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label for="route-origin" class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                      <span>Start Point (Origin)</span>
                    </label>
                    @if (userLocation()) {
                      <button
                        type="button"
                        (click)="setOriginToUserLocation()"
                        class="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                      >
                        Use GPS Location
                      </button>
                    }
                  </div>
                  <select
                    id="route-origin"
                    [(ngModel)]="originPlaceId"
                    class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    @if (userLocation()) {
                      <option value="gps_user_location">📍 My Current GPS Location</option>
                    }
                    @for (p of allPlaces(); track p.id) {
                      <option [value]="p.id">{{ p.name }} ({{ p.categoryLabel }})</option>
                    }
                  </select>
                </div>

                <!-- Swap Button -->
                <div class="flex justify-center -my-1">
                  <button
                    type="button"
                    (click)="swapOriginAndDestination()"
                    class="p-1.5 rounded-full bg-white border border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-700 shadow-2xs transition-transform active:rotate-180 cursor-pointer"
                    title="Swap Start and Destination"
                    aria-label="Swap Start and Destination"
                  >
                    ⇅
                  </button>
                </div>

                <!-- Destination (End Point) -->
                <div>
                  <label for="route-dest" class="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <span class="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block"></span>
                    <span>Destination</span>
                  </label>
                  <select
                    id="route-dest"
                    [(ngModel)]="destinationPlaceId"
                    class="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    @for (p of allPlaces(); track p.id) {
                      <option [value]="p.id">{{ p.name }} ({{ p.categoryLabel }})</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Mobility Profile Selector -->
              <div class="space-y-2">
                <label class="text-xs font-bold text-slate-800 block">
                  Select Your Mobility Profile:
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  @for (opt of mobilityProfileOptions; track opt.mode) {
                    <button
                      type="button"
                      (click)="selectMobilityMode(opt.mode)"
                      [class.bg-teal-700]="selectedMobilityMode() === opt.mode"
                      [class.text-white]="selectedMobilityMode() === opt.mode"
                      [class.border-teal-700]="selectedMobilityMode() === opt.mode"
                      [class.bg-white]="selectedMobilityMode() !== opt.mode"
                      [class.text-slate-700]="selectedMobilityMode() !== opt.mode"
                      class="p-2 rounded-xl border border-slate-200 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px]"
                    >
                      <div class="flex items-center gap-1 text-sm">
                        <span>{{ opt.icon }}</span>
                        <span class="text-[11px] font-bold line-clamp-1">{{ opt.title }}</span>
                      </div>
                      <span
                        class="text-[9px]"
                        [class.text-teal-100]="selectedMobilityMode() === opt.mode"
                        [class.text-slate-400]="selectedMobilityMode() !== opt.mode"
                      >
                        Max {{ opt.slope }}% • {{ opt.stairs ? 'Stairs OK' : 'Step-free' }}
                      </span>
                    </button>
                  }
                </div>
              </div>

              <!-- Customizable Preferences Accordion -->
              <div class="border border-slate-200 rounded-2xl p-3 bg-white space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>⚙️</span>
                    <span>Custom Preferences</span>
                  </span>
                  <span class="text-[10px] text-slate-500">Fine-tune routing constraints</span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs pt-1">
                  <!-- Max Slope Incline -->
                  <div>
                    <label for="pref-slope" class="text-[11px] font-semibold text-slate-600 block mb-1">
                      Max Incline:
                    </label>
                    <select
                      id="pref-slope"
                      [(ngModel)]="activeProfile.maxSlopePercent"
                      class="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-semibold"
                    >
                      <option [value]="5.0">5% (Gentle Ramp)</option>
                      <option [value]="8.0">8% (Standard ADA)</option>
                      <option [value]="10.0">10% (Moderate)</option>
                      <option [value]="12.0">12% (Power Chair)</option>
                      <option [value]="15.0">15% (Steep)</option>
                      <option [value]="25.0">25% (Pedestrian)</option>
                    </select>
                  </div>

                  <!-- Require Curb Ramps -->
                  <div class="flex flex-col justify-end">
                    <label class="inline-flex items-center gap-1.5 cursor-pointer py-1.5">
                      <input
                        type="checkbox"
                        [(ngModel)]="activeProfile.requireCurbRamps"
                        class="rounded text-teal-700 focus:ring-teal-600 w-3.5 h-3.5"
                      />
                      <span class="text-[11px] font-semibold text-slate-700">Require Curb Ramps</span>
                    </label>
                  </div>

                  <!-- Allow Stairs -->
                  <div>
                    <label class="inline-flex items-center gap-1.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        [(ngModel)]="activeProfile.allowStairs"
                        class="rounded text-teal-700 focus:ring-teal-600 w-3.5 h-3.5"
                      />
                      <span class="text-[11px] font-semibold text-slate-700">Allow Stairs</span>
                    </label>
                  </div>

                  <!-- Avoid Unpaved -->
                  <div>
                    <label class="inline-flex items-center gap-1.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        [(ngModel)]="activeProfile.avoidUnpaved"
                        class="rounded text-teal-700 focus:ring-teal-600 w-3.5 h-3.5"
                      />
                      <span class="text-[11px] font-semibold text-slate-700">Avoid Unpaved</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Calculate Route Button -->
              <button
                type="button"
                (click)="calculateRoute()"
                [disabled]="isCalculatingRoute()"
                class="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                @if (isCalculatingRoute()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Evaluating Pedestrian Sidewalks...</span>
                } @else {
                  <span>🧭</span>
                  <span>Calculate Accessible Route</span>
                }
              </button>

              <!-- ================= ROUTE RESULTS SECTION ================= -->
              @if (routeResult(); as result) {
                <div class="space-y-3 pt-2">
                  
                  <!-- Zero False Claims Disclaimer Notice (Requirement 7 & 10) -->
                  <div class="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
                    <span class="text-sm shrink-0">🛡️</span>
                    <div>
                      <strong class="text-slate-800">Verification Policy:</strong>
                      A route is never claimed as fully accessible when required sidewalk or curb ramp data is missing.
                    </div>
                  </div>

                  <!-- Alternative Route Selector Tabs (Requirement 8) -->
                  @if (result.routes.length > 1) {
                    <div class="space-y-1">
                      <span class="text-[11px] font-bold text-slate-700 block">
                        Calculated Route Alternatives ({{ result.routes.length }} options):
                      </span>
                      <div class="flex gap-1.5">
                        @for (rt of result.routes; track rt.id; let idx = $index) {
                          <button
                            type="button"
                            (click)="selectRouteIndex(idx)"
                            [class.bg-teal-700]="activeRouteIndex() === idx"
                            [class.text-white]="activeRouteIndex() === idx"
                            [class.border-teal-700]="activeRouteIndex() === idx"
                            [class.bg-white]="activeRouteIndex() !== idx"
                            [class.text-slate-700]="activeRouteIndex() !== idx"
                            class="flex-1 py-2 px-2 text-xs rounded-xl border border-slate-200 text-center font-bold cursor-pointer transition-all shadow-2xs"
                          >
                            <span class="block truncate text-[11px]">{{ rt.name }}</span>
                            <span class="text-[10px] font-normal opacity-90">
                              {{ rt.distanceMeters }}m • {{ rt.estimatedDurationMinutes }} min
                            </span>
                          </button>
                        }
                      </div>
                    </div>
                  }

                  <!-- Active Route Details Card -->
                  @if (selectedPlannedRoute(); as activeRt) {
                    <div class="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
                      
                      <!-- Route Header & Compliance Status Badge -->
                      <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 class="text-sm font-black text-slate-900 leading-snug">
                            {{ activeRt.name }}
                          </h3>
                          <p class="text-[11px] text-slate-500 mt-0.5">
                            {{ activeRt.segments.length }} pedestrian segment{{ activeRt.segments.length > 1 ? 's' : '' }} evaluated
                          </p>
                        </div>

                        <!-- Status Badge (Requirement 7) -->
                        <div>
                          @if (activeRt.evaluation.overallAccessibility === 'verified_accessible') {
                            <span class="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                              ✓ Verified Accessible
                            </span>
                          } @else if (activeRt.evaluation.overallAccessibility === 'partially_unverified') {
                            <span class="inline-flex items-center gap-1 text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                              ⚠️ Partially Unverified
                            </span>
                          } @else if (activeRt.evaluation.overallAccessibility === 'caution_limitations') {
                            <span class="inline-flex items-center gap-1 text-[11px] font-black bg-orange-50 text-orange-800 border border-orange-300 px-2 py-0.5 rounded-full">
                              ⚠️ Usable With Caution
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1 text-[11px] font-black bg-rose-50 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                              ⛔ Inaccessible
                            </span>
                          }
                        </div>
                      </div>

                      <!-- 4-Grid Key Metrics (Requirement 6) -->
                      <div class="grid grid-cols-4 gap-2 text-center">
                        <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span class="text-[10px] text-slate-500 uppercase font-bold block">Distance</span>
                          <span class="text-xs font-black text-slate-900">{{ activeRt.distanceMeters }} m</span>
                        </div>
                        <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span class="text-[10px] text-slate-500 uppercase font-bold block">Est. Time</span>
                          <span class="text-xs font-black text-slate-900">{{ activeRt.estimatedDurationMinutes }} min</span>
                        </div>
                        <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span class="text-[10px] text-slate-500 uppercase font-bold block">Stairs</span>
                          <span
                            class="text-xs font-black"
                            [class.text-rose-600]="activeRt.stepCount > 0"
                            [class.text-emerald-700]="activeRt.stepCount === 0"
                          >
                            {{ activeRt.stepCount > 0 ? activeRt.stepCount + ' steps' : '0 steps' }}
                          </span>
                        </div>
                        <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span class="text-[10px] text-slate-500 uppercase font-bold block">Max Slope</span>
                          <span class="text-xs font-black text-slate-900">{{ activeRt.maxInclinePercent }}%</span>
                        </div>
                      </div>

                      <!-- Verification Breakdown Bar (Requirement 7) -->
                      <div class="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div class="flex items-center justify-between text-[11px]">
                          <span class="font-bold text-slate-800">Data Verification Level:</span>
                          <span class="text-teal-800 font-extrabold">
                            {{ activeRt.evaluation.verificationBreakdown.verifiedPercent }}% Verified
                          </span>
                        </div>

                        <!-- Segmented Progress Bar -->
                        <div class="w-full h-2.5 rounded-full bg-slate-200 flex overflow-hidden">
                          <div
                            class="bg-emerald-600 h-full"
                            [style.width.%]="activeRt.evaluation.verificationBreakdown.verifiedPercent"
                            title="Physically Verified Survey"
                          ></div>
                          <div
                            class="bg-sky-500 h-full"
                            [style.width.%]="activeRt.evaluation.verificationBreakdown.communityPercent"
                            title="Community Audit"
                          ></div>
                          <div
                            class="bg-purple-500 h-full"
                            [style.width.%]="activeRt.evaluation.verificationBreakdown.inferredPercent"
                            title="Inferred"
                          ></div>
                          <div
                            class="bg-amber-500 h-full"
                            [style.width.%]="activeRt.evaluation.verificationBreakdown.missingPercent"
                            title="Missing / Unverified"
                          ></div>
                        </div>

                        <!-- Bar Legend -->
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-600 pt-0.5">
                          <span class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                            Verified: {{ activeRt.evaluation.verificationBreakdown.verifiedPercent }}%
                          </span>
                          @if (activeRt.evaluation.verificationBreakdown.communityPercent > 0) {
                            <span class="flex items-center gap-1">
                              <span class="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                              Community: {{ activeRt.evaluation.verificationBreakdown.communityPercent }}%
                            </span>
                          }
                          @if (activeRt.evaluation.verificationBreakdown.inferredPercent > 0) {
                            <span class="flex items-center gap-1">
                              <span class="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                              Inferred: {{ activeRt.evaluation.verificationBreakdown.inferredPercent }}%
                            </span>
                          }
                          @if (activeRt.evaluation.verificationBreakdown.missingPercent > 0) {
                            <span class="flex items-center gap-1 text-amber-800 font-bold">
                              <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                              Missing Data: {{ activeRt.evaluation.verificationBreakdown.missingPercent }}%
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Violations Box (Requirement 9: Explains why route may not meet preferences) -->
                      @if (activeRt.evaluation.violations.length > 0) {
                        <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                          <strong class="flex items-center gap-1.5 font-bold">
                            <span>⛔</span>
                            <span>Why This Route Does Not Meet Your Profile:</span>
                          </strong>
                          <ul class="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                            @for (v of activeRt.evaluation.violations; track v) {
                              <li>{{ v }}</li>
                            }
                          </ul>
                        </div>
                      }

                      <!-- Warnings Box (Requirement 10: Warnings when accessibility cannot be fully established) -->
                      @if (activeRt.evaluation.warnings.length > 0) {
                        <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                          <strong class="flex items-center gap-1.5 font-bold">
                            <span>⚠️</span>
                            <span>Route Warnings & Accessibility Cautions:</span>
                          </strong>
                          <ul class="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                            @for (w of activeRt.evaluation.warnings; track w) {
                              <li>{{ w }}</li>
                            }
                          </ul>
                        </div>
                      }

                      <!-- Turn-by-Turn / Segment-by-Segment Itinerary -->
                      <div class="space-y-2 pt-1">
                        <span class="text-xs font-bold text-slate-800 block">
                          Segment-by-Segment Itinerary:
                        </span>
                        
                        <div class="space-y-2">
                          @for (seg of activeRt.segments; track seg.id; let sIdx = $index) {
                            <div
                              (click)="zoomToSegment(seg)"
                              class="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/20 transition-all text-xs cursor-pointer space-y-1"
                              title="Click to zoom to this segment on the map"
                            >
                              <div class="flex items-start justify-between gap-2">
                                <span class="font-bold text-slate-900">
                                  {{ sIdx + 1 }}. {{ seg.name }}
                                </span>
                                <span class="text-[10px] font-bold text-slate-500 shrink-0">
                                  {{ seg.distanceMeters }} m
                                </span>
                              </div>

                              <div class="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                  🧱 {{ seg.surfaceType }}
                                </span>
                                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                  📐 Incline: {{ seg.inclinePercent }}%
                                </span>
                                @if (seg.hasStairs) {
                                  <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                                    🪜 {{ seg.stepCount ? seg.stepCount + ' steps' : 'Stairs' }}
                                  </span>
                                } @else {
                                  <span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                                    ✓ Step-free
                                  </span>
                                }
                                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  ♿ Curbs: {{ seg.curbRamps }}
                                </span>
                                <span
                                  class="ml-auto text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded"
                                  [class.bg-emerald-100]="seg.verificationLevel === 'verified'"
                                  [class.text-emerald-900]="seg.verificationLevel === 'verified'"
                                  [class.bg-amber-100]="seg.verificationLevel === 'missing'"
                                  [class.text-amber-900]="seg.verificationLevel === 'missing'"
                                >
                                  {{ seg.verificationLevel }}
                                </span>
                              </div>
                            </div>
                          }
                        </div>
                      </div>

                    </div>
                  }

                </div>
              }

            </div>
          </aside>
        }

        <!-- ======================= MAP AREA ======================= -->
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
            [activeRoute]="selectedPlannedRoute()"
            (placeSelect)="onPlaceSelectedFromMap($event)"
            class="w-full h-full"
          ></app-map>

          <!-- Floating Selected Place Detail Drawer (In explore mode) -->
          @if (mode() === 'explore' && selectedPlace(); as place) {
            <section
              class="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-5 z-[500] space-y-3.5"
              aria-labelledby="preview-title"
              role="region"
            >
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

              <div class="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  (click)="planRouteToPlace(place)"
                  class="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>🧭 Plan Accessible Route</span>
                  <span aria-hidden="true">→</span>
                </button>

                <a
                  [routerLink]="['/places', place.id]"
                  class="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center transition-colors"
                >
                  <span>Details</span>
                </a>
              </div>
            </section>
          }

          <!-- Floating Map Legend Card -->
          <div class="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-slate-200 p-3 text-xs text-slate-700 space-y-2 hidden md:block max-w-[210px]">
            <p class="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between">
              <span>{{ mode() === 'explore' ? 'Category Pins' : 'Route Legend' }}</span>
              <span class="text-[10px] text-teal-700 font-semibold">OSM</span>
            </p>

            @if (mode() === 'explore') {
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
              </div>
            } @else {
              <div class="space-y-1.5 text-[11px]">
                <div class="flex items-center gap-2">
                  <span class="w-4 h-1.5 rounded-full bg-teal-600 inline-block shrink-0"></span>
                  <span>Verified Step-Free</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-4 h-1.5 rounded-full bg-amber-500 inline-block shrink-0"></span>
                  <span>Unverified Data</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-4 h-1.5 rounded-full bg-rose-600 inline-block shrink-0"></span>
                  <span>Stairs / Obstacle</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-4 h-1.5 rounded-full bg-purple-600 inline-block shrink-0"></span>
                  <span>Cobblestone Surface</span>
                </div>
              </div>
            }
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
  private readonly routingService = inject(RoutingService);
  private readonly deviceLocationService = inject(DeviceLocationService);
  private readonly haptics = inject(DeviceHapticsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly filteredPlaces = this.placeService.filteredPlaces;
  readonly allPlaces = this.placeService.allPlaces;
  readonly filterCriteria = this.placeService.filterCriteria;
  readonly activeFilterCount = this.placeService.activeFilterCount;

  // Active Map Mode: Explore places directory vs Plan accessible route
  readonly mode = signal<MapMode>('explore');
  readonly selectedPlace = signal<Place | null>(null);
  readonly viewMode = signal<'map' | 'list'>('map');
  readonly userLocation = signal<[number, number] | null>(null);
  readonly isLocating = signal<boolean>(false);
  readonly locationAlert = signal<LocationAlert | null>(null);

  // Search & Filter
  searchQuery = '';
  selectedCategory = computed(() => this.filterCriteria().category);

  // Route Planning State
  originPlaceId = 'place-central-library';
  destinationPlaceId = 'place-city-hospital';
  readonly selectedMobilityMode = signal<MobilityMode>('manual_wheelchair');
  activeProfile: MobilityProfile = { ...DEFAULT_MOBILITY_PROFILES['manual_wheelchair'] };

  readonly isCalculatingRoute = signal<boolean>(false);
  readonly routeResult = signal<RoutePlanningResult | null>(null);
  readonly activeRouteIndex = signal<number>(0);

  // Selected active route polyline & segments passed to Leaflet map
  readonly selectedPlannedRoute = computed<PlannedRoute | null>(() => {
    const res = this.routeResult();
    if (!res || !res.routes || res.routes.length === 0) return null;
    return res.routes[this.activeRouteIndex()] || res.routes[0];
  });

  readonly mobilityProfileOptions = [
    {
      mode: 'manual_wheelchair' as MobilityMode,
      icon: '🧑‍🦽',
      title: 'Manual Chair',
      slope: 8,
      stairs: false,
    },
    {
      mode: 'powered_wheelchair' as MobilityMode,
      icon: '⚡',
      title: 'Power Chair',
      slope: 10,
      stairs: false,
    },
    {
      mode: 'walker_cane' as MobilityMode,
      icon: '🦯',
      title: 'Walker / Cane',
      slope: 12,
      stairs: false,
    },
    {
      mode: 'stroller_cart' as MobilityMode,
      icon: '🛒',
      title: 'Stroller / Cart',
      slope: 12,
      stairs: false,
    },
    {
      mode: 'standard_pedestrian' as MobilityMode,
      icon: '🚶',
      title: 'Pedestrian',
      slope: 25,
      stairs: true,
    },
  ];

  ngOnInit(): void {
    this.searchQuery = this.filterCriteria().searchQuery;

    // Check if entered via /plan-route route or query params
    const path = this.route.snapshot.routeConfig?.path;
    if (path === 'plan-route') {
      this.mode.set('route');
    }

    this.route.queryParams.subscribe((params) => {
      if (params['mode'] === 'route') {
        this.mode.set('route');
      }
      if (params['destId']) {
        this.mode.set('route');
        this.destinationPlaceId = params['destId'];
      }
    });

    // If destinationPlaceId is default, ensure places are populated
    if (this.allPlaces().length > 0) {
      if (!this.originPlaceId) {
        this.originPlaceId = this.allPlaces()[0].id;
      }
      if (!this.destinationPlaceId && this.allPlaces().length > 1) {
        this.destinationPlaceId = this.allPlaces()[1].id;
      }
    }
  }

  switchMode(newMode: MapMode): void {
    this.mode.set(newMode);
    if (newMode === 'route' && !this.routeResult()) {
      // Auto calculate initial demonstration route
      this.calculateRoute();
    }
  }

  planRouteToPlace(place: Place, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.destinationPlaceId = place.id;
    this.mode.set('route');
    this.selectedPlace.set(null);
    this.calculateRoute();
  }

  selectMobilityMode(mode: MobilityMode): void {
    this.selectedMobilityMode.set(mode);
    const template = DEFAULT_MOBILITY_PROFILES[mode];
    if (template) {
      this.activeProfile = { ...template };
    }
    // Re-calculate route if one is already computed
    if (this.routeResult()) {
      this.calculateRoute();
    }
  }

  swapOriginAndDestination(): void {
    const temp = this.originPlaceId;
    this.originPlaceId = this.destinationPlaceId;
    this.destinationPlaceId = temp;
    if (this.routeResult()) {
      this.calculateRoute();
    }
  }

  setOriginToUserLocation(): void {
    if (this.userLocation()) {
      this.originPlaceId = 'gps_user_location';
    }
  }

  selectRouteIndex(idx: number): void {
    this.activeRouteIndex.set(idx);
  }

  zoomToSegment(seg: PathSegment): void {
    if (this.mapComponentRef && seg.coordinates.length > 0) {
      const mid = seg.coordinates[Math.floor(seg.coordinates.length / 2)];
      this.mapComponentRef.flyToLocation(mid[0], mid[1], 17);
    }
  }

  calculateRoute(): void {
    let startLat = 40.7128;
    let startLng = -74.0060;
    let startName = 'Central Public Library';

    if (this.originPlaceId === 'gps_user_location' && this.userLocation()) {
      startLat = this.userLocation()![0];
      startLng = this.userLocation()![1];
      startName = 'My Current GPS Location';
    } else {
      const origin = this.allPlaces().find((p) => p.id === this.originPlaceId);
      if (origin) {
        startLat = origin.coordinates.lat;
        startLng = origin.coordinates.lng;
        startName = origin.name;
      }
    }

    let destLat = 40.7250;
    let destLng = -73.9960;
    let destName = 'Metro General Hospital';

    const dest = this.allPlaces().find((p) => p.id === this.destinationPlaceId);
    if (dest) {
      destLat = dest.coordinates.lat;
      destLng = dest.coordinates.lng;
      destName = dest.name;
    }

    const request: RoutePlanningRequest = {
      start: { lat: startLat, lng: startLng, name: startName },
      destination: { lat: destLat, lng: destLng, name: destName },
      mobilityProfile: {
        ...this.activeProfile,
        mode: this.selectedMobilityMode(),
      },
    };

    this.isCalculatingRoute.set(true);

    this.routingService.planRoute(request).subscribe({
      next: (result) => {
        this.isCalculatingRoute.set(false);
        this.routeResult.set(result);
        this.activeRouteIndex.set(0);
      },
      error: (err) => {
        this.isCalculatingRoute.set(false);
        console.error('Route planning error:', err);
      },
    });
  }

  // --- Search & Filter Methods ---
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

  resetFilters(): void {
    this.searchQuery = '';
    this.placeService.resetFilters();
    this.placeService.setCategory('all');
  }

  selectPlace(place: Place): void {
    this.selectedPlace.set(place);
    this.viewMode.set('map');
    if (this.mapComponentRef) {
      this.mapComponentRef.flyToLocation(place.coordinates.lat, place.coordinates.lng, 16);
      setTimeout(() => this.mapComponentRef?.invalidateSize(), 100);
    }
  }

  onPlaceSelectedFromMap(place: Place): void {
    if (this.mode() === 'explore') {
      this.selectedPlace.set(place);
    } else {
      // In route mode, clicking a pin sets destination
      this.destinationPlaceId = place.id;
      this.calculateRoute();
    }
  }

  async requestUserLocation(): Promise<void> {
    this.isLocating.set(true);
    this.locationAlert.set(null);

    const res = await this.deviceLocationService.getCurrentPosition();
    this.isLocating.set(false);

    if (res.success && res.coords) {
      const lat = res.coords.latitude;
      const lng = res.coords.longitude;
      this.userLocation.set([lat, lng]);
      this.haptics.impact('light');

      this.locationAlert.set({
        type: 'success',
        message: 'Found your current location. Panning map to your position.',
      });

      if (this.mapComponentRef) {
        this.mapComponentRef.flyToLocation(lat, lng, 15);
      }

      setTimeout(() => {
        if (this.locationAlert()?.type === 'success') {
          this.dismissLocationAlert();
        }
      }, 5000);
    } else {
      this.haptics.notification('error');
      this.locationAlert.set({
        type: 'error',
        message: res.error || 'Could not retrieve your location.',
      });
    }
  }

  dismissLocationAlert(): void {
    this.locationAlert.set(null);
  }
}
