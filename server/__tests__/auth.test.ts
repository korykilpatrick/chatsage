import request from 'supertest';
import { createMockDb } from './setup';
import { app } from '../index';

describe('Authentication API', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!',
    displayName: 'Test User'
  };

  const mockDb = createMockDb();

  beforeEach(async () => {
    await mockDb.clear();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and send verification email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created; verification email sent');
      expect(response.body).not.toHaveProperty('password'); // Ensure password is not returned
    });

    it('should return 400 for invalid registration data', async () => {
      const invalidUser = {
        username: 'test', // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already in use');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify user email with valid token', async () => {
      // First register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Get verification token from mock email service
      const verifyToken = mockDb.getLastVerificationToken();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verifyToken })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Email verified; user can now log in');
    });

    it('should return 400 for invalid verification token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid token or token expired');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create and verify user before login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const verifyToken = mockDb.getLastVerificationToken();
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verifyToken });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
    });

    it('should return 401 for unverified email', async () => {
      // Register a new user without verifying
      const unverifiedUser = {
        ...testUser,
        email: 'unverified@example.com'
      };
      await request(app)
        .post('/api/auth/register')
        .send(unverifiedUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: unverifiedUser.email,
          password: unverifiedUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'EMAIL_NOT_VERIFIED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Setup: Register, verify and login to get a refresh token
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const verifyToken = mockDb.getLastVerificationToken();
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verifyToken });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout user', async () => {
      // First register, verify and login
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const verifyToken = mockDb.getLastVerificationToken();
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verifyToken });

      const agent = request.agent(app);
      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Logout with the refresh token
      const response = await agent
        .post('/api/auth/logout')
        .send({ refreshToken: loginResponse.body.refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify refresh token is invalidated
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginResponse.body.refreshToken })
        .expect(401);

      expect(refreshResponse.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });
});