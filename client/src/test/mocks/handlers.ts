import { http, HttpResponse } from 'msw';

export const handlers = [
  // Add API mocks here as needed
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];