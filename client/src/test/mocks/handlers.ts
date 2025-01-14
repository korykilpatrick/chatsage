import { http, HttpResponse } from 'msw';
import type { Message } from '@db/schema';

// Define handlers array
export const handlers = [
  // Mock the messages endpoint
  http.get('/api/channels/:channelId/messages', () => {
    const mockMessages: Message[] = [
      {
        id: 1,
        content: 'Hello world',
        userId: 1,
        channelId: 1,
        createdAt: new Date('2024-01-14T12:00:00Z'),
        updatedAt: new Date('2024-01-14T12:00:00Z'),
        deleted: false
      },
      {
        id: 2,
        content: 'How are you?',
        userId: 2,
        channelId: 1,
        createdAt: new Date('2024-01-14T12:01:00Z'),
        updatedAt: new Date('2024-01-14T12:01:00Z'),
        deleted: false
      }
    ];

    return HttpResponse.json(mockMessages);
  })
];
