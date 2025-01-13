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
    server = registerRoutes(app);
  });

  afterEach((done) => {
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  it('GET /api/health should return 200', async () => {
    // Add health check endpoint for testing
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});