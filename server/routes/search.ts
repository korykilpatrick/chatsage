import { Router } from 'express';
import { db } from "@db";
import { messages, users, channels } from "@db/schema";
import { eq, and, ilike, gte, lte, or, isNull, sql } from "drizzle-orm";
import { type SQL } from 'drizzle-orm';
import express from "express";
import { z } from 'zod';

const router = Router();

// Add JSON parsing middleware
router.use(express.json());

// Set content type for all responses
router.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Input validation schemas
const baseSearchSchema = z.object({
  keyword: z.string().optional(),
  workspaceId: z.preprocess(
    (val) => (val ? parseInt(String(val)) : undefined),
    z.number().int().optional()
  ),
  includeArchived: z.preprocess(
    val => val === 'true' || val === true,
    z.boolean().optional().default(false)
  )
});

const advancedSearchSchema = baseSearchSchema.extend({
  fromDate: z.string().optional().transform((val, ctx) => {
    if (!val) return undefined;
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid fromDate format'
      });
      return z.NEVER;
    }
    return date;
  }),
  toDate: z.string().optional().transform((val, ctx) => {
    if (!val) return undefined;
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid toDate format'
      });
      return z.NEVER;
    }
    return date;
  }),
  fromUser: z.string().optional(),
  channelId: z.preprocess(
    (val) => (val ? parseInt(String(val)) : undefined),
    z.number().int().optional()
  )
});

// Helper function to create archived condition that always returns a valid SQL expression
const getArchivedCondition = (): SQL<unknown> => {
  const condition = or(
    isNull(channels.archived),
    eq(channels.archived, false)
  );
  return sql`${condition}`;
};

router.get('/', async (req, res) => {
  try {
    const result = baseSearchSchema.safeParse(req.query);
    if (!result.success) {
      const error = result.error.errors[0];
      if (error.code === 'invalid_type' && error.path[0] === 'workspaceId') {
        return res.status(400).json({ error: 'Invalid workspace ID' });
      }

      return res.status(400).json({
        error: 'INVALID_INPUT',
        details: result.error.errors.map(e => e.message)
      });
    }

    const { keyword, workspaceId, includeArchived } = result.data;

    // Build conditions array first
    const conditions: SQL<unknown>[] = [];

    if (keyword) {
      conditions.push(ilike(messages.content, `%${keyword}%`));
    }

    if (workspaceId) {
      conditions.push(eq(messages.workspaceId, workspaceId));
    }

    // Handle archived channels unless explicitly included
    if (!includeArchived) {
      conditions.push(getArchivedCondition());
    }

    // Execute query with all conditions combined
    const results = await db
      .select({
        messages: messages,
        user: users,
        channel: channels,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(channels, eq(messages.channelId, channels.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .execute();

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
        archived: result.channel.archived
      } : null,
      workspaceId: result.messages.workspaceId,
    }));

    res.json({ messages: formattedResults });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

router.get('/advanced', async (req, res) => {
  try {
    const result = advancedSearchSchema.safeParse(req.query);
    if (!result.success) {
      const customError = result.error.errors.find(e => 
        e.message === 'Invalid fromDate format' || e.message === 'Invalid toDate format'
      );

      if (customError) {
        return res.status(400).json({ error: customError.message });
      }

      return res.status(400).json({
        error: 'INVALID_INPUT',
        details: result.error.errors.map(e => e.message)
      });
    }

    const { 
      keyword, 
      workspaceId, 
      fromDate, 
      toDate, 
      fromUser,
      channelId,
      includeArchived 
    } = result.data;

    // Build conditions array first
    const conditions: SQL<unknown>[] = [];

    if (keyword) {
      conditions.push(ilike(messages.content, `%${keyword}%`));
    }

    if (workspaceId) {
      conditions.push(eq(messages.workspaceId, workspaceId));
    }

    if (channelId) {
      conditions.push(eq(messages.channelId, channelId));
    }

    if (fromDate) {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      conditions.push(gte(messages.createdAt, startDate));
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(messages.createdAt, endDate));
    }

    if (fromUser) {
      conditions.push(eq(users.username, fromUser));
    }

    // Handle archived channels unless explicitly included
    if (!includeArchived) {
      conditions.push(getArchivedCondition());
    }

    // Execute query with all conditions combined
    const results = await db
      .select({
        messages: messages,
        user: users,
        channel: channels,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .leftJoin(channels, eq(messages.channelId, channels.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .execute();

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
        archived: result.channel.archived
      } : null,
      workspaceId: result.messages.workspaceId,
    }));

    res.json({ messages: formattedResults });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

export default router;