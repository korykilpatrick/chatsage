import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import usersRouter from './routes/users';
import messagesRouter from './routes/messages';
import channelsRouter from './routes/channels';
import pinsRouter from './routes/pins';
import reactionsRouter from './routes/reactions';
import searchRouter from './routes/search';
import emojisRouter from './routes/emojis';
import filesRouter from './routes/files';
import express from 'express';

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Parse JSON bodies for API requests
  app.use(express.json());

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: 'Internal server error',
      details: {
        code: 'SERVER_ERROR',
        message: err.message || 'An unexpected error occurred'
      }
    });
  });

  // Register routes in order of specificity
  // More specific routes first
  app.use('/api/search', searchRouter);  
  app.use('/api/workspaces/:workspaceId/channels', channelsRouter);
  app.use('/api/channels/:channelId/messages', messagesRouter);
  app.use('/api/messages/:messageId/reactions', reactionsRouter);
  app.use('/api/messages/:messageId/pin', pinsRouter);
  app.use('/api/channels/:channelId/pins', pinsRouter);
  app.use('/api/files', filesRouter);  
  app.use('/api/channels', channelsRouter);  
  app.use('/api/users', usersRouter);
  app.use('/api/emojis', emojisRouter);  

  return httpServer;
}