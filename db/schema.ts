import { pgTable, serial, text, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const presenceEnum = pgEnum('user_presence_enum', ['ONLINE', 'AWAY', 'DND', 'OFFLINE']);
export const channelTypeEnum = pgEnum('channel_type_enum', ['PUBLIC', 'PRIVATE', 'DM']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  presence: presenceEnum("presence").default('OFFLINE'),
  lastSeen: timestamp("last_seen").defaultNow(),
  deactivated: boolean("deactivated").default(false),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: channelTypeEnum("type").default('PUBLIC'),
  topic: text("topic"),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id),
  channelId: integer("channel_id").references(() => channels.id),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userChannels = pgTable("user_channels", {
  userId: integer("user_id").references(() => users.id),
  channelId: integer("channel_id").references(() => channels.id)
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  channels: many(userChannels)
}));

export const channelsRelations = relations(channels, ({ many }) => ({
  messages: many(messages),
  members: many(userChannels)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertChannelSchema = createInsertSchema(channels);
export const selectChannelSchema = createSelectSchema(channels);

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

// Types
export type User = typeof users.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Message = typeof messages.$inferSelect;
