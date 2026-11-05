import fs from 'fs';
import path from 'path';
import { PlaceCategory, IPlace, VerifiedStatus } from '../models/place.model';
import {
  findPlaceByOsmId,
  createPlaceInStore,
  updatePlaceInStore,
  PlaceRecord,
} from './placeStore';
import { isWithinSriLanka, resolveNearestSriLankanLocation } from './sriLankaGeo';
import { recordAuditLog } from './auditLogStore';

export interface RawOsmElement {
  type: 'node' | 'way' | 'relation';
  id: number | string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  geometry?: {
    type: string;
    coordinates: [number, number];
  };
  properties?: Record<string, any>;
}

export interface OsmImportOptions {
  batchId?: string;
  sourceName?: string;
  dryRun?: boolean;
  skipUnnamed?: boolean;
  importedBy?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface OsmImportSummary {
  batchId: string;
  timestamp: string;
  sourceName: string;
  dryRun: boolean;
  totalElements: number;
  importedCount: number;
  updatedCount: number;
  preservedCommunityCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{ id: string; name?: string; error: string }>;
  executionTimeMs: number;
  categoriesBreakdown: Record<string, number>;
  citiesBreakdown: Record<string, number>;
}

/**
 * Map raw OSM tags to AccessMap PlaceCategory and human-readable label
 */
export function mapOsmTagsToCategory(tags: Record<string, string>): {
  category: PlaceCategory;
  categoryLabel: string;
} {
  // Healthcare
  if (
    tags.amenity === 'hospital' ||
    tags.amenity === 'clinic' ||
    tags.amenity === 'doctors' ||
    tags.amenity === 'pharmacy' ||
    tags.healthcare === 'hospital' ||
    tags.healthcare === 'clinic'
  ) {
    return {
      category: 'healthcare',
      categoryLabel: tags.amenity === 'pharmacy' ? 'Community Pharmacy' : 'Hospital & Healthcare Clinic',
    };
  }

  // Transport
  if (
    tags.railway === 'station' ||
    tags.railway === 'halt' ||
    tags.amenity === 'bus_station' ||
    tags.highway === 'bus_stop' ||
    tags.aeroway === 'terminal' ||
    tags.amenity === 'ferry_terminal' ||
    tags.public_transport === 'station'
  ) {
    return {
      category: 'transport',
      categoryLabel:
        tags.railway === 'station'
          ? 'Railway Station'
          : tags.amenity === 'bus_station'
          ? 'Bus Terminal'
          : 'Public Transit Terminal',
    };
  }

  // Education
  if (
    tags.amenity === 'university' ||
    tags.amenity === 'college' ||
    tags.amenity === 'school' ||
    tags.amenity === 'kindergarten'
  ) {
    return {
      category: 'education',
      categoryLabel:
        tags.amenity === 'university'
          ? 'State University'
          : tags.amenity === 'college'
          ? 'Higher Education College'
          : 'Public Educational Institution',
    };
  }

  // Government & Civic
  if (
    tags.amenity === 'townhall' ||
    tags.amenity === 'courthouse' ||
    tags.amenity === 'post_office' ||
    tags.amenity === 'police' ||
    tags.office === 'government' ||
    tags.building === 'government' ||
    tags.amenity === 'community_centre'
  ) {
    return {
      category: 'government',
      categoryLabel:
        tags.amenity === 'townhall'
          ? 'Municipal Council & Town Hall'
          : tags.amenity === 'post_office'
          ? 'Post Office'
          : tags.amenity === 'police'
          ? 'Police Station'
          : 'Public & Civic Administration',
    };
  }

  // Restroom
  if (tags.amenity === 'toilets') {
    return {
      category: 'restroom',
      categoryLabel: 'Public Restroom & Sanitation Facility',
    };
  }

  // Parks & Recreation
  if (
    tags.leisure === 'park' ||
    tags.leisure === 'garden' ||
    tags.leisure === 'playground' ||
    tags.leisure === 'nature_reserve'
  ) {
    return {
      category: 'parks',
      categoryLabel: tags.leisure === 'garden' ? 'Botanical Public Garden' : 'Public Park & Recreation',
    };
  }

  // Culture & Heritage
  if (
    tags.tourism === 'museum' ||
    tags.amenity === 'library' ||
    tags.historic ||
    tags.amenity === 'place_of_worship' ||
    tags.tourism === 'gallery'
  ) {
    return {
      category: 'culture',
      categoryLabel:
        tags.tourism === 'museum'
          ? 'National Museum'
          : tags.amenity === 'library'
          ? 'Public Library'
          : 'Cultural & Historic Landmark',
    };
  }

  // Dining
  if (
    tags.amenity === 'restaurant' ||
    tags.amenity === 'cafe' ||
    tags.amenity === 'fast_food' ||
    tags.amenity === 'food_court'
  ) {
    return {
      category: 'dining',
      categoryLabel: tags.amenity === 'cafe' ? 'Public Cafe' : 'Dining & Food Services',
    };
  }

  // Shopping & Commercial
  if (
    tags.shop ||
    tags.amenity === 'marketplace'
  ) {
    return {
      category: 'shopping',
      categoryLabel: tags.amenity === 'marketplace' ? 'Public Marketplace' : 'Shopping & Commercial Center',
    };
  }

  return {
    category: 'other',
    categoryLabel: 'Public Facility',
  };
}

/**
 * Normalizes OSM raw element into AccessMap Place document candidate
 */
export function parseOsmElement(
  element: RawOsmElement,
  batchId: string
): { candidate: Partial<IPlace>; osmId: string } | null {
  const tags = element.tags || element.properties || {};

  // Extract Coordinates: support node (lat/lon), center, or GeoJSON Point geometry
  let lat: number | undefined = element.lat;
  let lng: number | undefined = element.lon;

  if (lat === undefined && element.center) {
    lat = element.center.lat;
    lng = element.center.lon;
  } else if (
    lat === undefined &&
    element.geometry &&
    element.geometry.type === 'Point' &&
    Array.isArray(element.geometry.coordinates)
  ) {
    lng = element.geometry.coordinates[0];
    lat = element.geometry.coordinates[1];
  }

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    throw new Error(`Element ${element.type || 'element'}/${element.id} is missing valid coordinates.`);
  }

