import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import usersRouter from './routes/users';
import messagesRouter from './routes/messages';

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Register routes
  app.use('/api/users', usersRouter);
  app.use('/api/channels', messagesRouter);

  return httpServer;
}