import { z } from 'zod';

export const channelTypeEnum = z.enum(['PUBLIC', 'PRIVATE', 'DM']);

export type Channel = {
  id: number;
  name: string;
  topic: string | null;
  type: z.infer<typeof channelTypeEnum>;
  workspaceId: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: number;
  email: string;
  displayName: string;
  username: string;
  profilePicture: string | null;
  statusMessage: string | null;
  lastKnownPresence: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE';
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  id: number;
  content: string;
  userId: number;
  channelId: number;
  workspaceId: number;
  parentMessageId: number | null;
  deleted: boolean;
  postedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
