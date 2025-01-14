import request from 'supertest';
import { setupTestApp } from './setup';
import { db } from '@db';
import { workspaces } from '@db/schema';
import { eq } from 'drizzle-orm';

describe('Workspace Management', () => {
  let app: any;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    app = await setupTestApp();
    agent = request.agent(app);

    // Login before running tests
    const response = await agent
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });

    // Verify login was successful
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Login successful');
  });

  describe('POST /api/workspaces', () => {
    it('should create a workspace successfully', async () => {
      const workspaceData = {
        name: 'Test Workspace',
        description: 'A workspace for testing'
      };

      const response = await agent
        .post('/api/workspaces')
        .send(workspaceData)
        .expect('Content-Type', /json/)
        .expect(201);

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
      const response = await agent
        .post('/api/workspaces')
        .send({
          description: 'Missing name'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body.message).toBe('Workspace name is required');
    });

    it('should return 401 when not authenticated', async () => {
      // Use a new agent without authentication
      const unauthenticatedAgent = request(app);

      const response = await unauthenticatedAgent
        .post('/api/workspaces')
        .send({
          name: 'Unauthorized Workspace',
          description: 'This should fail'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });
});