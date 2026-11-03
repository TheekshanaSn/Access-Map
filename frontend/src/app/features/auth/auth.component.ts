import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

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
          {{ isLogin() ? 'Access verified audits and manage accessibility records' : 'Join a community of wheelchair users and accessibility auditors' }}
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

      <!-- Currently Logged In State View -->
      @if (authService.currentUser(); as user) {
        <div class="p-6 bg-teal-50 border-2 border-teal-200 rounded-2xl text-center space-y-4" role="status">
          <div class="w-12 h-12 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center text-xl font-bold mx-auto">
            ✓
          </div>
          <div class="space-y-1">
            <h2 class="text-lg font-bold text-slate-900">Signed In As</h2>
            <p class="text-sm font-black text-teal-900">{{ user.name }}</p>
            <p class="text-xs text-slate-600">{{ user.email }}</p>
            <div class="pt-1">
              <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-300">
                Role: {{ user.role }}
              </span>
            </div>
          </div>

          <div class="pt-2 flex flex-col gap-2">
            @if (user.role === 'admin' || user.role === 'moderator') {
              <a
                routerLink="/admin"
                class="min-h-[44px] px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5"
              >
                <span>🛡️ Open Moderation Dashboard</span>
              </a>
            }
            <a
              routerLink="/places"
              class="min-h-[44px] px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center"
            >
              Explore Accessible Places
            </a>
            <button
              type="button"
              (click)="onLogout()"
              class="min-h-[44px] px-5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
            >
              Sign Out
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

            <!-- Role Selection (Register only) -->
            <div class="space-y-1.5">
              <label for="auth-role" class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Account Role
              </label>
              <select
                id="auth-role"
                name="role"
                [(ngModel)]="selectedRole"
                class="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 min-h-[48px]"
              >
                <option value="user">Regular User (Discover & submit audits)</option>
                <option value="moderator">Accessibility Moderator (Verify & approve audits)</option>
                <option value="admin">Platform Administrator (Full system oversight)</option>
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
              <span class="text-[11px] text-slate-500">Min 8 chars, 1 number/symbol</span>
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

          <!-- Error Alert Banner -->
          @if (errorMessage()) {
            <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold space-y-1" role="alert">
              <div class="flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{{ errorMessage() }}</span>
              </div>
              @if (validationDetails().length > 0) {
                <ul class="list-disc list-inside pl-1 text-[11px] text-rose-700">
                  @for (msg of validationDetails(); track msg) {
                    <li>{{ msg }}</li>
                  }
                </ul>
              }
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full min-h-[50px] px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:opacity-50 text-white font-black text-sm transition-colors shadow-xs cursor-pointer focus:ring-4 focus:ring-teal-300 flex items-center justify-center gap-2"
          >
            @if (isLoading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Authenticating...</span>
            } @else {
              <span>{{ isLogin() ? 'Sign In' : 'Create Account' }}</span>
              <span aria-hidden="true">→</span>
            }
          </button>

          <!-- Privacy & Standards statement -->
          <p class="text-[11px] text-center text-slate-500 pt-2">
            By signing in, you agree to AccessMap's physical verification standards and data protection policy.
          </p>

        </form>
      }

    </div>
  `,
})
export class AuthComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isLogin = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  validationDetails = signal<string[]>([]);

  email = '';
  password = '';
  fullName = '';
  selectedRole: UserRole = 'user';
  showPassword = false;

  private returnUrl = '/places';

  ngOnInit(): void {
    // Check if routed via /register or /login
    this.route.url.subscribe((segments) => {
      const path = segments.map((s) => s.path).join('/');
      if (path.includes('register')) {
        this.isLogin.set(false);
      } else {
        this.isLogin.set(true);
      }
    });

    // Capture returnUrl query parameter
    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  setMode(login: boolean): void {
    this.isLogin.set(login);
    this.errorMessage.set(null);
    this.validationDetails.set([]);
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.validationDetails.set([]);

    // Client-side quick checks
    if (!this.email.trim() || !this.email.includes('@')) {
      this.errorMessage.set('Please provide a valid email address.');
      return;
    }

    if (!this.password || this.password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long.');
      return;
    }

    if (!this.isLogin() && (!this.fullName.trim() || this.fullName.trim().length < 2)) {
      this.errorMessage.set('Full Name is required (minimum 2 characters).');
      return;
    }

    this.isLoading.set(true);

    if (this.isLogin()) {
      this.authService
        .login({
          email: this.email.trim(),
          password: this.password,
        })
        .subscribe({
          next: (res) => {
            this.isLoading.set(false);
            // Navigate to returnUrl or appropriate dashboard
            if (res.user.role === 'admin' || res.user.role === 'moderator') {
              this.router.navigateByUrl(this.returnUrl.includes('admin') ? this.returnUrl : '/admin');
            } else {
              this.router.navigateByUrl(this.returnUrl);
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            if (err.status === 401) {
              this.errorMessage.set('Invalid email or password. Please verify your credentials.');
            } else if (err.error?.messages) {
              this.errorMessage.set('Validation failed:');
              this.validationDetails.set(err.error.messages);
            } else {
              this.errorMessage.set(err.error?.message || 'Authentication failed. Please check network connection.');
            }
          },
        });
    } else {
      this.authService
        .register({
          name: this.fullName.trim(),
          email: this.email.trim(),
          password: this.password,
          role: this.selectedRole,
        })
        .subscribe({
          next: (res) => {
            this.isLoading.set(false);
            if (res.user.role === 'admin' || res.user.role === 'moderator') {
              this.router.navigateByUrl('/admin');
            } else {
              this.router.navigateByUrl(this.returnUrl);
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            if (err.status === 409) {
              this.errorMessage.set('An account with this email address already exists. Please Sign In.');
            } else if (err.error?.messages) {
              this.errorMessage.set('Please correct the following:');
              this.validationDetails.set(err.error.messages);
            } else {
              this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
            }
          },
        });
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
