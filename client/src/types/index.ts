// User Status Enums
export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  DND = 'DND',
  OFFLINE = 'OFFLINE'
}

// Channel Types
export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  DM = 'DM'
}

// Base interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  deactivated?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  workspaceId: string;
  archived?: boolean;
  deleted?: boolean;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  channelId: string;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
  pinned?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  archived?: boolean;
}
