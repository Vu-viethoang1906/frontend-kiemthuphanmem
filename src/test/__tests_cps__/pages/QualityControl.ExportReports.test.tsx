import React from 'react';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

const mockExportReport = jest.fn();
const mockDownloadExportFile = jest.fn();
const mockListExportFiles = jest.fn();
const mockDeleteExportFile = jest.fn();
jest.mock('../../../api/exportApi', () => ({
  exportReport: (...args: any[]) => mockExportReport(...args),
  downloadExportFile: (...args: any[]) => mockDownloadExportFile(...args),
  listExportFiles: (...args: any[]) => mockListExportFiles(...args),
  deleteExportFile: (...args: any[]) => mockDeleteExportFile(...args),
}));

const mockFetchMyBoards = jest.fn();
jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
}));

const mockGetAllCenters = jest.fn();
jest.mock('../../../api/centerApi', () => ({
  getAllCenters: (...args: any[]) => mockGetAllCenters(...args),
}));

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

function renderPage() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Comp = require('../../../pages/QualityControl/ExportReports').default;
  return render(<Comp />);
}

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const pastDate = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();

beforeEach(() => {
  jest.clearAllMocks();
  mockListExportFiles.mockResolvedValue({ success: true, data: [] });
  mockFetchMyBoards.mockResolvedValue({ data: [{ _id: 'b1', title: 'Board One' }] });
  mockGetAllCenters.mockResolvedValue({ success: true, data: [{ _id: 'c1', name: 'Center One' }] });
  mockExportReport.mockResolvedValue({
    success: true,
    data: {
      filename: 'new-dashboard.xlsx',
      format: 'excel',
      reportType: 'dashboard',
      expiresAt: futureDate(),
    },
  });
  mockDownloadExportFile.mockResolvedValue(new Blob(['data']));
  (URL as any).createObjectURL = jest.fn(() => 'blob:mock');
  (URL as any).revokeObjectURL = jest.fn();
});

afterAll(() => {
  (URL as any).createObjectURL = originalCreateObjectURL;
  (URL as any).revokeObjectURL = originalRevokeObjectURL;
});

describe('ExportReports', () => {
  it('renders loader while data is fetching', async () => {
    let resolveBoards: (value: unknown) => void = () => undefined;
    let resolveCenters: (value: unknown) => void = () => undefined;
    mockFetchMyBoards.mockReturnValue(new Promise((res) => { resolveBoards = res; }));
    mockGetAllCenters.mockReturnValue(new Promise((res) => { resolveCenters = res; }));

    const { container } = renderPage();

    expect(container.querySelector('.animate-spin')).toBeTruthy();

    await act(async () => {
      resolveBoards({ data: [] });
      resolveCenters({ success: true, data: [] });
    });
    await waitFor(() => expect(mockGetAllCenters).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => expect(container.querySelector('.animate-spin')).toBeFalsy(), { timeout: 3000 });
  });

  it('validates board requirement before exporting', async () => {
    mockListExportFiles.mockResolvedValue({ success: true, data: [] });
    const { container } = renderPage();

    await waitFor(() => expect(screen.getByText('Export Reports')).toBeInTheDocument());

    const boardSelect = container.querySelector('select');
    expect(boardSelect).toBeTruthy();
    fireEvent.change(boardSelect!, { target: { value: '' } });
    const exportBtn = screen.getByRole('button', { name: /Export Report/i });
    expect(exportBtn).toBeDisabled();
    fireEvent.click(exportBtn);

    expect(mockExportReport).not.toHaveBeenCalled();
  });

  it('validates leaderboard date ordering before exporting', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(screen.getByText('Export Reports')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Leaderboard'));
    await waitFor(() => expect(container.querySelectorAll('input[type="date"]').length).toBe(2));
    const [startInput, endInput] = Array.from(container.querySelectorAll('input[type="date"]')) as HTMLInputElement[];

    fireEvent.change(startInput, { target: { value: '2024-05-10' } });
    fireEvent.change(endInput, { target: { value: '2024-05-01' } });
    fireEvent.click(screen.getByRole('button', { name: /Export Report/i }));

    expect(mockExportReport).not.toHaveBeenCalled();
    expect((toast as any).error).toHaveBeenCalledWith('Start date must be before end date');
  });

  it('exports dashboard report and refreshes file list', async () => {
    const nextFile = {
      filename: 'refreshed.xlsx',
      format: 'excel',
      reportType: 'dashboard',
      expiresAt: futureDate(),
    };
    mockListExportFiles.mockReset();
    mockListExportFiles
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: [nextFile] });

    renderPage();
    await waitFor(() => expect(screen.getByText('Export Reports')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Export Report/i }));

    await waitFor(() => expect(mockExportReport).toHaveBeenCalled());
    expect(mockExportReport).toHaveBeenCalledWith(expect.objectContaining({
      report_type: 'dashboard',
      format: 'excel',
      board_id: 'b1',
      granularity: 'day',
    }));

    await waitFor(() => expect(screen.getByText(nextFile.filename)).toBeInTheDocument());
    expect((toast as any).success).toHaveBeenCalledWith('Report exported successfully!');
  });

  it('downloads and deletes exported files, disabling expired ones', async () => {
    const files = [
      { filename: 'fresh.xlsx', format: 'excel', reportType: 'dashboard', expiresAt: futureDate() },
      { filename: 'expired.pdf', format: 'pdf', reportType: 'leaderboard', expiresAt: pastDate() },
    ];
    mockListExportFiles.mockResolvedValue({ success: true, data: files });

    renderPage();
    await waitFor(() => expect(screen.getByText('fresh.xlsx')).toBeInTheDocument());

    const [downloadFresh, downloadExpired] = screen.getAllByRole('button', { name: /Download/i });
    fireEvent.click(downloadFresh);
    await waitFor(() => expect(mockDownloadExportFile).toHaveBeenCalledWith('fresh.xlsx'));
    expect((URL as any).createObjectURL).toHaveBeenCalled();

    expect(downloadExpired).toBeDisabled();

    const deleteBtn = screen.getAllByTitle('Remove from list')[1];
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(screen.queryByText('expired.pdf')).not.toBeInTheDocument());
    expect((toast as any).success).toHaveBeenCalledWith('File removed from the list');
  });
});
