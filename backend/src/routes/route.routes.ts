import { Router } from 'express';
import { planRoute, getSegments, getProfiles } from '../controllers/route.controller';

const router = Router();

// Calculate accessibility-aware pedestrian route
router.post('/plan', planRoute);

// Inspect network segments and profile configurations
router.get('/segments', getSegments);
router.get('/profiles', getProfiles);

export default router;

