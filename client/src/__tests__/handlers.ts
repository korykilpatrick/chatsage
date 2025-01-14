import { rest } from 'msw';

// Define your API mocking handlers
export const handlers = [
  // Example handler for user endpoint
  rest.get('/api/user', (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        name: 'Test User',
      })
    );
  }),
];
