import { Component } from '@angular/core';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  template: `
    <aside
      class="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2.5 text-xs sm:text-sm"
      aria-label="Demonstration Data Notice"
    >
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs" aria-hidden="true">
            i
          </span>
          <p class="font-medium">
            <span class="font-bold">Demonstration Dataset:</span>
            Accessibility records shown are simulated for UI & functional demonstration. Always verify specific venue conditions directly before traveling.
          </p>
        </div>
        <span class="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 shrink-0">
          Prototype v1.0
        </span>
      </div>
    </aside>
  `,
})
export class DemoBannerComponent {}

