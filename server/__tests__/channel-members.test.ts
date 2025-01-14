import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { channels, users, userChannels, workspaces } from '@db/schema';
import channelsRouter from '../routes/channels';

describe('Channel Members API', () => {
  let app: express.Express;
  let testUser: any;
  let testWorkspace: any;
  let testChannel: any;
  let otherUser: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Set Content-Type header for all responses
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });

    // Clean up test data
    await db.delete(userChannels);
    await db.delete(channels);
    await db.delete(workspaces);
    await db.delete(users);

    // Create test user
    [testUser] = await db.insert(users).values({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      displayName: 'Test User'
    }).returning();

    // Create other user
    [otherUser] = await db.insert(users).values({
      username: 'otheruser',
      email: 'other@example.com',
      password: 'hashedpassword',
      displayName: 'Other User'
    }).returning();

    // Create test workspace
    [testWorkspace] = await db.insert(workspaces).values({
      name: 'Test Workspace',
      ownerId: testUser.id
    }).returning();

    // Create test channel
    [testChannel] = await db.insert(channels).values({
      name: 'test-channel',
      workspaceId: testWorkspace.id,
      type: 'PUBLIC',
      createdBy: testUser.id
    }).returning();

    // Add auth middleware first
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = testUser;
      next();
    });

    app.use('/api', channelsRouter);
  });

  afterEach(async () => {
    // Final cleanup
    await db.delete(userChannels);
    await db.delete(channels);
    await db.delete(workspaces);
    await db.delete(users);
  });

  describe('POST /api/channels/:channelId/members', () => {
    it('should add a member to the channel', async () => {
      const response = await request(app)
        .post(`/api/channels/${testChannel.id}/members`)
        .send({ userId: otherUser.id })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Member added to channel'
      });

      // Verify member was added in database
      const [membership] = await db
        .select()
        .from(userChannels)
        .where(eq(userChannels.userId, otherUser.id))
        .where(eq(userChannels.channelId, testChannel.id));

      expect(membership).toBeTruthy();
    });

    it('should return 404 for non-existent channel', async () => {
      const response = await request(app)
        .post('/api/channels/999/members')
        .send({ userId: otherUser.id })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post(`/api/channels/${testChannel.id}/members`)
        .send({ userId: 999 })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 if user is already a member', async () => {
      // First add the member
      await request(app)
        .post(`/api/channels/${testChannel.id}/members`)
        .send({ userId: otherUser.id });

      // Try to add again
      const response = await request(app)
        .post(`/api/channels/${testChannel.id}/members`)
        .send({ userId: otherUser.id })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User is already a member of this channel');
    });
  });

  describe('DELETE /api/channels/:channelId/members', () => {
    beforeEach(async () => {
      // Add the test member first
      await db.insert(userChannels).values({
        userId: otherUser.id,
        channelId: testChannel.id
      });
    });

    it('should remove a member from the channel', async () => {
      const response = await request(app)
        .delete(`/api/channels/${testChannel.id}/members`)
        .query({ userId: otherUser.id })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Member removed from channel'
      });

      // Verify member was removed from database
      const membership = await db
        .select()
        .from(userChannels)
        .where(eq(userChannels.userId, otherUser.id))
        .where(eq(userChannels.channelId, testChannel.id));

      expect(membership).toHaveLength(0);
    });

    it('should return 404 for non-existent channel', async () => {
      const response = await request(app)
        .delete('/api/channels/999/members')
        .query({ userId: otherUser.id })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Channel not found');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete(`/api/channels/${testChannel.id}/members`)
        .query({ userId: 999 })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 if user is not a member', async () => {
      // Remove the member first
      await db.delete(userChannels)
        .where(eq(userChannels.userId, otherUser.id))
        .where(eq(userChannels.channelId, testChannel.id));

      const response = await request(app)
        .delete(`/api/channels/${testChannel.id}/members`)
        .query({ userId: otherUser.id })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User is not a member of this channel');
    });
  });
});
