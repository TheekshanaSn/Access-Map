import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { BackendHealthResponse, ConnectionState } from '../models/health.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HealthService {
  private readonly http = inject(HttpClient);
  // Default to proxy-friendly relative path if running on dev server, fallback to configured URL
  private readonly healthEndpoint = `${environment.apiBaseUrl}/health`;

  // Reactive state using Angular Signals
  readonly connectionState = signal<ConnectionState>({
    status: 'idle',
    data: null,
    errorMessage: null,
    latencyMs: null,
    lastChecked: null,
  });

  checkHealth(): Observable<BackendHealthResponse | null> {
    const startTime = performance.now();

    this.connectionState.update((prev) => ({
      ...prev,
      status: 'checking',
      errorMessage: null,
    }));

    return this.http.get<BackendHealthResponse>(this.healthEndpoint).pipe(
      tap((response) => {
        const latency = Math.round(performance.now() - startTime);
        this.connectionState.set({
          status: 'connected',
          data: response,
          errorMessage: null,
          latencyMs: latency,
          lastChecked: new Date(),
        });
      }),
      catchError((error) => {
        const latency = Math.round(performance.now() - startTime);
        const errorText =
          error?.status === 0
            ? 'Unable to reach backend server. Please verify backend is running on port 5000.'
            : `Server returned error (${error.status}: ${error.statusText || 'Unknown'})`;

        this.connectionState.set({
          status: 'error',
          data: null,
          errorMessage: errorText,
          latencyMs: latency,
          lastChecked: new Date(),
        });

        return of(null);
      })
    );
  }
}

