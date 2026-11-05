import { Request, Response } from 'express';
import { defaultRoutingEngine } from '../services/routing/routingEngine';
import { PEDESTRIAN_SEGMENTS, TEST_AREA_INFO } from '../services/routing/pedestrianNetwork';
import { MobilityProfile } from '../models/route.model';

const DEFAULT_PROFILES: Record<string, MobilityProfile> = {
  manual_wheelchair: {
    mode: 'manual_wheelchair',
    modeLabel: 'Manual Wheelchair User',
    maxSlopePercent: 8.0, // Standard 1:12 slope limit
    allowStairs: false,
    requireCurbRamps: true,
    avoidUnpaved: true,
  },
  powered_wheelchair: {
    mode: 'powered_wheelchair',
    modeLabel: 'Power Wheelchair / Scooter',
    maxSlopePercent: 10.0,
    allowStairs: false,
    requireCurbRamps: true,
    avoidUnpaved: true,
  },
  walker_cane: {
    mode: 'walker_cane',
    modeLabel: 'Walker / Cane / Rollator',
    maxSlopePercent: 12.0,
    allowStairs: false, // Step-free preferred
    requireCurbRamps: true,
    avoidUnpaved: true,
  },
  stroller_cart: {
    mode: 'stroller_cart',
    modeLabel: 'Stroller / Wheeled Cart',
    maxSlopePercent: 12.0,
    allowStairs: false,
    requireCurbRamps: true,
    avoidUnpaved: false,
  },
  standard_pedestrian: {
    mode: 'standard_pedestrian',
    modeLabel: 'Standard Pedestrian',
    maxSlopePercent: 25.0,
    allowStairs: true,
    requireCurbRamps: false,
    avoidUnpaved: false,
  },
};

/**
 * Plan accessible route between start and destination
 * POST /api/routes/plan
 */
export const planRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, destination, mobilityProfile } = req.body;

    if (!start || typeof start.lat !== 'number' || typeof start.lng !== 'number') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Start location with numeric lat and lng is required.',
      });
      return;
    }

    if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Destination location with numeric lat and lng is required.',
      });
      return;
    }

    // Default to manual wheelchair profile if none provided
    const resolvedProfile: MobilityProfile = {
      ...(DEFAULT_PROFILES[mobilityProfile?.mode] || DEFAULT_PROFILES.manual_wheelchair),
      ...(mobilityProfile || {}),
    };

    const result = await defaultRoutingEngine.planRoute({
      start,
      destination,
      mobilityProfile: resolvedProfile,
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      error: 'Routing Failed',
      message: err.message || 'Unable to compute an accessible route.',
      testArea: TEST_AREA_INFO,
    });
  }
};

/**
 * Get catalog of pedestrian network segments in the test area
 * GET /api/routes/segments
 */
export const getSegments = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    testArea: TEST_AREA_INFO,
    segmentCount: PEDESTRIAN_SEGMENTS.length,
    segments: PEDESTRIAN_SEGMENTS,
  });
};

/**
 * Get available mobility profiles and their default rules
 * GET /api/routes/profiles
 */
export const getProfiles = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    profiles: DEFAULT_PROFILES,
  });
};

