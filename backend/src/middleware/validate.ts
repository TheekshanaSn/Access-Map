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

export const validateReportSubmission = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    placeId,
    placeName,
    isProposedPlace,
    proposedPlaceDetails,
    rampStatus,
    stairsStatus,
    liftStatus,
    accessibleToiletStatus,
    entranceInformation,
    parkingStatus,
    surfaceCondition,
    temporaryObstacle,
    temporaryObstacleDetails,
    notes,
    evidenceImageReferences,
  } = req.body;

  const errors: string[] = [];

  // Validate venue identification
  if (isProposedPlace) {
    if (!proposedPlaceDetails || typeof proposedPlaceDetails !== 'object') {
      errors.push('Proposed venue details are required when reporting an unlisted place');
    } else {
      if (!proposedPlaceDetails.name || typeof proposedPlaceDetails.name !== 'string' || proposedPlaceDetails.name.trim().length < 2) {
        errors.push('Proposed place name is required (minimum 2 characters)');
      }
      if (!proposedPlaceDetails.address || typeof proposedPlaceDetails.address !== 'string' || proposedPlaceDetails.address.trim().length < 3) {
        errors.push('Proposed place address/location is required (minimum 3 characters)');
      }
    }
  } else {
    if (!placeId || typeof placeId !== 'string' || placeId.trim().length === 0) {
      errors.push('Place ID is required for existing venues');
    }
    if (!placeName || typeof placeName !== 'string' || placeName.trim().length === 0) {
      errors.push('Place name is required');
    }
  }

  // Validate accessibility enums (ensuring safe input)
  const validRamps = ['available', 'too_steep', 'obstructed', 'none', 'not_specified'];
  if (rampStatus && !validRamps.includes(rampStatus)) {
    errors.push(`Invalid rampStatus. Allowed values: ${validRamps.join(', ')}`);
  }

  const validStairs = ['no_stairs', 'has_alternative_ramp', 'unavoidable_stairs', 'not_specified'];
  if (stairsStatus && !validStairs.includes(stairsStatus)) {
    errors.push(`Invalid stairsStatus. Allowed values: ${validStairs.join(', ')}`);
  }

  const validLifts = ['available', 'broken_down', 'single_level', 'none', 'not_specified'];
  if (liftStatus && !validLifts.includes(liftStatus)) {
    errors.push(`Invalid liftStatus. Allowed values: ${validLifts.join(', ')}`);
  }

  const validToilets = ['available', 'grab_bars_only', 'inaccessible', 'none', 'not_specified'];
  if (accessibleToiletStatus && !validToilets.includes(accessibleToiletStatus)) {
    errors.push(`Invalid accessibleToiletStatus. Allowed values: ${validToilets.join(', ')}`);
  }

  const validEntrances = ['step_free', 'ramp_access', 'steps_only', 'automatic_door', 'standard_door', 'not_specified'];
  if (entranceInformation && !validEntrances.includes(entranceInformation)) {
    errors.push(`Invalid entranceInformation. Allowed values: ${validEntrances.join(', ')}`);
  }

  const validParking = ['accessible_bays', 'drop_off_only', 'general_only', 'none', 'not_specified'];
  if (parkingStatus && !validParking.includes(parkingStatus)) {
    errors.push(`Invalid parkingStatus. Allowed values: ${validParking.join(', ')}`);
  }

  const validSurfaces = ['smooth_paved', 'cobblestone', 'gravel_uneven', 'mixed', 'not_specified'];
  if (surfaceCondition && !validSurfaces.includes(surfaceCondition)) {
    errors.push(`Invalid surfaceCondition. Allowed values: ${validSurfaces.join(', ')}`);
  }

  // Temporary obstacle validation
  if (temporaryObstacle && (!temporaryObstacleDetails || typeof temporaryObstacleDetails !== 'string' || temporaryObstacleDetails.trim().length === 0)) {
    errors.push('Details are required when reporting a temporary accessibility obstacle');
  }

  // Notes length limit
  if (notes && typeof notes === 'string' && notes.length > 2000) {
    errors.push('Notes cannot exceed 2000 characters');
  }

  // Images reference array
  if (evidenceImageReferences && !Array.isArray(evidenceImageReferences)) {
    errors.push('evidenceImageReferences must be an array of image URL references');
  } else if (Array.isArray(evidenceImageReferences) && evidenceImageReferences.length > 5) {
    errors.push('A maximum of 5 evidence images can be referenced per report');
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
  const allowedStatuses = ['approved', 'rejected', 'needs_review'];

  if (!status || !allowedStatuses.includes(status)) {
    res.status(400).json({
      error: 'Validation Error',
      message: `Status must be one of: ${allowedStatuses.join(', ')}`,
    });
    return;
  }

  next();
};
