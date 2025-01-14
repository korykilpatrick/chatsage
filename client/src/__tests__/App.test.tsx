import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Basic smoke test to ensure the app renders
    expect(document.querySelector('#root')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    render(<App />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
