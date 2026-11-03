import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlaceService } from '../../../core/services/place.service';
import { PlaceCardComponent } from '../../../shared/components/place-card/place-card.component';
import { PlaceCategory } from '../../../core/models/place.model';

@Component({
  selector: 'app-places-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PlaceCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      <!-- Page Header & Overview -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
            <span>♿ Verified Public Spaces</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Accessible Places Directory
          </h1>
          <p class="text-sm sm:text-base text-slate-600 max-w-2xl">
            Browse public venues with verified physical accessibility features, ramp gradients, doorway widths, and obstacle alerts.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <a
            routerLink="/explore-map"
            class="min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition-colors flex items-center gap-2 border border-slate-200"
          >
            <span>🗺️ Map View</span>
          </a>
          <a
            routerLink="/submit-report"
            class="min-h-[48px] px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold transition-colors flex items-center gap-2 shadow-xs"
          >
            <span>➕ Submit Audit</span>
          </a>
        </div>
      </div>

      <!-- Search & Filters Container -->
      <section class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5" aria-labelledby="filter-section-title">
        <h2 id="filter-section-title" class="sr-only">Filter accessible places</h2>

        <!-- Search Input Bar -->
        <div class="relative">
          <label for="places-search-field" class="sr-only">Search by name, category, or street</label>
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-lg" aria-hidden="true">
            🔍
          </div>
          <input
            id="places-search-field"
            type="search"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search by venue name, address, or amenities..."
            class="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-500 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[48px]"
          />
        </div>

        <!-- Category Selector Tabs -->
        <div>
          <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</span>
          <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by venue category">
            @for (cat of categoryOptions; track cat.id) {
              <button
                type="button"
                (click)="onCategorySelect(cat.id)"
                [class.bg-slate-900]="filterCriteria().category === cat.id"
                [class.text-white]="filterCriteria().category === cat.id"
                [class.border-slate-900]="filterCriteria().category === cat.id"
                [class.bg-white]="filterCriteria().category !== cat.id"
                [class.text-slate-700]="filterCriteria().category !== cat.id"
                class="px-3.5 py-2 rounded-lg text-xs font-bold border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer min-h-[40px] flex items-center gap-1.5"
                [attr.aria-pressed]="filterCriteria().category === cat.id"
              >
                <span>{{ cat.icon }}</span>
                <span>{{ cat.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Accessibility Feature Checkbox Toggles -->
        <div class="pt-2 border-t border-slate-100">
          <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Required Accessibility Features</span>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="toggleStepFree()"
              [class.bg-teal-700]="filterCriteria().mustHaveStepFree"
              [class.text-white]="filterCriteria().mustHaveStepFree"
              [class.border-teal-700]="filterCriteria().mustHaveStepFree"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px]"
              [attr.aria-pressed]="filterCriteria().mustHaveStepFree"
            >
              <span aria-hidden="true">🚶‍♂️</span>
              <span>Step-Free Entrance</span>
            </button>

            <button
              type="button"
              (click)="toggleRamp()"
              [class.bg-teal-700]="filterCriteria().mustHaveRamp"
              [class.text-white]="filterCriteria().mustHaveRamp"
              [class.border-teal-700]="filterCriteria().mustHaveRamp"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px]"
              [attr.aria-pressed]="filterCriteria().mustHaveRamp"
            >
              <span aria-hidden="true">📐</span>
              <span>Ramp Available</span>
            </button>

            <button
              type="button"
              (click)="toggleElevator()"
              [class.bg-teal-700]="filterCriteria().mustHaveElevator"
              [class.text-white]="filterCriteria().mustHaveElevator"
              [class.border-teal-700]="filterCriteria().mustHaveElevator"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px]"
              [attr.aria-pressed]="filterCriteria().mustHaveElevator"
            >
              <span aria-hidden="true">🛗</span>
              <span>Working Elevator</span>
            </button>

            <button
              type="button"
              (click)="toggleRestroom()"
              [class.bg-teal-700]="filterCriteria().mustHaveRestroom"
              [class.text-white]="filterCriteria().mustHaveRestroom"
              [class.border-teal-700]="filterCriteria().mustHaveRestroom"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px]"
              [attr.aria-pressed]="filterCriteria().mustHaveRestroom"
            >
              <span aria-hidden="true">🚻</span>
              <span>Accessible Restroom</span>
            </button>

            <button
              type="button"
              (click)="toggleParking()"
              [class.bg-teal-700]="filterCriteria().mustHaveParking"
              [class.text-white]="filterCriteria().mustHaveParking"
              [class.border-teal-700]="filterCriteria().mustHaveParking"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px]"
              [attr.aria-pressed]="filterCriteria().mustHaveParking"
            >
              <span aria-hidden="true">🅿️</span>
              <span>Disabled Parking</span>
            </button>

            @if (activeFilterCount() > 0 || searchQuery.trim()) {
              <button
                type="button"
                (click)="resetFilters()"
                class="px-3 py-2 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer min-h-[40px]"
              >
                Clear Filters ({{ activeFilterCount() }})
              </button>
            }
          </div>
        </div>

      </section>

      <!-- Results Feedback & Status Header -->
      <div class="flex items-center justify-between text-sm text-slate-600">
        <p class="font-bold text-slate-900">
          Showing <span class="text-teal-800">{{ filteredPlaces().length }}</span> of {{ allPlaces().length }} accessible places
        </p>
        <button
          type="button"
          (click)="refreshPlaces()"
          [disabled]="isLoading()"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-800 cursor-pointer disabled:opacity-50"
          aria-label="Refresh places directory"
        >
          <span [class.animate-spin]="isLoading()" aria-hidden="true">🔄</span>
          <span>{{ isLoading() ? 'Refreshing...' : 'Refresh List' }}</span>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200" role="status">
          <div class="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
          <p class="text-sm font-bold text-slate-800">Updating accessible places...</p>
          <p class="text-xs text-slate-500">Checking verified community audits</p>
        </div>
      }

      <!-- Empty State -->
      @else if (filteredPlaces().length === 0) {
        <div class="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs" role="region">
          <div class="w-16 h-16 rounded-full bg-slate-100 text-3xl flex items-center justify-center mx-auto" aria-hidden="true">
            🔍
          </div>
          <div class="max-w-md mx-auto space-y-1">
            <h3 class="text-lg font-bold text-slate-900">No Places Match Your Search</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              We couldn't find any places matching your current criteria. Try removing some filters or searching for another term.
            </p>
          </div>
          <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              (click)="resetFilters()"
              class="min-h-[44px] px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
            <a
              routerLink="/submit-report"
              class="min-h-[44px] px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors border border-slate-200"
            >
              Add This Place to AccessMap
            </a>
          </div>
        </div>
      }

      <!-- Places Cards Grid -->
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (place of filteredPlaces(); track place.id) {
            <app-place-card [place]="place"></app-place-card>
          }
        </div>
      }

    </div>
  `,
})
export class PlacesListComponent implements OnInit {
  private readonly placeService = inject(PlaceService);
  private readonly route = inject(ActivatedRoute);

  readonly allPlaces = this.placeService.allPlaces;
  readonly filteredPlaces = this.placeService.filteredPlaces;
  readonly filterCriteria = this.placeService.filterCriteria;
  readonly activeFilterCount = this.placeService.activeFilterCount;
  readonly isLoading = this.placeService.isLoading;

  searchQuery = '';

  readonly categoryOptions = [
    { id: 'all', label: 'All Categories', icon: '🌐' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'transport', label: 'Transit', icon: '🚆' },
    { id: 'dining', label: 'Dining', icon: '🍽️' },
    { id: 'parks', label: 'Parks', icon: '🌳' },
    { id: 'shopping', label: 'Shopping', icon: '🛒' },
    { id: 'culture', label: 'Culture & Civic', icon: '🏛️' },
  ];

  ngOnInit(): void {
    // Read optional query params from URL (e.g. from Home search or categories)
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchQuery = params['q'];
        this.placeService.setSearchQuery(params['q']);
      }
      if (params['category']) {
        this.placeService.setCategory(params['category']);
      }
    });
  }

  onSearchChange(val: string): void {
    this.placeService.setSearchQuery(val);
  }

  onCategorySelect(catId: string): void {
    this.placeService.setCategory(catId);
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
  }

  refreshPlaces(): void {
    this.placeService.refreshPlaces();
  }
}

