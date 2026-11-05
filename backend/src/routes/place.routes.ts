import { Router } from 'express';
import {
  getPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  detectDuplicatePlaces,
  resolveDuplicatePlace,
} from '../controllers/place.controller';
import { authenticate, requireModeratorOrAdmin } from '../middleware/auth';

const router = Router();

// Public place discovery routes
router.get('/', getPlaces);

// Duplicate detection (must precede /:id)
router.get('/duplicates/detect', authenticate, requireModeratorOrAdmin, detectDuplicatePlaces);
router.post('/duplicates/resolve', authenticate, requireModeratorOrAdmin, resolveDuplicatePlace);

// Public place details route
router.get('/:id', getPlaceById);

// Protected place editing & creation
router.post('/', authenticate, requireModeratorOrAdmin, createPlace);
router.put('/:id', authenticate, requireModeratorOrAdmin, updatePlace);

export default router;

