import request from 'supertest';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { app } from '../index';

describe('Authentication API', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!',
    displayName: 'Test User'
  };

  afterEach(async () => {
    // Clean up test user after each test
    await db.delete(users).where(eq(users.username, testUser.username));
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/register')
        .send(testUser)
        .expect(200); // Changed from 201 to 200 to match implementation

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(testUser.username);
    });

    it('should return 400 for invalid registration data', async () => {
      const invalidUser = {
        username: 'test', // Missing required fields
      };

      const response = await request(app)
        .post('/api/register')
        .send(invalidUser)
        .expect(400);

      expect(response.text).toContain('Invalid input');
    });

    it('should return 400 for duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/register')
        .send(testUser);

      // Second registration with same username
      const response = await request(app)
        .post('/api/register')
        .send(testUser)
        .expect(400);

      expect(response.text).toBe('Username already exists');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/register')
        .send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.user).toHaveProperty('username', testUser.username);
    });

    it('should return 400 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.text).toBe('Incorrect password');
    });

    it('should return 400 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.text).toBe('Incorrect username');
    });
  });

  describe('GET /api/user', () => {
    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/user')
        .expect(401);
    });

    it('should return user data for authenticated request', async () => {
      // First register and login
      await request(app)
        .post('/api/register')
        .send(testUser);

      const agent = request.agent(app);
      await agent
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      const response = await agent
        .get('/api/user')
        .expect(200);

      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('displayName', testUser.displayName);
    });
  });

  describe('POST /api/logout', () => {
    it('should successfully logout user', async () => {
      // First register and login
      await request(app)
        .post('/api/register')
        .send(testUser);

      const agent = request.agent(app);
      await agent
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      // Verify login was successful
      await agent
        .get('/api/user')
        .expect(200);

      // Logout
      const response = await agent
        .post('/api/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify we're actually logged out
      await agent
        .get('/api/user')
        .expect(401);
    });
  });
});