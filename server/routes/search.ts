import { Router } from 'express';
import { db } from "@db";
import { messages, users, channels } from "@db/schema";
import { eq, and, ilike, gte, lte } from "drizzle-orm";

const router = Router();

router.get('/', async (req, res) => {
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

// Add advanced search route
router.get('/advanced', async (req, res) => {
  try {
    const { keyword, workspaceId, fromDate, toDate, fromUser } = req.query;

    let query = db.select({
      messages: messages,
      user: users,
      channel: channels,
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .leftJoin(channels, eq(messages.channelId, channels.id));

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

    if (fromDate) {
      const date = new Date(fromDate as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid fromDate format' });
      }
      conditions.push(gte(messages.createdAt, date));
    }

    if (toDate) {
      const date = new Date(toDate as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid toDate format' });
      }
      conditions.push(lte(messages.createdAt, date));
    }

    if (fromUser) {
      conditions.push(eq(users.username, fromUser as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.execute();

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
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;