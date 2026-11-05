import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DeviceHapticsService } from '../../../core/services/device-haptics.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mobile-tab-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Bottom Navigation Bar: visible on mobile viewports (md:hidden) -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Bottom Navigation"
      role="navigation"
    >
      <div class="max-w-md mx-auto grid grid-cols-5 gap-1">
        
        <!-- Tab 1: Explore Map -->
        <a
          routerLink="/explore-map"
          routerLinkActive="text-teal-700 font-bold"
          (click)="onTabClick()"
          class="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-xl text-slate-500 hover:text-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 active:scale-95 cursor-pointer"
          aria-label="Map: Interactive accessibility map"
        >
          <span class="text-xl leading-none select-none" aria-hidden="true">🗺️</span>
          <span class="text-[10px] mt-1 tracking-tight">Map</span>
        </a>

        <!-- Tab 2: Places Directory -->
        <a
          routerLink="/places"
          routerLinkActive="text-teal-700 font-bold"
          (click)="onTabClick()"
          class="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-xl text-slate-500 hover:text-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 active:scale-95 cursor-pointer"
          aria-label="Places: Accessible places directory"
        >
          <span class="text-xl leading-none select-none" aria-hidden="true">🏢</span>
          <span class="text-[10px] mt-1 tracking-tight">Places</span>
        </a>

        <!-- Tab 3: Submit Audit (Highlighted Center Action) -->
        <a
          routerLink="/submit-report"
          routerLinkActive="bg-teal-800 text-white shadow-md ring-2 ring-teal-500"
          (click)="onTabClick()"
          class="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-2xl bg-teal-700 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 active:scale-95 cursor-pointer -mt-2.5 py-1"
          aria-label="Add Audit: Submit accessibility audit report"
        >
          <span class="text-xl leading-none select-none" aria-hidden="true">➕</span>
          <span class="text-[10px] mt-0.5 font-bold tracking-tight">Audit</span>
        </a>

        <!-- Tab 4: Accessible Route Planner -->
        <a
          routerLink="/plan-route"
          routerLinkActive="text-teal-700 font-bold"
          (click)="onTabClick()"
          class="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-xl text-slate-500 hover:text-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 active:scale-95 cursor-pointer"
          aria-label="Route: Plan accessible step-free route"
        >
          <span class="text-xl leading-none select-none" aria-hidden="true">🧭</span>
          <span class="text-[10px] mt-1 tracking-tight">Route</span>
        </a>

        <!-- Tab 5: User Profile -->
        <a
          routerLink="/profile"
          routerLinkActive="text-teal-700 font-bold"
          (click)="onTabClick()"
          class="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] rounded-xl text-slate-500 hover:text-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 active:scale-95 cursor-pointer"
          aria-label="Profile: User profile and offline settings"
        >
          <div class="relative">
            <span class="text-xl leading-none select-none" aria-hidden="true">👤</span>
            @if (authService.currentUser(); as user) {
              <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-500 border border-white"></span>
            }
          </div>
          <span class="text-[10px] mt-1 tracking-tight">Profile</span>
        </a>

      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class MobileTabNavComponent {
  readonly authService = inject(AuthService);
  private readonly haptics = inject(DeviceHapticsService);

  onTabClick(): void {
    this.haptics.impact('light');
  }
}

