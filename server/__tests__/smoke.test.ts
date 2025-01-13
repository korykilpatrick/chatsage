import { describe, it, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';

describe('Smoke Test', () => {
  it('should create an express app', () => {
    const app = express();
    expect(app).toBeTruthy();
    expect(typeof app.listen).toBe('function');
  });

  it('should handle a basic API route', async () => {
    const app = express();

    // Add a test route
    app.get('/api/test', (_req, res) => {
      res.json({ message: 'test successful' });
    });

    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'test successful' });
  });

  it('should properly handle middleware chain', async () => {
    const app = express();

    // Add middleware to modify request
    app.use((req, res, next) => {
      (req as any).customField = 'test value';
      next();
    });

    // Add route that uses the modified request
    app.get('/api/middleware-test', (req, res) => {
      res.json({ 
        customField: (req as any).customField,
        processed: true 
      });
    });

    const response = await request(app).get('/api/middleware-test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      customField: 'test value',
      processed: true
    });
  });
});