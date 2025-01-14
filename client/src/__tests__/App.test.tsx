import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing and shows loading state', () => {
    render(<App />);
    // Loading state should be visible initially (Loader2 component)
    const loadingSpinner = screen.getByLabelText('Loading');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveClass('animate-spin');
  });
});