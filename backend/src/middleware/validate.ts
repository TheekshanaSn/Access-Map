import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email, password, role } = req.body;
  const errors: string[] = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  // Email validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (!/(?=.*[0-9])|(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }

  // Prevent self-assigning privileged roles through public register endpoint
  if (role && !['user', 'moderator', 'admin'].includes(role)) {
    errors.push('Invalid user role specified');
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      messages: errors,
    });
    return;
  }

  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation Error',
      messages: errors,
    });
    return;
  }

  next();
};

export const validateReportStatus = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { status } = req.body;
  const allowedStatuses = ['approved', 'rejected'];

  if (!status || !allowedStatuses.includes(status)) {
    res.status(400).json({
      error: 'Validation Error',
      message: `Status must be one of: ${allowedStatuses.join(', ')}`,
    });
    return;
  }

  next();
};

