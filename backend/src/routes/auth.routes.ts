import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validate';

const router = Router();

// Public auth endpoints
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

// Protected auth endpoints
router.get('/me', authenticate, getMe);

export default router;

