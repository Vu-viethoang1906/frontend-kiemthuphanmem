import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useParams: () => ({ userId: 'u1', groupId: 'g1' }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('../../../api/boardApi', () => ({
  __esModule: true,
  fetchBoardMember: jest.fn(),
}));

describe('pages/Board/BoardMember render', () => {
  it('renders user boards and navigate button', async () => {
  const { fetchBoardMember } = require('../../../api/boardApi');
    fetchBoardMember.mockResolvedValueOnce({ data: [
      { _id: 'bm1', role_in_board: 'Member', createdAt: new Date().toISOString(), board_id: { _id: 'b1', title: 'Board 1' } },
    ]});

  const { default: BoardMember } = require('../../../pages/Board/BoardMember');
    render(<BoardMember />);

    expect(await screen.findByText(/Boards for User/i)).toBeInTheDocument();
    expect(await screen.findByText('Board 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Board/i })).toBeInTheDocument();
  });
});
