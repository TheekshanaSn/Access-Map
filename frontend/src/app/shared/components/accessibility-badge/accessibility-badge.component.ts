import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType =
  | 'step-free'
  | 'ramp'
  | 'elevator'
  | 'restroom'
  | 'parking'
  | 'door-width'
  | 'verified'
  | 'obstacle'
  | 'custom';

@Component({
  selector: 'app-accessibility-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors"
      [ngClass]="getStyleClass()"
    >
      <span aria-hidden="true" class="text-xs">{{ getIcon() }}</span>
      <span>{{ label || getDefaultLabel() }}</span>
    </span>
  `,
})
export class AccessibilityBadgeComponent {
  @Input({ required: true }) type!: BadgeType;
  @Input() label?: string;
  @Input() active = true;

  getIcon(): string {
    switch (this.type) {
      case 'step-free':
        return '🚶‍♂️';
      case 'ramp':
        return '📐';
      case 'elevator':
        return '🛗';
      case 'restroom':
        return '🚻';
      case 'parking':
        return '🅿️';
      case 'door-width':
        return '🚪';
      case 'verified':
        return '✓';
      case 'obstacle':
        return '⚠️';
      default:
        return '♿';
    }
  }

  getDefaultLabel(): string {
    switch (this.type) {
      case 'step-free':
        return 'Step-Free Entrance';
      case 'ramp':
        return 'Ramp Available';
      case 'elevator':
        return 'Elevator / Lift';
      case 'restroom':
        return 'Accessible Restroom';
      case 'parking':
        return 'Disabled Parking';
      case 'door-width':
        return 'Wide Doors (90cm+)';
      case 'verified':
        return 'Verified Audit';
      case 'obstacle':
        return 'Obstacle Notice';
      default:
        return 'Accessible';
    }
  }

  getStyleClass(): string {
    if (!this.active) {
      return 'bg-slate-100 text-slate-500 border-slate-200 line-through';
    }

    switch (this.type) {
      case 'step-free':
      case 'ramp':
      case 'elevator':
        return 'bg-teal-50 text-teal-900 border-teal-300';
      case 'restroom':
      case 'parking':
      case 'door-width':
        return 'bg-sky-50 text-sky-900 border-sky-300';
      case 'verified':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
      case 'obstacle':
        return 'bg-amber-50 text-amber-950 border-amber-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  }
}

