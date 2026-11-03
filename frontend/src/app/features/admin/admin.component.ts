import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/report.service';
import { PlaceService } from '../../core/services/place.service';
import { ModerationStatus } from '../../core/models/report.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      <!-- Dashboard Top Header -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-teal-400 text-xs font-bold">
            <span class="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>Moderation & System Oversight</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Admin Moderation Dashboard
          </h1>
          <p class="text-sm sm:text-base text-slate-600 max-w-2xl">
            Review crowdsourced accessibility audits, approve obstacle notices, and maintain data integrity across the platform.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
            Role: Lead Accessibility Moderator
          </span>
        </div>
      </header>

      <!-- Key Metrics Overview Cards -->
      <section class="grid grid-cols-2 lg:grid-cols-5 gap-4" aria-label="System Metrics Summary">
        
        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Audits</span>
          <p class="text-2xl sm:text-3xl font-black text-amber-600">{{ pendingCount() }}</p>
          <p class="text-[11px] text-slate-500 font-medium">Awaiting moderator verification</p>
        </div>

        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Audits</span>
          <p class="text-2xl sm:text-3xl font-black text-emerald-600">{{ approvedCount() }}</p>
          <p class="text-[11px] text-slate-500 font-medium">Live on public venue pages</p>
        </div>

        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Obstacles</span>
          <p class="text-2xl sm:text-3xl font-black text-rose-600">{{ obstacleCount() }}</p>
          <p class="text-[11px] text-slate-500 font-medium">Lifts broken or sidewalks blocked</p>
        </div>

        <div class="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flagged Reports</span>
          <p class="text-2xl sm:text-3xl font-black text-purple-600">{{ flaggedCount() }}</p>
          <p class="text-[11px] text-slate-500 font-medium">Contradictory or spam reports</p>
        </div>

        <div class="col-span-2 lg:col-span-1 p-4 rounded-xl bg-slate-900 text-white shadow-xs space-y-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Places Monitored</span>
          <p class="text-2xl sm:text-3xl font-black text-teal-400">{{ allPlaces().length }}</p>
          <p class="text-[11px] text-slate-400 font-medium">Catalogued facilities</p>
        </div>

      </section>

      <!-- Moderation Queue -->
      <section class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6" aria-labelledby="queue-heading">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 id="queue-heading" class="text-xl font-bold text-slate-900">
              Community Audit Review Queue
            </h2>
            <p class="text-xs text-slate-500">
              Examine submissions, verify physical measurements, and publish updates
            </p>
          </div>

          <!-- Filter Tabs -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200" role="group" aria-label="Filter moderation queue">
            <button
              type="button"
              (click)="setFilter('all')"
              [class.bg-white]="adminFilter() === 'all'"
              [class.font-bold]="adminFilter() === 'all'"
              [class.shadow-xs]="adminFilter() === 'all'"
              class="px-3 py-1.5 text-xs rounded-md text-slate-800 transition-colors cursor-pointer"
            >
              All ({{ allReports().length }})
            </button>
            <button
              type="button"
              (click)="setFilter('pending')"
              [class.bg-white]="adminFilter() === 'pending'"
              [class.font-bold]="adminFilter() === 'pending'"
              [class.shadow-xs]="adminFilter() === 'pending'"
              class="px-3 py-1.5 text-xs rounded-md text-slate-800 transition-colors cursor-pointer"
            >
              Pending ({{ pendingCount() }})
            </button>
            <button
              type="button"
              (click)="setFilter('approved')"
              [class.bg-white]="adminFilter() === 'approved'"
              [class.font-bold]="adminFilter() === 'approved'"
              [class.shadow-xs]="adminFilter() === 'approved'"
              class="px-3 py-1.5 text-xs rounded-md text-slate-800 transition-colors cursor-pointer"
            >
              Approved ({{ approvedCount() }})
            </button>
            <button
              type="button"
              (click)="setFilter('flagged')"
              [class.bg-white]="adminFilter() === 'flagged'"
              [class.font-bold]="adminFilter() === 'flagged'"
              [class.shadow-xs]="adminFilter() === 'flagged'"
              class="px-3 py-1.5 text-xs rounded-md text-slate-800 transition-colors cursor-pointer"
            >
              Flagged ({{ flaggedCount() }})
            </button>
          </div>
        </div>

        <!-- Moderation Items List -->
        @if (reports().length === 0) {
          <div class="p-8 text-center text-slate-500 text-sm">
            No audit submissions match the selected filter.
          </div>
        } @else {
          <div class="space-y-4">
            @for (rep of reports(); track rep.id) {
              <article class="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3">
                
                <!-- Item Header -->
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 class="text-base font-bold text-slate-900">
                      {{ rep.placeName }}
                    </h3>
                    <div class="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                      <span class="font-semibold text-slate-800">{{ rep.reporterName }}</span>
                      <span aria-hidden="true">•</span>
                      <span class="bg-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-800">
                        {{ rep.reporterRoleLabel }}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>{{ rep.submissionDate }}</span>
                    </div>
                  </div>

                  <!-- Status Badge -->
                  <div>
                    @if (rep.moderationStatus === 'pending') {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ⏳ Pending Review
                      </span>
                    } @else if (rep.moderationStatus === 'approved') {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        ✓ Approved & Live
                      </span>
                    } @else if (rep.moderationStatus === 'flagged') {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
                        🚩 Flagged for Inquiry
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                        ✕ Rejected
                      </span>
                    }
                  </div>
                </div>

                <!-- Notes & Observation -->
                <p class="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {{ rep.notes }}
                </p>

                <!-- Temporary Obstacle Alert if present -->
                @if (rep.hasTemporaryObstacle) {
                  <div class="p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium">
                    ⚠️ <strong>Reported Obstacle:</strong> {{ rep.temporaryObstacleDetails }}
                  </div>
                }

                <!-- Action Controls (Moderate Directly) -->
                <div class="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    @if (rep.placeId) {
                      <a
                        [routerLink]="['/places', rep.placeId]"
                        class="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                      >
                        Inspect Venue Profile →
                      </a>
                    }
                  </div>

                  <div class="flex items-center gap-2">
                    @if (rep.moderationStatus !== 'approved') {
                      <button
                        type="button"
                        (click)="approve(rep.id)"
                        class="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>✓</span>
                        <span>Approve & Publish</span>
                      </button>
                    }

                    @if (rep.moderationStatus !== 'flagged') {
                      <button
                        type="button"
                        (click)="flag(rep.id)"
                        class="min-h-[38px] px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold text-xs border border-purple-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>🚩</span>
                        <span>Flag</span>
                      </button>
                    }

                    @if (rep.moderationStatus !== 'rejected') {
                      <button
                        type="button"
                        (click)="reject(rep.id)"
                        class="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs border border-rose-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>✕</span>
                        <span>Reject</span>
                      </button>
                    }
                  </div>
                </div>

              </article>
            }
          </div>
        }

      </section>

    </div>
  `,
})
export class AdminComponent {
  private readonly reportService = inject(ReportService);
  private readonly placeService = inject(PlaceService);

  readonly allReports = this.reportService.allReports;
  readonly reports = this.reportService.filteredAdminReports;
  readonly adminFilter = this.reportService.adminFilter;

  readonly pendingCount = this.reportService.pendingCount;
  readonly approvedCount = this.reportService.approvedCount;
  readonly flaggedCount = this.reportService.flaggedCount;
  readonly obstacleCount = this.reportService.obstacleCount;
  readonly allPlaces = this.placeService.allPlaces;

  setFilter(filter: ModerationStatus | 'all'): void {
    this.reportService.adminFilter.set(filter);
  }

  approve(reportId: string): void {
    this.reportService.updateModerationStatus(reportId, 'approved');
  }

  flag(reportId: string): void {
    this.reportService.updateModerationStatus(reportId, 'flagged');
  }

  reject(reportId: string): void {
    this.reportService.updateModerationStatus(reportId, 'rejected');
  }
}

