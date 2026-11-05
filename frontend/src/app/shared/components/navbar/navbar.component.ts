import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- AccessMap Brand Logo -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/"
              class="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-teal-600 rounded-lg p-1"
              aria-label="AccessMap Homepage"
            >
              <div class="w-11 h-11 rounded-xl bg-teal-700 flex items-center justify-center text-white text-2xl shadow-sm font-bold" aria-hidden="true">
                ♿
              </div>
              <div>
                <span class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  Access<span class="text-teal-700">Map</span>
                </span>
                <span class="block text-[11px] font-medium text-slate-600 -mt-1 tracking-wide">
                  Move With Confidence
                </span>
              </div>
            </a>
          </div>

          <!-- Desktop Navigation Links -->
          <nav class="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
            <a
              routerLink="/"
              routerLinkActive="bg-teal-50 text-teal-800 font-bold border-teal-200"
              [routerLinkActiveOptions]="{ exact: true }"
              class="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-50 transition-colors border border-transparent"
            >
              Home
            </a>
            <a
              routerLink="/explore-map"
              routerLinkActive="bg-teal-50 text-teal-800 font-bold border-teal-200"
              class="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-50 transition-colors border border-transparent"
            >
              Explore Map
            </a>
            <a
              routerLink="/plan-route"
              routerLinkActive="bg-teal-50 text-teal-800 font-bold border-teal-200"
              class="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-50 transition-colors border border-transparent flex items-center gap-1.5"
            >
              <span>🧭</span>
              <span>Plan Route</span>
            </a>
            <a
              routerLink="/places"
              routerLinkActive="bg-teal-50 text-teal-800 font-bold border-teal-200"
              class="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-50 transition-colors border border-transparent"
            >
              Accessible Places
            </a>
            <a
              routerLink="/submit-report"
              routerLinkActive="bg-teal-50 text-teal-800 font-bold border-teal-200"
              class="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-50 transition-colors border border-transparent"
            >
              Submit Report
            </a>
            <a
              routerLink="/about"
              routerLinkActive="bg-teal-50 text-teal-800 font-bold border-teal-200"
              class="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-50 transition-colors border border-transparent"
            >
              About
            </a>

            <!-- Protected Admin Link for Moderator or Admin -->
            @if (authService.isModerator()) {
              <a
                routerLink="/admin"
                routerLinkActive="bg-slate-900 text-teal-300 font-bold"
                class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300 flex items-center gap-1.5 ml-1"
              >
                <span>🛡️ Moderation</span>
              </a>
            }
          </nav>

          <!-- Desktop Actions -->
          <div class="hidden sm:flex items-center gap-3">
            @if (authService.currentUser(); as user) {
              <!-- User Profile & Sign Out Button -->
              <div class="flex items-center gap-2.5 pl-2">
                <div class="text-right">
                  <span class="block text-xs font-black text-slate-900 leading-tight">
                    {{ user.name }}
                  </span>
                  <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                    {{ user.role }}
                  </span>
                </div>
                <button
                  type="button"
                  (click)="onLogout()"
                  class="min-h-[40px] px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="Sign out of your account"
                >
                  Sign Out
                </button>
              </div>
            } @else {
              <!-- Sign In & Register Buttons -->
              <a
                routerLink="/login"
                class="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center border border-slate-200"
              >
                Sign In
              </a>
              <a
                routerLink="/submit-report"
                class="min-h-[44px] px-5 py-2.5 text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
              >
                <span aria-hidden="true">➕</span>
                <span>Add Audit</span>
              </a>
            }
          </div>

          <!-- Mobile Hamburger Menu Button -->
          <div class="flex items-center md:hidden">
            <button
              type="button"
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
              class="min-w-[48px] min-h-[48px] p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 flex items-center justify-center"
            >
              @if (mobileMenuOpen()) {
                <!-- Close Icon -->
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              } @else {
                <!-- Menu Icon -->
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              }
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile Dropdown Navigation Menu -->
      @if (mobileMenuOpen()) {
        <nav
          id="mobile-menu"
          class="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1.5 shadow-lg"
          aria-label="Mobile Navigation"
        >
          <a
            routerLink="/"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center"
          >
            Home
          </a>
          <a
            routerLink="/explore-map"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center"
          >
            Explore Map
          </a>
          <a
            routerLink="/plan-route"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center gap-2"
          >
            <span>🧭</span>
            <span>Plan Route</span>
          </a>
          <a
            routerLink="/places"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center"
          >
            Accessible Places
          </a>
          <a
            routerLink="/submit-report"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center"
          >
            Submit Report
          </a>
          <a
            routerLink="/about"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center"
          >
            About
          </a>

          @if (authService.isModerator()) {
            <a
              routerLink="/admin"
              (click)="closeMobileMenu()"
              routerLinkActive="bg-slate-900 text-teal-300 font-bold"
              class="block px-4 py-3 rounded-lg text-base font-medium text-slate-900 bg-teal-50 min-h-[48px] flex items-center"
            >
              🛡️ Admin Moderation
            </a>
          }

          <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
            @if (authService.currentUser(); as user) {
              <div class="px-4 py-2 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <span class="block text-xs font-bold text-slate-900">{{ user.name }}</span>
                  <span class="text-[10px] text-slate-500 uppercase">{{ user.role }}</span>
                </div>
                <button
                  type="button"
                  (click)="onLogout(); closeMobileMenu()"
                  class="px-3 py-1.5 rounded text-xs font-bold text-rose-700 bg-white border border-rose-200"
                >
                  Sign Out
                </button>
              </div>
            } @else {
              <a
                routerLink="/login"
                (click)="closeMobileMenu()"
                class="w-full min-h-[48px] px-4 py-3 text-center rounded-lg text-sm font-semibold text-slate-800 bg-slate-100 flex items-center justify-center"
              >
                Sign In
              </a>
              <a
                routerLink="/register"
                (click)="closeMobileMenu()"
                class="w-full min-h-[48px] px-4 py-3 text-center rounded-lg text-sm font-bold text-white bg-teal-700 flex items-center justify-center"
              >
                Create Account
              </a>
            }
          </div>
        </nav>
      }

    </header>
  `,
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  mobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
