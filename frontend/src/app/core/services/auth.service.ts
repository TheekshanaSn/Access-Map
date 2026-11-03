import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of, throwError } from 'rxjs';
import { User, AuthResponse, RegisterDto, LoginDto, UserRole } from '../models/user.model';

const TOKEN_KEY = 'accessmap_jwt_token';
const USER_KEY = 'accessmap_user_profile';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  // Signals-based Auth State
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly token = signal<string | null>(this.getStoredToken());

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isModerator = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'moderator' || role === 'admin';
  });

  constructor() {
    // If token exists, verify and refresh user profile from backend
    if (this.token()) {
      this.loadCurrentUser().subscribe();
    }
  }

  /**
   * Register a new account
   */
  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, dto).pipe(
      tap((res) => {
        this.setSession(res.token, res.user);
      })
    );
  }

  /**
   * Log into an existing account
   */
  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, dto).pipe(
      tap((res) => {
        this.setSession(res.token, res.user);
      })
    );
  }

  /**
   * Log out current user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        // Even if network fails, always clear local credentials
        this.clearSession();
        return of(null);
      })
    );
  }

  /**
   * Fetch latest profile from /api/auth/me
   */
  loadCurrentUser(): Observable<User | null> {
    if (!this.token()) {
      this.clearSession();
      return of(null);
    }

    return this.http.get<{ user: User }>(`${this.apiUrl}/me`).pipe(
      map((res) => res.user),
      tap((user) => {
        this.currentUser.set(user);
        this.saveUser(user);
      }),
      catchError(() => {
        // Token expired or invalid -> safely clear session
        this.clearSession();
        return of(null);
      })
    );
  }

  /**
   * Retrieve active JWT token for HTTP interceptor
   */
  getToken(): string | null {
    return this.token();
  }

  /**
   * Save session to state and browser storage
   */
  private setSession(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);

    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch {
      // Storage unavailable or disabled
    }
  }

  /**
   * Clear session on logout or session expiration
   */
  clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);

    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // Storage unavailable
    }
  }

  private getStoredToken(): string | null {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return null;
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private saveUser(user: User): void {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch {
      // Storage unavailable
    }
  }
}
