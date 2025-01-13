export * from './authApi';
export * from './channelsApi';
export * from './emojisApi';
export * from './filesApi';
export * from './messagesApi';
export * from './pinningApi';
export * from './reactionsApi';
export * from './searchApi';
export * from './usersApi';
export * from './workspacesApi';

import * as http from 'http';

export class HttpError extends Error {
    constructor (public response: http.IncomingMessage, public body: any, public statusCode?: number) {
        super('HTTP request failed');
        this.name = 'HttpError';
    }
}

export { RequestFile } from '../model/models';