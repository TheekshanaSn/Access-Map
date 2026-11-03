import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-8">
      
      <!-- Brand & Header -->
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-sm" aria-hidden="true">
          ♿
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {{ isLogin() ? 'Sign In to AccessMap' : 'Create an Account' }}
        </h1>
        <p class="text-xs sm:text-sm text-slate-600">
          {{ isLogin() ? 'Track your audits and save favorite accessible places' : 'Join a community of wheelchair users and accessibility auditors' }}
        </p>
      </div>

      <!-- Tab Toggle (Sign In vs Register) -->
      <div class="flex rounded-xl bg-slate-100 p-1 border border-slate-200" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          (click)="setMode(true)"
          role="tab"
          [attr.aria-selected]="isLogin()"
          [class.bg-white]="isLogin()"
          [class.shadow-xs]="isLogin()"
          [class.font-bold]="isLogin()"
          [class.text-slate-900]="isLogin()"
          class="flex-1 min-h-[44px] py-2.5 text-sm rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          Sign In
        </button>

        <button
          type="button"
          (click)="setMode(false)"
          role="tab"
          [attr.aria-selected]="!isLogin()"
          [class.bg-white]="!isLogin()"
          [class.shadow-xs]="!isLogin()"
          [class.font-bold]="!isLogin()"
          [class.text-slate-900]="!isLogin()"
          class="flex-1 min-h-[44px] py-2.5 text-sm rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
        >
          Create Account
        </button>
      </div>

      <!-- Demo Account Notice -->
      <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center gap-2">
        <span class="text-amber-600 font-bold" aria-hidden="true">ℹ️</span>
        <p>
          <strong>Prototype Auth:</strong> Enter any email address to test the workflow. No live credentials required.
        </p>
      </div>

      <!-- Successful Simulated Auth Feedback -->
      @if (authSuccess()) {
        <div class="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-3" role="status" aria-live="polite">
          <span class="text-3xl" aria-hidden="true">🎉</span>
          <h2 class="text-lg font-bold text-emerald-950">
            {{ isLogin() ? 'Welcome Back!' : 'Account Created Successfully!' }}
          </h2>
          <p class="text-xs sm:text-sm text-emerald-800">
            You are signed in as <strong class="text-slate-900">{{ email }}</strong>.
          </p>
          <div class="pt-2 flex flex-col gap-2">
            <a
              routerLink="/places"
              class="min-h-[44px] px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center"
            >
              Explore Accessible Places
            </a>
            <button
              type="button"
              (click)="authSuccess.set(false)"
              class="text-xs text-slate-500 hover:text-slate-700 underline py-1"
            >
              Sign out / Test another email
            </button>
          </div>
        </div>
      } @else {
        <!-- Auth Form -->
        <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs" novalidate>
          
          @if (!isLogin()) {
            <!-- Name Field (Register only) -->
            <div class="space-y-1.5">
              <label for="auth-full-name" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                id="auth-full-name"
                name="fullName"
                type="text"
                [(ngModel)]="fullName"
                placeholder="e.g. Jordan Rivera"
                class="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[48px]"
                required
              />
            </div>

            <!-- Mobility Profile Selection (Register only) -->
            <div class="space-y-1.5">
              <label for="auth-mobility-aid" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mobility Device or Role
              </label>
              <select
                id="auth-mobility-aid"
                name="mobilityRole"
                [(ngModel)]="mobilityRole"
                class="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 min-h-[48px]"
              >
                <option value="wheelchair_user">Manual Wheelchair User</option>
                <option value="power_chair_user">Power Wheelchair / Scooter User</option>
                <option value="walker_user">Walker / Rollator / Cane</option>
                <option value="senior">Senior Citizen</option>
                <option value="caregiver">Caregiver / Family</option>
                <option value="auditor">Volunteer Auditor</option>
              </select>
            </div>
          }

          <!-- Email Field -->
          <div class="space-y-1.5">
            <label for="auth-email-field" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Address *
            </label>
            <input
              id="auth-email-field"
              name="email"
              type="email"
              [(ngModel)]="email"
              placeholder="name@example.com"
              class="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[48px]"
              required
            />
          </div>

          <!-- Password Field -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="auth-password-field" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password *
              </label>
              @if (isLogin()) {
                <span class="text-xs text-teal-700 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              }
            </div>
            <div class="relative">
              <input
                id="auth-password-field"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                placeholder="••••••••••••"
                class="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:bg-white min-h-[48px] pr-12"
                required
              />
              <button
                type="button"
                (click)="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-500 hover:text-slate-800"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <!-- Error Feedback -->
          @if (errorMessage()) {
            <div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold" role="alert">
              {{ errorMessage() }}
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            class="w-full min-h-[50px] px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-black text-sm transition-colors shadow-xs cursor-pointer focus:ring-4 focus:ring-teal-300 flex items-center justify-center gap-2"
          >
            <span>{{ isLogin() ? 'Sign In to Account' : 'Create Free Account' }}</span>
            <span aria-hidden="true">→</span>
          </button>

          <!-- Privacy statement -->
          <p class="text-[11px] text-center text-slate-500 pt-2">
            By signing in, you agree to AccessMap's community audit standards and privacy policy.
          </p>

        </form>
      }

    </div>
  `,
})
export class AuthComponent {
  isLogin = signal<boolean>(true);
  authSuccess = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  email = 'alex.jordan@example.com';
  password = 'AccessiblePassword123';
  fullName = 'Alex Jordan';
  mobilityRole = 'wheelchair_user';
  showPassword = false;

  setMode(login: boolean): void {
    this.isLogin.set(login);
    this.errorMessage.set(null);
    this.authSuccess.set(false);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (!this.email.trim() || !this.email.includes('@')) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }

    if (!this.isLogin() && !this.fullName.trim()) {
      this.errorMessage.set('Please enter your full name.');
      return;
    }

    this.authSuccess.set(true);
  }
}

