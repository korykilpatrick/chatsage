import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { WebSocket, WebSocketServer } from 'ws';
import { databaseAvailable } from './setup';
import { db } from '@db';

describe('Smoke Test', () => {
  let app: express.Express;
  let server: any;

  beforeEach(() => {
    app = express();
  });

  afterEach(() => {
    if (server && server.listening) {
      server.close();
    }
  });

  it('should create an express app', () => {
    expect(app).toBeTruthy();
    expect(typeof app.listen).toBe('function');
  });

  it('should handle a basic API route', async () => {
    // Add a test route
    app.get('/api/test', (_req, res) => {
      res.json({ message: 'test successful' });
    });

    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'test successful' });
  });

  it('should properly handle middleware chain', async () => {
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

  it('should verify database connection', async () => {
    expect(databaseAvailable).toBeTruthy();
    expect(db).toBeDefined();
    // Try a simple query to verify connection
    const result = await db.query.users.findMany();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle errors correctly', async () => {
    app.get('/api/error-test', (_req, _res) => {
      throw new Error('Test error');
    });

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: err.message });
    });

    const response = await request(app).get('/api/error-test');
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Test error');
  });

  it('should handle different content types', async () => {
    app.post('/api/json-test', express.json(), (req, res) => {
      res.json(req.body);
    });

    const testData = { key: 'value' };
    const response = await request(app)
      .post('/api/json-test')
      .send(testData)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(testData);
  });

  it('should verify WebSocket upgrade handling', (done) => {
    server = app.listen(0); // Use random port

    // Create WebSocket server
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        ws.send(`Echo: ${message}`);
      });
    });

    const port = (server.address() as any).port;
    const ws = new WebSocket(`ws://localhost:${port}`);

    ws.on('open', () => {
      ws.send('test message');
    });

    ws.on('message', (message) => {
      expect(message.toString()).toBe('Echo: test message');
      ws.close();
      wss.close();
      done();
    });

    ws.on('error', (err) => {
      done(err);
    });
  });
});