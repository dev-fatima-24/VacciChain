import { render, screen, fireEvent } from '@testing-library/react';
import NFTCard from './NFTCard';

describe('NFTCard', () => {
  const mockRecord = {
    token_id: '12345',
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15',
    issuer: 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234'
  };

  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render NFT details correctly', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);

    expect(screen.getByText('💉 COVID-19')).toBeInTheDocument();
    expect(screen.getByText('#12345')).toBeInTheDocument();
    expect(screen.getByText('Date: 2024-01-15')).toBeInTheDocument();
    expect(screen.getByText(/Issuer: GABC1234/)).toBeInTheDocument();
  });

  it('should handle click events', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events (Enter key)', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events (Space key)', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render without onClick handler', () => {
    render(<NFTCard record={mockRecord} />);

    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
  });

  it('should display truncated issuer address', () => {
    render(<NFTCard record={mockRecord} />);

    expect(screen.getByText(/Issuer: GABC1234/)).toBeInTheDocument();
    expect(screen.getByText(/…1234$/)).toBeInTheDocument();
  });
});