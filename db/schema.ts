import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from 'zod';

// Enums
export const presenceEnum = pgEnum('user_presence_enum', ['ONLINE', 'AWAY', 'DND', 'OFFLINE']);
export const workspaceRoleEnum = pgEnum('workspace_role_enum', ['OWNER', 'ADMIN', 'MEMBER', 'GUEST']);
export const channelTypeEnum = pgEnum('channel_type_enum', ['PUBLIC', 'PRIVATE', 'DM']);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  username: text("username").notNull(),
  profilePicture: text("profile_picture"),
  statusMessage: text("status_message"),
  lastKnownPresence: presenceEnum("last_known_presence").default('ONLINE'),
  emailVerified: boolean("email_verified").default(false),
  lastLogin: timestamp("last_login"),
  deactivated: boolean("deactivated").default(false),
  theme: text("theme").default('light'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create insert/select schemas with proper validation
export const insertUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
});

export const selectUserSchema = createSelectSchema(users);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workspace schema
export const insertWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  topic: text("topic"),
  type: channelTypeEnum("type").default('PUBLIC').notNull(),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Channel schema
export const insertChannelSchema = z.object({
  workspaceId: z.number(),
  name: z.string().min(1, "Name is required"),
  topic: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'DM']).default('PUBLIC'),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  channelId: integer("channel_id").references(() => channels.id),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  parentMessageId: integer("parent_message_id").references((): any => messages.id),
  content: text("content").notNull(),
  deleted: boolean("deleted").default(false),
  postedAt: timestamp("posted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Message schema
export const insertMessageSchema = z.object({
  userId: z.number(),
  channelId: z.number(),
  workspaceId: z.number(),
  parentMessageId: z.number().optional(),
  content: z.string().min(1, "Content is required"),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  messageId: integer("message_id").references(() => messages.id),
  filename: text("filename").notNull(),
  fileType: text("file_type"),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  fileHash: text("file_hash"),
  uploadTime: timestamp("upload_time").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// File schema
export const insertFileSchema = z.object({
  userId: z.number(),
  messageId: z.number().optional(),
  filename: z.string().min(1, "Filename is required"),
  fileType: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSize: z.number().optional(),
  fileHash: z.string().optional(),
});

export const emojis = pgTable("emojis", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Emoji schema
export const insertEmojiSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id),
  emojiId: integer("emoji_id").references(() => emojis.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  workspaces: many(userWorkspaces),
  files: many(files),
  reactions: many(messageReactions),
  pinnedMessages: many(pinnedMessages, { relationName: "pinnedBy" }),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  channels: many(channels),
  messages: many(messages),
  members: many(userWorkspaces),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [channels.workspaceId],
    references: [workspaces.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  workspace: one(workspaces, {
    fields: [messages.workspaceId],
    references: [workspaces.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
  }),
  replies: many(messages),
  reactions: many(messageReactions),
  files: many(files),
  pins: many(pinnedMessages),
}));

export const userWorkspaces = pgTable("user_workspaces", {
  userId: integer("user_id").references(() => users.id),
  workspaceId: integer("workspace_id").references(() => workspaces.id),
  role: workspaceRoleEnum("role").default('MEMBER'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userChannels = pgTable("user_channels", {
  userId: integer("user_id").references(() => users.id),
  channelId: integer("channel_id").references(() => channels.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pinnedMessages = pgTable("pinned_messages", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  pinnedBy: integer("pinned_by").references(() => users.id),
  pinnedReason: text("pinned_reason"),
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Types
export type Message = typeof messages.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type File = typeof files.$inferSelect;
export type Emoji = typeof emojis.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertEmoji = z.infer<typeof insertEmojiSchema>;

export const selectWorkspaceSchema = createSelectSchema(workspaces);
export const selectChannelSchema = createSelectSchema(channels);
export const selectMessageSchema = createSelectSchema(messages);
export const selectFileSchema = createSelectSchema(files);
export const selectEmojiSchema = createSelectSchema(emojis);