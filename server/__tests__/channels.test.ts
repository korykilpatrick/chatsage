import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { channels as channelsTable, users, workspaces } from '@db/schema';
import channelsRouter from '../routes/channels';

describe('Channels API', () => {
  let app: express.Express;
  let testUser: any;
  let testWorkspace: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Set Content-Type header for all responses
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // Clean up test data
    await db.delete(channelsTable);
    await db.delete(workspaces);
    await db.delete(users);

    // Create test user
    [testUser] = await db.insert(users).values({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      displayName: 'Test User'
    }).returning();

    // Create test workspace
    [testWorkspace] = await db.insert(workspaces).values({
      name: 'Test Workspace',
      ownerId: testUser.id
    }).returning();
  });

  afterEach(async () => {
    // Final cleanup
    await db.delete(channelsTable);
    await db.delete(workspaces);
    await db.delete(users);
  });

  describe('GET /api/workspaces/:workspaceId/channels', () => {
    it('should return 401 when not authenticated', async () => {
      app.use('/api', channelsRouter);

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace.id}/channels`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });

    it('should return empty array when no channels exist', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      app.use('/api', channelsRouter);

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace.id}/channels`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('channels');
      expect(Array.isArray(response.body.channels)).toBe(true);
      expect(response.body.channels).toHaveLength(0);
    });

    it('should return list of channels when channels exist', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      app.use('/api', channelsRouter);

      // Create test channel
      const [channel] = await db.insert(channelsTable).values({
        name: 'general',
        workspaceId: testWorkspace.id,
        type: 'PUBLIC',
        createdBy: testUser.id
      }).returning();

      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace.id}/channels`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('channels');
      expect(Array.isArray(response.body.channels)).toBe(true);
      expect(response.body.channels).toHaveLength(1);
      expect(response.body.channels[0]).toMatchObject({
        id: channel.id,
        name: 'general',
        workspaceId: testWorkspace.id,
        type: 'PUBLIC'
      });
    });

    it('should handle invalid workspace ID', async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      app.use('/api', channelsRouter);

      const response = await request(app)
        .get('/api/workspaces/999/channels')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Workspace not found');
    });
  });

  describe('POST /api/workspaces/:workspaceId/channels', () => {
    beforeEach(() => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      app.use('/api', channelsRouter);
    });

    it('should create a new channel', async () => {
      const channelData = {
        name: 'new-channel',
        type: 'PUBLIC'
      };

      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace.id}/channels`)
        .send(channelData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        name: channelData.name,
        workspaceId: testWorkspace.id,
        type: channelData.type
      });

      // Verify channel was actually created in database
      const [dbChannel] = await db
        .select()
        .from(channelsTable)
        .where(eq(channelsTable.id, response.body.id));

      expect(dbChannel).toBeTruthy();
      expect(dbChannel.name).toBe(channelData.name);
    });

    it('should return 400 for invalid channel name', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace.id}/channels`)
        .send({ name: '', type: 'PUBLIC' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Channel name cannot be empty');
    });

    it('should return 404 for invalid workspace ID', async () => {
      const response = await request(app)
        .post('/api/workspaces/999/channels')
        .send({ name: 'test-channel', type: 'PUBLIC' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Workspace not found');
    });
  });

  describe('GET /api/channels/:channelId', () => {
    let testChannel: any;

    beforeEach(async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      app.use('/api', channelsRouter);

      // Create a test channel
      [testChannel] = await db.insert(channelsTable).values({
        name: 'test-channel',
        workspaceId: testWorkspace.id,
        type: 'PUBLIC',
        createdBy: testUser.id
      }).returning();
    });

    it('should return channel details', async () => {
      const response = await request(app)
        .get(`/api/channels/${testChannel.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: testChannel.id,
        name: testChannel.name,
        workspaceId: testWorkspace.id,
        type: 'PUBLIC'
      }));
    });

    it('should return 404 for non-existent channel', async () => {
      const response = await request(app)
        .get('/api/channels/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });
  });

  describe('PUT /api/channels/:channelId', () => {
    let testChannel: any;

    beforeEach(async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      app.use('/api', channelsRouter);

      // Create a test channel
      [testChannel] = await db.insert(channelsTable).values({
        name: 'test-channel',
        workspaceId: testWorkspace.id,
        type: 'PUBLIC',
        createdBy: testUser.id
      }).returning();
    });

    it('should update channel details', async () => {
      const updateData = {
        name: 'updated-channel',
        type: 'PRIVATE'
      };

      const response = await request(app)
        .put(`/api/channels/${testChannel.id}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        id: testChannel.id,
        name: updateData.name,
        type: updateData.type,
        workspaceId: testWorkspace.id
      }));

      // Verify channel was actually updated in database
      const [dbChannel] = await db
        .select()
        .from(channelsTable)
        .where(eq(channelsTable.id, testChannel.id));

      expect(dbChannel.name).toBe(updateData.name);
      expect(dbChannel.type).toBe(updateData.type);
    });

    it('should return 404 for non-existent channel', async () => {
      const response = await request(app)
        .put('/api/channels/999')
        .send({ name: 'updated-channel', type: 'PRIVATE' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });
  });

  describe('DELETE /api/channels/:channelId', () => {
    let testChannel: any;

    beforeEach(async () => {
      // Add auth middleware first
      app.use((req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = testUser;
        next();
      });

      app.use('/api', channelsRouter);

      // Create a test channel
      [testChannel] = await db.insert(channelsTable).values({
        name: 'test-channel',
        workspaceId: testWorkspace.id,
        type: 'PUBLIC',
        createdBy: testUser.id
      }).returning();
    });

    it('should archive channel', async () => {
      const response = await request(app)
        .delete(`/api/channels/${testChannel.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Channel archived');

      // Verify channel was archived in database
      const [dbChannel] = await db
        .select()
        .from(channelsTable)
        .where(eq(channelsTable.id, testChannel.id));

      expect(dbChannel.archived).toBe(true);
    });

    it('should return 404 for non-existent channel', async () => {
      const response = await request(app)
        .delete('/api/channels/999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });
  });
});