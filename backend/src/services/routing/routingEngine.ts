import {
  MobilityProfile,
  PathSegment,
  PlannedRoute,
  RouteEvaluation,
  RoutePlanningRequest,
  RoutePlanningResult,
  RouteAccessibilityStatus,
} from '../../models/route.model';
import {
  PEDESTRIAN_NODES,
  PEDESTRIAN_SEGMENTS,
  TEST_AREA_INFO,
  NetworkNode,
} from './pedestrianNetwork';

export interface IRoutingProvider {
  name: string;
  planRoute(request: RoutePlanningRequest): Promise<RoutePlanningResult>;
}

/**
 * Calculates Euclidean/Haversine distance in meters between two lat/lng points
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Find closest pedestrian network node to given coordinates
 */
function findClosestNode(lat: number, lng: number): { node: NetworkNode; distanceMeters: number } | null {
  let closest: NetworkNode | null = null;
  let minDistance = Infinity;

  for (const node of Object.values(PEDESTRIAN_NODES)) {
    const dist = getDistanceMeters(lat, lng, node.coordinates[0], node.coordinates[1]);
    if (dist < minDistance) {
      minDistance = dist;
      closest = node;
    }
  }

  return closest ? { node: closest, distanceMeters: minDistance } : null;
}

export class AccessAwareRoutingEngine implements IRoutingProvider {
  readonly name = 'AccessAware Pedestrian Routing Engine (v1.0)';

  async planRoute(request: RoutePlanningRequest): Promise<RoutePlanningResult> {
    const { start, destination, mobilityProfile } = request;

    if (!start?.lat || !start?.lng || !destination?.lat || !destination?.lng) {
      throw new Error('Both start and destination coordinates are required for route planning.');
    }

    const startMatch = findClosestNode(start.lat, start.lng);
    const destMatch = findClosestNode(destination.lat, destination.lng);

    if (!startMatch || !destMatch) {
      throw new Error('Could not identify pedestrian path nodes near the requested coordinates.');
    }

    // Check if the requested location is outside the active mapped district
    if (startMatch.distanceMeters > 3000 || destMatch.distanceMeters > 3000) {
      throw new Error(
        `Requested location is outside the current active mapped test area (${TEST_AREA_INFO.name}). Verified pedestrian path network is currently limited to this district.`
      );
    }

    // Graph adjacency search to find all candidate paths
    const candidatePaths = this.findCandidatePaths(startMatch.node.id, destMatch.node.id);

    if (candidatePaths.length === 0) {
      throw new Error(
        `No pedestrian path could be found between "${start.name || 'Start'}" and "${destination.name || 'Destination'}". The destination appears disconnected or across an unmapped boundary.`
      );
    }

    // Evaluate each candidate path against mobility preferences and data verification quality
    const plannedRoutes: PlannedRoute[] = candidatePaths.map((segments, index) => {
      const isPrimary = index === 0;
      return this.evaluatePath(segments, mobilityProfile, isPrimary, index);
    });

    // Sort compliant routes first, then by distance
    plannedRoutes.sort((a, b) => {
      if (a.evaluation.isCompliant && !b.evaluation.isCompliant) return -1;
      if (!a.evaluation.isCompliant && b.evaluation.isCompliant) return 1;
      return a.distanceMeters - b.distanceMeters;
    });

    // Mark the first route as primary
    plannedRoutes.forEach((r, idx) => {
      r.isPrimary = idx === 0;
    });

    return {
      startPoint: {
        name: start.name || startMatch.node.name,
        coordinates: [start.lat, start.lng],
      },
      destinationPoint: {
        name: destination.name || destMatch.node.name,
        coordinates: [destination.lat, destination.lng],
      },
      selectedProfile: mobilityProfile,
      routes: plannedRoutes,
      activeTestArea: TEST_AREA_INFO,
      limitationsDisclaimer:
        'AccessMap Prototype Routing Notice: Pedestrian path evaluation uses physically verified surveys where available. Segments with missing or unverified attributes are explicitly flagged and never treated as accessible.',
    };
  }

