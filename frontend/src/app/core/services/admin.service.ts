import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Place } from '../models/place.model';

export interface AdminOverviewMetrics {
  places: {
    total: number;
    verified: number;
    pending: number;
    possibleDuplicates: number;
  };
  reports: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    needsReview: number;
    activeObstacles: number;
  };
  users: {
    total: number;
  };
}

export interface AuditLogItem {
  id: string;
  action: string;
  performedBy: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  targetType: string;
  targetId: string;
  targetName: string;
  reason?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface DuplicatePlacePair {
  pairId: string;
  placeA: Place;
  placeB: Place;
  similarityScore: number;
  distanceMeters?: number;
  reasons: string[];
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<{ metrics: AdminOverviewMetrics; recentActivity: AuditLogItem[] }> {
    return this.http.get<{ metrics: AdminOverviewMetrics; recentActivity: AuditLogItem[] }>('/api/admin/overview').pipe(
      catchError(() => {
        // Fallback for offline demonstration
        return of({
          metrics: {
            places: { total: 5, verified: 4, pending: 1, possibleDuplicates: 1 },
            reports: { total: 6, pending: 2, approved: 3, rejected: 1, needsReview: 0, activeObstacles: 1 },
            users: { total: 3 },
          },
          recentActivity: [
            {
              id: 'audit-1',
              action: 'REPORT_APPROVED',
              performedBy: { userId: 'admin-1', name: 'System Admin', email: 'admin@accessmap.org', role: 'admin' },
              targetType: 'report',
              targetId: 'rep-1',
              targetName: 'National Hospital of Sri Lanka',
              reason: 'Verified entrance ramp slope (1:12) against official standards.',
              timestamp: new Date().toISOString(),
            },
          ],
        });
      })
    );
  }

  getAuditLogs(params: { page?: number; limit?: number; action?: string } = {}): Observable<{ logs: AuditLogItem[]; total: number; page: number; totalPages: number }> {
    return this.http.get<{ logs: AuditLogItem[]; total: number; page: number; totalPages: number }>('/api/admin/audit-logs', { params: params as any }).pipe(
      catchError(() => {
        return of({
          logs: [
            {
              id: 'audit-demo-1',
              action: 'REPORT_APPROVED',
              performedBy: { userId: 'mod-1', name: 'Lead Moderator', email: 'moderator@accessmap.org', role: 'moderator' },
              targetType: 'report',
              targetId: 'rep-1',
              targetName: 'City General Hospital',
              reason: 'Verified entrance ramp against photo evidence.',
              timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            },
            {
              id: 'audit-demo-2',
              action: 'PLACE_UPDATED',
              performedBy: { userId: 'mod-1', name: 'Lead Moderator', email: 'moderator@accessmap.org', role: 'moderator' },
              targetType: 'place',
              targetId: 'place-central-library',
              targetName: 'Metropolitan Central Library',
              reason: 'Updated door clear width measurement to 105cm.',
              timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            },
          ],
          total: 2,
          page: 1,
          totalPages: 1,
        });
      })
    );
  }

  getUsers(params: { page?: number; limit?: number; search?: string } = {}): Observable<{ users: AdminUserItem[]; total: number; page: number; totalPages: number }> {
    return this.http.get<{ users: AdminUserItem[]; total: number; page: number; totalPages: number }>('/api/admin/users', { params: params as any }).pipe(
      catchError(() => {
        return of({
          users: [
            { id: 'dev-user-1', name: 'AccessMap Administrator', email: 'admin@accessmap.org', role: 'admin' as const, createdAt: '2026-10-01' },
            { id: 'dev-user-2', name: 'Accessibility Moderator', email: 'moderator@accessmap.org', role: 'moderator' as const, createdAt: '2026-10-02' },
            { id: 'dev-user-3', name: 'Sample Community User', email: 'user@accessmap.org', role: 'user' as const, createdAt: '2026-10-05' },
          ],
          total: 3,
          page: 1,
          totalPages: 1,
        });
      })
    );
  }

  updateUserRole(userId: string, role: 'user' | 'moderator' | 'admin', reason?: string): Observable<any> {
    return this.http.patch(`/api/admin/users/${userId}/role`, { role, reason });
  }

  detectDuplicates(): Observable<{ count: number; duplicates: DuplicatePlacePair[] }> {
    return this.http.get<{ count: number; duplicates: DuplicatePlacePair[] }>('/api/places/duplicates/detect').pipe(
      catchError(() => of({ count: 0, duplicates: [] }))
    );
  }

  resolveDuplicate(primaryId: string, duplicateId: string, action: 'mark_duplicate' | 'dismiss', reason?: string): Observable<any> {
    return this.http.post('/api/places/duplicates/resolve', { primaryId, duplicateId, action, reason });
  }

  updatePlace(id: string, updates: any): Observable<any> {
    return this.http.put(`/api/places/${id}`, updates);
  }
}
