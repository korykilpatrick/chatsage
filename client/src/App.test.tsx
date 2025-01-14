import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // This is a basic smoke test
    expect(document.body).toBeInTheDocument();
  });
});
