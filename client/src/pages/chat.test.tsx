import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Chat from './chat';
import { useSocket } from '@/hooks/use-socket';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';

// Mock the hooks
vi.mock('@/hooks/use-socket', () => ({
  useSocket: vi.fn()
}));

vi.mock('@/hooks/use-user', () => ({
  useUser: vi.fn()
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn()
}));

describe('Chat', () => {
  const mockSocket = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  };

  const mockUser = {
    id: 1,
    displayName: 'Test User',
    email: 'test@example.com',
    lastKnownPresence: 'ONLINE',
    statusMessage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockChannels = [
    { id: 1, name: 'General', workspaceId: 1 },
    { id: 2, name: 'Random', workspaceId: 1 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSocket).mockReturnValue(mockSocket);
    vi.mocked(useUser).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });
    vi.mocked(useQuery).mockReturnValue({
      data: mockChannels,
      refetch: vi.fn(),
      isLoading: false,
      error: null
    } as any);
  });

  it('renders nothing when user is not authenticated', () => {
    vi.mocked(useUser).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });
    render(<Chat />);
    expect(screen.queryByRole('region', { name: /message list/i })).not.toBeInTheDocument();
  });

  it('renders chat interface when user is authenticated', () => {
    render(<Chat />);
    expect(screen.getByRole('region', { name: /message list/i })).toBeInTheDocument();
  });

  it('joins channels on mount', () => {
    render(<Chat />);
    mockChannels.forEach(channel => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join_channel', channel.id);
    });
  });

  it('displays user status and logout button', () => {
    render(<Chat />);
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('displays channel list', () => {
    render(<Chat />);
    mockChannels.forEach(channel => {
      expect(screen.getByText(channel.name)).toBeInTheDocument();
    });
  });
});