import { Injectable } from '@angular/core';
import { Place } from '../models/place.model';

const CACHED_PLACES_KEY = 'accessmap_offline_places';
const CACHE_TIMESTAMP_KEY = 'accessmap_cache_timestamp';

@Injectable({
  providedIn: 'root',
})
export class DeviceStorageService {
  private readonly memoryStore = new Map<string, string>();

  /**
   * Save a string value in native Preferences, window.localStorage, or memory fallback
   */
  async set(key: string, value: string): Promise<void> {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Preferences) {
        await cap.Plugins.Preferences.set({ key, value });
        return;
      }
    } catch {
      // Fallback below
    }

    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Storage restricted / disabled
    }

    this.memoryStore.set(key, value);
  }

  /**
   * Retrieve a string value from native Preferences, window.localStorage, or memory fallback
   */
  async get(key: string): Promise<string | null> {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Preferences) {
        const res = await cap.Plugins.Preferences.get({ key });
        return res?.value ?? null;
      }
    } catch {
      // Fallback below
    }

    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        return localStorage.getItem(key);
      }
    } catch {
      // Storage restricted / disabled
    }

    return this.memoryStore.get(key) ?? null;
  }

  /**
   * Remove a key
   */
  async remove(key: string): Promise<void> {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Preferences) {
        await cap.Plugins.Preferences.remove({ key });
        return;
      }
    } catch {
      // Fallback below
    }

    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
        localStorage.removeItem(key);
        return;
      }
    } catch {
      // Storage restricted / disabled
    }

    this.memoryStore.delete(key);
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Preferences) {
        await cap.Plugins.Preferences.clear();
        return;
      }
    } catch {
      // Fallback below
    }

    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
        localStorage.clear();
        return;
      }
    } catch {
      // Storage restricted / disabled
    }

    this.memoryStore.clear();
  }

  // --- Offline Places Caching Methods ---

  /**
   * Cache places catalog for offline navigation and inspection
   */
  async cachePlaces(places: Place[]): Promise<void> {
    const serialized = JSON.stringify(places);
    await this.set(CACHED_PLACES_KEY, serialized);
    await this.set(CACHE_TIMESTAMP_KEY, Date.now().toString());
  }

  /**
   * Retrieve cached places when device is disconnected
   */
  async getCachedPlaces(): Promise<Place[] | null> {
    const data = await this.get(CACHED_PLACES_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as Place[];
    } catch {
      return null;
    }
  }

  /**
   * Get timestamp of last cached places snapshot
   */
  async getLastCacheTimestamp(): Promise<number | null> {
    const raw = await this.get(CACHE_TIMESTAMP_KEY);
    if (!raw) return null;
    const num = parseInt(raw, 10);
    return isNaN(num) ? null : num;
  }
}
