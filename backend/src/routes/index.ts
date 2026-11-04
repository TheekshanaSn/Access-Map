import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import reportRoutes from './report.routes';
import placeRoutes from './place.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Mount individual feature routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/places', placeRoutes);
router.use('/admin', adminRoutes);

export default router;
