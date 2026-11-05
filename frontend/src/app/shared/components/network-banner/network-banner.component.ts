import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceNetworkService } from '../../../core/services/device-network.service';

@Component({
  selector: 'app-network-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Offline Alert Banner -->
    @if (!networkService.isOnline()) {
      <div
        class="bg-rose-700 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md z-50 sticky top-0"
        role="alert"
        aria-live="assertive"
      >
        <div class="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <span class="text-base select-none" aria-hidden="true">📡</span>
          <div class="flex-1">
            <strong class="font-bold">Offline Mode:</strong>
            <span class="ml-1 opacity-95">
              {{ networkService.staleDataMessage() || 'You are disconnected from the internet. Viewing cached venue data.' }}
            </span>
          </div>
        </div>
      </div>
    } @else if (networkService.isSlowConnection()) {
      <!-- Slow Connection Warning -->
      <div
        class="bg-amber-600 text-white px-4 py-1.5 text-xs flex items-center justify-between shadow-xs z-50 sticky top-0"
        role="status"
        aria-live="polite"
      >
        <div class="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <span class="select-none" aria-hidden="true">🐢</span>
          <span>Slow network connection detected. Map tiles and route planning may take longer to load.</span>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class NetworkBannerComponent {
  readonly networkService = inject(DeviceNetworkService);
}

