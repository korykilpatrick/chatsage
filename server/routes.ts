import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import { db } from "@db";
import { channels, messages, userChannels } from "@db/schema";
import { and, eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

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

    res.json(channelMessages);
  });

  return httpServer;
}