  /**
   * Search candidate paths between startNode and endNode in the pedestrian graph
   */
  private findCandidatePaths(startNodeId: string, destNodeId: string): PathSegment[][] {
    const results: PathSegment[][] = [];
    const maxPaths = 3;
    const visitedNodes = new Set<string>();

    const dfs = (currentNodeId: string, currentPath: PathSegment[]) => {
      if (results.length >= maxPaths) return;

      if (currentNodeId === destNodeId) {
        results.push([...currentPath]);
        return;
      }

      visitedNodes.add(currentNodeId);

      // Find all segments departing from currentNodeId or arriving (bidirectional sidewalks)
      const outgoing = PEDESTRIAN_SEGMENTS.filter(
        (seg) => seg.startNode === currentNodeId || seg.endNode === currentNodeId
      );

      for (const seg of outgoing) {
        const nextNodeId = seg.startNode === currentNodeId ? seg.endNode : seg.startNode;
        if (!visitedNodes.has(nextNodeId)) {
          currentPath.push(seg);
          dfs(nextNodeId, currentPath);
          currentPath.pop();
        }
      }

      visitedNodes.delete(currentNodeId);
    };

    dfs(startNodeId, []);
    return results;
  }

  /**
   * Evaluates path against user preferences, stairs, surface, slope, and data completeness
   */
  private evaluatePath(
    segments: PathSegment[],
    profile: MobilityProfile,
    isPrimary: boolean,
    pathIndex: number
  ): PlannedRoute {
    let totalDistance = 0;
    let totalSteps = 0;
    let maxSlope = 0;
    const polyline: [number, number][] = [];

    let verifiedMeters = 0;
    let communityMeters = 0;
    let inferredMeters = 0;
    let missingMeters = 0;

    const violations: string[] = [];
    const warnings: string[] = [];
    const limitations: string[] = [];

    let hasUnverifiedMissingData = false;
    let hasSevereInaccessibility = false;

    for (const seg of segments) {
      totalDistance += seg.distanceMeters;
      totalSteps += seg.stepCount || 0;
      if (seg.inclinePercent > maxSlope) {
        maxSlope = seg.inclinePercent;
      }

      // Add segment coordinates to route polyline
      for (const pt of seg.coordinates) {
        polyline.push(pt);
      }

      // Track data quality levels
      switch (seg.verificationLevel) {
        case 'verified':
          verifiedMeters += seg.distanceMeters;
          break;
        case 'community':
          communityMeters += seg.distanceMeters;
          break;
        case 'inferred':
          inferredMeters += seg.distanceMeters;
          break;
        case 'missing':
          missingMeters += seg.distanceMeters;
          hasUnverifiedMissingData = true;
          break;
      }

      // 1. Evaluate Stairs
      if (seg.hasStairs) {
        hasSevereInaccessibility = true;
        limitations.push(`Contains ${seg.stepCount || 'multiple'} steps on "${seg.name}"`);
        if (!profile.allowStairs) {
          violations.push(
            `Inaccessible: Segment "${seg.name}" contains ${seg.stepCount || 'a flight of'} steps with no ramp alternative.`
          );
        }
      }

      // 2. Evaluate Incline / Slope
      if (seg.inclinePercent > profile.maxSlopePercent) {
        violations.push(
          `Excessive Incline: "${seg.name}" has a ${seg.inclinePercent}% slope, which exceeds your ${profile.maxSlopePercent}% maximum slope preference.`
        );
      }

      // 3. Evaluate Surface Type
      if (seg.surfaceType === 'cobblestone') {
        limitations.push(`Rough cobblestone paving on "${seg.name}"`);
        if (profile.avoidUnpaved) {
          violations.push(
            `Rough Terrain: "${seg.name}" has a cobblestone surface which causes strong vibration for mobility aids.`
          );
        }
      } else if (seg.surfaceType === 'gravel' || seg.surfaceType === 'unpaved') {
        limitations.push(`Unpaved loose surface on "${seg.name}"`);
        if (profile.avoidUnpaved) {
          violations.push(
            `Unpaved Surface: "${seg.name}" consists of loose gravel/unpaved terrain.`
          );
        }
      } else if (seg.surfaceType === 'unknown') {
        hasUnverifiedMissingData = true;
        warnings.push(
          `Missing Surface Information: The surface material on "${seg.name}" is unknown and has not been verified.`
        );
      }

      // 4. Evaluate Curb Ramps
      if (seg.curbRamps === 'missing' && profile.requireCurbRamps) {
        violations.push(
          `Missing Curb Ramps: Segment "${seg.name}" lacks curb cutouts at street crossings.`
        );
      } else if (seg.curbRamps === 'unknown') {
        hasUnverifiedMissingData = true;
        warnings.push(
          `Unverified Curb Ramps: Curb ramp availability at crossings on "${seg.name}" is unconfirmed.`
        );
      }

      // 5. Evaluate Obstacles
      if (seg.temporaryObstacles && seg.temporaryObstacles.length > 0) {
        hasSevereInaccessibility = true;
        violations.push(
          `Active Obstacle: Path on "${seg.name}" is blocked by ${seg.temporaryObstacles.join(', ')}.`
        );
      }
    }

    // Determine overall accessibility status
    // CRITICAL REQUIREMENT: Do not claim that a route is fully wheelchair-accessible when required data is missing.
    // Do not silently treat missing attributes as accessible!
    let overallAccessibility: RouteAccessibilityStatus;
    const isCompliant = violations.length === 0;

    if (hasSevereInaccessibility || violations.length > 0) {
      overallAccessibility = 'inaccessible';
    } else if (hasUnverifiedMissingData) {
      overallAccessibility = 'partially_unverified';
      warnings.unshift(
        'Route accessibility cannot be fully guaranteed because one or more segments have missing surface or curb ramp data.'
      );
    } else if (limitations.length > 0) {
      overallAccessibility = 'caution_limitations';
    } else {
      overallAccessibility = 'verified_accessible';
    }

    // Calculate accessibility score (0 - 100)
    let score = 100;
    if (totalSteps > 0) score -= Math.min(60, totalSteps * 8);
    if (maxSlope > 8) score -= (maxSlope - 8) * 5;
    if (hasUnverifiedMissingData) score -= 25;
    if (violations.length > 0) score -= violations.length * 20;
    score = Math.max(10, Math.min(100, Math.round(score)));

    // Speed calculation based on mobility mode and gradient
    let baseSpeedMetersPerMinute = 60; // 3.6 km/h
    switch (profile.mode) {
      case 'manual_wheelchair':
        baseSpeedMetersPerMinute = 58;
        break;
      case 'powered_wheelchair':
        baseSpeedMetersPerMinute = 80;
        break;
      case 'walker_cane':
        baseSpeedMetersPerMinute = 45;
        break;
      case 'stroller_cart':
        baseSpeedMetersPerMinute = 65;
        break;
      case 'standard_pedestrian':
        baseSpeedMetersPerMinute = 80;
        break;
    }

    // Slope speed reduction factor
    const slopePenalty = Math.max(0, (maxSlope - 3) * 0.05);
    const effectiveSpeed = baseSpeedMetersPerMinute * (1 - slopePenalty);
    const durationMinutes = Math.max(1, Math.round(totalDistance / effectiveSpeed));

    // Calculate percentages
    const denom = totalDistance || 1;
    const verificationBreakdown = {
      verifiedPercent: Math.round((verifiedMeters / denom) * 100),
      communityPercent: Math.round((communityMeters / denom) * 100),
      inferredPercent: Math.round((inferredMeters / denom) * 100),
      missingPercent: Math.round((missingMeters / denom) * 100),
    };

    // Route Name
    let routeName = `Route ${pathIndex + 1}`;
    if (totalSteps === 0 && !hasUnverifiedMissingData && isCompliant) {
      routeName = 'Verified Step-Free Route';
    } else if (totalSteps > 0) {
      routeName = `Direct Route (${totalSteps} steps)`;
    } else if (hasUnverifiedMissingData) {
      routeName = 'Alternative Route (Unverified Segments)';
    }

    return {
      id: `route-${pathIndex + 1}-${Date.now()}`,
      name: routeName,
      isPrimary,
      distanceMeters: totalDistance,
      estimatedDurationMinutes: durationMinutes,
      stepCount: totalSteps,
      maxInclinePercent: maxSlope,
      segments,
      polyline,
      evaluation: {
        isCompliant,
        overallAccessibility,
        accessibilityScore: score,
        violations,
        warnings,
        limitations,
        verificationBreakdown,
      },
    };
  }
}

// Singleton routing provider instance
export const defaultRoutingEngine = new AccessAwareRoutingEngine();

