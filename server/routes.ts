import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import { db } from "@db";
import { channels, messages, userChannels, toApiUser, type ApiUser, type User } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { 
  AuthApi, 
  ChannelsApi, 
  EmojisApi, 
  FilesApi, 
  MessagesApi, 
  PinningApi, 
  ReactionsApi, 
  SearchApi, 
  UsersApi, 
  WorkspacesApi 
} from "./generated/api/apis";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Initialize API instances
  const authApi = new AuthApi();
  const channelsApi = new ChannelsApi();
  const emojisApi = new EmojisApi();
  const filesApi = new FilesApi();
  const messagesApi = new MessagesApi();
  const pinningApi = new PinningApi();
  const reactionsApi = new ReactionsApi();
  const searchApi = new SearchApi();
  const usersApi = new UsersApi();
  const workspacesApi = new WorkspacesApi();

  // Set base path for all APIs to use our Express server
  const basePath = process.env.NODE_ENV === 'production' 
    ? 'https://api.chatsage.com/v1' 
    : 'http://localhost:5000/api/v1';

  [authApi, channelsApi, emojisApi, filesApi, messagesApi, 
   pinningApi, reactionsApi, searchApi, usersApi, workspacesApi]
    .forEach(api => {
      api.basePath = basePath;
    });

  // Channel routes
  app.get("/api/channels", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const userChannelsList = await db.query.userChannels.findMany({
      where: eq(userChannels.userId, (req.user as User).id),
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
      .values({ userId: (req.user as User).id, channelId: newChannel.id });

    res.status(201).json(newChannel);
  });

  // Message routes
  app.get("/api/channels/:channelId/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const channelId = parseInt(req.params.channelId);
    const channelMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.channelId, channelId),
        eq(messages.deleted, false)
      ),
      with: {
        user: true
      },
      orderBy: (messages, { desc }) => [desc(messages.createdAt)]
    });

    res.json(channelMessages.map(msg => ({
      ...msg,
      user: msg.user ? toApiUser(msg.user) : null
    })));
  });

  return httpServer;
}