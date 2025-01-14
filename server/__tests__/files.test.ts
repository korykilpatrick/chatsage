import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db } from '../db';
import { files, messages, users } from '../db/schema';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { setupTestApp } from './setup';
import { createTestUser, loginTestUser } from './setup';
import { eq } from 'drizzle-orm';

// Mock Vite-related modules
jest.mock('../vite', () => ({
  setupVite: jest.fn(),
  serveStatic: jest.fn(),
  log: jest.fn()
}));

describe('File Routes', () => {
  let app: any;
  let testUser: any;
  let authToken: string;
  let testFilePath: string;
  let uploadedFileId: number;

  beforeAll(async () => {
    app = await setupTestApp();
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email);

    // Create test file
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    testFilePath = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFilePath, 'Test file content');
  });

  beforeEach(async () => {
    // Clean up files before each test
    await db.delete(files);
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(files);
    await db.delete(messages);
    await db.delete(users).where(eq(users.id, testUser.id));
    
    // Remove test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('POST /files', () => {
    it('should upload a file', async () => {
      const response = await supertest(app)
        .post('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('url');
      
      uploadedFileId = response.body.id;
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await supertest(app)
        .post('/api/files')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });
  });

  describe('GET /files/:fileId', () => {
    it('should download a file', async () => {
      // First upload a file
      const uploadResponse = await supertest(app)
        .post('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.id;

      const response = await supertest(app)
        .get(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application/);
      expect(response.body).toBeTruthy();
    });

    it('should return 404 for non-existent file', async () => {
      const response = await supertest(app)
        .get('/api/files/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('FILE_NOT_FOUND');
    });
  });

  describe('DELETE /files/:fileId', () => {
    it('should delete a file', async () => {
      // First upload a file
      const uploadResponse = await supertest(app)
        .post('/api/files')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      const fileId = uploadResponse.body.id;

      const response = await supertest(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify file is deleted
      const getResponse = await supertest(app)
        .get(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await supertest(app)
        .delete('/api/files/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('FILE_NOT_FOUND');
    });
  });
});
