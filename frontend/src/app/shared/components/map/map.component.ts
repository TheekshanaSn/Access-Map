import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Place, PlaceCategory } from '../../../core/models/place.model';
import { PlannedRoute, PathSegment } from '../../../core/models/route.model';

export interface CategoryMarkerStyle {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full min-h-[350px] bg-slate-100 overflow-hidden rounded-xl border border-slate-200">
      
      <!-- Leaflet Map Container -->
      <div
        #mapEl
        class="w-full h-full z-0 outline-none"
        [attr.aria-label]="ariaLabel"
        role="application"
        tabindex="0"
      ></div>

      <!-- Quick Map Action Controls (Floating Overlays) -->
      @if (showControls) {
        <div class="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
          <!-- Recenter Map Button -->
          <button
            type="button"
            (click)="recenter()"
            title="Recenter map to all places"
            aria-label="Recenter map"
            class="w-10 h-10 rounded-xl bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 hover:text-teal-700 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 active:scale-95"
          >
            <span class="text-base select-none" aria-hidden="true">🎯</span>
          </button>
        </div>
      }

      <!-- OpenStreetMap Tile Disclaimer & Accessibility Note Badge -->
      <div class="absolute bottom-2 left-2 z-[400] pointer-events-auto hidden sm:block">
        <div class="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-[10px] text-slate-600 shadow-xs border border-slate-200/80 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-teal-600 inline-block" aria-hidden="true"></span>
          <span>AccessMap Mobility Layer • Demo Data</span>
        </div>
      </div>

    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class MapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapElementRef!: ElementRef<HTMLDivElement>;

  @Input() places: Place[] = [];
  @Input() selectedPlace: Place | null = null;
  @Input() center: [number, number] = [40.718, -74.004]; // Metro City default
  @Input() zoom = 13;
  @Input() userLocation: [number, number] | null = null;
  @Input() activeRoute: PlannedRoute | null = null;
  @Input() interactive = true;
  @Input() showControls = true;
  @Input() ariaLabel = 'Interactive accessibility map';

  @Output() placeSelect = new EventEmitter<Place>();
  @Output() mapReady = new EventEmitter<L.Map>();

  private map?: L.Map;
  private markersLayer?: L.LayerGroup;
  private userLocationLayer?: L.LayerGroup;
  private routeLayer?: L.LayerGroup;
  private resizeObserver?: ResizeObserver;

