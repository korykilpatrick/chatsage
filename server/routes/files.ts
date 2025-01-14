import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '@db/index';
import { files } from '@db/schema';
import { eq } from 'drizzle-orm';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = Router();

// Upload file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = {
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      uploadTime: new Date(),
      messageId: req.body.messageId ? parseInt(req.body.messageId) : null,
      userId: req.user?.id // Will be set if authentication is implemented
    };

    const [newFile] = await db.insert(files).values(fileData).returning();

    res.status(201).json({
      id: newFile.id,
      filename: newFile.filename,
      mimeType: newFile.fileType,
      size: newFile.fileSize,
      uploadedAt: newFile.uploadTime,
      url: newFile.fileUrl
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download/view file
router.get('/:fileId', async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    const file = await db.query.files.findFirst({
      where: eq(files.id, fileId)
    });

    if (!file) {
      return res.status(404).json({ error: 'FILE_NOT_FOUND' });
    }

    const filePath = path.join(__dirname, '../..', file.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'FILE_NOT_FOUND' });
    }

    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId);
    const file = await db.query.files.findFirst({
      where: eq(files.id, fileId)
    });

    if (!file) {
      return res.status(404).json({ error: 'FILE_NOT_FOUND' });
    }

    // Delete file from storage
    const filePath = path.join(__dirname, '../..', file.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete file record from database
    await db.delete(files).where(eq(files.id, fileId));

    res.status(204).send();
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
