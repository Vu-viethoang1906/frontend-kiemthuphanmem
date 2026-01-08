import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import ScheduledReports from '../../../pages/Reports/ScheduledReports';
import {
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  sendScheduledReportNow,
} from '../../../api/scheduledReportApi';
import { fetchMyBoards } from '../../../api/boardApi';

const mockConfirm = jest.fn(() => Promise.resolve(true));

jest.mock('../../../components/ModalProvider', () => ({
  __esModule: true,
  useModal: () => ({ confirm: mockConfirm }),
}));

jest.mock('../../../api/scheduledReportApi', () => ({
  getScheduledReports: jest.fn(),
  createScheduledReport: jest.fn(),
  updateScheduledReport: jest.fn(),
  deleteScheduledReport: jest.fn(),
  sendScheduledReportNow: jest.fn(),
}));

jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const sampleReport = {
  _id: 'sr1',
  board_id: { _id: 'b1', title: 'Board 1' },
  report_type: 'dashboard' as const,
  frequency: 'weekly' as const,
  recipients: ['a@example.com'],
  is_active: true,
  last_sent_at: null,
  next_send_at: '2024-01-02T00:00:00Z',
  retry_count: 0,
  last_error: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  report_params: {},
};

const mockBoards = { data: [{ _id: 'b1', title: 'Board 1' }] };

describe('ScheduledReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
    (fetchMyBoards as jest.Mock).mockResolvedValue(mockBoards);
    (getScheduledReports as jest.Mock).mockResolvedValue({ success: true, data: [sampleReport] });
    (createScheduledReport as jest.Mock).mockResolvedValue({});
    (updateScheduledReport as jest.Mock).mockResolvedValue({});
    (deleteScheduledReport as jest.Mock).mockResolvedValue({});
    (sendScheduledReportNow as jest.Mock).mockResolvedValue({});
    window.confirm = jest.fn(() => true);
  });

  const renderPage = () => render(<ScheduledReports />);

  it('renders scheduled reports list', async () => {
    renderPage();

    await waitFor(() => expect(getScheduledReports).toHaveBeenCalled());
    expect(screen.getByText('Scheduled Reports')).toBeInTheDocument();
    expect(screen.getByText('Board 1')).toBeInTheDocument();
    expect(screen.getByText(/Active|Đang hoạt động/i)).toBeInTheDocument();
  });

  it('sends now, toggles active, and deletes', async () => {
    renderPage();
    await screen.findByText('Board 1');

    fireEvent.click(screen.getByTitle('Send now'));
    await waitFor(() => expect(sendScheduledReportNow).toHaveBeenCalledWith('sr1'));

    fireEvent.click(screen.getByTitle('Disable'));
    await waitFor(() =>
      expect(updateScheduledReport).toHaveBeenCalledWith('sr1', { is_active: false }),
    );

    fireEvent.click(screen.getByTitle('Delete'));
    await waitFor(() => expect(deleteScheduledReport).toHaveBeenCalledWith('sr1'));
  });

  it('creates a new scheduled report from modal', async () => {
    renderPage();
    await screen.findByText('Board 1');

    fireEvent.click(screen.getByRole('button', { name: /Create New/i }));

    const emailInput = screen.getByPlaceholderText('email@example.com');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    const heading = screen.getByRole('heading', {
      name: /Create Scheduled Report|Đăng ký báo cáo mới/i,
    });
    const modal = heading.closest('div')?.parentElement;
    fireEvent.click(within(modal as HTMLElement).getByRole('button', { name: /^Create$/i }));

    await waitFor(() =>
      expect(createScheduledReport).toHaveBeenCalledWith({
        board_id: 'b1',
        report_type: 'dashboard',
        frequency: 'weekly',
        recipients: ['new@example.com'],
        report_params: {},
      }),
    );
  });

  it('edits an existing scheduled report', async () => {
    renderPage();
    await screen.findByText('Board 1');

    fireEvent.click(screen.getByTitle('Edit'));
    fireEvent.change(screen.getByDisplayValue('a@example.com'), {
      target: { value: 'updated@example.com' },
    });
    const frequencyField = screen.getByText(/Frequency|Tần suất/i).closest('div');
    const frequencySelect = within(frequencyField as HTMLElement).getByRole('combobox');
    fireEvent.change(frequencySelect, { target: { value: 'monthly' } });

    fireEvent.click(screen.getByRole('button', { name: /Update/i }));

    await waitFor(() =>
      expect(updateScheduledReport).toHaveBeenCalledWith('sr1', {
        board_id: 'b1',
        report_type: 'dashboard',
        frequency: 'monthly',
        recipients: ['updated@example.com'],
        report_params: {},
      }),
    );
  });
});
