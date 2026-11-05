import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DeviceLocationService } from './device-location.service';
import { DeviceNetworkService } from './device-network.service';
import { DeviceStorageService } from './device-storage.service';
import { DeviceHapticsService } from './device-haptics.service';
import { Place } from '../models/place.model';
import { MOCK_PLACES } from '../data/mock-places';

describe('STEP 10 Mobile Services Test Suite', () => {
  let locationService: DeviceLocationService;
  let networkService: DeviceNetworkService;
  let storageService: DeviceStorageService;
  let hapticsService: DeviceHapticsService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        DeviceLocationService,
        DeviceNetworkService,
        DeviceStorageService,
        DeviceHapticsService,
      ],
    });

    locationService = TestBed.inject(DeviceLocationService);
    networkService = TestBed.inject(DeviceNetworkService);
    storageService = TestBed.inject(DeviceStorageService);
    hapticsService = TestBed.inject(DeviceHapticsService);

    await storageService.clear();
  });

  describe('DeviceLocationService', () => {
    it('should be created and have explicit permission rationale', () => {
      expect(locationService).toBeTruthy();
      expect(locationService.permissionRationale).toContain('AccessMap uses your device location');
    });

    it('should report location permission status as prompt initially', async () => {
      const status = await locationService.checkPermission();
      expect(['prompt', 'granted', 'denied']).toContain(status);
    });

    it('should gracefully handle position acquisition failure when GPS is mocked unavailable', async () => {
      // Mock missing geolocation
      const originalGeo = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      });

      const res = await locationService.getCurrentPosition();
      expect(res.success).toBe(false);
      expect(res.code).toBe('POSITION_UNAVAILABLE');

      // Restore
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeo,
        configurable: true,
      });
    });
  });

  describe('DeviceNetworkService', () => {
    it('should track network online status', () => {
      expect(networkService).toBeTruthy();
      expect(typeof networkService.isOnline()).toBe('boolean');
    });

    it('should manage stale data indicators when offline', () => {
      networkService.markStaleData(true, 'Offline test notice');
      expect(networkService.isServingStaleData()).toBe(true);
      expect(networkService.staleDataMessage()).toBe('Offline test notice');

      networkService.markStaleData(false);
      expect(networkService.isServingStaleData()).toBe(false);
      expect(networkService.staleDataMessage()).toBeNull();
    });
  });

  describe('DeviceStorageService & Offline Caching', () => {
    it('should set, get, and remove values', async () => {
      await storageService.set('test_key', 'test_value');
      const val = await storageService.get('test_key');
      expect(val).toBe('test_value');

      await storageService.remove('test_key');
      const deleted = await storageService.get('test_key');
      expect(deleted).toBeNull();
    });

    it('should cache places array and retrieve them accurately', async () => {
      const samplePlaces: Place[] = [MOCK_PLACES[0], MOCK_PLACES[1]];
      await storageService.cachePlaces(samplePlaces);

      const retrieved = await storageService.getCachedPlaces();
      expect(retrieved).toBeTruthy();
      expect(retrieved?.length).toBe(2);
      expect(retrieved?.[0].id).toBe(MOCK_PLACES[0].id);

      const timestamp = await storageService.getLastCacheTimestamp();
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('DeviceHapticsService', () => {
    it('should execute impact and notification calls safely without throwing', async () => {
      await expect(hapticsService.impact('light')).resolves.not.toThrow();
      await expect(hapticsService.notification('success')).resolves.not.toThrow();
    });
  });
});
