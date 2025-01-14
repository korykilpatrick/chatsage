import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../index';
import { db } from '@db/index';
import { files } from '@db/schema';
import { eq } from 'drizzle-orm';

describe('File Operations', () => {
  const testFilePath = path.join(__dirname, 'test-assets/test-file.txt');
  const testFileContent = 'Test file content';

  beforeAll(async () => {
    // Create test assets directory if it doesn't exist
    const testAssetsDir = path.join(__dirname, 'test-assets');
    if (!fs.existsSync(testAssetsDir)) {
      fs.mkdirSync(testAssetsDir, { recursive: true });
    }
    // Create a test file
    fs.writeFileSync(testFilePath, testFileContent);
  });

  afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    // Clean up test assets directory
    const testAssetsDir = path.join(__dirname, 'test-assets');
    if (fs.existsSync(testAssetsDir)) {
      fs.rmdirSync(testAssetsDir);
    }
    // Clean up any uploaded test files
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file.startsWith('test-')) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
    }
  });

  describe('POST /v1/files', () => {
    it('should upload a file successfully', async () => {
      const response = await request(app)
        .post('/v1/files')
        .attach('file', testFilePath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('mimeType');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('uploadedAt');
      expect(response.body).toHaveProperty('url');
    });

    it('should fail without a file', async () => {
      const response = await request(app)
        .post('/v1/files')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('No file uploaded');
    });
  });

  describe('GET /v1/files/:fileId', () => {
    let uploadedFileId: number;

    beforeAll(async () => {
      // Upload a file first
      const response = await request(app)
        .post('/v1/files')
        .attach('file', testFilePath);
      uploadedFileId = response.body.id;
    });

    it('should download a file successfully', async () => {
      const response = await request(app)
        .get(`/v1/files/${uploadedFileId}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain');
      expect(response.text).toBe(testFileContent);
    });

    it('should return 404 for non-existent file', async () => {
      await request(app)
        .get('/v1/files/99999')
        .expect(404);
    });
  });

  describe('DELETE /v1/files/:fileId', () => {
    let uploadedFileId: number;

    beforeEach(async () => {
      // Upload a file before each test
      const response = await request(app)
        .post('/v1/files')
        .attach('file', testFilePath);
      uploadedFileId = response.body.id;
    });

    it('should delete a file successfully', async () => {
      await request(app)
        .delete(`/v1/files/${uploadedFileId}`)
        .expect(204);

      // Verify file is deleted from database
      const deletedFile = await db.query.files.findFirst({
        where: eq(files.id, uploadedFileId)
      });
      expect(deletedFile).toBeNull();
    });

    it('should return 404 for non-existent file', async () => {
      await request(app)
        .delete('/v1/files/99999')
        .expect(404);
    });
  });
});