  // Boundary verification for Sri Lanka
  if (!isWithinSriLanka(lat, lng)) {
    throw new Error(
      `Coordinates [${lat}, ${lng}] fall outside Sri Lanka geographic envelope (minLat: 5.85, maxLat: 9.95).`
    );
  }

  // Extract Name (multilingual priority)
  const name =
    tags.name ||
    tags['name:en'] ||
    tags['name:si'] ||
    tags['name:ta'] ||
    tags.operator ||
    (tags.amenity ? `Public ${tags.amenity}` : null);

  if (!name || name.trim().length === 0) {
    throw new Error(`Element lacks a discernible name or operator.`);
  }

  const { category, categoryLabel } = mapOsmTagsToCategory(tags);

  // Address parsing with spatial district fallback
  const nearest = resolveNearestSriLankanLocation(lat, lng);
  const city = tags['addr:city'] || tags['addr:suburb'] || nearest.name;
  const state = tags['addr:district'] || tags['addr:province'] || nearest.district;
  const street = tags['addr:street'] || tags['addr:place'] || 'Main Road';
  const postalCode = tags['addr:postcode'] || nearest.postalCode;

  // Accessibility evaluation: Strictly non-presumptive
  const wheelchairTag = tags.wheelchair ? tags.wheelchair.toLowerCase().trim() : 'unknown';
  let stepFreeEntrance = false;
  let accessNote = 'Imported from OpenStreetMap. Accessibility information is currently unverified.';

