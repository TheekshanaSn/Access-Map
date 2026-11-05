import { Injectable, signal } from '@angular/core';

export type NetworkConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

export interface NetworkStatus {
  connected: boolean;
  connectionType: NetworkConnectionType;
  isSlowConnection: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceNetworkService {
  readonly isOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  readonly connectionType = signal<NetworkConnectionType>('unknown');
  readonly isSlowConnection = signal<boolean>(false);

  // Stale data indicator signal when offline
  readonly isServingStaleData = signal<boolean>(false);
  readonly staleDataMessage = signal<string | null>(null);

  constructor() {
    this.initNetworkMonitoring();
  }

  private initNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // 1. Try Native Capacitor Network Plugin
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.Network) {
      cap.Plugins.Network.getStatus().then((status: any) => {
        this.updateStatus(status.connected, status.connectionType);
      });

      cap.Plugins.Network.addListener('networkStatusChange', (status: any) => {
        this.updateStatus(status.connected, status.connectionType);
      });
      return;
    }

    // 2. Progressive Web Network Event Listeners
    window.addEventListener('online', () => {
      this.updateStatus(true, 'unknown');
    });

    window.addEventListener('offline', () => {
      this.updateStatus(false, 'none');
    });

    // Check NetworkInformation API if available in browser
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      this.checkEffectiveType(conn);
      conn.addEventListener('change', () => this.checkEffectiveType(conn));
    }
  }

  private checkEffectiveType(conn: any): void {
    if (conn?.effectiveType) {
      const slow = conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
      this.isSlowConnection.set(slow);
    }
  }

  private updateStatus(connected: boolean, rawType?: string): void {
    this.isOnline.set(connected);

    let mappedType: NetworkConnectionType = 'unknown';
    if (!connected) {
      mappedType = 'none';
      this.markStaleData(true, 'You are currently offline. Showing cached accessibility places.');
    } else {
      if (rawType === 'wifi') mappedType = 'wifi';
      else if (rawType === 'cellular') mappedType = 'cellular';
      else mappedType = 'unknown';

      // Cleared offline warning
      this.markStaleData(false);
    }

    this.connectionType.set(mappedType);
  }

  markStaleData(isStale: boolean, message?: string): void {
    this.isServingStaleData.set(isStale);
    this.staleDataMessage.set(isStale ? message || 'Viewing cached data' : null);
  }
}

