import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from './message-input';
import { useSocket } from '@/hooks/use-socket';
import { useUser } from '@/hooks/use-user';
import { createMockUser } from '../../test/setupTests';

// Mock the hooks
vi.mock('@/hooks/use-socket', () => ({
  useSocket: vi.fn()
}));

vi.mock('@/hooks/use-user', () => ({
  useUser: vi.fn()
}));

describe('MessageInput', () => {
  const mockSocket = {
    emit: vi.fn()
  };

  const mockUser = createMockUser();

  beforeEach(() => {
    vi.mocked(useSocket).mockReturnValue(mockSocket);
    vi.mocked(useUser).mockReturnValue({ user: mockUser });
    vi.clearAllMocks();
  });

  it('renders message input form', () => {
    render(<MessageInput />);
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    render(<MessageInput />);
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Hello world' } });
    expect(input).toHaveValue('Hello world');
  });

  it('emits new_message event on form submission with valid input', () => {
    render(<MessageInput />);
    const input = screen.getByPlaceholderText(/type a message/i);
    const form = screen.getByRole('form');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    expect(mockSocket.emit).toHaveBeenCalledWith('new_message', {
      content: 'Test message',
      userId: mockUser.id,
      channelId: 1
    });
    expect(input).toHaveValue(''); // Input should be cleared after submission
  });

  it('does not emit message when input is empty', () => {
    render(<MessageInput />);
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('does not emit message when user is not available', () => {
    vi.mocked(useUser).mockReturnValue({ user: null });
    render(<MessageInput />);
    
    const input = screen.getByPlaceholderText(/type a message/i);
    const form = screen.getByRole('form');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('does not emit message when socket is not available', () => {
    vi.mocked(useSocket).mockReturnValue(null);
    render(<MessageInput />);
    
    const input = screen.getByPlaceholderText(/type a message/i);
    const form = screen.getByRole('form');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
