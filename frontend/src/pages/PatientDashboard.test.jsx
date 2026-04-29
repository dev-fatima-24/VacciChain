import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientDashboard from './PatientDashboard';

jest.mock('../hooks/useFreighter', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useVaccination', () => ({ useVaccination: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'patient.title') return 'My Vaccination Records';
      if (key === 'patient.recordCount') return `${opts?.count} records`;
      if (key === 'patient.pageOf') return `Page ${opts?.page} of ${opts?.total}`;
      if (key === 'patient.prevPage') return 'Previous';
      if (key === 'patient.nextPage') return 'Next';
      return key;
    },
  }),
}));

import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';

const WALLET = 'G12345678901234567890123456789012345678901234567890123456';

describe('PatientDashboard', () => {
  const mockConnect = jest.fn();

  beforeEach(() => { jest.clearAllMocks(); });

  describe('when not connected', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ publicKey: null, connect: mockConnect });
      useVaccination.mockReturnValue({ fetchRecords: jest.fn(), loading: false });
    });

    it('shows connect wallet prompt', () => {
      render(<PatientDashboard />);
      expect(screen.getByText(/Connect your wallet to view records/i)).toBeInTheDocument();
    });

    it('calls connect when button is clicked', () => {
      render(<PatientDashboard />);
      screen.getByRole('button', { name: /Connect Freighter wallet/i }).click();
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('when connected', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ publicKey: WALLET, connect: mockConnect });
    });

    it('shows title', async () => {
      useVaccination.mockReturnValue({
        fetchRecords: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
        loading: false,
      });
      render(<PatientDashboard />);
      expect(screen.getByText(/My Vaccination Records/i)).toBeInTheDocument();
    });

    it('shows wallet address', () => {
      useVaccination.mockReturnValue({
        fetchRecords: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
        loading: false,
      });
      render(<PatientDashboard />);
      expect(screen.getByText(/Wallet:/i)).toBeInTheDocument();
    });

    it('shows loading skeleton when loading', () => {
      useVaccination.mockReturnValue({
        fetchRecords: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
        loading: true,
      });
      render(<PatientDashboard />);
      // NFTCardSkeleton injects a keyframe style tag
      const styleTag = document.querySelector('style');
      expect(styleTag).not.toBeNull();
      expect(styleTag.textContent).toMatch(/vacciPulse/);
    });

    it('shows empty state when no records', async () => {
      useVaccination.mockReturnValue({
        fetchRecords: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
        loading: false,
      });
      render(<PatientDashboard />);
      await waitFor(() => expect(screen.getByText(/No vaccination records found/i)).toBeInTheDocument());
    });

    it('shows record count when records exist', async () => {
      const records = [
        { token_id: '1', vaccine_name: 'COVID-19', date_administered: '2024-01-15', issuer: 'G123' },
        { token_id: '2', vaccine_name: 'Flu', date_administered: '2023-10-01', issuer: 'G456' },
      ];
      useVaccination.mockReturnValue({
        fetchRecords: jest.fn().mockResolvedValue({ data: records, total: 2, page: 1, limit: 20 }),
        loading: false,
      });
      render(<PatientDashboard />);
      await waitFor(() => expect(screen.getByText(/2 records/i)).toBeInTheDocument());
    });

    it('shows pagination when multiple pages exist', async () => {
      const records = Array.from({ length: 20 }, (_, i) => ({
        token_id: String(i + 1), vaccine_name: 'COVID-19', date_administered: '2024-01-15', issuer: 'G123',
      }));
      useVaccination.mockReturnValue({
        fetchRecords: jest.fn().mockResolvedValue({ data: records, total: 40, page: 1, limit: 20 }),
        loading: false,
      });
      render(<PatientDashboard />);
      await waitFor(() => expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument());
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    });

    it('fetches next page when Next is clicked', async () => {
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({ data: [], total: 40, page: 1, limit: 20 })
        .mockResolvedValueOnce({ data: [], total: 40, page: 2, limit: 20 });
      useVaccination.mockReturnValue({ fetchRecords: mockFetch, loading: false });

      render(<PatientDashboard />);
      await waitFor(() => screen.getByRole('button', { name: /Next/i }));
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(WALLET, { page: 2, limit: 20 }));
    });

    it('passes page and limit to fetchRecords on initial load', async () => {
      const mockFetch = jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
      useVaccination.mockReturnValue({ fetchRecords: mockFetch, loading: false });

      render(<PatientDashboard />);
      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(WALLET, { page: 1, limit: 20 }));
    });
  });
});
