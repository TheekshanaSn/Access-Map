import { Request, Response } from 'express';
import { User, UserRole } from '../models/user.model';
import { generateToken, setAuthCookie, clearAuthCookie } from '../middleware/auth';
import { findUserByEmail, findUserById, createUser } from '../services/userStore';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check for duplicate email
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists',
      });
      return;
    }

    // 2. Hash password securely using bcrypt
    const passwordHash = await User.hashPassword(password);

    // 3. Assign role (default to 'user', allow specified role if valid)
    const assignedRole: UserRole =
      role && ['user', 'moderator', 'admin'].includes(role)
        ? (role as UserRole)
        : 'user';

    // 4. Create user record (persists to MongoDB or in-memory fallback store)
    const user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
    });

    // 5. Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Set secure HttpOnly cookie
    setAuthCookie(res, token);

    // 7. Return safe user data (passwordHash excluded automatically by toJSON)
    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Registration Failed',
      message: err.message || 'An unexpected error occurred during registration',
    });
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Query user with passwordHash
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      // Safe generic error message prevents email harvesting/enumeration
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // 2. Verify password with bcrypt
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      return;
    }

    // 3. Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 4. Set secure HttpOnly cookie
    setAuthCookie(res, token);

    // 5. Return safe user data
    res.status(200).json({
      message: 'Logged in successfully',
      user: user.toJSON(),
      token,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Login Failed',
      message: err.message || 'An unexpected error occurred during login',
    });
  }
};

/**
 * Log out user by clearing cookie
 * POST /api/auth/logout
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.status(200).json({
    message: 'Successfully logged out',
  });
};

/**
 * Get currently authenticated user
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const user = await findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User profile no longer exists',
      });
      return;
    }

    res.status(200).json({
      user: user.toJSON(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve profile',
      message: err.message || 'An unexpected error occurred',
    });
  }
};
