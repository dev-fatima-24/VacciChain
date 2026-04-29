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

    const card = screen.getByTestId('nft-card');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events (Enter key)', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);

    const card = screen.getByTestId('nft-card');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events (Space key)', () => {
    render(<NFTCard record={mockRecord} onClick={mockOnClick} />);

    const card = screen.getByTestId('nft-card');
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render without onClick handler', () => {
    render(<NFTCard record={mockRecord} />);

    const card = screen.getByTestId('nft-card');
    expect(card).toBeInTheDocument();
  });

  it('should display truncated issuer address', () => {
    render(<NFTCard record={mockRecord} />);

    expect(screen.getByText(/Issuer: GABC1234/)).toBeInTheDocument();
    expect(screen.getByText(/…1234$/)).toBeInTheDocument();
  });

  it('should display dose progress badge when dose_number and dose_series are present', () => {
    const doseRecord = { ...mockRecord, dose_number: 2, dose_series: 3 };
    render(<NFTCard record={doseRecord} />);
    expect(screen.getByText('2/3 doses')).toBeInTheDocument();
    expect(screen.getByLabelText('Dose 2 of 3')).toBeInTheDocument();
  });

  it('should display completed dose badge when series is complete', () => {
    const doseRecord = { ...mockRecord, dose_number: 3, dose_series: 3 };
    render(<NFTCard record={doseRecord} />);
    expect(screen.getByText('3/3 doses')).toBeInTheDocument();
  });

  it('should display dose number only when dose_series is absent', () => {
    const doseRecord = { ...mockRecord, dose_number: 1 };
    render(<NFTCard record={doseRecord} />);
    expect(screen.getByText('Dose 1')).toBeInTheDocument();
  });

  it('should not display dose badge when dose_number is absent', () => {
    render(<NFTCard record={mockRecord} />);
    expect(screen.queryByText(/doses/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dose \d/)).not.toBeInTheDocument();
  });
});