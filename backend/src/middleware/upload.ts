import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Target directory for uploaded accessibility report evidence photos
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const REPORT_UPLOADS_DIR = path.join(UPLOAD_ROOT, 'reports');

// Ensure upload directory exists
if (!fs.existsSync(REPORT_UPLOADS_DIR)) {
  fs.mkdirSync(REPORT_UPLOADS_DIR, { recursive: true });
}

// Storage configuration with sanitized unique filename
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(REPORT_UPLOADS_DIR)) {
      fs.mkdirSync(REPORT_UPLOADS_DIR, { recursive: true });
    }
    cb(null, REPORT_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const safeExt = allowedExts.includes(rawExt) ? rawExt : '.jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    cb(null, `report-${timestamp}-${randomSuffix}${safeExt}`);
  },
});

// File filter: strict validation of MIME types and extensions
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP image files are accepted.'));
    return;
  }

  cb(null, true);
};

// 5 MB maximum file size, up to 5 photos per report
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 5,
  },
});

/**
 * Multer middleware wrapper that catches multer errors (e.g. file too large, invalid type)
 * and returns consistent JSON HTTP 400 responses.
 */
export const uploadReportImages = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const uploadHandler = upload.array('photos', 5);

  uploadHandler(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            error: 'File Too Large',
            message: 'Image size exceeds the 5 MB limit. Please compress or select a smaller photo.',
          });
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({
            error: 'Too Many Files',
            message: 'You can upload a maximum of 5 evidence photos per report.',
          });
          return;
        }
        res.status(400).json({
          error: 'Upload Error',
          message: err.message,
        });
        return;
      }

      // Non-multer error (e.g. invalid file type from fileFilter)
      res.status(400).json({
        error: 'Invalid File',
        message: err.message || 'Failed to process uploaded file.',
      });
      return;
    }

    next();
  });
};

