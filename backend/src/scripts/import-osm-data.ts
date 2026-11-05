#!/usr/bin/env node
/**
 * Sri Lanka OpenStreetMap Geographic Data Importer CLI
 * 
 * Usage:
 *   npx tsx src/scripts/import-osm-data.ts --sample
 *   npx tsx src/scripts/import-osm-data.ts --sample --dry-run
 *   npx tsx src/scripts/import-osm-data.ts --file <path-to-osm.json>
 */

import fs from 'fs';
import path from 'path';
import { connectDatabase } from '../config/database';
import { importOsmElements, OsmImportSummary } from '../services/osmImport.service';
import { SRI_LANKA_OSM_SAMPLE_FACILITIES } from '../data/sri-lanka-osm-sample';

async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  const isSample = args.includes('--sample');
  const isDryRun = args.includes('--dry-run');
  const fileArgIndex = args.indexOf('--file');
  const filePath = fileArgIndex !== -1 ? args[fileArgIndex + 1] : null;

  console.log(`=============================================================`);
  console.log(`  AccessMap — Sri Lanka OpenStreetMap Data Importer (Step 12)`);
  console.log(`=============================================================`);

  if (!isSample && !filePath) {
    console.log(`\nUsage:`);
    console.log(`  npx tsx src/scripts/import-osm-data.ts --sample [--dry-run]`);
    console.log(`  npx tsx src/scripts/import-osm-data.ts --file <path> [--dry-run]`);
    console.log(`\nOptions:`);
    console.log(`  --sample     Import curated authentic Sri Lankan public facilities dataset`);
    console.log(`  --file       Path to OSM GeoJSON or Overpass JSON file`);
    console.log(`  --dry-run    Validate records and print metrics without database writes`);
    process.exit(0);
  }

  // Connect database if online
  await connectDatabase();

  let elementsToImport: any[] = [];
  let sourceName = 'Sri Lanka OpenStreetMap Public Facilities';

  if (isSample) {
    console.log(`[Importer] Loading authentic Sri Lanka sample dataset (${SRI_LANKA_OSM_SAMPLE_FACILITIES.length} facilities)...`);
    elementsToImport = SRI_LANKA_OSM_SAMPLE_FACILITIES;
    sourceName = 'Sri Lanka Verified Sample Extract (Hospitals, Transit, Education, Civic, Parks, Restrooms)';
  } else if (filePath) {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`[Error] File not found: ${resolvedPath}`);
      process.exit(1);
    }
    console.log(`[Importer] Loading data from file: ${resolvedPath}`);
    const rawContent = fs.readFileSync(resolvedPath, 'utf-8');
    const parsedJson = JSON.parse(rawContent);

    if (Array.isArray(parsedJson)) {
      elementsToImport = parsedJson;
    } else if (parsedJson.elements && Array.isArray(parsedJson.elements)) {
      // Overpass JSON format
      elementsToImport = parsedJson.elements;
    } else if (parsedJson.type === 'FeatureCollection' && Array.isArray(parsedJson.features)) {
      // GeoJSON FeatureCollection format
      elementsToImport = parsedJson.features;
    } else {
      console.error(`[Error] Unrecognized file structure. Expected Overpass elements or GeoJSON FeatureCollection.`);
      process.exit(1);
    }
    sourceName = `File: ${path.basename(filePath)}`;
  }

  console.log(`[Importer] Beginning import of ${elementsToImport.length} elements (Dry-run: ${isDryRun})...\n`);

  const summary: OsmImportSummary = await importOsmElements(elementsToImport, {
    batchId: `cli-import-${Date.now()}`,
    sourceName,
    dryRun: isDryRun,
    importedBy: {
      userId: 'cli-importer',
      email: 'admin@accessmap.org',
      role: 'admin',
    },
  });

  console.log(`-------------------------------------------------------------`);
  console.log(`  Import Execution Summary`);
  console.log(`-------------------------------------------------------------`);
  console.log(`  Batch ID:                ${summary.batchId}`);
  console.log(`  Source:                  ${summary.sourceName}`);
  console.log(`  Mode:                    ${summary.dryRun ? 'DRY RUN (Simulated)' : 'COMMITTED TO DATABASE'}`);
  console.log(`  Total Evaluated:         ${summary.totalElements}`);
  console.log(`  New Places Inserted:     ${summary.importedCount}`);
  console.log(`  Existing Places Updated: ${summary.updatedCount}`);
  console.log(`  Preserved Community Audits: ${summary.preservedCommunityCount}`);
  console.log(`  Elements Skipped:        ${summary.skippedCount}`);
  console.log(`  Errors Encountered:      ${summary.errorCount}`);
  console.log(`  Duration:                ${summary.executionTimeMs} ms`);

  console.log(`\n  Categories Breakdown:`);
  for (const [cat, count] of Object.entries(summary.categoriesBreakdown)) {
    console.log(`    - ${cat.padEnd(14)}: ${count}`);
  }

  console.log(`\n  Cities Breakdown:`);
  for (const [city, count] of Object.entries(summary.citiesBreakdown)) {
    console.log(`    - ${city.padEnd(16)}: ${count}`);
  }

  if (summary.errors.length > 0) {
    console.log(`\n  ⚠️  Encountered Errors:`);
    for (const err of summary.errors.slice(0, 5)) {
      console.log(`    - [${err.id}] ${err.name || 'Unnamed'}: ${err.error}`);
    }
    if (summary.errors.length > 5) {
      console.log(`    ... and ${summary.errors.length - 5} more.`);
    }
  }

  console.log(`-------------------------------------------------------------`);
  console.log(`  Log saved to backend/data/import-reports/${summary.batchId}.json`);
  console.log(`=============================================================\n`);

  process.exit(0);
}

runCli().catch((err) => {
  console.error('[Importer] Fatal execution failure:', err);
  process.exit(1);
});

