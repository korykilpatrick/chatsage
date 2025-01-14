import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '@db/index';
import { files } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload file
router.post('/', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: {
          code: 'FILE_REQUIRED',
          message: 'Please provide a file to upload'
        }
      });
    }

    const fileRecord = await db.insert(files).values({
      userId: req.user.id,
      messageId: null,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      fileHash: null,
      uploadTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return res.status(201).json({
      id: fileRecord[0].id,
      filename: fileRecord[0].filename,
      url: fileRecord[0].fileUrl
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to process file upload'
      }
    });
  }
});

// Download/view file
router.get('/:fileId', requireAuth, async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId);
    const fileRecord = await db.query.files.findFirst({
      where: eq(files.id, fileId)
    });

    if (!fileRecord) {
      return res.status(404).json({
        error: 'File not found',
        details: {
          code: 'FILE_NOT_FOUND',
          message: 'The requested file does not exist'
        }
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', path.basename(fileRecord.fileUrl));

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        details: {
          code: 'FILE_NOT_FOUND',
          message: 'The requested file is not available'
        }
      });
    }

    res.download(filePath, fileRecord.filename);
  } catch (error) {
    console.error('File download error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: {
        code: 'DOWNLOAD_FAILED',
        message: 'Failed to process file download'
      }
    });
  }
});

// Mark file as deleted (soft delete)
router.delete('/:fileId', requireAuth, async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId);
    const fileRecord = await db.query.files.findFirst({
      where: eq(files.id, fileId)
    });

    if (!fileRecord) {
      return res.status(404).json({
        error: 'File not found',
        details: {
          code: 'FILE_NOT_FOUND',
          message: 'The requested file does not exist'
        }
      });
    }

    // Update file record to mark as deleted
    await db.update(files)
      .set({ updatedAt: new Date() })
      .where(eq(files.id, fileId));

    return res.status(204).send();
  } catch (error) {
    console.error('File deletion error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete file'
      }
    });
  }
});

export default router;