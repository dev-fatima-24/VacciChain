import { render, screen, fireEvent } from '@testing-library/react';
import RecordDetailModal from './RecordDetailModal';

describe('RecordDetailModal', () => {
  const mockRecord = {
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15',
    token_id: '123',
    issuer: 'G12345678901234567890123456789012345678901234567890123456',
    tx_hash: 'abc123def456'
  };
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no record is provided', () => {
    const { container } = render(<RecordDetailModal record={null} onClose={mockOnClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal with record details', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Vaccination Record/i)).toBeInTheDocument();
    expect(screen.getByText(/Vaccine Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Date Administered/i)).toBeInTheDocument();
    expect(screen.getByText(/Token ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Issuer Address/i)).toBeInTheDocument();
  });

  it('displays vaccine name', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    expect(screen.getByText(/COVID-19/i)).toBeInTheDocument();
  });

  it('displays date administered', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    expect(screen.getByText(/2024-01-15/i)).toBeInTheDocument();
  });

  it('displays token ID', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    expect(screen.getByText(/#123/i)).toBeInTheDocument();
  });

  it('displays issuer address', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    expect(screen.getByText(/G12345678/i)).toBeInTheDocument();
  });

  it('displays transaction hash when present', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    expect(screen.getByText(/Transaction Hash/i)).toBeInTheDocument();
    expect(screen.getByText(/abc123def456/i)).toBeInTheDocument();
  });

  it('shows Stellar Explorer link when tx_hash exists', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    const link = screen.getByRole('link', { name: /View on Stellar Explorer/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('stellar.expert'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows message when no tx_hash', () => {
    const recordWithoutTx = { ...mockRecord, tx_hash: null };
    render(<RecordDetailModal record={recordWithoutTx} onClose={mockOnClose} />);
    expect(screen.getByText(/Transaction hash not available/i)).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: /Close modal/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Close modal/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('has correct role and aria attributes', () => {
    render(<RecordDetailModal record={mockRecord} onClose={mockOnClose} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Vaccination record details');
  });
});