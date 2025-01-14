import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./socket";
import usersRouter from './routes/users';
import messagesRouter from './routes/messages';
import channelsRouter from './routes/channels';
import pinsRouter from './routes/pins';
import reactionsRouter from './routes/reactions';
import { db } from "@db";
import { messages, users, channels } from "@db/schema";
import { eq, and, ilike } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Add search route first as it's most specific
  app.get('/api/search', async (req, res) => {
    try {
      const { keyword, workspaceId } = req.query;

      // Base query for messages
      let query = db.select({
        messages: messages,
        user: users,
        channel: channels,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(channels, eq(messages.channelId, channels.id));

      // Add conditions based on parameters
      const conditions = [];

      if (keyword) {
        conditions.push(ilike(messages.content, `%${keyword}%`));
      }

      if (workspaceId) {
        const wsId = parseInt(workspaceId as string);
        if (isNaN(wsId)) {
          return res.status(400).json({ error: 'Invalid workspace ID' });
        }
        conditions.push(eq(messages.workspaceId, wsId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Execute query
      const results = await query.execute();

      // Format results
      const formattedResults = results.map(result => ({
        id: result.messages.id,
        content: result.messages.content,
        createdAt: result.messages.createdAt,
        user: result.user ? {
          id: result.user.id,
          username: result.user.username,
          displayName: result.user.displayName,
        } : null,
        channel: result.channel ? {
          id: result.channel.id,
          name: result.channel.name,
          workspaceId: result.channel.workspaceId,
        } : null,
        workspaceId: result.messages.workspaceId,
      }));

      res.json({ messages: formattedResults });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

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