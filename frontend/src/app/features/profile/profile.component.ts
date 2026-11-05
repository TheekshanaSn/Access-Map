import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PlaceService } from '../../core/services/place.service';
import { DeviceLocationService } from '../../core/services/device-location.service';
import { DeviceStorageService } from '../../core/services/device-storage.service';
import { DeviceNetworkService } from '../../core/services/device-network.service';
import { DeviceHapticsService } from '../../core/services/device-haptics.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-8rem)] bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-5">
      
      <!-- Top Screen Header -->
      <div class="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>👤</span>
            <span>Mobile User Profile</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Account settings, location permissions & offline cache
          </p>
        </div>
        <span class="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
          {{ isNative() ? 'Android App' : 'Mobile Web' }}
        </span>
      </div>

      <!-- User Account Card -->
      @if (authService.currentUser(); as user) {
        <section class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4" aria-labelledby="account-card-title">
          <div class="flex items-center gap-3.5">
            <div class="w-13 h-13 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <h2 id="account-card-title" class="text-base font-black text-slate-900 truncate">
                {{ user.name }}
              </h2>
              <p class="text-xs text-slate-500 truncate">{{ user.email }}</p>
              <div class="mt-1 flex items-center gap-1.5">
                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  {{ user.role }}
                </span>
                <span class="text-[10px] text-slate-400">Verified Member</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            @if (authService.isModerator()) {
              <a
                routerLink="/admin"
                class="min-h-[48px] px-4 py-2 text-xs font-bold bg-slate-900 text-teal-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🛡️</span>
                <span>Moderation Dashboard</span>
              </a>
            }

            <button
              type="button"
              (click)="onSignOut()"
              class="min-h-[48px] px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer ml-auto flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </section>
      } @else {
        <!-- Guest Welcome Card -->
        <section class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5 text-center" aria-labelledby="guest-card-title">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center text-2xl" aria-hidden="true">
            ♿
          </div>
          <div>
            <h2 id="guest-card-title" class="text-base font-bold text-slate-900">
              Welcome to AccessMap
            </h2>
            <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Sign in to submit accessibility audits, upload photo evidence, and contribute to step-free navigation.
            </p>
          </div>
          <div class="flex items-center justify-center gap-2.5 pt-2">
            <a
              routerLink="/login"
              class="min-h-[48px] px-5 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              Sign In
            </a>
            <a
              routerLink="/register"
              class="min-h-[48px] px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            >
              Create Account
            </a>
          </div>
        </section>
      }

      <!-- Offline Data & Caching Section (Requirement 7) -->
      <section class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3" aria-labelledby="offline-card-title">
        <div class="flex items-start justify-between">
          <div>
            <h2 id="offline-card-title" class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>💾</span>
              <span>Offline Navigation & Place Cache</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Download physical accessibility surveys so they remain usable without internet.
            </p>
          </div>
          <span
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            [class.bg-emerald-100]="cachedCount() > 0"
            [class.text-emerald-800]="cachedCount() > 0"
            [class.bg-slate-100]="cachedCount() === 0"
            [class.text-slate-600]="cachedCount() === 0"
          >
            {{ cachedCount() }} Cached
          </span>
        </div>

        @if (lastSyncedTime(); as syncTime) {
          <p class="text-[11px] text-slate-500">
            Last synchronized: <strong class="text-slate-700">{{ syncTime }}</strong>
          </p>
        }

        @if (cacheNotice(); as notice) {
          <div class="p-2.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs flex items-center gap-2">
            <span>✓</span>
            <span>{{ notice }}</span>
          </div>
        }

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            (click)="syncPlacesOffline()"
            [disabled]="isSyncing()"
            class="min-h-[48px] px-3 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            @if (isSyncing()) {
              <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Syncing...</span>
            } @else {
              <span>📥</span>
              <span>Download Offline Data</span>
            }
          </button>

          <button
            type="button"
            (click)="clearOfflineCache()"
            [disabled]="cachedCount() === 0"
            class="min-h-[48px] px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>🗑️</span>
            <span>Clear Local Cache</span>
          </button>
        </div>
      </section>

      <!-- Location Permissions & Privacy Section (Requirement 4) -->
      <section class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3" aria-labelledby="location-card-title">
        <div class="flex items-start justify-between">
          <div>
            <h2 id="location-card-title" class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>📍</span>
              <span>GPS Location & Privacy Policy</span>
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Controls for device GPS and physical location access.
            </p>
          </div>
          <span
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            [class.bg-emerald-100]="locationService.permissionState().status === 'granted'"
            [class.text-emerald-800]="locationService.permissionState().status === 'granted'"
            [class.bg-amber-100]="locationService.permissionState().status !== 'granted'"
            [class.text-amber-800]="locationService.permissionState().status !== 'granted'"
          >
            Permission: {{ locationService.permissionState().status | uppercase }}
          </span>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
          <strong class="text-slate-800 block">Why AccessMap requests your location:</strong>
          <p>{{ locationService.permissionRationale }}</p>
        </div>

        @if (locationTestResult(); as testRes) {
          <div
            class="p-2.5 rounded-xl border text-xs flex items-start gap-2"
            [class.bg-emerald-50]="testRes.success"
            [class.border-emerald-200]="testRes.success"
            [class.text-emerald-900]="testRes.success"
            [class.bg-rose-50]="!testRes.success"
            [class.border-rose-200]="!testRes.success"
            [class.text-rose-900]="!testRes.success"
          >
            <span>{{ testRes.success ? '📍' : '⚠️' }}</span>
            <div>
              @if (testRes.success) {
                <strong class="block">Location Acquired Successfully:</strong>
                <span>Lat: {{ testRes.coords?.latitude?.toFixed(4) }}, Lng: {{ testRes.coords?.longitude?.toFixed(4) }}</span>
              } @else {
                <strong class="block">Location Request Failed:</strong>
                <span>{{ testRes.error }}</span>
              }
            </div>
          </div>
        }

        <button
          type="button"
          (click)="testLocationAccess()"
          [disabled]="locationService.isLocating()"
          class="w-full min-h-[48px] px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          @if (locationService.isLocating()) {
            <span class="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
            <span>Requesting Device Position...</span>
          } @else {
            <span>🎯</span>
            <span>Request Location with Rationale</span>
          }
        </button>
      </section>

      <!-- App Environment & Hardware Feedback -->
      <section class="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
        <h2 class="font-bold text-slate-900 flex items-center gap-1.5">
          <span>⚙️</span>
          <span>Device & Platform Diagnostics</span>
        </h2>
        <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div>
            <span class="text-slate-400 block">Runtime Environment:</span>
            <strong class="text-slate-800">{{ isNative() ? 'Capacitor Android (Native)' : 'Web Browser' }}</strong>
          </div>
          <div>
            <span class="text-slate-400 block">Network Connectivity:</span>
            <strong class="text-slate-800">{{ networkService.isOnline() ? 'Connected' : 'Offline' }} ({{ networkService.connectionType() }})</strong>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px]">Test Haptic Feedback:</span>
          <button
            type="button"
            (click)="testHaptic()"
            class="min-h-[44px] px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg cursor-pointer"
          >
            Vibrate / Tap
          </button>
        </div>
      </section>

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
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly placeService = inject(PlaceService);
  readonly locationService = inject(DeviceLocationService);
  private readonly storageService = inject(DeviceStorageService);
  readonly networkService = inject(DeviceNetworkService);
  private readonly haptics = inject(DeviceHapticsService);
  private readonly router = inject(Router);

  readonly cachedCount = signal<number>(0);
  readonly lastSyncedTime = signal<string | null>(null);
  readonly isSyncing = signal<boolean>(false);
  readonly cacheNotice = signal<string | null>(null);
  readonly locationTestResult = signal<{ success: boolean; coords?: any; error?: string } | null>(null);

  ngOnInit(): void {
    this.refreshCacheStats();
  }

  isNative(): boolean {
    return this.locationService.isNativePlatform();
  }

  async refreshCacheStats(): Promise<void> {
    const cached = await this.storageService.getCachedPlaces();
    this.cachedCount.set(cached?.length ?? 0);
    const ts = await this.storageService.getLastCacheTimestamp();
    if (ts) {
      this.lastSyncedTime.set(new Date(ts).toLocaleString());
    }
  }

  async syncPlacesOffline(): Promise<void> {
    this.isSyncing.set(true);
    this.cacheNotice.set(null);
    const places = this.placeService.allPlaces();
    await this.storageService.cachePlaces(places);
    await this.refreshCacheStats();
    this.isSyncing.set(false);
    this.haptics.notification('success');
    this.cacheNotice.set(`Successfully saved ${places.length} places for offline use!`);
    setTimeout(() => this.cacheNotice.set(null), 4000);
  }

  async clearOfflineCache(): Promise<void> {
    await this.storageService.remove('accessmap_offline_places');
    await this.storageService.remove('accessmap_cache_timestamp');
    await this.refreshCacheStats();
    this.haptics.notification('warning');
    this.cacheNotice.set('Offline place cache cleared.');
    setTimeout(() => this.cacheNotice.set(null), 3000);
  }

  async testLocationAccess(): Promise<void> {
    this.locationTestResult.set(null);
    const granted = await this.locationService.requestPermissionWithRationale();
    if (!granted) {
      this.locationTestResult.set({
        success: false,
        error: 'Location permission was denied by the user.',
      });
      this.haptics.notification('error');
      return;
    }

    const res = await this.locationService.getCurrentPosition();
    this.locationTestResult.set(res);
    if (res.success) {
      this.haptics.notification('success');
    } else {
      this.haptics.notification('error');
    }
  }

  testHaptic(): void {
    this.haptics.impact('medium');
  }

  onSignOut(): void {
    this.authService.logout().subscribe(() => {
      this.haptics.notification('warning');
      this.router.navigate(['/']);
    });
  }
}

