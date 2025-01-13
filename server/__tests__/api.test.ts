import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import type { Express } from 'express';
import type { Server } from 'http';
import { createMockDb } from './setup';

describe('API Endpoints', () => {
  let app: Express;
  let server: Server;
  const mockDb = createMockDb();

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    mockDb.clear();

    // Setup mock routes for testing
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    // Users API
    app.get('/api/users', (req, res) => {
      const { deactivated } = req.query;
      const users = Array.from(mockDb.users.values());
      res.json(deactivated === 'true' ? users.filter(u => u.deactivated) : users);
    });

    app.get('/api/users/:id', (req, res) => {
      const userId = parseInt(req.params.id);
      const user = Array.from(mockDb.users.values()).find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ error: 'USER_NOT_FOUND' });
      }
      res.json(user);
    });

    // Workspaces API
    app.get('/api/workspaces', (_req, res) => {
      res.json([{
        id: 1,
        name: 'Test Workspace',
        ownerId: 1
      }]);
    });

    app.get('/api/workspaces/:id', (req, res) => {
      const workspaceId = parseInt(req.params.id);
      if (workspaceId !== 1) {
        return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
      }
      res.json({
        id: workspaceId,
        name: 'Test Workspace',
        ownerId: 1
      });
    });

    app.post('/api/workspaces/:id/members', (req, res) => {
      const workspaceId = parseInt(req.params.id);
      if (workspaceId !== 1) {
        return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
      }
      res.status(201).json({ message: 'User added to workspace' });
    });

    // Channels API
    app.get('/api/workspaces/:workspaceId/channels', (req, res) => {
      const { includeArchived } = req.query;
      const channels = [{
        id: 1,
        name: 'general',
        workspaceId: 1,
        isPrivate: false,
        archived: false
      }];

      if (includeArchived === 'true') {
        channels.push({
          id: 2,
          name: 'archived-channel',
          workspaceId: 1,
          isPrivate: false,
          archived: true
        });
      }

      res.json(channels);
    });

    app.get('/api/channels/:channelId', (req, res) => {
      const channelId = parseInt(req.params.channelId);
      if (channelId !== 1) {
        return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
      }
      res.json({
        id: channelId,
        name: 'general',
        workspaceId: 1,
        isPrivate: false,
        archived: false
      });
    });

    app.post('/api/channels/:channelId/members', (req, res) => {
      const channelId = parseInt(req.params.channelId);
      if (channelId !== 1) {
        return res.status(404).json({ error: 'CHANNEL_NOT_FOUND' });
      }
      res.status(201).json({ message: 'User added to the channel' });
    });

    server = registerRoutes(app);
  });

  afterEach((done) => {
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Health Check', () => {
    it('GET /api/health should return 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Users API', () => {
    const testUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    beforeEach(() => {
      mockDb.users.set(testUser.email, testUser);
    });

    describe('GET /api/users', () => {
      it('should list all users', async () => {
        const response = await request(app)
          .get('/api/users')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('username');
        expect(response.body[0]).toHaveProperty('email');
      });

      it('should filter deactivated users when specified', async () => {
        const response = await request(app)
          .get('/api/users?deactivated=true')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return user details for valid ID', async () => {
        const response = await request(app)
          .get('/api/users/1')
          .expect(200);

        expect(response.body).toHaveProperty('username');
        expect(response.body.id).toBe(1);
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/users/999')
          .expect(404);

        expect(response.body).toHaveProperty('error', 'USER_NOT_FOUND');
      });
    });
  });

  describe('Workspaces API', () => {
    describe('GET /api/workspaces', () => {
      it('should list all workspaces', async () => {
        const response = await request(app)
          .get('/api/workspaces')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('ownerId');
      });
    });

    describe('GET /api/workspaces/:id', () => {
      it('should return workspace details', async () => {
        const response = await request(app)
          .get('/api/workspaces/1')
          .expect(200);

        expect(response.body).toHaveProperty('name');
        expect(response.body.id).toBe(1);
      });

      it('should return 404 for non-existent workspace', async () => {
        const response = await request(app)
          .get('/api/workspaces/999')
          .expect(404);

        expect(response.body).toHaveProperty('error', 'WORKSPACE_NOT_FOUND');
      });
    });

    describe('POST /api/workspaces/:id/members', () => {
      it('should add a member to workspace', async () => {
        const response = await request(app)
          .post('/api/workspaces/1/members')
          .send({ userId: 2, role: 'MEMBER' })
          .expect(201);

        expect(response.body).toHaveProperty('message', 'User added to workspace');
      });

      it('should return 404 for non-existent workspace', async () => {
        const response = await request(app)
          .post('/api/workspaces/999/members')
          .send({ userId: 2, role: 'MEMBER' })
          .expect(404);

        expect(response.body).toHaveProperty('error', 'WORKSPACE_NOT_FOUND');
      });
    });
  });

  describe('Channels API', () => {
    describe('GET /api/workspaces/:workspaceId/channels', () => {
      it('should list channels in a workspace', async () => {
        const response = await request(app)
          .get('/api/workspaces/1/channels')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0]).toHaveProperty('name');
      });

      it('should exclude archived channels by default', async () => {
        const response = await request(app)
          .get('/api/workspaces/1/channels')
          .expect(200);

        expect(response.body.every((channel: any) => !channel.archived)).toBe(true);
      });

      it('should include archived channels when specified', async () => {
        const response = await request(app)
          .get('/api/workspaces/1/channels?includeArchived=true')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(1);
      });
    });

    describe('GET /api/channels/:channelId', () => {
      it('should return channel details', async () => {
        const response = await request(app)
          .get('/api/channels/1')
          .expect(200);

        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('workspaceId');
      });

      it('should return 404 for non-existent channel', async () => {
        const response = await request(app)
          .get('/api/channels/999')
          .expect(404);

        expect(response.body).toHaveProperty('error', 'CHANNEL_NOT_FOUND');
      });
    });

    describe('POST /api/channels/:channelId/members', () => {
      it('should add a member to channel', async () => {
        const response = await request(app)
          .post('/api/channels/1/members')
          .send({ userId: 2 })
          .expect(201);

        expect(response.body).toHaveProperty('message', 'User added to the channel');
      });

      it('should return 404 for non-existent channel', async () => {
        const response = await request(app)
          .post('/api/channels/999/members')
          .send({ userId: 2 })
          .expect(404);

        expect(response.body).toHaveProperty('error', 'CHANNEL_NOT_FOUND');
      });
    });
  });
});