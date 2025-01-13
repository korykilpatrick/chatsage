import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import { db } from "@db";
import { channels, messages, userChannels } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { AuthApi } from './generated/api/authApi';
import { 
  AuthLoginPostRequest as LoginRequest,
  AuthRegisterPostRequest as RegisterRequest,
  AuthVerifyEmailPostRequest as VerifyEmailRequest,
  AuthRefreshPostRequest as RefreshTokenRequest
} from './generated/model/models';
import { messagesService } from "./services/messages";
import usersRouter from './routes/users';
import messagesRouter from './routes/messages';

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Register routes
  app.use('/api/users', usersRouter);
  app.use('/api/channels', messagesRouter);

  // Initialize API clients
  const authApi = new AuthApi();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerData = req.body as RegisterRequest;
      await authApi.authRegisterPost(registerData);
      res.status(201).send();
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const verifyData = req.body as VerifyEmailRequest;
      await authApi.authVerifyEmailPost(verifyData);
      res.status(200).send();
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = req.body as LoginRequest;
      const result = await authApi.authLoginPost(loginData);
      res.status(200).json(result.body);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshData = req.body as RefreshTokenRequest;
      const result = await authApi.authRefreshPost(refreshData);
      res.status(200).json(result.body);
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  return httpServer;
}