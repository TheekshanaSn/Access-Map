import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from './core/services/health.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly healthService = inject(HealthService);
  protected readonly state = this.healthService.connectionState;

  readonly features = [
    {
      title: 'Ramps & Slopes',
      desc: 'Identify gradient-compliant ramps, handrails, and step-free alternatives.',
      icon: '♿',
      status: 'Ready in Phase 3',
    },
    {
      title: 'Elevators & Lifts',
      desc: 'Real-time status of passenger lifts, platform lifts, and audible call buttons.',
      icon: '🛗',
      status: 'Ready in Phase 3',
    },
    {
      title: 'Accessible Toilets',
      desc: 'Details on grab bars, roll-in sinks, emergency cords, and door widths.',
      icon: '🚻',
      status: 'Ready in Phase 3',
    },
    {
      title: 'Entrances & Parking',
      desc: 'Automatic doors, threshold heights, and designated disabled parking bays.',
      icon: '🅿️',
      status: 'Ready in Phase 3',
    },
    {
      title: 'Community Reporting',
      desc: 'Crowdsource obstacle warnings, broken lifts, and verified accessibility audits.',
      icon: '📢',
      status: 'Ready in Phase 4',
    },
    {
      title: 'Accessible Routing',
      desc: 'Turn-by-turn navigation avoiding stairs, steep curbs, and uneven terrain.',
      icon: '🗺️',
      status: 'Ready in Phase 5',
    },
  ];

  ngOnInit(): void {
    // Automatically perform an initial health check on application load
    this.checkHealth();
  }

  checkHealth(): void {
    this.healthService.checkHealth().subscribe();
  }
}
