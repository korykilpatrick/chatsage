import { http } from 'msw';

// Define your API mocking handlers
export const handlers = [
  // Example handler for user endpoint
  http.get('/api/user', () => {
    return new Response(
      JSON.stringify({
        id: 1,
        name: 'Test User',
      }),
      { status: 200 }
    );
  }),
];