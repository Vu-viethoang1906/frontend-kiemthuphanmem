import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Toast and Modal
jest.mock('react-hot-toast', () => {
  const toast = { success: jest.fn(), error: jest.fn(), custom: jest.fn() };
  return { __esModule: true, default: toast, toast };
});
jest.mock('../../../components/ModalProvider', () => ({
  useModal: () => ({ show: jest.fn(), confirm: jest.fn().mockResolvedValue(true) })
}));

// API mocks
jest.mock('../../../api/userPointApi', () => {
  const getAllUserPoints = jest.fn();
  const updateUserPoint = jest.fn();
  const deleteUserPoint = jest.fn();
  const createUserPoint = jest.fn();
  return { __esModule: true, getAllUserPoints, updateUserPoint, deleteUserPoint, createUserPoint };
});
jest.mock('../../../api/centerApi', () => {
  const getAllCenters = jest.fn();
  return { __esModule: true, getAllCenters };
});
jest.mock('../../../api/userApi', () => {
  const fetchAllUsers = jest.fn();
  return { __esModule: true, fetchAllUsers };
});

const renderPage = async () => {

  const upApi = require('../../../api/userPointApi');
  const centerApi = require('../../../api/centerApi');
  const userApi = require('../../../api/userApi');

  upApi.getAllUserPoints.mockResolvedValueOnce({ success: true, data: [
    { _id: 'up1', user_id: 'u1', center_id: 'c1', user: { username: 'john', full_name: 'John', email: 'john@example.com' }, center: { _id: 'c1', name: 'Center 1' }, points: 10, total_points: 20, status: 'active' },
  ]});
  centerApi.getAllCenters.mockResolvedValueOnce({ success: true, data: [{ _id: 'c1', name: 'Center 1' }] });
  userApi.fetchAllUsers.mockResolvedValueOnce({ success: true, users: [{ _id: 'u1', username: 'john', full_name: 'John', email: 'john@example.com' }] });

  const { default: UserPointsManagement } = require('../../../pages/Admin/UserPointsManagement');
  render(<UserPointsManagement />);
  await screen.findByText(/User Points & Achievements/i);
};

