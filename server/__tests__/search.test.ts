import request from 'supertest';
import { type Express } from 'express';
import { describe, expect, it, beforeAll, beforeEach } from '@jest/globals';
import { setupTestApp } from './setup';
import { db } from '@db';
import { users, workspaces, channels, messages } from '@db/schema';
import { eq, and, ilike } from 'drizzle-orm';

let app: Express;
let testUser: any;
let testWorkspace: any;
let testChannel: any;

beforeAll(async () => {
  app = await setupTestApp();
});

describe('Search API', () => {
  beforeEach(async () => {
    // Create test user with unique email
    [testUser] = await db.insert(users).values({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password',
      displayName: 'Test User'
    }).returning();

    // Create test workspace
    [testWorkspace] = await db.insert(workspaces).values({
      name: 'Test Workspace',
      description: 'Test Description',
    }).returning();

    // Create test channel
    [testChannel] = await db.insert(channels).values({
      name: 'test-channel',
      workspaceId: testWorkspace.id,
      type: 'PUBLIC',
    }).returning();

    // Create test messages
    await db.insert(messages).values([
      {
        content: 'Hello world test message',
        userId: testUser.id,
        channelId: testChannel.id,
        workspaceId: testWorkspace.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        content: 'Another message with different content',
        userId: testUser.id,
        channelId: testChannel.id,
        workspaceId: testWorkspace.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        content: 'Third message with search term',
        userId: testUser.id,
        channelId: testChannel.id,
        workspaceId: testWorkspace.id,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  });

  describe('GET /api/search', () => {
    it('should search messages by keyword', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ keyword: 'search term' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBe(1);
      expect(res.body.messages[0].content).toContain('search term');
    });

    it('should search within a specific workspace', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          keyword: 'test',
          workspaceId: testWorkspace.id 
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBeGreaterThan(0);
      expect(res.body.messages[0].workspaceId).toBe(testWorkspace.id);
    });

    it('should return empty results for non-matching keyword', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ keyword: 'nonexistent' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('messages');
      expect(res.body.messages).toHaveLength(0);
    });

    it('should return 400 for invalid workspaceId', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ 
          keyword: 'test',
          workspaceId: 'invalid' 
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Invalid workspace ID');
    });

    it('should include channel and user details in search results', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ keyword: 'Hello' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('messages');
      expect(res.body.messages[0]).toHaveProperty('user');
      expect(res.body.messages[0]).toHaveProperty('channel');
      expect(res.body.messages[0].user).toHaveProperty('username', testUser.username);
      expect(res.body.messages[0].channel).toHaveProperty('name', testChannel.name);
    });
  });
});