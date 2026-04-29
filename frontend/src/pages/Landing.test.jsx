import { render, screen } from '@testing-library/react';
import Landing from './Landing';

// Mock useAuth hook
jest.mock('../hooks/useFreighter', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../hooks/useFreighter';

describe('Landing', () => {
  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    useAuth.mockReturnValue({ publicKey: null, connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    expect(screen.getByText('💉 VacciChain')).toBeInTheDocument();
  });

  it('renders description', () => {
    useAuth.mockReturnValue({ publicKey: null, connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    expect(screen.getByText(/Blockchain-based vaccination records/i)).toBeInTheDocument();
  });

  it('shows connect button when not connected', () => {
    useAuth.mockReturnValue({ publicKey: null, connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    expect(screen.getByRole('button', { name: /Connect Freighter Wallet/i })).toBeInTheDocument();
  });

  it('calls connect when button is clicked', () => {
    useAuth.mockReturnValue({ publicKey: null, connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    const button = screen.getByRole('button', { name: /Connect Freighter Wallet/i });
    button.click();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('shows connected state with public key', () => {
    useAuth.mockReturnValue({ publicKey: 'G12345678901234567890123456789012345678901234567890123456', connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    expect(screen.getByText(/✅ Connected:/i)).toBeInTheDocument();
    // Public key is rendered as "G1234567…3456" (first 8 chars + ... + last 4 chars)
    expect(screen.getByText(/G1234567/i)).toBeInTheDocument();
    expect(screen.getByText(/3456/i)).toBeInTheDocument();
  });

  it('shows disconnect button when connected', () => {
    useAuth.mockReturnValue({ publicKey: 'G12345678901234567890123456789012345678901234567890123456', connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
  });

  it('calls disconnect when disconnect button is clicked', () => {
    useAuth.mockReturnValue({ publicKey: 'G12345678901234567890123456789012345678901234567890123456', connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    const button = screen.getByRole('button', { name: /Disconnect/i });
    button.click();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('shows info about Freighter requirement', () => {
    useAuth.mockReturnValue({ publicKey: null, connect: mockConnect, disconnect: mockDisconnect });
    render(<Landing />);
    expect(screen.getByText(/Requires Freighter browser extension/i)).toBeInTheDocument();
  });
});