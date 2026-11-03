import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlaceService } from '../../core/services/place.service';
import { PlaceCardComponent } from '../../shared/components/place-card/place-card.component';
import { PlaceCategory } from '../../core/models/place.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PlaceCardComponent],
  template: `
    <div class="space-y-16 pb-16">
      
      <!-- Hero Section -->
      <section class="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden" aria-labelledby="home-hero-heading">
        <!-- Subtle background decorative accents -->
        <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden="true"></div>

        <div class="relative max-w-5xl mx-auto text-center space-y-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold">
            <span class="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true"></span>
            Inclusive Mobility • Verified Physical Access
          </div>

          <h1 id="home-hero-heading" class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Explore Places.<br />
            <span class="text-teal-400">Move With Confidence.</span>
          </h1>

          <p class="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Discover accessible public venues, check ramps, lifts, entrance door widths, and accessible toilets before you leave home. Built for wheelchair users, elderly citizens, and individuals with mobility difficulties.
          </p>

          <!-- Search Form (Large, High Contrast, Touch-Friendly) -->
          <form
            (ngSubmit)="onSearch()"
            role="search"
            class="max-w-3xl mx-auto pt-4 flex flex-col sm:flex-row items-stretch gap-3 text-left"
          >
            <div class="relative flex-1">
              <label for="home-search-input" class="sr-only">Search accessible places, venues, or addresses</label>
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-lg" aria-hidden="true">
                🔍
              </div>
              <input
                id="home-search-input"
                name="searchQuery"
                type="search"
                [(ngModel)]="searchQuery"
                placeholder="Search clinics, transit stations, parks, libraries..."
                class="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-slate-900 placeholder:text-slate-500 font-medium text-base shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-400 min-h-[56px]"
              />
            </div>

            <button
              type="submit"
              class="min-h-[56px] px-8 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-black text-base transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer focus:ring-4 focus:ring-teal-300 shrink-0"
            >
              <span>Search Places</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <!-- Quick Action Buttons -->
          <div class="pt-2 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <a
              routerLink="/places"
              class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors min-h-[48px]"
            >
              <span>Browse All Accessible Places</span>
              <span aria-hidden="true">📂</span>
            </a>
            <a
              routerLink="/explore-map"
              class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white border border-teal-600 transition-colors min-h-[48px]"
            >
              <span>Open Interactive Map</span>
              <span aria-hidden="true">🗺️</span>
            </a>
          </div>

          <!-- Fast Accessibility Stats -->
          <div class="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-center border-t border-slate-800">
            <div class="p-3">
              <p class="text-2xl sm:text-3xl font-extrabold text-teal-400">100%</p>
              <p class="text-xs text-slate-400 font-medium">Step-Free Filterable</p>
            </div>
            <div class="p-3">
              <p class="text-2xl sm:text-3xl font-extrabold text-teal-400">8+ Venues</p>
              <p class="text-xs text-slate-400 font-medium">Curated Demo Audits</p>
            </div>
            <div class="p-3">
              <p class="text-2xl sm:text-3xl font-extrabold text-teal-400">Door & Ramp</p>
              <p class="text-xs text-slate-400 font-medium">Exact Measurements</p>
            </div>
            <div class="p-3">
              <p class="text-2xl sm:text-3xl font-extrabold text-teal-400">Live Alerts</p>
              <p class="text-xs text-slate-400 font-medium">Broken Lift Notices</p>
            </div>
          </div>

        </div>
      </section>

      <!-- Accessibility Category Cards -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" aria-labelledby="categories-heading">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 id="categories-heading" class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore by Category
            </h2>
            <p class="text-sm text-slate-600 mt-1">
              Filter public spaces by the type of facility you need to visit
            </p>
          </div>
          <a
            routerLink="/places"
            class="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-900 focus:underline"
          >
            <span>View all categories</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          @for (cat of categories; track cat.id) {
            <button
              type="button"
              (click)="onSelectCategory(cat.id)"
              class="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group shadow-xs focus:ring-2 focus:ring-teal-600 min-h-[120px]"
              [attr.aria-label]="'Explore places in ' + cat.title"
            >
              <span class="text-3xl group-hover:scale-110 transition-transform" aria-hidden="true">
                {{ cat.icon }}
              </span>
              <div>
                <p class="font-bold text-slate-900 text-sm group-hover:text-teal-800">
                  {{ cat.title }}
                </p>
                <p class="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {{ cat.desc }}
                </p>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- Recently Added & Verified Places -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" aria-labelledby="recent-places-heading">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div class="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 mb-1">
              <span>✓ Verified Accessibility</span>
            </div>
            <h2 id="recent-places-heading" class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Recently Audited Places
            </h2>
            <p class="text-sm text-slate-600">
              Community and staff-reviewed venues with documented physical access conditions
            </p>
          </div>
          <a
            routerLink="/places"
            class="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors shrink-0"
          >
            <span>See All {{ places().length }} Places</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (place of recentPlaces(); track place.id) {
            <app-place-card [place]="place"></app-place-card>
          }
        </div>
      </section>

      <!-- How AccessMap Works Section -->
      <section class="bg-slate-50 border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8" aria-labelledby="how-it-works-heading">
        <div class="max-w-7xl mx-auto space-y-12">
          
          <div class="text-center max-w-2xl mx-auto space-y-3">
            <h2 id="how-it-works-heading" class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How AccessMap Works
            </h2>
            <p class="text-sm sm:text-base text-slate-600">
              Reliable, granular accessibility intelligence generated by wheelchair users, caregivers, and community auditors
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
              <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-black">
                1
              </div>
              <h3 class="text-base font-bold text-slate-900">Discover & Search</h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Search by name or filter public spaces specifically by step-free entrances, wheelchair ramps, elevators, and wide doors.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
              <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-black">
                2
              </div>
              <h3 class="text-base font-bold text-slate-900">Inspect Before Traveling</h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review verified doorway measurements in centimeters, ramp gradients, grab bar positions, and parking distances before leaving.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
              <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-black">
                3
              </div>
              <h3 class="text-base font-bold text-slate-900">Report Temporary Obstacles</h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Alert fellow mobility travelers when an elevator is under maintenance, a ramp is iced over, or construction blocks a sidewalk.
              </p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
              <div class="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-black">
                4
              </div>
              <h3 class="text-base font-bold text-slate-900">Plan Accessible Routes</h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Prepare for turn-by-turn navigation avoiding stairs, steep curbs, and cobblestones with our upcoming navigation engine.
              </p>
            </div>

          </div>

          <div class="text-center pt-4">
            <a
              routerLink="/submit-report"
              class="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-colors shadow-sm focus:ring-4 focus:ring-teal-300"
            >
              <span>Contribute an Accessibility Audit</span>
              <span aria-hidden="true">📝</span>
            </a>
          </div>

        </div>
      </section>

      <!-- Call to Action Banner -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-gradient-to-r from-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
          <div class="space-y-3 max-w-xl text-center md:text-left">
            <span class="inline-flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider">
              Community Empowerment
            </span>
            <h2 class="text-2xl sm:text-3xl font-black">Know Before You Go.</h2>
            <p class="text-slate-200 text-sm sm:text-base leading-relaxed">
              Help us map every ramp, elevator, and restroom. Your observations save someone hours of uncertainty and physical frustration.
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <a
              routerLink="/explore-map"
              class="min-h-[48px] px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-sm text-center flex items-center justify-center transition-colors"
            >
              Explore Map View
            </a>
            <a
              routerLink="/submit-report"
              class="min-h-[48px] px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm text-center border border-white/20 flex items-center justify-center transition-colors"
            >
              Submit Venue Report
            </a>
          </div>
        </div>
      </section>

    </div>
  `,
})
export class HomeComponent {
  private readonly placeService = inject(PlaceService);
  private readonly router = inject(Router);

  searchQuery = '';
  readonly places = this.placeService.allPlaces;

  // Recently audited places (first 3)
  recentPlaces = () => this.places().slice(0, 3);

  readonly categories = [
    { id: 'healthcare', title: 'Healthcare', icon: '🏥', desc: 'Clinics & Hospitals' },
    { id: 'transport', title: 'Transit', icon: '🚆', desc: 'Stations & Stops' },
    { id: 'dining', title: 'Dining', icon: '🍽️', desc: 'Cafes & Bistros' },
    { id: 'parks', title: 'Parks', icon: '🌳', desc: 'Trails & Gardens' },
    { id: 'shopping', title: 'Shopping', icon: '🛒', desc: 'Markets & Grocers' },
    { id: 'culture', title: 'Culture', icon: '🏛️', desc: 'Libraries & Civic' },
  ];

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.placeService.setSearchQuery(this.searchQuery.trim());
      this.router.navigate(['/places'], { queryParams: { q: this.searchQuery.trim() } });
    } else {
      this.router.navigate(['/places']);
    }
  }

  onSelectCategory(categoryId: string): void {
    this.placeService.setCategory(categoryId as PlaceCategory);
    this.router.navigate(['/places'], { queryParams: { category: categoryId } });
  }
}

