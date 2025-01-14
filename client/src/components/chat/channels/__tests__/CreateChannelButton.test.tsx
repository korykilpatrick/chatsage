import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateChannelButton } from '../CreateChannelButton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('CreateChannelButton', () => {
  it('renders create channel button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateChannelButton />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Create Channel')).toBeInTheDocument();
  });

  it('opens dialog when clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateChannelButton />
      </QueryClientProvider>
    );
    
    fireEvent.click(screen.getByText('Create Channel'));
    expect(screen.getByText('Create a new channel')).toBeInTheDocument();
    expect(screen.getByLabelText('Channel name')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Private channel')).toBeInTheDocument();
  });

  // Note: More extensive testing of form submission and API interaction
  // will be added in a separate PR
});
