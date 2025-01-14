import request from 'supertest';
import { setupTestApp } from './setup';
import { db } from '@db';
import { workspaces } from '@db/schema';
import { eq } from 'drizzle-orm';

describe('Workspace Management', () => {
  let app: any;
  let cookie: string;

  beforeAll(async () => {
    app = await setupTestApp();

    // Login to get session cookie
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });

    cookie = loginResponse.headers['set-cookie'][0];
  });

  describe('POST /api/workspaces', () => {
    it('should create a workspace successfully', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A workspace for testing'
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Cookie', cookie)
        .send(workspaceData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(workspaceData.name);
      expect(response.body.description).toBe(workspaceData.description);
      expect(response.body.archived).toBe(false);

      // Verify workspace was created in database
      const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.id, response.body.id)
      });

      expect(workspace).toBeDefined();
      expect(workspace?.name).toBe(workspaceData.name);
    });

    it('should return 400 when workspace name is missing', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Cookie', cookie)
        .send({
          description: 'Missing name'
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid request');
      expect(response.body.message).toBe('Workspace name is required');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .send({
          name: 'Unauthorized Workspace',
          description: 'This should fail'
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Not authenticated');
    });
  });
});