import { pgTable, text, boolean, integer, timestamp, pgEnum, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, type InferModel } from "drizzle-orm";

// Keep existing enums and types
export const presenceEnum = pgEnum('user_presence_enum', ['ONLINE', 'AWAY', 'DND', 'OFFLINE']);
export const workspaceRoleEnum = pgEnum('workspace_role_enum', ['OWNER', 'ADMIN', 'MEMBER', 'GUEST']);
export const channelTypeEnum = pgEnum('channel_type_enum', ['PUBLIC', 'PRIVATE', 'DM']);

// Add API types to match generated code
export interface ApiUser {
  id: number;
  email: string;
  displayName: string;
  password: string;
  profilePicture: string | null;
  statusMessage: string | null;
  lastKnownPresence: "ONLINE" | "AWAY" | "DND" | "OFFLINE" | null;
  emailVerified: boolean;
  lastLogin: Date | null;
  deactivated: boolean;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
  // Add username as an alias of displayName for backward compatibility
  get username(): string {
    return this.displayName;
  }
}

// Keep existing tables and schemas
// No changes to the actual database structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
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

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export type Message = InferModel<typeof messages>;

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

export const emojis = pgTable("emojis", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id),
  emojiId: integer("emoji_id").references(() => emojis.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  channels: many(userChannels),
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
  members: many(userChannels),
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
  reactions: many(messageReactions),
  files: many(files),
  pins: many(pinnedMessages),
}));

// Schemas for validation and types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect & {
  username?: string; // Add username as optional alias of displayName
};
export type InsertUser = typeof users.$inferInsert;

export const insertWorkspaceSchema = createInsertSchema(workspaces);
export const selectWorkspaceSchema = createSelectSchema(workspaces);
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

export const insertChannelSchema = createInsertSchema(channels);
export const selectChannelSchema = createSelectSchema(channels);
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

export type InsertMessage = typeof messages.$inferInsert;

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;

export type Emoji = typeof emojis.$inferSelect;
export type InsertEmoji = typeof emojis.$inferInsert;