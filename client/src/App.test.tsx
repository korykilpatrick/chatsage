import { render, screen } from '@testing-library/react';
import App from './App';
import { server } from './test/setup';
import { rest } from 'msw';

// Mock the hooks
jest.mock('@/hooks/use-user', () => ({
  useUser: () => ({
    user: null,
    isLoading: false
  })
}));

describe('App', () => {
  it('renders auth page when user is not logged in', () => {
    render(<App />);
    // AuthPage should be rendered when there's no user
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.spyOn(require('@/hooks/use-user'), 'useUser').mockReturnValue({
      user: null,
      isLoading: true
    });
    
    render(<App />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
