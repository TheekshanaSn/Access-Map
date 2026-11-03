import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('Auth & Admin Guards', () => {
  let authService: AuthService;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/admin' } as RouterStateSnapshot;

  let storageStore: Record<string, string> = {};

  beforeEach(() => {
    storageStore = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => storageStore[key] || null,
      setItem: (key: string, val: string) => {
        storageStore[key] = val;
      },
      removeItem: (key: string) => {
        delete storageStore[key];
      },
      clear: () => {
        storageStore = {};
      },
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
      ],
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should block unauthenticated user and redirect to /login', () => {
      authService.currentUser.set(null);

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(false);
    });

    it('should allow authenticated user', () => {
      authService.currentUser.set({
        id: 'u-1',
        name: 'Sarah',
        email: 'sarah@example.com',
        role: 'user',
      });

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });
  });

  describe('adminGuard', () => {
    it('should redirect unauthenticated visitor to /login', () => {
      authService.currentUser.set(null);

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(false);
    });

    it('should block regular user from /admin and redirect to /', () => {
      authService.currentUser.set({
        id: 'u-1',
        name: 'Normal User',
        email: 'normal@test.com',
        role: 'user',
      });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(false);
    });

    it('should permit moderator to enter /admin', () => {
      authService.currentUser.set({
        id: 'u-mod',
        name: 'Mod User',
        email: 'mod@test.com',
        role: 'moderator',
      });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should permit administrator to enter /admin', () => {
      authService.currentUser.set({
        id: 'u-admin',
        name: 'Super Admin',
        email: 'admin@accessmap.org',
        role: 'admin',
      });

      const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });
  });
});
