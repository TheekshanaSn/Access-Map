import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Place } from '../../../core/models/place.model';
import { AccessibilityBadgeComponent } from '../accessibility-badge/accessibility-badge.component';

@Component({
  selector: 'app-place-card',
  standalone: true,
  imports: [CommonModule, RouterLink, AccessibilityBadgeComponent],
  template: `
    <article
      class="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between h-full"
      [attr.aria-labelledby]="'place-title-' + place.id"
    >
      <div class="space-y-3">
        <!-- Top Metadata Row -->
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {{ place.categoryLabel }}
          </span>

          <div class="flex items-center gap-2">
            @if (place.verifiedStatus === 'community_verified') {
              <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span aria-hidden="true">✓</span> Verified Audit
              </span>
            } @else if (place.verifiedStatus === 'staff_verified') {
              <span class="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                <span aria-hidden="true">★</span> Official Review
              </span>
            }

            <span class="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="Overall Accessibility Rating">
              <span class="text-amber-500" aria-hidden="true">★</span> {{ place.overallRating }}
              <span class="text-slate-400 font-normal">({{ place.reviewCount }})</span>
            </span>
          </div>
        </div>

        <!-- Place Title & Address -->
        <div>
          <h3 [id]="'place-title-' + place.id" class="text-lg font-bold text-slate-900 group">
            <a
              [routerLink]="['/places', place.id]"
              class="hover:text-teal-700 focus:underline focus:outline-none"
            >
              {{ place.name }}
            </a>
          </h3>
          <p class="text-xs sm:text-sm text-slate-600 mt-1 flex items-start gap-1.5">
            <span class="text-slate-400 shrink-0" aria-hidden="true">📍</span>
            <span>{{ place.address.street }}, {{ place.address.city }}</span>
          </p>
          @if (place.address.landmark) {
            <p class="text-xs text-slate-500 italic ml-5">
              Near {{ place.address.landmark }}
            </p>
          }
        </div>

        <!-- Description -->
        <p class="text-xs sm:text-sm text-slate-700 line-clamp-2 leading-relaxed">
          {{ place.shortDescription }}
        </p>

        <!-- Temporary Obstacle Alert if any -->
        @if (place.temporaryObstacles.length > 0) {
          <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2" role="note">
            <span class="text-amber-600 font-bold shrink-0" aria-hidden="true">⚠️</span>
            <div>
              <p class="font-bold">{{ place.temporaryObstacles[0].title }}</p>
              <p class="text-amber-800 line-clamp-1">{{ place.temporaryObstacles[0].description }}</p>
            </div>
          </div>
        }

        <!-- Accessibility Badges Grid -->
        <div class="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5" aria-label="Key accessibility features">
          @if (place.amenities.stepFreeEntrance) {
            <app-accessibility-badge type="step-free"></app-accessibility-badge>
          }
          @if (place.amenities.ramp.available) {
            <app-accessibility-badge type="ramp"></app-accessibility-badge>
          }
          @if (place.amenities.elevator.available && place.amenities.elevator.workingStatus === 'operational') {
            <app-accessibility-badge type="elevator"></app-accessibility-badge>
          }
          @if (place.amenities.accessibleRestroom.available) {
            <app-accessibility-badge type="restroom"></app-accessibility-badge>
          }
          @if (place.amenities.disabledParking.available) {
            <app-accessibility-badge type="parking"></app-accessibility-badge>
          }
          @if (place.amenities.doorWidthCm >= 90) {
            <app-accessibility-badge type="door-width" [label]="place.amenities.doorWidthCm + 'cm Door'"></app-accessibility-badge>
          }
        </div>
      </div>

      <!-- Action Button (Large Touch Target) -->
      <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <a
          [routerLink]="['/places', place.id]"
          class="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm transition-colors text-center shadow-xs focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
          [attr.aria-label]="'View full accessibility details for ' + place.name"
        >
          <span>View Accessibility Details</span>
          <span aria-hidden="true">→</span>
        </a>

        <a
          [routerLink]="['/submit-report']"
          [queryParams]="{ placeId: place.id }"
          class="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors shrink-0 border border-slate-200"
          title="Submit an updated accessibility audit"
          aria-label="Submit an updated accessibility audit for this place"
        >
          <span aria-hidden="true">📝</span>
        </a>
      </div>
    </article>
  `,
})
export class PlaceCardComponent {
  @Input({ required: true }) place!: Place;
}

