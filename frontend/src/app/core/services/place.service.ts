import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { Place, PlaceFilterCriteria } from '../models/place.model';
import { MOCK_PLACES } from '../data/mock-places';
import { DeviceStorageService } from './device-storage.service';
import { DeviceNetworkService } from './device-network.service';

@Injectable({
  providedIn: 'root',
})
export class PlaceService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(DeviceStorageService);
  private readonly networkService = inject(DeviceNetworkService);

  // Master places signal initialized with realistic demo data
  private readonly placesState = signal<Place[]>(MOCK_PLACES);

  // Loading and error states for responsive feedback
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isOfflineData = signal<boolean>(false);

  constructor() {
    this.hydrateFromCache();
  }

  private async hydrateFromCache(): Promise<void> {
    const cached = await this.storageService.getCachedPlaces();
    if (cached && cached.length > 0) {
      this.placesState.set(cached);
    } else {
      await this.storageService.cachePlaces(MOCK_PLACES);
    }
  }

  // Active filter criteria signal
  readonly filterCriteria = signal<PlaceFilterCriteria>({
    searchQuery: '',
    category: 'all',
    mustHaveStepFree: false,
    mustHaveRamp: false,
    mustHaveElevator: false,
    mustHaveRestroom: false,
    mustHaveParking: false,
  });

  // Public readonly access to places
  readonly allPlaces = this.placesState.asReadonly();

  // Computed signal for filtered places
  readonly filteredPlaces = computed(() => {
    const list = this.placesState();
    const { searchQuery, category, mustHaveStepFree, mustHaveRamp, mustHaveElevator, mustHaveRestroom, mustHaveParking } = this.filterCriteria();

    return list.filter((place) => {
      // Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = place.name.toLowerCase().includes(query);
        const matchesCategory = place.categoryLabel.toLowerCase().includes(query);
        const matchesAddress = `${place.address.street} ${place.address.city} ${place.address.landmark || ''}`.toLowerCase().includes(query);
        const matchesDesc = place.shortDescription.toLowerCase().includes(query);
        if (!matchesName && !matchesCategory && !matchesAddress && !matchesDesc) {
          return false;
        }
      }

      // Category filter
      if (category !== 'all' && place.category !== category) {
        return false;
      }

      // Accessibility criteria filters
      if (mustHaveStepFree && !place.amenities.stepFreeEntrance) {
        return false;
      }
      if (mustHaveRamp && !place.amenities.ramp.available) {
        return false;
      }
      if (mustHaveElevator && (!place.amenities.elevator.available || place.amenities.elevator.workingStatus !== 'operational')) {
        return false;
      }
      if (mustHaveRestroom && !place.amenities.accessibleRestroom.available) {
        return false;
      }
      if (mustHaveParking && !place.amenities.disabledParking.available) {
        return false;
      }

      return true;
    });
  });

  // Computed count of active filters (excluding query)
  readonly activeFilterCount = computed(() => {
    const f = this.filterCriteria();
    let count = 0;
    if (f.category !== 'all') count++;
    if (f.mustHaveStepFree) count++;
    if (f.mustHaveRamp) count++;
    if (f.mustHaveElevator) count++;
    if (f.mustHaveRestroom) count++;
    if (f.mustHaveParking) count++;
    return count;
  });

  getPlaceById(id: string): Place | undefined {
    return this.placesState().find((p) => p.id === id);
  }

  setSearchQuery(query: string): void {
    this.filterCriteria.update((prev) => ({ ...prev, searchQuery: query }));
  }

  setCategory(category: string): void {
    this.filterCriteria.update((prev) => ({ ...prev, category }));
  }

  toggleStepFree(): void {
    this.filterCriteria.update((prev) => ({ ...prev, mustHaveStepFree: !prev.mustHaveStepFree }));
  }

  toggleRamp(): void {
    this.filterCriteria.update((prev) => ({ ...prev, mustHaveRamp: !prev.mustHaveRamp }));
  }

  toggleElevator(): void {
    this.filterCriteria.update((prev) => ({ ...prev, mustHaveElevator: !prev.mustHaveElevator }));
  }

  toggleRestroom(): void {
    this.filterCriteria.update((prev) => ({ ...prev, mustHaveRestroom: !prev.mustHaveRestroom }));
  }

  toggleParking(): void {
    this.filterCriteria.update((prev) => ({ ...prev, mustHaveParking: !prev.mustHaveParking }));
  }

  resetFilters(): void {
    this.filterCriteria.set({
      searchQuery: '',
      category: 'all',
      mustHaveStepFree: false,
      mustHaveRamp: false,
      mustHaveElevator: false,
      mustHaveRestroom: false,
      mustHaveParking: false,
    });
  }

  // Simulated refresh with user-visible loading state
  refreshPlaces(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 400);
  }

  /**
   * Update place details with audit trail support
   */
  updatePlace(id: string, updates: Partial<Place>, reason?: string): Observable<any> {
    return this.http
      .put<{ message: string; place: Place }>(`/api/places/${id}`, { ...updates, reason })
      .pipe(
        catchError((err) => {
          console.warn('API place update failed, falling back to local signal update:', err);
          return of({ message: 'Updated locally', place: updates as Place });
        }),
        tap(() => {
          this.placesState.update((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
          );
        })
      );
  }
}

