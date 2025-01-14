import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db } from '@db/index';
import { workspaces, users, userWorkspaces } from '@db/schema';
import supertest from 'supertest';
import { app } from '../index';
import { createTestUser, loginTestUser } from './setup';

const request = supertest(app);

describe('Workspace Routes', () => {
  let testUser: any;
  let authToken: string;
  let workspaceId: number;

  beforeAll(async () => {
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email);
  });

  beforeEach(async () => {
    // Clean up workspaces before each test
    await db.delete(userWorkspaces);
    await db.delete(workspaces);
  });

  afterAll(async () => {
    await db.delete(userWorkspaces);
    await db.delete(workspaces);
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  describe('POST /workspaces', () => {
    it('should create a new workspace', async () => {
      const response = await request
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A test workspace'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Workspace');
      expect(response.body.description).toBe('A test workspace');
      expect(response.body.archived).toBe(false);

      workspaceId = response.body.id;
    });
  });

  describe('GET /workspaces', () => {
    it('should list all workspaces', async () => {
      const response = await request
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /workspaces/:workspaceId', () => {
    it('should get workspace details', async () => {
      // First create a workspace
      const createResponse = await request
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A test workspace'
        });
      
      workspaceId = createResponse.body.id;

      const response = await request
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', workspaceId);
      expect(response.body.name).toBe('Test Workspace');
    });

    it('should return 404 for non-existent workspace', async () => {
      const response = await request
        .get('/api/workspaces/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('WORKSPACE_NOT_FOUND');
    });
  });

  describe('PUT /workspaces/:workspaceId', () => {
    it('should update workspace details', async () => {
      // First create a workspace
      const createResponse = await request
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A test workspace'
        });
      
      workspaceId = createResponse.body.id;

      const response = await request
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Workspace',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Workspace');
      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('DELETE /workspaces/:workspaceId', () => {
    it('should archive a workspace', async () => {
      // First create a workspace
      const createResponse = await request
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A test workspace'
        });
      
      workspaceId = createResponse.body.id;

      const response = await request
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify workspace is archived
      const getResponse = await request
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.archived).toBe(true);
    });
  });

  describe('Workspace Members', () => {
    it('should add a member to workspace', async () => {
      // Create another test user to add as member
      const newMember = await createTestUser('member@test.com');

      const response = await request
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: newMember.id,
          role: 'MEMBER'
        });

      expect(response.status).toBe(201);
    });

    it('should remove a member from workspace', async () => {
      const newMember = await createTestUser('member2@test.com');

      // First add the member
      await request
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: newMember.id,
          role: 'MEMBER'
        });

      // Then remove them
      const response = await request
        .delete(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: newMember.id });

      expect(response.status).toBe(204);
    });
  });
});
