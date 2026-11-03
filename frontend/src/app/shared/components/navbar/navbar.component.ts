import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
            <a
              routerLink="/admin"
              routerLinkActive="bg-teal-50 text-teal-800 font-bold border-teal-200"
              class="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-50 transition-colors border border-transparent"
            >
              Admin
            </a>
          </nav>

          <!-- Desktop Actions -->
          <div class="hidden sm:flex items-center gap-3">
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
            Submit Accessibility Report
          </a>
          <a
            routerLink="/about"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center"
          >
            About AccessMap
          </a>
          <a
            routerLink="/admin"
            (click)="closeMobileMenu()"
            routerLinkActive="bg-teal-50 text-teal-800 font-bold"
            class="block px-4 py-3 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50 min-h-[48px] flex items-center"
          >
            Admin Moderation
          </a>

          <div class="pt-4 mt-2 border-t border-slate-200 flex flex-col gap-2.5">
            <a
              routerLink="/login"
              (click)="closeMobileMenu()"
              class="w-full min-h-[48px] px-4 py-3 rounded-lg text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 text-center flex items-center justify-center"
            >
              Sign In or Register
            </a>
            <a
              routerLink="/submit-report"
              (click)="closeMobileMenu()"
              class="w-full min-h-[48px] px-4 py-3 rounded-lg text-base font-bold text-white bg-teal-700 hover:bg-teal-800 text-center flex items-center justify-center gap-2"
            >
              <span>Submit Accessibility Report</span>
            </a>
          </div>
        </nav>
      }
    </header>
  `,
})
export class NavbarComponent {
  readonly mobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}

