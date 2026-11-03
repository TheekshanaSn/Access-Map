import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User, AuthResponse } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 'u-1',
    name: 'Sarah Wheelchair User',
    email: 'sarah@example.com',
    role: 'user',
  };

  const mockAdmin: User = {
    id: 'u-2',
    name: 'Admin User',
    email: 'admin@accessmap.org',
    role: 'admin',
  };

  const mockAuthResponse: AuthResponse = {
    message: 'Success',
    user: mockUser,
    token: 'jwt.mock.token.123',
  };

  // Mock in-memory storage for test environment
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
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created with initial unauthenticated state when storage is empty', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('should log in user and set reactive signals and storage', () => {
    service.login({ email: 'sarah@example.com', password: 'Password123!' }).subscribe((res) => {
      expect(res.user.email).toBe('sarah@example.com');
      expect(res.token).toBe('jwt.mock.token.123');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.name).toBe('Sarah Wheelchair User');
    expect(service.isAdmin()).toBe(false);
    expect(service.isModerator()).toBe(false);
    expect(storageStore['accessmap_jwt_token']).toBe('jwt.mock.token.123');
  });

  it('should register user and set session', () => {
    service
      .register({
        name: 'Sarah Wheelchair User',
        email: 'sarah@example.com',
        password: 'Password123!',
      })
      .subscribe((res) => {
        expect(res.user.id).toBe('u-1');
      });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    expect(service.isAuthenticated()).toBe(true);
  });

  it('should compute isAdmin and isModerator correctly for admin user', () => {
    service.login({ email: 'admin@accessmap.org', password: 'AdminPassword1!' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({
      message: 'Admin login',
      user: mockAdmin,
      token: 'jwt.admin.token.456',
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.isModerator()).toBe(true);
  });

  it('should clear signals and storage on logout', () => {
    service.login({ email: 'sarah@example.com', password: 'Password123!' }).subscribe();
    httpMock.expectOne('/api/auth/login').flush(mockAuthResponse);
    expect(service.isAuthenticated()).toBe(true);

    service.logout().subscribe();
    const logoutReq = httpMock.expectOne('/api/auth/logout');
    logoutReq.flush({ message: 'Logged out' });

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(storageStore['accessmap_jwt_token']).toBeUndefined();
  });
});
