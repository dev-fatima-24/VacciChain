import { render, screen, fireEvent } from '@testing-library/react';
import FreighterBanner from './FreighterBanner';

// Mock useAuth hook
jest.mock('../hooks/useFreighter', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../hooks/useFreighter';

describe('FreighterBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when freighter is installed', () => {
    useAuth.mockReturnValue({ freighterInstalled: true });
    const { container } = render(<FreighterBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders banner when freighter is not installed', () => {
    useAuth.mockReturnValue({ freighterInstalled: false });
    render(<FreighterBanner />);
    expect(screen.getByText(/Freighter wallet not detected/i)).toBeInTheDocument();
  });

  it('renders install link', () => {
    useAuth.mockReturnValue({ freighterInstalled: false });
    render(<FreighterBanner />);
    const link = screen.getByRole('link', { name: /Install Freighter/i });
    expect(link).toHaveAttribute('href', 'https://www.freighter.app/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders dismiss button', () => {
    useAuth.mockReturnValue({ freighterInstalled: false });
    render(<FreighterBanner />);
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
  });

  it('hides banner after dismiss', () => {
    useAuth.mockReturnValue({ freighterInstalled: false });
    const { rerender } = render(<FreighterBanner />);
    expect(screen.getByText(/Freighter wallet not detected/i)).toBeInTheDocument();
    
    // Dismiss the banner - component uses internal state
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    
    // After dismiss, the component's internal state changes and banner is hidden
    expect(screen.queryByText(/Freighter wallet not detected/i)).not.toBeInTheDocument();
  });

  it('has correct styling', () => {
    useAuth.mockReturnValue({ freighterInstalled: false });
    render(<FreighterBanner />);
    const banner = screen.getByText(/Freighter wallet not detected/i).closest('div');
    expect(banner).toHaveStyle({ background: '#7c3aed', color: '#fff' });
  });
});