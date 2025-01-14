import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../index';
import { db } from '@db/index';
import { files } from '@db/schema';
import { eq } from 'drizzle-orm';

describe('File Handling', () => {
  let authToken: string;
  let testFileId: number;
  
  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = loginResponse.body.accessToken;
  });

  describe('POST /v1/files', () => {
    it('should upload a file successfully', async () => {
      const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt');
      // Create test file
      fs.writeFileSync(testFilePath, 'Test file content');

      const response = await request(app)
        .post('/v1/files')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('url');

      testFileId = response.body.id;

      // Cleanup test file
      fs.unlinkSync(testFilePath);
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/v1/files')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/files/{fileId}', () => {
    it('should download a file successfully', async () => {
      const response = await request(app)
        .get(`/v1/files/${testFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.header['content-disposition']).toBeDefined();
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/v1/files/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /v1/files/{fileId}', () => {
    it('should delete a file successfully', async () => {
      const response = await request(app)
        .delete(`/v1/files/${testFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify file is marked as deleted in database
      const deletedFile = await db.query.files.findFirst({
        where: eq(files.id, testFileId)
      });
      expect(deletedFile?.deleted).toBe(true);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/v1/files/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
