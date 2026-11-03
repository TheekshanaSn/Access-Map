import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import reportRoutes from './report.routes';

const router = Router();

// Mount individual feature routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);

export default router;