  // Visual marker styles per venue category
  private static readonly CATEGORY_STYLES: Record<string, CategoryMarkerStyle> = {
    healthcare: {
      color: '#e11d48',
      bgColor: '#ffe4e6',
      icon: '🏥',
      label: 'Hospital & Healthcare',
    },
    transport: {
      color: '#0284c7',
      bgColor: '#e0f2fe',
      icon: '🚆',
      label: 'Transit Station & Hub',
    },
    culture: {
      color: '#4f46e5',
      bgColor: '#e0e7ff',
      icon: '🏛️',
      label: 'Public Building & Culture',
    },
    dining: {
      color: '#d97706',
      bgColor: '#fef3c7',
      icon: '☕',
      label: 'Cafe & Restaurant',
    },
    shopping: {
      color: '#059669',
      bgColor: '#d1fae5',
      icon: '🛒',
      label: 'Market & Shopping',
    },
    parks: {
      color: '#16a34a',
      bgColor: '#dcfce7',
      icon: '🌳',
      label: 'Park & Recreation',
    },
    restroom: {
      color: '#0891b2',
      bgColor: '#cffafe',
      icon: '🚻',
      label: 'Accessible Restroom',
    },
    education: {
      color: '#2563eb',
      bgColor: '#dbeafe',
      icon: '🎓',
      label: 'Education & Learning',
    },
    default: {
      color: '#0f766e',
      bgColor: '#ccfbf1',
      icon: '♿',
      label: 'Accessible Venue',
    },
  };

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['places'] && !changes['places'].firstChange) {
      this.renderPlaceMarkers();
    }

    if (changes['selectedPlace'] && this.selectedPlace) {
      this.highlightPlace(this.selectedPlace);
    }

    if (changes['userLocation']) {
      this.renderUserLocation();
    }

    if (changes['activeRoute']) {
      this.renderActiveRoute();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (!this.mapElementRef?.nativeElement) return;

    // Initialize Leaflet Map
    this.map = L.map(this.mapElementRef.nativeElement, {
      center: this.center,
      zoom: this.zoom,
      zoomControl: this.interactive,
      dragging: this.interactive,
      touchZoom: this.interactive,
      scrollWheelZoom: this.interactive,
      doubleClickZoom: this.interactive,
    });

    // High quality OpenStreetMap tiles with correct attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 4,
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.userLocationLayer = L.layerGroup().addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);

    this.renderPlaceMarkers();
    this.renderUserLocation();
    this.renderActiveRoute();

    // Trigger initial invalidateSize to ensure correct tile loading
    setTimeout(() => {
      this.invalidateSize();
      this.mapReady.emit(this.map);
    }, 150);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      this.invalidateSize();
    });

    this.resizeObserver.observe(this.mapElementRef.nativeElement);
  }

  public invalidateSize(): void {
    this.map?.invalidateSize();
  }

  public recenter(): void {
    if (!this.map) return;

    if (this.places.length > 0) {
      const bounds = L.latLngBounds(
        this.places.map((p) => [p.coordinates.lat, p.coordinates.lng] as [number, number])
      );
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      this.map.flyTo(this.center, this.zoom);
    }
  }

  public flyToLocation(lat: number, lng: number, zoomLevel = 15): void {
    if (!this.map) return;
    this.map.flyTo([lat, lng], zoomLevel, {
      duration: 1.0,
      easeLinearity: 0.25,
    });
  }

  private renderPlaceMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();

    this.places.forEach((place) => {
      const marker = this.createPlaceMarker(place);
      this.markersLayer?.addLayer(marker);
    });
  }

  private createPlaceMarker(place: Place): L.Marker {
    const style = MapComponent.CATEGORY_STYLES[place.category] || MapComponent.CATEGORY_STYLES['default'];
    const hasObstacle = place.temporaryObstacles.length > 0;
    const isSelected = this.selectedPlace?.id === place.id;

    // Distinct accessible color & icon badge per category
    const pinColor = hasObstacle ? '#d97706' : style.color;
    const iconSymbol = hasObstacle ? '⚠️' : style.icon;

    const customIcon = L.divIcon({
      className: 'custom-access-pin',
      html: `
        <div style="
          position: relative;
          width: ${isSelected ? '46px' : '40px'};
          height: ${isSelected ? '46px' : '40px'};
          transition: transform 0.2s ease, width 0.2s ease, height 0.2s ease;
        ">
          <!-- Main Map Pin Droplet -->
          <div style="
            background-color: ${pinColor};
            width: 100%;
            height: 100%;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: ${isSelected ? '3px solid #0f172a' : '2.5px solid #ffffff'};
            box-shadow: ${
              isSelected
                ? '0 10px 25px -3px rgba(0,0,0,0.4), 0 0 0 4px rgba(13,148,136,0.4)'
                : '0 4px 10px -1px rgba(0,0,0,0.25)'
            };
            cursor: pointer;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: ${isSelected ? '18px' : '16px'};
              line-height: 1;
              user-select: none;
            " role="img" aria-label="${place.name} (${style.label})">${iconSymbol}</span>
          </div>

          <!-- Alert Badge if temporary maintenance or obstacle -->
          ${
            hasObstacle
              ? `<span style="
                  position: absolute;
                  top: -4px;
                  right: -4px;
                  width: 16px;
                  height: 16px;
                  background-color: #ef4444;
                  border: 2px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                " aria-hidden="true"></span>`
              : ''
          }
        </div>
      `,
      iconSize: [isSelected ? 46 : 40, isSelected ? 46 : 40],
      iconAnchor: [isSelected ? 23 : 20, isSelected ? 46 : 40],
      popupAnchor: [0, isSelected ? -44 : -38],
    });

    const marker = L.marker([place.coordinates.lat, place.coordinates.lng], {
      icon: customIcon,
      title: place.name,
      riseOnHover: true,
    });

    // Bind structured interactive popup
    const popupContent = this.createPopupContent(place, style, hasObstacle);
    marker.bindPopup(popupContent, {
      maxWidth: 320,
      className: 'accessmap-popup',
    });

    marker.on('click', () => {
      this.placeSelect.emit(place);
    });

    return marker;
  }

  private createPopupContent(place: Place, style: CategoryMarkerStyle, hasObstacle: boolean): string {
    const amenities = place.amenities;
    const obstaclesNotice = hasObstacle
      ? `<div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 6px 8px; border-radius: 8px; margin: 8px 0; font-size: 11px; color: #92400e; display: flex; gap: 4px; align-items: center;">
          <span>⚠️</span>
          <strong>Alert: ${place.temporaryObstacles[0].title}</strong>
        </div>`
      : '';

    const amenitiesList = [
      amenities.stepFreeEntrance ? '✅ Step-Free' : '❌ Steps Present',
      amenities.ramp.available ? `📐 Ramp (${amenities.ramp.slope})` : null,
      amenities.elevator.available && amenities.elevator.workingStatus === 'operational' ? '🛗 Lift Working' : null,
      amenities.accessibleRestroom.available ? '🚻 Accessible Toilet' : null,
      amenities.disabledParking.available ? `🅿️ Disabled Parking (${amenities.disabledParking.bayCount} bays)` : null,
    ]
      .filter(Boolean)
      .map(
        (item) =>
          `<span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${item}</span>`
      )
      .join(' ');

    return `
      <div style="font-family: inherit; padding: 12px; max-width: 280px; color: #0f172a; line-height: 1.4;">
        
        <!-- Category & Rating Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="background-color: ${style.bgColor}; color: ${style.color}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid ${style.color}30;">
            ${style.icon} ${place.categoryLabel}
          </span>
          <span style="font-size: 11px; font-weight: 700; color: #b45309;">
            ★ ${place.overallRating}
          </span>
        </div>

        <!-- Venue Name -->
        <h4 style="font-size: 14px; font-weight: 800; margin: 0 0 2px 0; color: #0f172a;">
          ${place.name}
        </h4>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">
          ${place.address.street}, ${place.address.city}
        </p>

        <!-- Obstacle Warning if any -->
        ${obstaclesNotice}

        <!-- Key Accessibility Amenities Pills -->
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
          ${amenitiesList}
        </div>

        <!-- Door Width Highlight -->
        <div style="font-size: 11px; color: #475569; margin-bottom: 10px; background: #f8fafc; padding: 4px 6px; border-radius: 6px; border: 1px dashed #cbd5e1;">
          <strong>Doorway clearance:</strong> ${amenities.doorWidthCm} cm ${amenities.automatedDoor ? '(Power Sliding)' : '(Manual)'}
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 6px;">
          <a
            href="/places/${place.id}"
            style="flex: 1; text-align: center; background-color: #0f766e; color: #ffffff; font-size: 11px; font-weight: 700; padding: 8px 10px; border-radius: 6px; text-decoration: none; display: block;"
          >
            View Details →
          </a>
          <a
            href="/submit-report?placeId=${place.id}"
            style="background-color: #f1f5f9; color: #334155; font-size: 11px; font-weight: 600; padding: 8px 10px; border-radius: 6px; text-decoration: none; border: 1px solid #cbd5e1; display: block;"
            title="Submit audit update"
          >
            Audit
          </a>
        </div>

        <!-- Demo disclaimer -->
        <p style="font-size: 9px; color: #94a3b8; margin-top: 8px; text-align: center;">
          Demo audit record. Check conditions before travel.
        </p>

      </div>
    `;
  }

  private renderUserLocation(): void {
    if (!this.map || !this.userLocationLayer) return;

    this.userLocationLayer.clearLayers();

    if (!this.userLocation) return;

    const [lat, lng] = this.userLocation;

    // Glowing blue user location radar pin
    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="
            position: absolute;
            width: 24px;
            height: 24px;
            background: rgba(37, 99, 235, 0.25);
            border-radius: 50%;
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute;
            top: 4px;
            left: 4px;
            width: 16px;
            height: 16px;
            background-color: #2563eb;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([lat, lng], {
      icon: userIcon,
      title: 'Your Location',
      zIndexOffset: 1000,
    });

    userMarker.bindPopup(
      `<div style="font-size: 12px; font-weight: bold; padding: 4px 6px; color: #1e3a8a;">
        📍 Your Current Position
      </div>`
    );

    this.userLocationLayer.addLayer(userMarker);
  }

  private renderActiveRoute(): void {
    if (!this.map || !this.routeLayer) return;

    this.routeLayer.clearLayers();
    if (!this.activeRoute) return;

    // Render color-coded path segments according to accessibility & data certainty
    this.activeRoute.segments.forEach((seg) => {
      let color = '#0d9488'; // Default teal (verified accessible)
      let dashArray: string | undefined = undefined;
      const weight = 6;

      if (seg.hasStairs || !seg.isAccessible) {
        color = '#e11d48'; // Red (inaccessible / stairs / obstacle)
        dashArray = '6, 6';
      } else if (seg.verificationLevel === 'missing' || seg.surfaceType === 'unknown') {
        color = '#d97706'; // Amber (missing data - caution)
        dashArray = '4, 6';
      } else if (seg.surfaceType === 'cobblestone') {
        color = '#7c3aed'; // Purple (vibration cobblestone)
      }

      const poly = L.polyline(seg.coordinates, {
        color,
        weight,
        opacity: 0.9,
        dashArray,
      });

      poly.bindPopup(`
        <div style="font-size:12px; font-family:sans-serif; min-width:180px; padding:4px;">
          <strong style="color:#0f172a; display:block; margin-bottom:4px;">${seg.name}</strong>
          <div style="color:#475569; font-size:11px; line-height:1.4;">
            <div>📏 Distance: <strong>${seg.distanceMeters}m</strong></div>
            <div>🧱 Surface: <strong>${seg.surfaceType}</strong></div>
            <div>📐 Incline: <strong>${seg.inclinePercent}%</strong></div>
            <div>🪜 Steps: <strong>${seg.hasStairs ? `⚠️ ${seg.stepCount || ''} steps` : '✓ Step-free'}</strong></div>
            <div>♿ Curb Ramps: <strong>${seg.curbRamps}</strong></div>
            <div style="margin-top:4px; font-size:10px; color:#0d9488; font-weight:bold;">
              Verification: ${seg.verificationLevel.toUpperCase()}
            </div>
          </div>
        </div>
      `);

      this.routeLayer?.addLayer(poly);
    });

    // Render Start and Destination Pins
    if (this.activeRoute.polyline.length > 0) {
      const startCoord = this.activeRoute.polyline[0];
      const destCoord = this.activeRoute.polyline[this.activeRoute.polyline.length - 1];

      const startIcon = L.divIcon({
        className: 'route-start-pin',
        html: `
          <div style="
            background:#059669; color:#ffffff; font-weight:bold; font-size:11px;
            padding:3px 8px; border-radius:12px; border:2px solid #ffffff;
            box-shadow:0 3px 8px rgba(0,0,0,0.3); white-space:nowrap;
          ">🚩 Start</div>
        `,
        iconAnchor: [24, 16],
      });

      const destIcon = L.divIcon({
        className: 'route-dest-pin',
        html: `
          <div style="
            background:#0f766e; color:#ffffff; font-weight:bold; font-size:11px;
            padding:3px 8px; border-radius:12px; border:2px solid #ffffff;
            box-shadow:0 3px 8px rgba(0,0,0,0.3); white-space:nowrap;
          ">🏁 Destination</div>
        `,
        iconAnchor: [36, 16],
      });

      this.routeLayer.addLayer(L.marker(startCoord, { icon: startIcon, zIndexOffset: 800 }));
      this.routeLayer.addLayer(L.marker(destCoord, { icon: destIcon, zIndexOffset: 800 }));

      // Fit map view to complete route
      const bounds = L.latLngBounds(this.activeRoute.polyline);
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }

  private highlightPlace(place: Place): void {
    if (!this.map) return;

    this.flyToLocation(place.coordinates.lat, place.coordinates.lng, 16);
    this.renderPlaceMarkers(); // re-render to update selected pin size
  }
}
