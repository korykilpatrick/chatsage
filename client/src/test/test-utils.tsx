import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={testQueryClient}>
        {ui}
      </QueryClientProvider>
    ),
    testQueryClient,
  };
}

export function createWrapper() {
  const testQueryClient = createTestQueryClient();
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={testQueryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}
