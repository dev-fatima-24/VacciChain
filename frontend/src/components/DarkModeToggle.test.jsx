import { render, screen, fireEvent } from '@testing-library/react';
import DarkModeToggle from './DarkModeToggle';

describe('DarkModeToggle', () => {
  it('renders toggle button', () => {
    render(<DarkModeToggle dark={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('shows moon emoji when in light mode', () => {
    render(<DarkModeToggle dark={false} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveTextContent('🌙');
  });

  it('shows sun emoji when in dark mode', () => {
    render(<DarkModeToggle dark={true} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveTextContent('☀️');
  });

  it('calls onToggle when clicked', () => {
    const handleToggle = jest.fn();
    render(<DarkModeToggle dark={false} onToggle={handleToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label for light mode', () => {
    render(<DarkModeToggle dark={false} onToggle={() => {}} />);
    // In light mode (dark=false), button says "Switch to dark mode"
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('has correct aria-label for dark mode', () => {
    render(<DarkModeToggle dark={true} onToggle={() => {}} />);
    // In dark mode (dark=true), button says "Switch to light mode"
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });
});