describe('pages/Admin/UserPointsManagement', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    // default admin
    jest.spyOn(Storage.prototype as any, 'getItem').mockImplementation((...args: any[]) => (
      args[0] === 'roles' ? JSON.stringify(['admin']) : null
    ));
  });

  it('loads table and adds quick points via modal with correct totals', async () => {
    await renderPage();

    const row = (await screen.findByText('John')).closest('tr') as HTMLElement;
    const { within } = require('@testing-library/react');
    await userEvent.click(within(row).getByRole('button', { name: /^Add$/i }));
    expect(await screen.findByText(/ADD POINTS/i)).toBeInTheDocument();

    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '5');

    const upApi = require('../../../api/userPointApi');
    upApi.updateUserPoint.mockResolvedValueOnce({});
    await userEvent.click(screen.getByRole('button', { name: /ADD 5 POINTS/i }));
    await waitFor(() =>
      expect(upApi.updateUserPoint).toHaveBeenCalledWith('up1', {
        points: 15,
        total_points: 25,
      })
    );
  });

  it('shows access denied for non-admin and does not fetch data', async () => {
    // roles: not admin
    (Storage.prototype.getItem as any).mockImplementation((key: string) => key === 'roles' ? JSON.stringify(['member']) : null);

  const upApi = require('../../../api/userPointApi');
  const { default: UserPointsManagement } = require('../../../pages/Admin/UserPointsManagement');
    render(<UserPointsManagement />);

    // Access denied UI
    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
    // Ensure no fetchAll called
    expect(upApi.getAllUserPoints).not.toHaveBeenCalled();
  });

  it('edits a user point via modal and submits update', async () => {
    await renderPage();

    // Wait for row
    const nameCell = await screen.findByText('John');
    const row = nameCell.closest('tr') as HTMLElement;
    // Open Edit modal scoped to the row
  const { within } = require('@testing-library/react');
  await userEvent.click(within(row).getByRole('button', { name: /^Edit$/i }));
    // pick the last opened dialog to avoid multiple matches (edit modal vs add points modal)
    const allDialogs = await screen.findAllByRole('dialog');
    const modal = allDialogs[allDialogs.length - 1];
    expect(within(modal).getByRole('heading', { name: /Edit User Point/i })).toBeInTheDocument();

    // Change points and total points and status (scope to modal to avoid picking filter selects)
  const spinboxes = within(modal).getAllByRole('spinbutton');
  const pointsInput = spinboxes[0];
  const totalInput = spinboxes[1];
  const statusSelect = within(modal).getByRole('combobox');

    await userEvent.clear(pointsInput);
    await userEvent.type(pointsInput, '15');
    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '30');
    await userEvent.selectOptions(statusSelect, 'inactive');

  const upApi = require('../../../api/userPointApi');
    upApi.updateUserPoint.mockResolvedValueOnce({});

    await userEvent.click(within(modal).getByRole('button', { name: /UPDATE/i }));
    // Component sends string values for numeric inputs; accept strings in expectation
    await waitFor(() => expect(upApi.updateUserPoint).toHaveBeenCalledWith('up1', expect.objectContaining({ points: '15', total_points: '30', status: 'inactive' })));
  });

  it('deletes a user point after confirm', async () => {
  await renderPage();

  const upApi = require('../../../api/userPointApi');
  upApi.deleteUserPoint.mockResolvedValueOnce({});

  const row = (await screen.findByText('John')).closest('tr') as HTMLElement;
  const { within } = require('@testing-library/react');
  await userEvent.click(within(row).getByRole('button', { name: /Delete/i }));
    await waitFor(() => expect(upApi.deleteUserPoint).toHaveBeenCalledWith('up1'));
  });

  it('filters by status to show empty state', async () => {
    await renderPage();
    // Set filter to Inactive to hide active row
    const statusSelect = screen.getAllByRole('combobox')[1];
    await userEvent.selectOptions(statusSelect, 'inactive');
    expect(await screen.findByText(/No user points found/i)).toBeInTheDocument();
  });

  it('prevents negative quick-add points and shows error', async () => {
  await renderPage();
  const { toast } = require('react-hot-toast');

  const row = (await screen.findByText('John')).closest('tr') as HTMLElement;
  const { within } = require('@testing-library/react');
  await userEvent.click(within(row).getByRole('button', { name: /Add/i }));
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '-3');
    // Button enabled for negative (only disabled for zero)
    await userEvent.click(screen.getByRole('button', { name: /ADD -3 POINTS/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/cannot be negative/i)));
  });

  it('prevents saving negative points in edit modal', async () => {
    await renderPage();
    const { within } = require('@testing-library/react');
    const upApi = require('../../../api/userPointApi');
    const { toast } = require('react-hot-toast');

    const row = (await screen.findByText('John')).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /^Edit$/i }));
    const modal = (await screen.findAllByRole('dialog')).pop() as HTMLElement;

    const [pointsInput, totalInput] = within(modal).getAllByRole('spinbutton');
    await userEvent.clear(pointsInput);
    await userEvent.type(pointsInput, '-5');
    await userEvent.clear(totalInput);
    await userEvent.type(totalInput, '10');

    await userEvent.click(within(modal).getByRole('button', { name: /UPDATE/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/cannot be negative/i)));
    expect(upApi.updateUserPoint).not.toHaveBeenCalled();
  });

  it('filters by search term to empty state', async () => {
    await renderPage();
    const search = screen.getByPlaceholderText(/Search by user or center/i);
    await userEvent.clear(search);
    await userEvent.type(search, 'no-match');
    expect(await screen.findByText(/No user points found/i)).toBeInTheDocument();
  });
});
