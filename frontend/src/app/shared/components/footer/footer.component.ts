import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8" role="contentinfo">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <!-- Column 1: Brand & Mission -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm" aria-hidden="true">
                ♿
              </div>
              <span class="text-xl font-black text-white tracking-tight">
                Access<span class="text-teal-400">Map</span>
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Empowering wheelchair users, elderly citizens, and people with mobility challenges to discover accessible places and understand physical conditions before stepping out.
            </p>
            <div class="text-xs text-teal-400 font-semibold flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-teal-400"></span>
              WCAG 2.1 Level AA Accessibility Compliant
            </div>
          </div>

          <!-- Column 2: Navigation Links -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Explore AccessMap</h3>
            <ul class="space-y-2 text-xs sm:text-sm">
              <li>
                <a routerLink="/" class="hover:text-teal-400 transition-colors focus:underline">Home</a>
              </li>
              <li>
                <a routerLink="/explore-map" class="hover:text-teal-400 transition-colors focus:underline">Explore Interactive Map</a>
              </li>
              <li>
                <a routerLink="/places" class="hover:text-teal-400 transition-colors focus:underline">Accessible Places Directory</a>
              </li>
              <li>
                <a routerLink="/submit-report" class="hover:text-teal-400 transition-colors focus:underline">Submit Accessibility Report</a>
              </li>
              <li>
                <a routerLink="/about" class="hover:text-teal-400 transition-colors focus:underline">About AccessMap & Standards</a>
              </li>
              <li>
                <a routerLink="/admin" class="hover:text-teal-400 transition-colors focus:underline">Moderation Dashboard</a>
              </li>
            </ul>
          </div>

          <!-- Column 3: Accessibility Features Explained -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">What We Audit</h3>
            <ul class="space-y-1.5 text-xs text-slate-400">
              <li class="flex items-center gap-2">
                <span class="text-teal-400">✓</span> Step-free zero-threshold entrances
              </li>
              <li class="flex items-center gap-2">
                <span class="text-teal-400">✓</span> Compliant gradient ramps & handrails
              </li>
              <li class="flex items-center gap-2">
                <span class="text-teal-400">✓</span> Working elevators & tactile buttons
              </li>
              <li class="flex items-center gap-2">
                <span class="text-teal-400">✓</span> Roll-in restrooms & emergency cords
              </li>
              <li class="flex items-center gap-2">
                <span class="text-teal-400">✓</span> Designated wide disabled parking bays
              </li>
              <li class="flex items-center gap-2">
                <span class="text-teal-400">✓</span> Real-time temporary obstacle warnings
              </li>
            </ul>
          </div>

          <!-- Column 4: Emergency Mobility Support & Help -->
          <div class="space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Mobility Support</h3>
            <p class="text-xs text-slate-400">
              Accessible transport assistance & community reporting inquiries:
            </p>
            <div class="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs space-y-1">
              <p class="font-bold text-white">Accessible Transit Helpline:</p>
              <p class="text-teal-300 font-mono">1-800-555-ACCESS (2223)</p>
              <p class="text-[11px] text-slate-400 pt-1">Telecommunications Relay (TRS): 711</p>
            </div>
            <p class="text-[11px] text-slate-500">
              Need assistance? Email: support&#64;accessmap-project.org
            </p>
          </div>

        </div>

        <!-- Disclaimer & Copyright -->
        <div class="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p class="max-w-3xl">
            <strong class="text-slate-400">Disclaimer:</strong> AccessMap sample records are provided for system demonstration and testing. Environmental conditions such as broken lifts or weather obstacles can change rapidly. Always confirm specific requirements directly with venues whenever possible.
          </p>
          <p class="shrink-0 text-slate-400">
            &copy; 2026 AccessMap Project. Inclusive mobility for all.
          </p>
        </div>

      </div>
    </footer>
  `,
})
export class FooterComponent {}

