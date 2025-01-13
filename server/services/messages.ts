import { db } from "@db";
import { messages } from "@db/schema";
import { eq, and } from "drizzle-orm";
import type { Message } from "../generated/model/message";
import type { MessageCreateRequest } from "../generated/model/messageCreateRequest";

export class MessagesService {
  async getChannelMessages(
    channelId: number,
    limit?: number,
    offset?: number,
    before?: Date,
    includeDeleted = false
  ): Promise<Message[]> {
    const conditions = [eq(messages.channelId, channelId)];

    if (!includeDeleted) {
      conditions.push(eq(messages.deleted, false));
    }

    if (before) {
      conditions.push(eq(messages.createdAt, before));
    }

    const query = db.select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(messages.createdAt);

    const results = await (limit !== undefined 
      ? query.limit(limit).offset(offset || 0)
      : query).execute();

    return results.map(msg => ({
      content: msg.content,
      userId: msg.userId || 0,
      channelId: msg.channelId || 0,
      messageId: msg.id, // Map id to messageId as per OpenAPI spec
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      deleted: msg.deleted || false
    }));
  }

  async getMessage(messageId: number): Promise<Message | null> {
    const result = await db.select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .execute();

    if (!result.length) return null;

    const msg = result[0];
    return {
      content: msg.content,
      userId: msg.userId || 0,
      channelId: msg.channelId || 0,
      messageId: msg.id,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      deleted: msg.deleted || false
    };
  }

  async createMessage(request: MessageCreateRequest): Promise<Message> {
    const now = new Date();
    const [msg] = await db.insert(messages)
      .values({
        content: request.content,
        userId: request.userId,
        channelId: request.channelId,
        parentMessageId: null,
        deleted: false,
        createdAt: now,
        updatedAt: now,
        postedAt: now
      })
      .returning();

    return {
      content: msg.content,
      userId: msg.userId || 0,
      channelId: msg.channelId || 0,
      messageId: msg.id,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      deleted: msg.deleted || false
    };
  }

  async softDeleteMessage(messageId: number): Promise<void> {
    await db.update(messages)
      .set({ 
        deleted: true, 
        updatedAt: new Date() 
      })
      .where(eq(messages.id, messageId))
      .execute();
  }
}

export const messagesService = new MessagesService();