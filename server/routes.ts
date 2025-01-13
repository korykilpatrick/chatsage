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

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

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

  // Channel routes
  app.get("/api/channels", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const userChannelsList = await db.query.userChannels.findMany({
      where: eq(userChannels.userId, req.user.id),
      with: {
        channel: true
      }
    });

    res.json(userChannelsList.map(uc => uc.channel));
  });

  app.post("/api/channels", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const { name, type } = req.body;
    const [newChannel] = await db.insert(channels)
      .values({ name, type })
      .returning();

    await db.insert(userChannels)
      .values({ userId: req.user.id, channelId: newChannel.id });

    res.status(201).json(newChannel);
  });

  app.get("/api/channels/:channelId/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const channelId = parseInt(req.params.channelId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    const includeDeleted = req.query.includeDeleted === 'true';

    try {
      const messages = await messagesService.getChannelMessages(
        channelId,
        limit,
        offset,
        before,
        includeDeleted
      );
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}