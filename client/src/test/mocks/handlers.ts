import { http, HttpResponse } from 'msw';
import type { Message } from '@db/schema';
import { mockUser } from '../setupTests';

// Define handlers array for REST endpoints
export const handlers = [
  // Mock the messages endpoint
  http.get('/api/channels/:channelId/messages', () => {
    const mockMessages: Message[] = [
      {
        id: 1,
        content: 'Hello world',
        userId: 1,
        channelId: 1,
        workspaceId: 1,
        parentMessageId: null,
        createdAt: new Date('2024-01-14T12:00:00Z'),
        updatedAt: new Date('2024-01-14T12:00:00Z'),
        deleted: false,
        postedAt: new Date('2024-01-14T12:00:00Z')
      },
      {
        id: 2,
        content: 'How are you?',
        userId: 2,
        channelId: 1,
        workspaceId: 1,
        parentMessageId: null,
        createdAt: new Date('2024-01-14T12:01:00Z'),
        updatedAt: new Date('2024-01-14T12:01:00Z'),
        deleted: false,
        postedAt: new Date('2024-01-14T12:01:00Z')
      }
    ];

    return HttpResponse.json(mockMessages);
  }),

  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ token: 'fake-token' });
    }
    return new HttpResponse('Invalid credentials', { status: 401 });
  }),

  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    if (body.email && body.password && body.displayName) {
      return HttpResponse.json({ message: 'Registration successful' });
    }
    return new HttpResponse('Invalid registration data', { status: 400 });
  }),

  // User endpoints
  http.get('/api/users/me', () => {
    return HttpResponse.json(mockUser);
  })
];