  if (wheelchairTag === 'yes') {
    stepFreeEntrance = true;
    accessNote = 'OpenStreetMap records indicate wheelchair accessibility. Ground verification audit required.';
  } else if (wheelchairTag === 'limited') {
    stepFreeEntrance = false;
    accessNote = 'OpenStreetMap records indicate partial accessibility. May require assistance or have steps.';
  } else if (wheelchairTag === 'no') {
    stepFreeEntrance = false;
    accessNote = 'OpenStreetMap records indicate this facility is not wheelchair accessible.';
  }

  const osmType = element.type || 'node';
  const osmId = `${osmType}/${element.id}`;

  const candidate: Partial<IPlace> = {
    name: name.trim(),
    category,
    categoryLabel,
    address: {
      street,
      city,
      state,
      postalCode,
      landmark: tags['addr:landmark'] || `${categoryLabel} near ${city}`,
    },
    coordinates: { lat, lng },
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    overallRating: 0, // Unrated: Never fabricate a fake rating for imported places
    reviewCount: 0,
    verifiedStatus: 'pending_verification' as VerifiedStatus,
    lastAuditDate: new Date().toISOString().split('T')[0],
    amenities: {
      stepFreeEntrance,
      ramp: {
        available: false, // Unknown in raw OSM: Never treat missing data as accessible
        slope: 'none',
        hasHandrails: false,
      },
      doorWidthCm: 90,
      automatedDoor: tags['door:automatic'] === 'yes',
      elevator: {
        available: false,
        workingStatus: 'none',
        auditoryPrompts: false,
        brailleButtons: false,
      },
      accessibleRestroom: {
        available: tags['toilets:wheelchair'] === 'yes',
        grabBars: false,
        rollInSink: false,
        emergencyCord: false,
        groundFloorOrElevator: false,
      },
      disabledParking: {
        available: tags['capacity:disabled'] ? parseInt(tags['capacity:disabled'], 10) > 0 : false,
        bayCount: tags['capacity:disabled'] ? parseInt(tags['capacity:disabled'], 10) || 0 : 0,
        distanceToEntranceMeters: 0,
      },
      brailleSignage: false,
      hearingLoop: false,
      quietHoursAvailable: false,
    },
    temporaryObstacles: [],
    shortDescription: `${categoryLabel} in ${city}, ${state}. ${accessNote}`,
    fullDescription: `${name.trim()} is a public ${categoryLabel.toLowerCase()} located in ${city}, Sri Lanka. ${accessNote} Help your community by submitting the first verified physical accessibility audit for this location.`,
    transitTips: tags.public_transport || `Accessible via ${city} central transit network.`,
    entranceTips: accessNote,
    isDuplicate: false,
    isDemoData: false, // Real imported geographic dataset
    osmId,
    osmType,
    osmTags: tags,
    dataSource: 'osm',
    sourceAttribution: '© OpenStreetMap contributors, ODbL 1.0',
    importBatchId: batchId,
    lastImportDate: new Date(),
    accessibilityAuditStatus: 'unverified_osm',
  };

  return { candidate, osmId };
}

/**
 * Execute batch import of raw OpenStreetMap elements into AccessMap
 */
