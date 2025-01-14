import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import MessageList from './message-list';
import { useSocket } from '@/hooks/use-socket';
import { useQuery } from '@tanstack/react-query';
import { createMockMessage } from '../../test/setupTests';

// Mock the hooks
vi.mock('@/hooks/use-socket', () => ({
  useSocket: vi.fn()
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn()
}));

describe('MessageList', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn()
  };

  const mockMessages = [
    createMockMessage({ 
      id: 1,
      content: 'Hello world',
      userId: 1,
      channelId: 1,
      createdAt: new Date('2024-01-14T12:00:00Z')
    }),
    createMockMessage({
      id: 2,
      content: 'How are you?',
      userId: 2,
      channelId: 1,
      createdAt: new Date('2024-01-14T12:01:00Z')
    })
  ];

  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSocket).mockReturnValue(mockSocket);
    vi.mocked(useQuery).mockReturnValue({
      data: mockMessages,
      refetch: mockRefetch,
      isLoading: false,
      error: null
    } as any);
  });

  it('renders messages correctly', () => {
    render(<MessageList />);

    // Check if messages are displayed
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();

    // Check if user names are displayed
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();

    // Check for avatar components
    const messageItems = screen.getAllByRole('listitem');
    expect(messageItems).toHaveLength(2);
    messageItems.forEach((item, index) => {
      const avatarImage = within(item).getByRole('img', { name: `User ${index + 1}'s avatar` });
      expect(avatarImage).toHaveAttribute('alt', `User ${index + 1}'s avatar`);
      expect(avatarImage).toHaveAttribute('src', `https://avatar.vercel.sh/${index + 1}`);
    });
  });

  it('sets up socket listeners on mount', () => {
    render(<MessageList />);
    expect(mockSocket.on).toHaveBeenCalledWith('message_received', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledTimes(1);
  });

  it('cleans up socket listeners on unmount', () => {
    const { unmount } = render(<MessageList />);
    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('message_received');
    expect(mockSocket.off).toHaveBeenCalledTimes(1);
  });

  it('refetches messages when receiving socket event', () => {
    render(<MessageList />);
    const [[, callback]] = mockSocket.on.mock.calls;
    act(() => {
      callback();
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no messages', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [],
      refetch: mockRefetch,
      isLoading: false,
      error: null
    } as any);

    render(<MessageList />);
    const messageContainer = screen.getByRole('region', { name: /message list/i });
    expect(messageContainer).toBeInTheDocument();
    expect(within(messageContainer).queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('handles loading state', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: true,
      error: null
    } as any);

    render(<MessageList />);
    expect(screen.getByLabelText('Loading messages')).toBeInTheDocument();
  });
});