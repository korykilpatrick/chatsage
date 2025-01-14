import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import usersRouter from './routes/users';
import messagesRouter from './routes/messages';
import channelsRouter from './routes/channels';
import pinsRouter from './routes/pins';
import reactionsRouter from './routes/reactions';

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Register routes in order of specificity
  // More specific routes first
  app.use('/api/workspaces/:workspaceId/channels', channelsRouter);
  app.use('/api/channels/:channelId/messages', messagesRouter);
  app.use('/api/messages/:messageId/reactions', reactionsRouter);
  app.use('/api/messages/:messageId/pin', pinsRouter);
  app.use('/api/channels/:channelId/pins', pinsRouter);
  app.use('/api/channels', channelsRouter);  // Global channel routes after specific ones
  app.use('/api/users', usersRouter);

  return httpServer;
}