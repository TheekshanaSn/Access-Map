import { Injectable, signal } from '@angular/core';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
}

export interface LocationPermissionState {
  status: 'prompt' | 'granted' | 'denied';
  explanationNeeded: boolean;
}

export interface LocationResult {
  success: boolean;
  coords?: LocationCoordinates;
  error?: string;
  code?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

@Injectable({
  providedIn: 'root',
})
export class DeviceLocationService {
  readonly isLocating = signal<boolean>(false);
  readonly lastKnownLocation = signal<LocationCoordinates | null>(null);
  readonly permissionState = signal<LocationPermissionState>({
    status: 'prompt',
    explanationNeeded: true,
  });

  // Accessible permission rationale explaining WHY location is needed
  readonly permissionRationale =
    'AccessMap uses your device location exclusively to display step-free routes, accessible ramps, and elevators around you. Your location is never logged, tracked, or shared.';

  /**
   * Check if running inside a native Capacitor shell (Android / iOS)
   */
  isNativePlatform(): boolean {
    if (typeof window === 'undefined') return false;
    const cap = (window as any).Capacitor;
    return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  }

  /**
   * Check current location permissions from Capacitor or Web API
   */
  async checkPermission(): Promise<'prompt' | 'granted' | 'denied'> {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Geolocation) {
        const perm = await cap.Plugins.Geolocation.checkPermissions();
        const loc = perm?.location;
        const mapped = loc === 'granted' ? 'granted' : loc === 'denied' ? 'denied' : 'prompt';
        this.permissionState.set({ status: mapped, explanationNeeded: mapped !== 'granted' });
        return mapped;
      }

      if (typeof navigator !== 'undefined' && navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        const mapped = perm.state as 'prompt' | 'granted' | 'denied';
        this.permissionState.set({ status: mapped, explanationNeeded: mapped !== 'granted' });
        return mapped;
      }
    } catch {
      // Permission API not supported, default to prompt
    }

    return 'prompt';
  }

  /**
   * Request device location with prior explicit permission rationale.
   * Fulfills Requirement 4: Request location permissions only when needed and explain why.
   */
  async requestPermissionWithRationale(): Promise<boolean> {
    const current = await this.checkPermission();
    if (current === 'granted') {
      return true;
    }

    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Geolocation) {
        const res = await cap.Plugins.Geolocation.requestPermissions();
        const granted = res?.location === 'granted';
        this.permissionState.set({
          status: granted ? 'granted' : 'denied',
          explanationNeeded: !granted,
        });
        return granted;
      }
    } catch {
      // Fallback to web browser trigger on next getCurrentPosition
    }

    return true;
  }

  /**
   * Acquire current device position with graceful timeout and error mapping
   */
  async getCurrentPosition(options?: PositionOptions): Promise<LocationResult> {
    this.isLocating.set(true);

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options,
    };

    try {
      // 1. Try Native Capacitor Geolocation Plugin if on native platform
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Geolocation) {
        const pos = await cap.Plugins.Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });

        const coords: LocationCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
        };

        this.lastKnownLocation.set(coords);
        this.isLocating.set(false);
        return { success: true, coords };
      }

      // 2. Progressive Web Geolocation API fallback
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        this.isLocating.set(false);
        return {
          success: false,
          error: 'Geolocation is not supported by your device or browser.',
          code: 'POSITION_UNAVAILABLE',
        };
      }

      return await new Promise<LocationResult>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords: LocationCoordinates = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              speed: pos.coords.speed,
            };
            this.lastKnownLocation.set(coords);
            this.isLocating.set(false);
            resolve({ success: true, coords });
          },
          (err) => {
            this.isLocating.set(false);
            let code: LocationResult['code'] = 'UNKNOWN';
            let msg = 'Could not acquire device location.';

            switch (err.code) {
              case err.PERMISSION_DENIED:
                code = 'PERMISSION_DENIED';
                msg =
                  'Location permission was denied. You can still search and navigate places manually on the map.';
                this.permissionState.set({ status: 'denied', explanationNeeded: true });
                break;
              case err.POSITION_UNAVAILABLE:
                code = 'POSITION_UNAVAILABLE';
                msg = 'GPS signal or network location is unavailable. Check your device GPS settings.';
                break;
              case err.TIMEOUT:
                code = 'TIMEOUT';
                msg = 'Location request timed out. Please check your signal and try again.';
                break;
            }

            resolve({ success: false, error: msg, code });
          },
          defaultOptions
        );
      });
    } catch (err: any) {
      this.isLocating.set(false);
      return {
        success: false,
        error: err?.message || 'Unexpected location error',
        code: 'UNKNOWN',
      };
    }
  }
}

