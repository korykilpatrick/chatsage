export * from './authApi';
import { AuthApi } from './authApi';
export * from './channelsApi';
import { ChannelsApi } from './channelsApi';
export * from './emojisApi';
import { EmojisApi } from './emojisApi';
export * from './filesApi';
import { FilesApi } from './filesApi';
export * from './messagesApi';
import { MessagesApi } from './messagesApi';
export * from './pinningApi';
import { PinningApi } from './pinningApi';
export * from './reactionsApi';
import { ReactionsApi } from './reactionsApi';
export * from './searchApi';
import { SearchApi } from './searchApi';
export * from './usersApi';
import { UsersApi } from './usersApi';
export * from './workspacesApi';
import { WorkspacesApi } from './workspacesApi';
import * as http from 'http';

export class HttpError extends Error {
    constructor (public response: http.IncomingMessage, public body: any, public statusCode?: number) {
        super('HTTP request failed');
        this.name = 'HttpError';
    }
}

export { RequestFile } from '../model/models';

export const APIS = [AuthApi, ChannelsApi, EmojisApi, FilesApi, MessagesApi, PinningApi, ReactionsApi, SearchApi, UsersApi, WorkspacesApi];
