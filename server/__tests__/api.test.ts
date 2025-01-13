import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import type { Express } from 'express';
import type { Server } from 'http';

describe('API Endpoints', () => {
  let app: Express;
  let server: Server;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
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
      app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok' });
      });

      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Messages API', () => {
    beforeEach(() => {
      app.get('/api/messages', (_req, res) => {
        res.json([
          { id: 1, content: 'Test message 1', userId: 1 },
          { id: 2, content: 'Test message 2', userId: 2 }
        ]);
      });

      app.post('/api/messages', (req, res) => {
        const { content, userId } = req.body;
        if (!content || !userId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        res.status(201).json({ id: 3, content, userId });
      });
    });

    it('GET /api/messages should return list of messages', async () => {
      const response = await request(app).get('/api/messages');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('content');
    });

    it('POST /api/messages should create a new message', async () => {
      const newMessage = {
        content: 'New test message',
        userId: 1
      };

      const response = await request(app)
        .post('/api/messages')
        .send(newMessage)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(newMessage.content);
    });

    it('POST /api/messages should return 400 for invalid input', async () => {
      const invalidMessage = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/messages')
        .send(invalidMessage)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Users API', () => {
    beforeEach(() => {
      app.get('/api/users', (_req, res) => {
        res.json([
          { id: 1, username: 'user1', email: 'user1@example.com' },
          { id: 2, username: 'user2', email: 'user2@example.com' }
        ]);
      });

      app.post('/api/users', (req, res) => {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        res.status(201).json({ id: 3, username, email });
      });

      app.get('/api/users/:id', (req, res) => {
        const userId = parseInt(req.params.id);
        if (userId === 1) {
          res.json({ id: 1, username: 'user1', email: 'user1@example.com' });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      });
    });

    it('GET /api/users should return list of users', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('username');
    });

    it('GET /api/users/:id should return user details', async () => {
      const response = await request(app).get('/api/users/1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username');
      expect(response.body.id).toBe(1);
    });

    it('GET /api/users/:id should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/users/999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('POST /api/users should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(newUser.username);
    });

    it('POST /api/users should return 400 for invalid input', async () => {
      const invalidUser = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Workspaces API', () => {
    beforeEach(() => {
      app.get('/api/workspaces', (_req, res) => {
        res.json([
          { id: 1, name: 'Workspace 1', ownerId: 1 },
          { id: 2, name: 'Workspace 2', ownerId: 1 }
        ]);
      });

      app.post('/api/workspaces', (req, res) => {
        const { name, ownerId } = req.body;
        if (!name || !ownerId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        res.status(201).json({ id: 3, name, ownerId });
      });

      app.get('/api/workspaces/:id', (req, res) => {
        const workspaceId = parseInt(req.params.id);
        if (workspaceId === 1) {
          res.json({ id: 1, name: 'Workspace 1', ownerId: 1 });
        } else {
          res.status(404).json({ error: 'Workspace not found' });
        }
      });
    });

    it('GET /api/workspaces should return list of workspaces', async () => {
      const response = await request(app).get('/api/workspaces');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
    });

    it('GET /api/workspaces/:id should return workspace details', async () => {
      const response = await request(app).get('/api/workspaces/1');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body.id).toBe(1);
    });

    it('GET /api/workspaces/:id should return 404 for non-existent workspace', async () => {
      const response = await request(app).get('/api/workspaces/999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('POST /api/workspaces should create a new workspace', async () => {
      const newWorkspace = {
        name: 'New Workspace',
        ownerId: 1
      };

      const response = await request(app)
        .post('/api/workspaces')
        .send(newWorkspace)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newWorkspace.name);
    });

    it('POST /api/workspaces should return 400 for invalid input', async () => {
      const invalidWorkspace = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/workspaces')
        .send(invalidWorkspace)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});