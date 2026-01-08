import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/dashboard/centers' }),
  }),
  { virtual: true },
);

jest.mock('../../../api/centerApi', () => ({
  getAllCenters: jest.fn(async () => ({ success: true, data: [] })),
}));

import CenterManagement from '../../../pages/Center/CenterManagement';
import { ModalProvider } from '../../../components/ModalProvider';

describe('Center/CenterManagement states behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  test('empty list state', async () => {
    const api = require('../../../api/centerApi');
    api.getAllCenters.mockResolvedValueOnce({ success: true, data: [] });
    render(<ModalProvider><CenterManagement /></ModalProvider>);
    expect(await screen.findByText(/No centers found/i)).toBeInTheDocument();
    expect(screen.getByText(/No centers found/i)).toBeInTheDocument();
  });

    test('loaded list state', async () => {
    const api = require('../../../api/centerApi');
    api.getAllCenters.mockResolvedValueOnce({ success: true, data: [{ _id: 'c1', name: 'Center A' }] });
    render(<ModalProvider><CenterManagement /></ModalProvider>);
      const items = await screen.findAllByText(/Center A/i);
      expect(items.length).toBeGreaterThan(0);
  });

  test('error fallback to empty', async () => {
    const api = require('../../../api/centerApi');
    api.getAllCenters.mockRejectedValueOnce(new Error('network'));
    render(<ModalProvider><CenterManagement /></ModalProvider>);
    expect(await screen.findByText(/No centers found/i)).toBeInTheDocument();
  });
});
