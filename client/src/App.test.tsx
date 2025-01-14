import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { createTestQueryClient } from './test/setup';

describe('App', () => {
  it('renders without crashing', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    // By default App shows auth page when no user is logged in
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});