export async function importOsmElements(
  elements: RawOsmElement[],
  options: OsmImportOptions = {}
): Promise<OsmImportSummary> {
  const startTime = Date.now();
  const batchId = options.batchId || `osm-import-${Date.now()}`;
  const sourceName = options.sourceName || 'Sri Lanka OpenStreetMap Extract';
  const dryRun = !!options.dryRun;

  const summary: OsmImportSummary = {
    batchId,
    timestamp: new Date().toISOString(),
    sourceName,
    dryRun,
    totalElements: elements.length,
    importedCount: 0,
    updatedCount: 0,
    preservedCommunityCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
    executionTimeMs: 0,
    categoriesBreakdown: {},
    citiesBreakdown: {},
  };

  for (const element of elements) {
    const rawId = `${element.type || 'elem'}/${element.id}`;
    try {
      const parsed = parseOsmElement(element, batchId);
      if (!parsed) {
        summary.skippedCount++;
        continue;
      }

      const { candidate, osmId } = parsed;

      // Track categories and cities
      const cat = candidate.category || 'other';
      summary.categoriesBreakdown[cat] = (summary.categoriesBreakdown[cat] || 0) + 1;
      const c = candidate.address?.city || 'Unknown';
      summary.citiesBreakdown[c] = (summary.citiesBreakdown[c] || 0) + 1;

      if (dryRun) {
        summary.importedCount++;
        continue;
      }

      // Check if place already exists in database
      const existingPlace = await findPlaceByOsmId(osmId);

      if (existingPlace) {
        // NON-DESTRUCTIVE COMMUNITY REPORT PROTECTION
        const hasCommunityAudit =
          existingPlace.verifiedStatus === 'community_verified' ||
          existingPlace.verifiedStatus === 'staff_verified' ||
          (existingPlace.reviewCount && existingPlace.reviewCount > 0);

        if (hasCommunityAudit) {
          // DO NOT OVERWRITE verified amenities, ratings, reviews or audit status!
          // Only refresh geospatial coordinates, raw OSM tags and import timestamp
          await updatePlaceInStore(existingPlace.id, {
            location: candidate.location,
            coordinates: candidate.coordinates,
            osmTags: candidate.osmTags,
            sourceAttribution: candidate.sourceAttribution,
            lastImportDate: new Date(),
          });
          summary.preservedCommunityCount++;
        } else {
          // Unverified OSM place: Update information safely
          await updatePlaceInStore(existingPlace.id, {
            name: candidate.name,
            address: candidate.address,
            location: candidate.location,
            coordinates: candidate.coordinates,
            osmTags: candidate.osmTags,
            shortDescription: candidate.shortDescription,
            fullDescription: candidate.fullDescription,
            sourceAttribution: candidate.sourceAttribution,
            lastImportDate: new Date(),
          });
          summary.updatedCount++;
        }
      } else {
        // Insert new Place document
        await createPlaceInStore(candidate);
        summary.importedCount++;
      }
    } catch (err: any) {
      summary.errorCount++;
      summary.errors.push({
        id: rawId,
        name: element.tags?.name,
        error: err?.message || String(err),
      });
    }
  }

  summary.executionTimeMs = Date.now() - startTime;

  // Persist structured import log
  try {
    const reportsDir = path.resolve(process.cwd(), 'data', 'import-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const reportFilePath = path.join(reportsDir, `${batchId}.json`);
    fs.writeFileSync(reportFilePath, JSON.stringify(summary, null, 2), 'utf-8');
  } catch (logErr) {
    console.warn('[OsmImportService] Failed to write disk report:', logErr);
  }

  // Record to administrative audit trail
  try {
    await recordAuditLog({
      action: 'OSM_DATA_IMPORTED',
      performedBy: options.importedBy
        ? {
            userId: options.importedBy.userId,
            name: options.importedBy.email,
            email: options.importedBy.email,
            role: options.importedBy.role,
          }
        : {
            userId: 'system-importer',
            name: 'System OSM Importer',
            email: 'admin@accessmap.org',
            role: 'admin',
          },
      targetType: 'system',
      targetId: batchId,
      targetName: sourceName,
      reason: `Imported ${summary.importedCount} new and updated ${summary.updatedCount} Sri Lanka OSM places`,
      details: {
        sourceName,
        totalElements: summary.totalElements,
        importedCount: summary.importedCount,
        updatedCount: summary.updatedCount,
        preservedCommunityCount: summary.preservedCommunityCount,
        errorCount: summary.errorCount,
        dryRun,
        executionTimeMs: summary.executionTimeMs,
      },
    });
  } catch (auditErr) {
    console.warn('[OsmImportService] Failed to write audit trail:', auditErr);
  }

  return summary;
}
