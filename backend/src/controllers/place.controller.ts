import { Request, Response } from 'express';
import {
  createPlaceInStore,
  findPlaceById,
  findPlacesInStore,
  updatePlaceInStore,
  detectDuplicatePlacesInStore,
  resolveDuplicatePlaceInStore,
} from '../services/placeStore';
import { recordAuditLog } from '../services/auditLogStore';

/**
 * Get catalog of accessible places
 * GET /api/places
 * Public with optional filtering & pagination
 */
export const getPlaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, verifiedStatus, search, page, limit } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (verifiedStatus) filter.verifiedStatus = verifiedStatus;

    const result = await findPlacesInStore(filter, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search ? String(search) : undefined,
    });

    res.status(200).json({
      places: result.places.map((p) => p.toJSON()),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve places',
      message: err.message,
    });
  }
};

/**
 * Get place by ID
 * GET /api/places/:id
 * Public
 */
export const getPlaceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const place = await findPlaceById(id);

    if (!place) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Place not found in catalog',
      });
      return;
    }

    res.status(200).json({
      place: place.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve place',
      message: err.message,
    });
  }
};

/**
 * Create a new place
 * POST /api/places
 * Protected: Moderators and Admins only
 */
export const createPlace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, categoryLabel, address, coordinates, amenities, shortDescription, fullDescription } = req.body;

    if (!name || !category || !address?.street || !address?.city || !coordinates) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Name, category, street, city, and coordinates are required to catalogue a place',
      });
      return;
    }

    const place = await createPlaceInStore({
      name: name.trim(),
      category,
      categoryLabel: categoryLabel || category,
      address,
      coordinates,
      amenities,
      shortDescription: shortDescription || '',
      fullDescription: fullDescription || '',
      verifiedStatus: 'staff_verified',
      isDemoData: false,
    });

    // Record audit log
    if (req.user) {
      await recordAuditLog({
        action: 'PLACE_CREATED',
        performedBy: {
          userId: req.user.userId,
          name: req.user.email,
          email: req.user.email,
          role: req.user.role,
        },
        targetType: 'place',
        targetId: (place as any).id || (place as any)._id?.toString() || '',
        targetName: place.name,
        details: { category: place.category, city: place.address.city },
      });
    }

    res.status(201).json({
      message: 'Place created and verified successfully',
      place: place.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create place',
      message: err.message,
    });
  }
};

/**
 * Update place details (inaccurate information correction)
 * PUT /api/places/:id
 * Protected: Moderators and Admins only
 */
export const updatePlace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, ...updates } = req.body;

    const existing = await findPlaceById(id);
    if (!existing) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Place not found',
      });
      return;
    }

    const updated = await updatePlaceInStore(id, updates);
    if (!updated) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Failed to update place',
      });
      return;
    }

    // Record audit log
    if (req.user) {
      await recordAuditLog({
        action: 'PLACE_UPDATED',
        performedBy: {
          userId: req.user.userId,
          name: req.user.email,
          email: req.user.email,
          role: req.user.role,
        },
        targetType: 'place',
        targetId: id,
        targetName: updated.name,
        reason: reason || 'Updated venue accessibility details',
        details: { modifiedFields: Object.keys(updates) },
      });
    }

    res.status(200).json({
      message: 'Place details updated successfully',
      place: updated.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update place',
      message: err.message,
    });
  }
};

/**
 * Detect possible duplicate places
 * GET /api/places/duplicates/detect
 * Protected: Moderators and Admins only
 */
export const detectDuplicatePlaces = async (_req: Request, res: Response): Promise<void> => {
  try {
    const duplicates = await detectDuplicatePlacesInStore();

    res.status(200).json({
      count: duplicates.length,
      duplicates,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to detect duplicate places',
      message: err.message,
    });
  }
};

/**
 * Resolve duplicate place pair (mark as duplicate or dismiss)
 * POST /api/places/duplicates/resolve
 * Protected: Moderators and Admins only
 */
export const resolveDuplicatePlace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { primaryId, duplicateId, action, reason } = req.body;

    if (!primaryId || !duplicateId || !action || !['mark_duplicate', 'dismiss'].includes(action)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'primaryId, duplicateId, and a valid action (mark_duplicate or dismiss) are required',
      });
      return;
    }

    const success = await resolveDuplicatePlaceInStore(primaryId, duplicateId, action);
    if (!success) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Could not resolve duplicate place',
      });
      return;
    }

    // Record audit log
    if (req.user) {
      await recordAuditLog({
        action: 'PLACE_DUPLICATE_RESOLVED',
        performedBy: {
          userId: req.user.userId,
          name: req.user.email,
          email: req.user.email,
          role: req.user.role,
        },
        targetType: 'place',
        targetId: duplicateId,
        targetName: `Duplicate resolution for ${primaryId}`,
        reason: reason || `Resolved duplicate pair with action: ${action}`,
        details: { primaryId, duplicateId, action },
      });
    }

    res.status(200).json({
      message: `Duplicate pair resolved successfully (${action})`,
      primaryId,
      duplicateId,
      action,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to resolve duplicate place',
      message: err.message,
    });
  }
};
