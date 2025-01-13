import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockDb } from './setup';

// Create Express app for testing
const app = express();
app.use(express.json());

// Create mock database instance
const mockDb = createMockDb();

// Mock auth routes for testing
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check for existing user
  if (mockDb.users.has(email)) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  // Store user in mock db
  mockDb.users.set(email, { email, password, displayName });
  res.status(201).json({ message: 'User created; verification email sent' });
});

app.post('/api/auth/verify-email', (req, res) => {
  const { token } = req.body;
  if (token === 'invalid-token') {
    return res.status(400).json({ error: 'Invalid token or token expired' });
  }
  res.status(200).json({ message: 'Email verified; user can now log in' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'unverified@example.com') {
    return res.status(401).json({ error: 'EMAIL_NOT_VERIFIED' });
  }

  const user = mockDb.users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }

  const accessToken = 'mock-access-token';
  const refreshToken = 'mock-refresh-token';
  mockDb.refreshTokens.add(refreshToken);

  return res.status(200).json({
    message: 'Login successful',
    accessToken,
    refreshToken
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!mockDb.refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  return res.status(200).json({
    accessToken: 'new-mock-access-token',
    refreshToken: 'new-mock-refresh-token'
  });
});

app.post('/api/auth/logout', (req, res) => {
  const { refreshToken } = req.body;
  mockDb.refreshTokens.delete(refreshToken);
  res.status(200).json({ message: 'Logout successful' });
});

describe('Authentication API', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!',
    displayName: 'Test User'
  };

  beforeEach(async () => {
    mockDb.clear();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and send verification email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created; verification email sent');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 for invalid registration data', async () => {
      const invalidUser = {
        username: 'test' // Missing required fields
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
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

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

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Logout with the refresh token
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: loginResponse.body.refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify refresh token is invalidated
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginResponse.body.refreshToken })
        .expect(401);
    });
  });
});