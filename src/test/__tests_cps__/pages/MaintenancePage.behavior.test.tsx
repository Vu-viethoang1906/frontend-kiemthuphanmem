import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock maintenance API
const mockEnable = jest.fn();
const mockDisable = jest.fn();
const mockGetStatus = jest.fn();

jest.mock('../../../api/maintenanceApi', () => ({
  enableMaintenance: (...args: any[]) => mockEnable(...args),
  disableMaintenance: (...args: any[]) => mockDisable(...args),
  getMaintenanceStatus: (...args: any[]) => mockGetStatus(...args),
}));

import MaintenancePage from '../../../pages/MaintenancePage';

describe('pages/MaintenancePage behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders current status and toggles from off -> on', async () => {
    // Initial: not enabled
    mockGetStatus.mockResolvedValueOnce({ data: { maintenance: false } });
    mockEnable.mockResolvedValueOnce({});
    mockGetStatus.mockResolvedValueOnce({ data: { maintenance: true } });

    render(<MaintenancePage />);

    // Shows initial state
    expect(await screen.findByText(/ACTIVE/i)).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Enable maintenance/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockEnable).toHaveBeenCalled();
    });

    // After toggle + refresh, shows enabled state
    const statusText = await screen.findByText(/Current status:/i);
    expect(statusText).toBeInTheDocument();
    expect(statusText.textContent).toMatch(/MAINTENANCE/i);
  });

  it('toggles from on -> off', async () => {
    // Initial enabled
    mockGetStatus.mockResolvedValueOnce({ data: { maintenance: true } });
    mockDisable.mockResolvedValueOnce({});
    mockGetStatus.mockResolvedValueOnce({ data: { maintenance: false } });

    render(<MaintenancePage />);

    const statusText = await screen.findByText(/Current status:/i);
    expect(statusText).toBeInTheDocument();
    expect(statusText.textContent).toMatch(/MAINTENANCE/i);

    const btn = screen.getByRole('button', { name: /Disable maintenance/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockDisable).toHaveBeenCalled();
    });

    expect(await screen.findByText(/ACTIVE/i)).toBeInTheDocument();
  });
});
