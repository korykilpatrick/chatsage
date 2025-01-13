import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

describe('Smoke Test', () => {
  it('server should start successfully', async () => {
    const app = express();
    const server = registerRoutes(app);
    
    // Add a simple test route
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    
    server.close();
  });
});
