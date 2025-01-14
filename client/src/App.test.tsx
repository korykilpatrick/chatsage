import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // By default App shows auth page when no user is logged in
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});
