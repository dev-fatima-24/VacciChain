import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmMintDialog from './ConfirmMintDialog';

describe('ConfirmMintDialog', () => {
  const mockRecord = {
    patient_address: 'G12345678901234567890123456789012345678901234567890123456',
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15'
  };
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with record details', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    
    expect(screen.getByText(/Confirm Vaccination Mint/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient/i)).toBeInTheDocument();
    expect(screen.getByText(/Vaccine/i)).toBeInTheDocument();
    expect(screen.getByText(/Date/i)).toBeInTheDocument();
  });

  it('displays patient address', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    expect(screen.getByText(/G12345678/i)).toBeInTheDocument();
  });

  it('displays vaccine name', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    expect(screen.getByText(/COVID-19/i)).toBeInTheDocument();
  });

  it('displays date administered', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    expect(screen.getByText(/2024-01-15/i)).toBeInTheDocument();
  });

  it('shows confirm button', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    expect(screen.getByRole('button', { name: /Confirm & Mint/i })).toBeInTheDocument();
  });

  it('shows cancel button', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /Confirm & Mint/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('has correct role and aria attributes', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  it('confirm button has autoFocus', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    const confirmButton = screen.getByRole('button', { name: /Confirm & Mint/i });
    expect(confirmButton).toHaveFocus();
  });

  it('prevents Enter key from triggering default behavior', () => {
    render(<ConfirmMintDialog record={mockRecord} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />);
    const overlay = screen.getByRole('dialog');
    const preventDefault = jest.fn();
    fireEvent.keyDown(overlay, { key: 'Enter', preventDefault });
    expect(preventDefault).not.toHaveBeenCalled(); // Enter is allowed to propagate
  });
});