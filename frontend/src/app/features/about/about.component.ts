import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      <!-- Page Header -->
      <header class="space-y-4 border-b border-slate-200 pb-8 text-center sm:text-left">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
          <span>Our Purpose & Accessibility Principles</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          About AccessMap
        </h1>
        <p class="text-base sm:text-xl text-slate-600 leading-relaxed max-w-3xl">
          We believe nobody should have their day disrupted by an unexpected flight of stairs, a broken elevator, or a restroom door that won't fit a wheelchair.
        </p>
      </header>

      <!-- Mission Statement Section -->
      <section class="space-y-4" aria-labelledby="mission-heading">
        <h2 id="mission-heading" class="text-2xl font-black text-slate-900 tracking-tight">
          Our Mission: Removing Physical Uncertainty
        </h2>
        <div class="prose prose-slate text-sm sm:text-base text-slate-700 space-y-4 leading-relaxed">
          <p>
            For millions of wheelchair users, elderly people, parents with strollers, and individuals recovering from injuries, visiting a new restaurant, clinic, or municipal building often comes with acute anxiety:
            <em>"Will I be able to enter independently? Will the bathroom accommodate my power chair? Is the parking lot ramp accessible?"</em>
          </p>
          <p>
            Standard digital maps frequently categorize a venue as "wheelchair accessible" when it merely has an alternate service entrance through a kitchen or a ramp that is dangerously steep.
            <strong>AccessMap replaces vague labels with precise, verified physical measurements.</strong>
          </p>
        </div>
      </section>

      <!-- What We Measure Section -->
      <section class="space-y-6" aria-labelledby="standards-heading">
        <div class="space-y-1">
          <h2 id="standards-heading" class="text-2xl font-black text-slate-900 tracking-tight">
            Key Physical Standards We Measure
          </h2>
          <p class="text-sm text-slate-600">
            Every audit on AccessMap tracks specific architectural parameters designed around international accessibility standards:
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span class="text-3xl" aria-hidden="true">🚪</span>
            <h3 class="text-base font-bold text-slate-900">Doorway Clearance (90cm+)</h3>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Standard manual wheelchairs require 80cm clear passage; motorized chairs and bariatric models require at least 90cm to navigate without scraping knuckles.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span class="text-3xl" aria-hidden="true">📐</span>
            <h3 class="text-base font-bold text-slate-900">Ramp Gradient & Handrails</h3>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A compliant ramp must have an incline of 1:12 or gentler, non-slip friction surfaces, and continuous handrails on both sides to prevent tipping.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span class="text-3xl" aria-hidden="true">🛗</span>
            <h3 class="text-base font-bold text-slate-900">Elevator Operations & Cues</h3>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We track door closing speeds, low reach button panels (<=110cm), tactile braille indicators, and auditory announcements for visually impaired visitors.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span class="text-3xl" aria-hidden="true">🚻</span>
            <h3 class="text-base font-bold text-slate-900">Accessible Restroom Geometry</h3>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              True accessibility requires a minimum 150cm turning circle, horizontal and vertical grab rails, roll-in sink knee space, and emergency floor cords.
            </p>
          </div>
        </div>
      </section>

      <!-- Digital Accessibility Commitment (WCAG 2.1 AA) -->
      <section class="bg-teal-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-md" aria-labelledby="digital-a11y-heading">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800 text-teal-200 text-xs font-bold">
          <span>Digital Inclusivity</span>
        </div>
        <h2 id="digital-a11y-heading" class="text-xl sm:text-2xl font-black">
          Our Digital Accessibility Commitment
        </h2>
        <p class="text-teal-100 text-xs sm:text-sm leading-relaxed">
          Because this platform is built for individuals with diverse functional needs, our digital application strictly adheres to the <strong>W3C Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>:
        </p>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-teal-50 pt-2">
          <li class="flex items-center gap-2">
            <span class="text-teal-300 font-bold">✓</span> High-contrast color palette (> 7:1 ratio)
          </li>
          <li class="flex items-center gap-2">
            <span class="text-teal-300 font-bold">✓</span> Visible focus outlines on all controls
          </li>
          <li class="flex items-center gap-2">
            <span class="text-teal-300 font-bold">✓</span> Large touch targets (minimum 44-48px)
          </li>
          <li class="flex items-center gap-2">
            <span class="text-teal-300 font-bold">✓</span> Screen reader friendly ARIA live announcements
          </li>
        </ul>
      </section>

      <!-- Transparent Demo Data Notice -->
      <section class="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3" aria-labelledby="disclaimer-heading">
        <h2 id="disclaimer-heading" class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Transparency & Demonstration Notice</span>
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The records in this current version of AccessMap are simulated for interface and functional demonstration. While they model realistic architectural challenges faced by mobility device users, you should always contact a facility directly if you are embarking on a critical journey.
        </p>
      </section>

      <!-- Get Involved CTA -->
      <section class="text-center pt-4 space-y-4">
        <h2 class="text-xl font-black text-slate-900">Want to Help Map Your City?</h2>
        <p class="text-sm text-slate-600 max-w-xl mx-auto">
          Every ramp photographed and every doorway measured makes life easier for your fellow citizens.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a
            routerLink="/submit-report"
            class="min-h-[48px] px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-colors shadow-sm"
          >
            Submit an Accessibility Audit
          </a>
          <a
            routerLink="/places"
            class="min-h-[48px] px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors border border-slate-200"
          >
            Explore Documented Places
          </a>
        </div>
      </section>

    </div>
  `,
})
export class AboutComponent {}

