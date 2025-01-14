import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import * as useUserHook from '@/hooks/use-user';

// Mock useUser hook
vi.mock('@/hooks/use-user', () => ({
  useUser: () => ({
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  })
}));

describe('App', () => {
  it('renders loading state initially', () => {
    vi.spyOn(useUserHook, 'useUser').mockReturnValueOnce({
      user: null,
      isLoading: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    });

    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('flex items-center justify-center min-h-screen');
  });

  it('renders auth page when not loading and no user', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});