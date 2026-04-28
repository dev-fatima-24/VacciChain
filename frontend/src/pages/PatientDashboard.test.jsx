import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientDashboard from './PatientDashboard';

// Mock hooks
jest.mock('../hooks/useFreighter', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useVaccination', () => ({
  useVaccination: jest.fn(),
}));

jest.mock('../hooks/usePagination', () => ({
  usePagination: jest.fn(),
}));

import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';
import { usePagination } from '../hooks/usePagination';

describe('PatientDashboard', () => {
  const mockConnect = jest.fn();
  const mockFetchRecords = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when not connected', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ publicKey: null, connect: mockConnect });
      useVaccination.mockReturnValue({ fetchRecords: mockFetchRecords, loading: false });
      usePagination.mockReturnValue({
        currentItems: [],
        page: 1,
        totalPages: 0,
        goTo: jest.fn(),
        reset: jest.fn(),
        total: 0
      });
    });

    it('shows connect wallet prompt', () => {
      render(<PatientDashboard />);
      expect(screen.getByText(/Connect your wallet to view records/i)).toBeInTheDocument();
    });

    it('shows connect button', () => {
      render(<PatientDashboard />);
      expect(screen.getByRole('button', { name: /Connect Freighter wallet to view vaccination records/i })).toBeInTheDocument();
    });

    it('calls connect when button is clicked', () => {
      render(<PatientDashboard />);
      const button = screen.getByRole('button', { name: /Connect Freighter wallet to view vaccination records/i });
      button.click();
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('when connected', () => {
    const mockPublicKey = 'G12345678901234567890123456789012345678901234567890123456';

    beforeEach(() => {
      useAuth.mockReturnValue({ publicKey: mockPublicKey, connect: mockConnect });
      // Mock fetchRecords to return a Promise
      useVaccination.mockReturnValue({ 
        fetchRecords: jest.fn().mockResolvedValue({ records: [] }), 
        loading: false 
      });
    });

    it('shows title', () => {
      usePagination.mockReturnValue({
        currentItems: [],
        page: 1,
        totalPages: 0,
        goTo: jest.fn(),
        reset: jest.fn(),
        total: 0
      });
      render(<PatientDashboard />);
      expect(screen.getByText(/My Vaccination Records/i)).toBeInTheDocument();
    });

    it('shows wallet address', () => {
      usePagination.mockReturnValue({
        currentItems: [],
        page: 1,
        totalPages: 0,
        goTo: jest.fn(),
        reset: jest.fn(),
        total: 0
      });
      render(<PatientDashboard />);
      expect(screen.getByText(/Wallet:/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockPublicKey.slice(0, 8)))).toBeInTheDocument();
    });

    it('shows loading skeleton when loading', () => {
      useVaccination.mockReturnValue({ 
        fetchRecords: jest.fn().mockResolvedValue({ records: [] }), 
        loading: true 
      });
      usePagination.mockReturnValue({
        currentItems: [],
        page: 1,
        totalPages: 0,
        goTo: jest.fn(),
        reset: jest.fn(),
        total: 0
      });
      render(<PatientDashboard />);
      // NFTCardSkeleton should be rendered
      const skeletons = document.querySelectorAll('[style*="border: 1px solid #334155"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows empty state when no records', () => {
      usePagination.mockReturnValue({
        currentItems: [],
        page: 1,
        totalPages: 0,
        goTo: jest.fn(),
        reset: jest.fn(),
        total: 0
      });
      render(<PatientDashboard />);
      expect(screen.getByText(/No vaccination records found/i)).toBeInTheDocument();
    });

    it('shows record count when records exist', () => {
      const mockRecords = [
        { token_id: '1', vaccine_name: 'COVID-19', date_administered: '2024-01-15', issuer: 'G123' },
        { token_id: '2', vaccine_name: 'Flu', date_administered: '2023-10-01', issuer: 'G456' }
      ];
      usePagination.mockReturnValue({
        currentItems: mockRecords,
        page: 1,
        totalPages: 1,
        goTo: jest.fn(),
        reset: jest.fn(),
        total: 2
      });
      render(<PatientDashboard />);
      expect(screen.getByText(/2 records/i)).toBeInTheDocument();
    });

    it('shows pagination when multiple pages', () => {
      const mockRecords = Array.from({ length: 10 }, (_, i) => ({
        token_id: String(i + 1),
        vaccine_name: 'COVID-19',
        date_administered: '2024-01-15',
        issuer: 'G123'
      }));
      usePagination.mockReturnValue({
        currentItems: mockRecords.slice(0, 5),
        page: 1,
        totalPages: 2,
        goTo: jest.fn(),
        reset: jest.fn(),
        total: 10
      });
      render(<PatientDashboard />);
      expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    });
  });
});