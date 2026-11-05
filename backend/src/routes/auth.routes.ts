import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public auth endpoints protected by rate limiting to mitigate brute-force
router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);
router.post('/logout', logout);

// Protected auth endpoints
router.get('/me', authenticate, getMe);

export default router;
