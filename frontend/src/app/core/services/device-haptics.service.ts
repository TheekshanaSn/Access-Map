import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceHapticsService {
  /**
   * Provide light, medium, or heavy physical feedback on touch interactions
   */
  async impact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Haptics) {
        const styleMap = {
          light: 'LIGHT',
          medium: 'MEDIUM',
          heavy: 'HEAVY',
        };
        await cap.Plugins.Haptics.impact({ style: styleMap[style] });
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      const duration = style === 'heavy' ? 40 : style === 'medium' ? 25 : 12;
      navigator.vibrate(duration);
    }
  }

  /**
   * Provide success, warning, or error notification haptic pattern
   */
  async notification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.Haptics) {
        const typeMap = {
          success: 'SUCCESS',
          warning: 'WARNING',
          error: 'ERROR',
        };
        await cap.Plugins.Haptics.notification({ type: typeMap[type] });
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (type === 'success') {
        navigator.vibrate([15, 50, 25]);
      } else if (type === 'warning') {
        navigator.vibrate([20, 40, 20, 40]);
      } else {
        navigator.vibrate([50, 40, 50]);
      }
    }
  }
}

