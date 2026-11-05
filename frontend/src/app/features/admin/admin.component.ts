import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/report.service';
import { PlaceService } from '../../core/services/place.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminService, AdminOverviewMetrics, AuditLogItem, DuplicatePlacePair, AdminUserItem } from '../../core/services/admin.service';
import { AccessibilityReport, ModerationStatus } from '../../core/models/report.model';
import { Place, PlaceCategory } from '../../core/models/place.model';

type AdminTab = 'overview' | 'moderation' | 'places' | 'duplicates' | 'audit-trail' | 'users' | 'osm-data';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      <!-- Top Header & Role Overview -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-teal-400 text-xs font-bold">
            <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>Administrative Governance & System Oversight</span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            AccessMap Admin Dashboard
          </h1>
          <p class="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Manage verification workflows, review crowdsourced audits, rectify venue records, detect duplicate facilities, and audit all moderation decisions.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs">
            <span class="text-slate-500">Logged in as: </span>
            <strong class="text-teal-900">{{ currentUser()?.name || 'Moderator' }}</strong>
            <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              [class.bg-purple-100]="isAdmin()"
              [class.text-purple-800]="isAdmin()"
              [class.bg-teal-100]="!isAdmin()"
              [class.text-teal-800]="!isAdmin()">
              {{ currentUser()?.role || 'moderator' }}
            </span>
          </div>
        </div>
      </header>

      <!-- System Notification Banner -->
      @if (actionNotification()) {
        <aside
          class="p-4 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs transition-all"
          [class.bg-emerald-50]="actionNotification()?.type === 'success'"
          [class.border-2]="true"
          [class.border-emerald-300]="actionNotification()?.type === 'success'"
          [class.text-emerald-950]="actionNotification()?.type === 'success'"
          [class.bg-rose-50]="actionNotification()?.type === 'error'"
          [class.border-rose-300]="actionNotification()?.type === 'error'"
          [class.text-rose-950]="actionNotification()?.type === 'error'"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-center gap-2">
            <span>{{ actionNotification()?.type === 'success' ? '✓' : '⚠️' }}</span>
            <span class="font-bold">{{ actionNotification()?.message }}</span>
          </div>
          <button
            type="button"
            (click)="actionNotification.set(null)"
            class="text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer"
          >
            ✕ Dismiss
          </button>
        </aside>
      }

      <!-- Admin Primary Navigation Tabs -->
      <nav class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2" aria-label="Admin Sections">
        <button
          type="button"
          (click)="setActiveTab('overview')"
          [class.bg-teal-700]="activeTab() === 'overview'"
          [class.text-white]="activeTab() === 'overview'"
          [class.bg-slate-100]="activeTab() !== 'overview'"
          [class.text-slate-700]="activeTab() !== 'overview'"
          class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>📊 Overview</span>
        </button>

        <button
          type="button"
          (click)="setActiveTab('moderation')"
          [class.bg-teal-700]="activeTab() === 'moderation'"
          [class.text-white]="activeTab() === 'moderation'"
          [class.bg-slate-100]="activeTab() !== 'moderation'"
          [class.text-slate-700]="activeTab() !== 'moderation'"
          class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>⚖️ Report Moderation</span>
          @if (pendingCount() > 0) {
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
              {{ pendingCount() }}
            </span>
          }
        </button>

        <button
          type="button"
          (click)="setActiveTab('places')"
          [class.bg-teal-700]="activeTab() === 'places'"
          [class.text-white]="activeTab() === 'places'"
          [class.bg-slate-100]="activeTab() !== 'places'"
          [class.text-slate-700]="activeTab() !== 'places'"
          class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>🏢 Places Catalog</span>
          <span class="text-xs opacity-75">({{ allPlaces().length }})</span>
        </button>

        <button
          type="button"
          (click)="setActiveTab('duplicates')"
          [class.bg-teal-700]="activeTab() === 'duplicates'"
          [class.text-white]="activeTab() === 'duplicates'"
          [class.bg-slate-100]="activeTab() !== 'duplicates'"
          [class.text-slate-700]="activeTab() !== 'duplicates'"
          class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>🔍 Duplicate Detection</span>
          @if (detectedDuplicates().length > 0) {
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {{ detectedDuplicates().length }}
            </span>
          }
        </button>

        <button
          type="button"
          (click)="setActiveTab('audit-trail')"
          [class.bg-teal-700]="activeTab() === 'audit-trail'"
          [class.text-white]="activeTab() === 'audit-trail'"
          [class.bg-slate-100]="activeTab() !== 'audit-trail'"
          [class.text-slate-700]="activeTab() !== 'audit-trail'"
          class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
        >
          <span>📜 Audit Trail</span>
        </button>

        @if (isAdmin()) {
          <button
            type="button"
            (click)="setActiveTab('users')"
            [class.bg-teal-700]="activeTab() === 'users'"
            [class.text-white]="activeTab() === 'users'"
            [class.bg-slate-100]="activeTab() !== 'users'"
            [class.text-slate-700]="activeTab() !== 'users'"
            class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <span>👥 User Roles</span>
          </button>
        }
          <button
            type="button"
            (click)="setActiveTab('osm-data')"
            [class.bg-teal-700]="activeTab() === 'osm-data'"
            [class.text-white]="activeTab() === 'osm-data'"
            [class.bg-slate-100]="activeTab() !== 'osm-data'"
            [class.text-slate-700]="activeTab() !== 'osm-data'"
            class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <span>Sri Lanka OSM Data</span>
          </button>
      </nav>

      <!-- TAB 1: SYSTEM OVERVIEW & METRICS -->
      @if (activeTab() === 'overview') {
        <section class="space-y-8" aria-label="Administrative Overview">
          
          <!-- Key Metrics Cards -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catalog Places</span>
              <p class="text-3xl font-black text-slate-900">{{ metrics()?.places?.total ?? allPlaces().length }}</p>
              <p class="text-[11px] text-teal-700 font-semibold">{{ metrics()?.places?.verified ?? 4 }} verified</p>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Audits</span>
              <p class="text-3xl font-black text-amber-600">{{ pendingCount() }}</p>
              <p class="text-[11px] text-slate-500">Needs moderation</p>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Audits</span>
              <p class="text-3xl font-black text-emerald-600">{{ approvedCount() }}</p>
              <p class="text-[11px] text-slate-500">Live on venue pages</p>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Obstacles</span>
              <p class="text-3xl font-black text-rose-600">{{ obstacleCount() }}</p>
              <p class="text-[11px] text-slate-500">Lifts/ramps down</p>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duplicate Suspects</span>
              <p class="text-3xl font-black text-purple-600">{{ detectedDuplicates().length }}</p>
              <p class="text-[11px] text-slate-500">Requires resolution</p>
            </div>

            <div class="p-4 rounded-2xl bg-slate-900 text-white shadow-xs space-y-1">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <p class="text-3xl font-black text-teal-400">{{ metrics()?.users?.total ?? 3 }}</p>
              <p class="text-[11px] text-slate-400">Registered auditors</p>
            </div>
          </div>

          <!-- Quick Action Shortcuts & Recent Activity Split -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Quick Actions Panel -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>⚡ Priority Moderation Actions</span>
              </h2>
              <div class="space-y-2.5">
                <button
                  type="button"
                  (click)="filterModeration('pending')"
                  class="w-full text-left p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 hover:bg-amber-100/70 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span class="text-xs font-bold text-amber-950 block">Review Pending Submissions</span>
                    <span class="text-[11px] text-amber-800">{{ pendingCount() }} community audits awaiting verification</span>
                  </div>
                  <span class="text-sm font-bold text-amber-900">→</span>
                </button>

                <button
                  type="button"
                  (click)="filterModeration('user_corrections')"
                  class="w-full text-left p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 hover:bg-blue-100/70 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span class="text-xs font-bold text-blue-950 block">Inspect User Corrections</span>
                    <span class="text-[11px] text-blue-800">Audits amended by original reporters</span>
                  </div>
                  <span class="text-sm font-bold text-blue-900">→</span>
                </button>

                <button
                  type="button"
                  (click)="setActiveTab('duplicates')"
                  class="w-full text-left p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 hover:bg-purple-100/70 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span class="text-xs font-bold text-purple-950 block">Scan Suspected Duplicates</span>
                    <span class="text-[11px] text-purple-800">{{ detectedDuplicates().length }} proximity/name candidate pairs</span>
                  </div>
                  <span class="text-sm font-bold text-purple-900">→</span>
                </button>
              </div>
            </div>

            <!-- Recent Administrative Audit Trail Feed -->
            <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📜 Recent Administrative Audit Trail</span>
                </h2>
                <button
                  type="button"
                  (click)="setActiveTab('audit-trail')"
                  class="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  View Full Log →
                </button>
              </div>

              <div class="space-y-3">
                @for (log of recentLogs(); track log.id) {
                  <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          [class.bg-emerald-100]="log.action === 'REPORT_APPROVED'"
                          [class.text-emerald-800]="log.action === 'REPORT_APPROVED'"
                          [class.bg-rose-100]="log.action === 'REPORT_REJECTED'"
                          [class.text-rose-800]="log.action === 'REPORT_REJECTED'"
                          [class.bg-blue-100]="log.action === 'PLACE_UPDATED' || log.action === 'REPORT_CORRECTION_REQUESTED'"
                          [class.text-blue-800]="log.action === 'PLACE_UPDATED' || log.action === 'REPORT_CORRECTION_REQUESTED'"
                          [class.bg-purple-100]="log.action === 'USER_ROLE_CHANGED' || log.action === 'PLACE_DUPLICATE_RESOLVED'"
                          [class.text-purple-800]="log.action === 'USER_ROLE_CHANGED' || log.action === 'PLACE_DUPLICATE_RESOLVED'">
                          {{ log.action.replace('_', ' ') }}
                        </span>
                        <strong class="text-slate-900">{{ log.targetName }}</strong>
                      </div>
                      <span class="text-slate-400">{{ log.timestamp | date:'short' }}</span>
                    </div>
                    <p class="text-slate-600 pl-1">{{ log.reason || 'Administrative action logged' }}</p>
                    <p class="text-[11px] text-slate-400 pl-1">Performed by: {{ log.performedBy.name }} ({{ log.performedBy.role }})</p>
                  </div>
                }
              </div>
            </div>

          </div>

        </section>
      }

      <!-- TAB 2: REPORT MODERATION QUEUE -->
      @if (activeTab() === 'moderation') {
        <section class="space-y-6" aria-label="Community Audit Review Queue">
          
          <!-- Filter Controls Bar -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <!-- Filter Pills -->
              <div class="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  (click)="setFilter('all')"
                  [class.bg-white]="adminFilter() === 'all' && !filterOnlyCorrections"
                  [class.font-bold]="adminFilter() === 'all' && !filterOnlyCorrections"
                  [class.shadow-xs]="adminFilter() === 'all' && !filterOnlyCorrections"
                  class="px-3.5 py-1.5 text-xs rounded-lg text-slate-800 cursor-pointer"
                >
                  All ({{ allReports().length }})
                </button>
                <button
                  type="button"
                  (click)="setFilter('pending')"
                  [class.bg-white]="adminFilter() === 'pending' && !filterOnlyCorrections"
                  [class.font-bold]="adminFilter() === 'pending' && !filterOnlyCorrections"
                  [class.shadow-xs]="adminFilter() === 'pending' && !filterOnlyCorrections"
                  class="px-3.5 py-1.5 text-xs rounded-lg text-slate-800 cursor-pointer flex items-center gap-1"
                >
                  <span>Pending</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                    {{ pendingCount() }}
                  </span>
                </button>
                <button
                  type="button"
                  (click)="setFilter('needs_review')"
                  [class.bg-white]="adminFilter() === 'needs_review' && !filterOnlyCorrections"
                  [class.font-bold]="adminFilter() === 'needs_review' && !filterOnlyCorrections"
                  [class.shadow-xs]="adminFilter() === 'needs_review' && !filterOnlyCorrections"
                  class="px-3.5 py-1.5 text-xs rounded-lg text-slate-800 cursor-pointer"
                >
                  Needs Review / Correction
                </button>
                <button
                  type="button"
                  (click)="setFilter('approved')"
                  [class.bg-white]="adminFilter() === 'approved' && !filterOnlyCorrections"
                  [class.font-bold]="adminFilter() === 'approved' && !filterOnlyCorrections"
                  [class.shadow-xs]="adminFilter() === 'approved' && !filterOnlyCorrections"
                  class="px-3.5 py-1.5 text-xs rounded-lg text-slate-800 cursor-pointer"
                >
                  Approved ({{ approvedCount() }} )
                </button>
                <button
                  type="button"
                  (click)="setFilter('rejected')"
                  [class.bg-white]="adminFilter() === 'rejected' && !filterOnlyCorrections"
                  [class.font-bold]="adminFilter() === 'rejected' && !filterOnlyCorrections"
                  [class.shadow-xs]="adminFilter() === 'rejected' && !filterOnlyCorrections"
                  class="px-3.5 py-1.5 text-xs rounded-lg text-slate-800 cursor-pointer"
                >
                  Rejected
                </button>
              </div>

              <!-- Corrections Toggle & Search -->
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="filterOnlyCorrections"
                    (change)="reloadAdminReports()"
                    class="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>User Corrections Only</span>
                </label>

                <div class="relative min-w-[200px]">
                  <input
                    type="search"
                    [(ngModel)]="reportSearchQuery"
                    (input)="onReportSearch()"
                    placeholder="Search venue or notes..."
                    class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

            </div>
          </div>

          <!-- Moderation Queue Items -->
          @if (reportsLoading()) {
            <div class="p-12 text-center text-slate-500 text-sm space-y-2">
              <div class="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p>Loading moderation queue...</p>
            </div>
          } @else if (displayedReports().length === 0) {
            <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
              <span class="text-3xl block">✓</span>
              <h3 class="text-base font-bold text-slate-800">No Audits Found</h3>
              <p class="text-xs text-slate-500">There are no audit submissions matching the selected filters.</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (rep of displayedReports(); track rep.id) {
                <article class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs hover:border-slate-300 transition-all">
                  
                  <!-- Report Top Bar -->
                  <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="text-lg font-black text-slate-900">{{ rep.placeName }}</h3>
                        @if (rep.isProposedPlace) {
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Unlisted Venue
                          </span>
                        }
                        @if (rep.isCorrection) {
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            ✏️ User Correction
                          </span>
                        }
                      </div>
                      <p class="text-xs text-slate-500 mt-1">
                        Reported by: <strong class="text-slate-800">{{ rep.reporterName }}</strong>
                        • Role: <span class="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">{{ rep.reporterRoleLabel || rep.reporterRole }}</span>
                        • Date: {{ rep.submissionDate }}
                      </p>
                    </div>

                    <!-- Status Indicator -->
                    <div>
                      @switch (rep.moderationStatus || rep.reportStatus) {
                        @case ('approved') {
                          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Approved & Live
                          </span>
                        }
                        @case ('needs_review') {
                          <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            ℹ Correction Requested
                          </span>
                        }
                        @case ('rejected') {
                          <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            ✕ Rejected
                          </span>
                        }
                        @default {
                          <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            ⏳ Pending Review
                          </span>
                        }
                      }
                    </div>
                  </div>

                  <!-- Physical Accessibility Data Grid -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Ramp</span>
                      <strong class="text-slate-800">{{ rep.rampStatus || 'Not specified' }}</strong>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Stairs / Steps</span>
                      <strong class="text-slate-800">{{ rep.stairsStatus || 'Not specified' }}</strong>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Lift / Elevator</span>
                      <strong class="text-slate-800">{{ rep.liftStatus || 'Not specified' }}</strong>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Restroom</span>
                      <strong class="text-slate-800">{{ rep.accessibleToiletStatus || 'Not specified' }}</strong>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Entrance</span>
                      <strong class="text-slate-800">{{ rep.entranceInformation || 'Not specified' }}</strong>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Disabled Parking</span>
                      <strong class="text-slate-800">{{ rep.parkingStatus || 'Not specified' }}</strong>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Surface</span>
                      <strong class="text-slate-800">{{ rep.surfaceCondition || 'Not specified' }}</strong>
                    </div>
                    <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Door Clear Width</span>
                      <strong class="text-slate-800">{{ rep.doorWidthCm ? rep.doorWidthCm + ' cm' : 'Unmeasured' }}</strong>
                    </div>
                  </div>

                  <!-- Temporary Obstacle Alert -->
                  @if (rep.hasTemporaryObstacle) {
                    <div class="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs">
                      <strong>⚠️ Active Obstacle:</strong> {{ rep.temporaryObstacleDetails }}
                    </div>
                  }

                  <!-- Notes & Observation -->
                  @if (rep.notes) {
                    <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong>Field Notes:</strong> "{{ rep.notes }}"
                    </div>
                  }

                  <!-- Correction Notes (if user correction) -->
                  @if (rep.isCorrection && rep.correctionNotes) {
                    <div class="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
                      <strong>Amended Details Note:</strong> {{ rep.correctionNotes }}
                    </div>
                  }

                  <!-- Photo Evidence Gallery Preview -->
                  @if (rep.evidenceImageReferences && rep.evidenceImageReferences.length > 0) {
                    <div class="space-y-1.5">
                      <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Photo Evidence ({{ rep.evidenceImageReferences.length }}):</span>
                      <div class="flex flex-wrap gap-2">
                        @for (imgUrl of rep.evidenceImageReferences; track imgUrl) {
                          <a
                            [href]="imgUrl"
                            target="_blank"
                            rel="noopener"
                            class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-teal-800 text-xs font-semibold flex items-center gap-1 border border-slate-300"
                          >
                            <span>📸 View Evidence Photo</span>
                            <span class="text-[10px]">↗</span>
                          </a>
                        }
                      </div>
                    </div>
                  }

                  <!-- Moderator Action Decision Controls -->
                  <div class="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      @if (rep.placeId) {
                        <a
                          [routerLink]="['/places', rep.placeId]"
                          class="text-xs font-bold text-teal-700 hover:underline"
                        >
                          View Public Place Profile →
                        </a>
                      }
                    </div>

                    <!-- Action Decision Buttons -->
                    <div class="flex flex-wrap items-center gap-2">
                      
                      <!-- Self-approval guard hint -->
                      @if (isReporterOf(rep)) {
                        <span class="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          ⚠️ Self-audit (Peer moderation required)
                        </span>
                      }

                      <!-- Approve Button -->
                      <button
                        type="button"
                        [disabled]="isReporterOf(rep)"
                        (click)="openDecisionModal(rep, 'approved')"
                        class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>✓ Approve & Publish</span>
                      </button>

                      <!-- Request Correction Button -->
                      <button
                        type="button"
                        (click)="openDecisionModal(rep, 'needs_review')"
                        class="px-3.5 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>ℹ Request Correction</span>
                      </button>

                      <!-- Reject Button -->
                      <button
                        type="button"
                        (click)="openDecisionModal(rep, 'rejected')"
                        class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>✕ Reject</span>
                      </button>

                    </div>
                  </div>

                </article>
              }
            </div>
          }

        </section>
      }

      <!-- TAB 3: PLACES CATALOG & ACCESSIBLE INFORMATION EDITOR -->
      @if (activeTab() === 'places') {
        <section class="space-y-6" aria-label="Places Catalog Management">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Registered Accessible Places</h2>
              <p class="text-xs text-slate-500">Edit inaccurate venue data, update physical criteria, or inspect listings.</p>
            </div>

            <div class="flex items-center gap-3">
              <input
                type="search"
                [(ngModel)]="placeSearchQuery"
                placeholder="Filter by name or city..."
                class="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg min-w-[220px]"
              />
            </div>
          </div>

          <!-- Accessible Places Table -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse" role="table">
              <caption class="sr-only">Catalog of Accessible Places</caption>
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th scope="col" class="py-3.5 px-4">Venue Name</th>
                  <th scope="col" class="py-3.5 px-4">Category</th>
                  <th scope="col" class="py-3.5 px-4">City</th>
                  <th scope="col" class="py-3.5 px-4">Key Amenities</th>
                  <th scope="col" class="py-3.5 px-4">Status</th>
                  <th scope="col" class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (place of filteredCatalogPlaces(); track place.id) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="py-3 px-4 font-bold text-slate-900">
                      {{ place.name }}
                      @if (place.isDuplicate) {
                        <span class="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-rose-100 text-rose-800 font-bold">Duplicate</span>
                      }
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded text-[11px] bg-slate-100 font-semibold">{{ place.categoryLabel }}</span>
                    </td>
                    <td class="py-3 px-4">{{ place.address.city }}</td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-1.5 text-[11px]">
                        <span [title]="place.amenities.stepFreeEntrance ? 'Step-Free Entrance' : 'No Step-Free Entrance'">
                          {{ place.amenities.stepFreeEntrance ? '🟢 Step-Free' : '⚪ Stairs' }}
                        </span>
                        <span [title]="place.amenities.ramp.available ? 'Ramp Available' : 'No Ramp'">
                          {{ place.amenities.ramp.available ? '🟢 Ramp' : '⚪ No Ramp' }}
                        </span>
                        <span [title]="place.amenities.elevator.available ? 'Elevator Available' : 'No Elevator'">
                          {{ place.amenities.elevator.available ? '🟢 Lift' : '⚪ No Lift' }}
                        </span>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [class.bg-emerald-100]="place.verifiedStatus === 'staff_verified'"
                        [class.text-emerald-800]="place.verifiedStatus === 'staff_verified'"
                        [class.bg-blue-100]="place.verifiedStatus === 'community_verified'"
                        [class.text-blue-800]="place.verifiedStatus === 'community_verified'"
                        [class.bg-amber-100]="place.verifiedStatus === 'pending_verification'"
                        [class.text-amber-800]="place.verifiedStatus === 'pending_verification'">
                        {{ place.verifiedStatus.replace('_', ' ') }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <button
                        type="button"
                        (click)="openEditPlaceModal(place)"
                        class="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 cursor-pointer"
                      >
                        ✏️ Edit Data
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        </section>
      }

      <!-- TAB 4: DUPLICATE DETECTION & RESOLUTION -->
      @if (activeTab() === 'duplicates') {
        <section class="space-y-6" aria-label="Duplicate Places Detection">
          
          <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-slate-900">Suspected Duplicate Venue Pairs</h2>
                <p class="text-xs text-slate-500">
                  Automated scan detecting duplicate places using geographic proximity (Haversine formula) and name string similarity.
                </p>
              </div>

              <button
                type="button"
                (click)="scanDuplicates()"
                class="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer"
              >
                🔄 Re-scan Catalog
              </button>
            </div>
          </div>

          @if (detectedDuplicates().length === 0) {
            <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
              <span class="text-3xl block">✓</span>
              <h3 class="text-base font-bold text-slate-800">No Duplicate Places Detected</h3>
              <p class="text-xs text-slate-500">All catalogued venues possess distinct geographic coordinates and distinct titles.</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (pair of detectedDuplicates(); track pair.pairId) {
                <article class="bg-white rounded-2xl border-2 border-purple-200 p-6 space-y-4 shadow-xs">
                  
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-xl">⚠️</span>
                      <h3 class="text-base font-bold text-purple-950">Suspected Duplicate Pair</h3>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300">
                        {{ (pair.similarityScore * 100).toFixed(0) }}% Similarity Match
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="resolveDuplicate(pair, 'mark_duplicate')"
                        class="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer"
                      >
                        Merge / Mark as Duplicate
                      </button>
                      <button
                        type="button"
                        (click)="resolveDuplicate(pair, 'dismiss')"
                        class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Dismiss (Keep Separate)
                      </button>
                    </div>
                  </div>

                  <!-- Pair Side by Side comparison -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate A (Primary)</span>
                      <h4 class="text-sm font-black text-slate-900">{{ pair.placeA.name }}</h4>
                      <p class="text-xs text-slate-600">{{ pair.placeA.address.street }}, {{ pair.placeA.address.city }}</p>
                      <p class="text-[11px] text-slate-500">ID: {{ pair.placeA.id }}</p>
                    </div>

                    <div class="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2">
                      <span class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Candidate B (Suspected Duplicate)</span>
                      <h4 class="text-sm font-black text-slate-900">{{ pair.placeB.name }}</h4>
                      <p class="text-xs text-slate-600">{{ pair.placeB.address.street }}, {{ pair.placeB.address.city }}</p>
                      <p class="text-[11px] text-slate-500">ID: {{ pair.placeB.id }}</p>
                    </div>
                  </div>

                  <!-- Detection Evidence -->
                  <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <strong class="text-slate-900">Detection Reasons:</strong>
                    <ul class="list-disc list-inside space-y-0.5 pl-1">
                      @for (reason of pair.reasons; track reason) {
                        <li>{{ reason }}</li>
                      }
                    </ul>
                  </div>

                </article>
              }
            </div>
          }

        </section>
      }

      <!-- TAB 5: ADMINISTRATIVE AUDIT TRAIL -->
      @if (activeTab() === 'audit-trail') {
        <section class="space-y-6" aria-label="Administrative Audit Trail Log">
          
          <div class="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 class="text-xl font-bold text-slate-900">System Audit Trail</h2>
              <p class="text-xs text-slate-500">Immutable record of approvals, rejections, place modifications, and role updates.</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse" role="table">
              <caption class="sr-only">Administrative Audit Trail Logs</caption>
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th scope="col" class="py-3.5 px-4">Timestamp</th>
                  <th scope="col" class="py-3.5 px-4">Action</th>
                  <th scope="col" class="py-3.5 px-4">Target</th>
                  <th scope="col" class="py-3.5 px-4">Moderator</th>
                  <th scope="col" class="py-3.5 px-4">Reason / Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (log of auditLogs(); track log.id) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {{ log.timestamp | date:'short' }}
                    </td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        [class.bg-emerald-100]="log.action === 'REPORT_APPROVED'"
                        [class.text-emerald-800]="log.action === 'REPORT_APPROVED'"
                        [class.bg-rose-100]="log.action === 'REPORT_REJECTED'"
                        [class.text-rose-800]="log.action === 'REPORT_REJECTED'"
                        [class.bg-blue-100]="log.action === 'PLACE_UPDATED' || log.action === 'REPORT_CORRECTION_REQUESTED'"
                        [class.text-blue-800]="log.action === 'PLACE_UPDATED' || log.action === 'REPORT_CORRECTION_REQUESTED'"
                        [class.bg-purple-100]="log.action === 'USER_ROLE_CHANGED' || log.action === 'PLACE_DUPLICATE_RESOLVED'"
                        [class.text-purple-800]="log.action === 'USER_ROLE_CHANGED' || log.action === 'PLACE_DUPLICATE_RESOLVED'">
                        {{ log.action.replace('_', ' ') }}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-bold text-slate-900">{{ log.targetName }}</td>
                    <td class="py-3 px-4">
                      {{ log.performedBy.name }}
                      <span class="text-[10px] text-slate-400 block">{{ log.performedBy.role }}</span>
                    </td>
                    <td class="py-3 px-4 text-slate-600 max-w-md">
                      {{ log.reason || '-' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        </section>
      }

      <!-- TAB 6: USER ROLES MANAGEMENT -->
      @if (activeTab() === 'users' && isAdmin()) {
        <section class="space-y-6" aria-label="User Account Governance">
          
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h2 class="text-xl font-bold text-slate-900">User Role Governance</h2>
            <p class="text-xs text-slate-500">Elevate verified contributors to moderators or manage administrator privileges.</p>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse" role="table">
              <caption class="sr-only">System Users and Roles</caption>
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th scope="col" class="py-3.5 px-4">Name</th>
                  <th scope="col" class="py-3.5 px-4">Email Address</th>
                  <th scope="col" class="py-3.5 px-4">Assigned Role</th>
                  <th scope="col" class="py-3.5 px-4 text-right">Update Permissions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (user of usersList(); track user.id) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="py-3 px-4 font-bold text-slate-900">{{ user.name }}</td>
                    <td class="py-3 px-4 text-slate-600">{{ user.email }}</td>
                    <td class="py-3 px-4">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                        [class.bg-purple-100]="user.role === 'admin'"
                        [class.text-purple-800]="user.role === 'admin'"
                        [class.bg-teal-100]="user.role === 'moderator'"
                        [class.text-teal-800]="user.role === 'moderator'"
                        [class.bg-slate-100]="user.role === 'user'"
                        [class.text-slate-700]="user.role === 'user'">
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <select
                        [value]="user.role"
                        (change)="changeUserRole(user, $event)"
                        class="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        </section>
      }

      <!-- TAB 7: SRI LANKA OPENSTREETMAP DATA INGESTION -->
      @if (activeTab() === 'osm-data' && isAdmin()) {
        <section class="space-y-6" aria-label="Sri Lanka OpenStreetMap Data Ingestion">
          
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[11px] font-bold mb-2">
                Real OpenStreetMap Extract • Step 12
              </div>
              <h2 class="text-xl font-black text-slate-900">Sri Lanka Geographic Data Ingestion</h2>
              <p class="text-xs text-slate-600 max-w-2xl mt-1">
                Import verified Sri Lankan public facilities (hospitals, clinics, universities, schools, railway stations, bus stands, town halls, restrooms, parks) from OpenStreetMap.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                [disabled]="osmImportLoading()"
                (click)="triggerOsmImport(true)"
                class="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <span>Test Dry-Run</span>
              </button>

              <button
                type="button"
                [disabled]="osmImportLoading()"
                (click)="triggerOsmImport(false)"
                class="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2"
              >
                @if (osmImportLoading()) {
                  <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Importing Dataset...</span>
                } @else {
                  <span>Import Public Facilities</span>
                }
              </button>
            </div>
          </div>

          <!-- Crucial Standards & Guidelines Notice -->
          <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
            <div class="flex items-center gap-2 font-bold text-amber-950">
              <span>Important Architectural & Data Integrity Rules</span>
            </div>
            <ul class="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
              <li><strong>Zero Presumed Accessibility:</strong> Locations imported from OpenStreetMap do NOT automatically have verified accessibility. All records default to pending_verification until physically audited.</li>
              <li><strong>Preserve Source Provenance:</strong> Original OSM element IDs (node/123, way/456), raw tags, and ODbL attribution are permanently recorded.</li>
              <li><strong>Non-Destructive Updates:</strong> Community audits, photos, and verified reports are <strong>never overwritten</strong> by re-importing OSM updates.</li>
              <li><strong>Geospatial Structure:</strong> Coordinates are indexed with MongoDB 2dsphere for high-performance proximity queries.</li>
            </ul>
          </div>

          <!-- Latest Import Results Summary Card -->
          @if (osmImportSummary(); as summary) {
            <div class="bg-white rounded-2xl border border-teal-200 p-6 space-y-5 shadow-xs">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="space-y-0.5">
                  <h3 class="text-sm font-black text-slate-900">
                    {{ summary.dryRun ? 'Dry-Run Simulation Summary' : 'Import Execution Summary' }}
                  </h3>
                  <p class="text-[11px] text-slate-500">Batch ID: <code class="font-mono">{{ summary.batchId }}</code> • Source: {{ summary.sourceName }}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  [class.bg-amber-100]="summary.dryRun"
                  [class.text-amber-900]="summary.dryRun"
                  [class.bg-emerald-100]="!summary.dryRun"
                  [class.text-emerald-900]="!summary.dryRun">
                  {{ summary.dryRun ? 'Simulated' : 'Committed' }}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span class="text-xl font-black text-slate-900 block">{{ summary.totalElements }}</span>
                  <span class="text-[11px] text-slate-500 uppercase font-bold">Total Evaluated</span>
                </div>
                <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span class="text-xl font-black text-emerald-800 block">{{ summary.importedCount }}</span>
                  <span class="text-[11px] text-emerald-600 uppercase font-bold">New Places</span>
                </div>
                <div class="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span class="text-xl font-black text-blue-800 block">{{ summary.updatedCount }}</span>
                  <span class="text-[11px] text-blue-600 uppercase font-bold">Updated Places</span>
                </div>
                <div class="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span class="text-xl font-black text-purple-800 block">{{ summary.preservedCommunityCount }}</span>
                  <span class="text-[11px] text-purple-600 uppercase font-bold">Preserved Audits</span>
                </div>
              </div>
            </div>
          }

        </section>
      }

      <!-- MODAL: DECISION CONFIRMATION (APPROVE / REJECT / CORRECTION) -->
      @if (activeDecisionModal()) {
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 class="text-lg font-black text-slate-900">
              @if (decisionStatus() === 'approved') {
                ✓ Approve Accessibility Audit
              } @else if (decisionStatus() === 'needs_review') {
                ℹ Request Audit Corrections
              } @else {
                ✕ Reject Audit Submission
              }
            </h3>

            <p class="text-xs text-slate-600">
              Venue: <strong>{{ activeDecisionModal()?.placeName }}</strong>
            </p>

            <div class="space-y-1.5">
              <label for="decision-reason" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {{ decisionStatus() === 'approved' ? 'Approval Notes (Optional)' : 'Reason / Clarification Instructions *' }}
              </label>
              <textarea
                id="decision-reason"
                [(ngModel)]="decisionReason"
                rows="3"
                [placeholder]="decisionStatus() === 'needs_review' ? 'e.g. Please re-check elevator door width or upload photo of the entrance ramp...' : 'Specify grounds for decision...'"
                class="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600"
              ></textarea>
            </div>

            @if (decisionError()) {
              <div class="p-3 rounded-lg bg-rose-50 text-rose-900 text-xs font-semibold">
                {{ decisionError() }}
              </div>
            }

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                (click)="closeDecisionModal()"
                class="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submitDecision()"
                class="px-5 py-2 rounded-xl font-bold text-xs text-white transition-colors cursor-pointer"
                [class.bg-emerald-700]="decisionStatus() === 'approved'"
                [class.bg-blue-700]="decisionStatus() === 'needs_review'"
                [class.bg-rose-700]="decisionStatus() === 'rejected'"
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: EDIT PLACE DETAILS -->
      @if (editingPlace()) {
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 class="text-lg font-black text-slate-900">✏️ Edit Inaccurate Place Information</h3>
            
            <form (ngSubmit)="savePlaceEdit()" class="space-y-4 text-xs">
              <div>
                <label for="edit-name" class="block font-bold text-slate-700 uppercase mb-1">Venue Name *</label>
                <input
                  id="edit-name"
                  type="text"
                  [(ngModel)]="editPlaceForm.name"
                  name="editPlaceName"
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="edit-street" class="block font-bold text-slate-700 uppercase mb-1">Street Address</label>
                  <input
                    id="edit-street"
                    type="text"
                    [(ngModel)]="editPlaceForm.street"
                    name="editPlaceStreet"
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label for="edit-city" class="block font-bold text-slate-700 uppercase mb-1">City</label>
                  <input
                    id="edit-city"
                    type="text"
                    [(ngModel)]="editPlaceForm.city"
                    name="editPlaceCity"
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <!-- Amenity toggles -->
              <div class="space-y-2 border-t border-slate-100 pt-3">
                <span class="font-bold text-slate-800 uppercase block">Accessibility Features:</span>
                <div class="grid grid-cols-2 gap-2">
                  <label class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <input type="checkbox" [(ngModel)]="editPlaceForm.stepFree" name="editStepFree" class="rounded text-teal-600" />
                    <span>Step-Free Entrance</span>
                  </label>
                  <label class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <input type="checkbox" [(ngModel)]="editPlaceForm.ramp" name="editRamp" class="rounded text-teal-600" />
                    <span>Ramp Available</span>
                  </label>
                  <label class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <input type="checkbox" [(ngModel)]="editPlaceForm.elevator" name="editElevator" class="rounded text-teal-600" />
                    <span>Elevator / Lift</span>
                  </label>
                  <label class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <input type="checkbox" [(ngModel)]="editPlaceForm.toilet" name="editToilet" class="rounded text-teal-600" />
                    <span>Accessible Restroom</span>
                  </label>
                </div>
              </div>

              <div>
                <label for="edit-reason" class="block font-bold text-slate-700 uppercase mb-1">Reason for Administrative Update *</label>
                <input
                  id="edit-reason"
                  type="text"
                  [(ngModel)]="editPlaceForm.reason"
                  name="editReason"
                  placeholder="e.g. Corrected ramp slope based on venue engineering plans"
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  (click)="editingPlace.set(null)"
                  class="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `,
})
export class AdminComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly placeService = inject(PlaceService);
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);

  readonly currentUser = this.authService.currentUser;
  readonly isAdmin = this.authService.isAdmin;
  readonly isModerator = this.authService.isModerator;

  // View state
  activeTab = signal<AdminTab>('overview');
  metrics = signal<AdminOverviewMetrics | null>(null);
  recentLogs = signal<AuditLogItem[]>([]);
  auditLogs = signal<AuditLogItem[]>([]);
  usersList = signal<AdminUserItem[]>([]);
  detectedDuplicates = signal<DuplicatePlacePair[]>([]);
  reportsLoading = signal<boolean>(false);
  osmImportLoading = signal<boolean>(false);
  osmImportSummary = signal<any | null>(null);
  actionNotification = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Moderation state
  readonly allReports = this.reportService.allReports;
  readonly adminFilter = this.reportService.adminFilter;
  readonly pendingCount = this.reportService.pendingCount;
  readonly approvedCount = this.reportService.approvedCount;
  readonly obstacleCount = this.reportService.obstacleCount;
  readonly allPlaces = this.placeService.allPlaces;

  filterOnlyCorrections = false;
  reportSearchQuery = '';
  displayedReports = signal<AccessibilityReport[]>([]);

  // Decision Modal State
  activeDecisionModal = signal<AccessibilityReport | null>(null);
  decisionStatus = signal<ModerationStatus>('approved');
  decisionReason = '';
  decisionError = signal<string | null>(null);

  // Places Search & Edit State
  placeSearchQuery = '';
  editingPlace = signal<Place | null>(null);
  editPlaceForm = {
    name: '',
    street: '',
    city: '',
    stepFree: false,
    ramp: false,
    elevator: false,
    toilet: false,
    reason: '',
  };

  ngOnInit(): void {
    this.loadOverview();
    this.reloadAdminReports();
    this.scanDuplicates();
    this.loadAuditLogs();
    if (this.isAdmin()) {
      this.loadUsers();
    }
  }

  setActiveTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    if (tab === 'duplicates') {
      this.scanDuplicates();
    } else if (tab === 'audit-trail') {
      this.loadAuditLogs();
    } else if (tab === 'users') {
      this.loadUsers();
    } else if (tab === 'overview') {
      this.loadOverview();
    }
  }

  loadOverview(): void {
    this.adminService.getOverview().subscribe({
      next: (res) => {
        this.metrics.set(res.metrics);
        this.recentLogs.set(res.recentActivity);
      },
    });
  }

  loadAuditLogs(): void {
    this.adminService.getAuditLogs({ page: 1, limit: 25 }).subscribe({
      next: (res) => {
        this.auditLogs.set(res.logs);
      },
    });
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.usersList.set(res.users);
      },
    });
  }

  scanDuplicates(): void {
    this.adminService.detectDuplicates().subscribe({
      next: (res) => {
        this.detectedDuplicates.set(res.duplicates);
      },
    });
  }

  setFilter(status: ModerationStatus | 'all'): void {
    this.reportService.adminFilter.set(status);
    this.reloadAdminReports();
  }

  filterModeration(filterType: 'pending' | 'user_corrections'): void {
    this.activeTab.set('moderation');
    if (filterType === 'pending') {
      this.filterOnlyCorrections = false;
      this.setFilter('pending');
    } else if (filterType === 'user_corrections') {
      this.filterOnlyCorrections = true;
      this.reloadAdminReports();
    }
  }

  onReportSearch(): void {
    this.reloadAdminReports();
  }

  reloadAdminReports(): void {
    this.reportsLoading.set(true);
    this.reportService
      .fetchAdminReports({
        status: this.adminFilter(),
        isCorrection: this.filterOnlyCorrections ? true : undefined,
        search: this.reportSearchQuery.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.displayedReports.set(res.reports);
          this.reportsLoading.set(false);
        },
        error: () => {
          this.reportsLoading.set(false);
        },
      });
  }

  isReporterOf(report: AccessibilityReport): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return (report as any).submittedBy?.userId === user.id;
  }

  openDecisionModal(report: AccessibilityReport, status: ModerationStatus): void {
    this.activeDecisionModal.set(report);
    this.decisionStatus.set(status);
    this.decisionReason = '';
    this.decisionError.set(null);
  }

  closeDecisionModal(): void {
    this.activeDecisionModal.set(null);
    this.decisionReason = '';
    this.decisionError.set(null);
  }

  submitDecision(): void {
    const report = this.activeDecisionModal();
    const status = this.decisionStatus();
    if (!report) return;

    if ((status === 'rejected' || status === 'needs_review') && !this.decisionReason.trim()) {
      this.decisionError.set('A specific reason or instruction is required for this decision.');
      return;
    }

    this.reportService.updateModerationStatus(report.id, status, this.decisionReason.trim()).subscribe({
      next: () => {
        this.actionNotification.set({
          message: `Audit status successfully changed to "${status}"`,
          type: 'success',
        });
        this.closeDecisionModal();
        this.reloadAdminReports();
        this.loadOverview();
      },
      error: (err: any) => {
        this.decisionError.set(err.error?.message || 'Failed to update report status.');
      },
    });
  }

  // Places Directory Filtering
  filteredCatalogPlaces(): Place[] {
    const list = this.allPlaces();
    const query = this.placeSearchQuery.toLowerCase().trim();
    if (!query) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address.city.toLowerCase().includes(query) ||
        p.categoryLabel.toLowerCase().includes(query)
    );
  }

  openEditPlaceModal(place: Place): void {
    this.editingPlace.set(place);
    this.editPlaceForm = {
      name: place.name,
      street: place.address.street,
      city: place.address.city,
      stepFree: place.amenities.stepFreeEntrance,
      ramp: place.amenities.ramp.available,
      elevator: place.amenities.elevator.available,
      toilet: place.amenities.accessibleRestroom.available,
      reason: '',
    };
  }

  savePlaceEdit(): void {
    const place = this.editingPlace();
    if (!place) return;

    if (!this.editPlaceForm.reason.trim()) {
      alert('A reason is required to modify venue data for audit trail compliance.');
      return;
    }

    const updates: Partial<Place> = {
      name: this.editPlaceForm.name,
      address: {
        ...place.address,
        street: this.editPlaceForm.street,
        city: this.editPlaceForm.city,
      },
      amenities: {
        ...place.amenities,
        stepFreeEntrance: this.editPlaceForm.stepFree,
        ramp: { ...place.amenities.ramp, available: this.editPlaceForm.ramp },
        elevator: { ...place.amenities.elevator, available: this.editPlaceForm.elevator },
        accessibleRestroom: { ...place.amenities.accessibleRestroom, available: this.editPlaceForm.toilet },
      },
    };

    this.placeService.updatePlace(place.id, updates, this.editPlaceForm.reason).subscribe({
      next: () => {
        this.actionNotification.set({
          message: `Venue "${place.name}" updated successfully and logged in audit trail.`,
          type: 'success',
        });
        this.editingPlace.set(null);
        this.loadOverview();
      },
    });
  }

  resolveDuplicate(pair: DuplicatePlacePair, action: 'mark_duplicate' | 'dismiss'): void {
    const confirmed = confirm(
      action === 'mark_duplicate'
        ? `Merge "${pair.placeB.name}" as duplicate of "${pair.placeA.name}"?`
        : `Dismiss duplicate alert between these two places?`
    );
    if (!confirmed) return;

    this.adminService
      .resolveDuplicate(pair.placeA.id, pair.placeB.id, action, `Admin resolved duplicate pair (${action})`)
      .subscribe({
        next: () => {
          this.actionNotification.set({
            message: `Duplicate pair resolved (${action}) and audit logged.`,
            type: 'success',
          });
          this.scanDuplicates();
          this.loadOverview();
        },
      });
  }

  triggerOsmImport(dryRun = false): void {
    this.osmImportLoading.set(true);
    this.adminService.importOsmData({ sample: true, dryRun }).subscribe({
      next: (res) => {
        this.osmImportLoading.set(false);
        this.osmImportSummary.set(res.summary);
        this.actionNotification.set({
          message: res.message || 'OSM Data import executed successfully',
          type: 'success',
        });
        if (!dryRun) {
          this.loadOverview();
          this.placeService.refreshPlaces();
        }
      },
      error: (err) => {
        this.osmImportLoading.set(false);
        this.actionNotification.set({
          message: err?.error?.message || 'Failed to execute OSM data import',
          type: 'error',
        });
      },
    });
  }

  changeUserRole(user: AdminUserItem, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as 'user' | 'moderator' | 'admin';
    if (newRole === user.role) return;

    const confirmed = confirm(`Change ${user.name}'s role from ${user.role} to ${newRole}?`);
    if (!confirmed) {
      select.value = user.role;
      return;
    }

    this.adminService
      .updateUserRole(user.id, newRole, `Administrator updated user role from ${user.role} to ${newRole}`)
      .subscribe({
        next: () => {
          this.actionNotification.set({
            message: `User ${user.name} role changed to ${newRole}.`,
            type: 'success',
          });
          this.loadUsers();
          this.loadOverview();
        },
      });
  }
}
