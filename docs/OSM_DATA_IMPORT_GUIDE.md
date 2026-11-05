# AccessMap — OpenStreetMap Sri Lanka Data Ingestion & Update Guide (Step 12)

This guide documents the architecture, operational workflow, and execution steps for integrating and updating real OpenStreetMap (OSM) public facilities across Sri Lanka into the AccessMap platform.

---

## 1. Architecture Overview

AccessMap integrates OpenStreetMap geographic data into MongoDB using an idempotent, non-destructive ingestion pipeline.

```
┌─────────────────────────────────┐
│ OpenStreetMap Sri Lanka Extract │
│ (Overpass API / Geofabrik PBF)  │
└────────────────┬────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ OsmImportService (backend/src/services/osmImport.ts)   │
│  - Geographic envelope filtering (Lat 5.85-9.95)       │
│  - Tag mapping to AccessMap categories                │
│  - GeoJSON Point conversion ([lng, lat])               │
│  - Non-presumptive accessibility default (unverified)  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Idempotent & Non-Destructive Storage Pipeline          │
│  - Matches by unique osmId ("node/123", "way/456")     │
│  - New Facility: Insert document (pending verification)│
│  - Community Audited: PRESERVE reviews & audit data;   │
│    only refresh GPS coordinates and raw OSM tags       │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ MongoDB Place Collection with 2dsphere Index           │
│  + Structured Import Log (backend/data/import-reports/) │
│  + Administrative Audit Trail (AuditLog)               │
└────────────────────────────────────────────────────────┘
```

---

## 2. Ingesting Data

### 2.1 Using the CLI Importer

AccessMap provides a dedicated CLI tool in the backend:

```powershell
# Navigate to backend
cd backend

# 1. Run a Dry-Run Simulation on the Curated Sri Lankan Sample Dataset
npm run import:osm -- --sample --dry-run

# 2. Commit the Verified Sri Lanka Sample Facilities to Database
npm run import:osm -- --sample

# 3. Import from a Custom GeoJSON or Overpass JSON Extract
npm run import:osm -- --file ./path/to/sri-lanka-public-facilities.json
```

### 2.2 Using the Admin Dashboard

1. Sign in as an **Administrator** (`admin@accessmap.org` / `AdminPassword123!`).
2. Navigate to **Admin Dashboard** (`/admin`).
3. Select the **🇱🇰 Sri Lanka OSM Data** tab.
4. Click **🧪 Test Dry-Run** to preview the dataset, or **⬇ Import Public Facilities** to execute the ingestion live.
5. Review the execution summary, breakdown by category, and breakdown across all 12 target cities.

---

## 3. How to Acquire Fresh Sri Lanka OSM Extracts

### Option A: Real-Time POI Extract via Overpass API (Recommended)

To extract all public facilities across Sri Lanka in Overpass JSON format, run the following Overpass query in [Overpass Turbo](https://overpass-turbo.eu/) or via `curl`:

```text
[out:json][timeout:180];
// Sri Lanka geographic bounding box
(
  // 1. Healthcare
  node["amenity"~"hospital|clinic|doctors|pharmacy"](5.85, 79.55, 9.95, 81.95);
  way["amenity"~"hospital|clinic|doctors|pharmacy"](5.85, 79.55, 9.95, 81.95);
  
  // 2. Public Transit Terminals & Stations
  node["railway"~"station|halt"](5.85, 79.55, 9.95, 81.95);
  node["amenity"="bus_station"](5.85, 79.55, 9.95, 81.95);
  
  // 3. Higher Education & Schools
  node["amenity"~"university|college|school"](5.85, 79.55, 9.95, 81.95);
  
  // 4. Civic & Government Administration
  node["amenity"~"townhall|courthouse|post_office|police"](5.85, 79.55, 9.95, 81.95);
  
  // 5. Public Restrooms & Sanitation
  node["amenity"="toilets"](5.85, 79.55, 9.95, 81.95);
  
  // 6. Parks & Recreation
  node["leisure"~"park|garden|playground"](5.85, 79.55, 9.95, 81.95);
  
  // 7. Culture & Heritage
  node["tourism"~"museum|gallery|attraction"](5.85, 79.55, 9.95, 81.95);
  node["amenity"="library"](5.85, 79.55, 9.95, 81.95);
);
out body center;
```

Export the query result as `sri-lanka-poi.json` into `backend/data/` and run:
```powershell
npm run import:osm -- --file ./data/sri-lanka-poi.json
```

### Option B: Full Country Extract from Geofabrik

1. Download the Sri Lanka country extract from Geofabrik:
   `https://download.geofabrik.de/asia/sri-lanka-latest.osm.pbf`
2. Extract Points of Interest using `osmium-tool`:
   ```bash
   osmium tags-filter sri-lanka-latest.osm.pbf n/amenity n/railway n/leisure n/tourism -o sri-lanka-facilities.osm.pbf
   osmium export sri-lanka-facilities.osm.pbf -o sri-lanka-facilities.geojson
   ```
3. Run the AccessMap importer on the generated GeoJSON:
   ```powershell
   npm run import:osm -- --file ./data/sri-lanka-facilities.geojson
   ```

---

## 4. Geospatial 2dsphere Queries

AccessMap stores geospatial coordinates using standard GeoJSON:
```json
{
  "location": {
    "type": "Point",
    "coordinates": [80.6337, 7.2906]
  }
}
```

> **Note**: GeoJSON coordinates are ordered **`[longitude, latitude]`** (e.g., `[80.6337, 7.2906]`), while the legacy presentation object retains `{ lat: 7.2906, lng: 80.6337 }`.

### MongoDB Proximity Query Example ($near)

To find public facilities within a 3km radius of Kandy Lake:
```javascript
db.places.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [80.6385, 7.2928] // [lng, lat]
      },
      $maxDistance: 3000 // meters
    }
  },
  isDuplicate: { $ne: true }
});
```

---

## 5. Data Safety & Integrity Guarantees

1. **Zero Presumed Accessibility**:
   Even if an OSM element has `wheelchair=yes`, AccessMap designates the record as `pending_verification`. Real accessibility standards (such as ramp slope < 1:12, door width ≥ 90 cm, grab bars) require ground-truth audits by users and moderators.
2. **Community Audit Protection**:
   If an existing facility has been reviewed or verified (`community_verified` or `staff_verified`), re-importing OSM extracts **never overwrites** verified amenities, ratings, reviews, photos, or status. Only GPS coordinates and raw tags are refreshed.
3. **Duplicate Prevention**:
   The unique index on `osmId` (`node/123456`) guarantees that re-running imports is 100% idempotent and will never create duplicate venues.
4. **Audit Trail & Error Reports**:
   Every batch run generates a timestamped report in `backend/data/import-reports/<batchId>.json` and records a governance action in `AuditLog`.

