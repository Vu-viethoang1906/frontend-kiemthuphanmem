import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CenterMembers from '../../../pages/Center/CenterMembers';

// Router mock
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ centerId: 'center1' }),
  useNavigate: () => mockNavigate,
}), { virtual: true });

// API mocks
jest.mock('../../../api/centerApi', () => ({
  getCenterById: jest.fn(() => Promise.resolve({ name: 'Main Center' }))
}));

// We allow real centerMemberApi logic (MSW handlers may return empty set)
jest.mock('../../../api/centerMemberApi', () => ({
  getCenterMembers: jest.fn(() => Promise.resolve({ success: true, data: [] }))
}));

// Toast silence
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

describe('CenterMembers behavior', () => {
  beforeEach(() => {
    localStorage.setItem('roles', JSON.stringify(['admin']));
  });

  test('shows empty state, supports search and back navigation', async () => {
    render(<CenterMembers />);

    // Search input present
    const searchInput = screen.getByPlaceholderText(/Search members/i);
    expect(searchInput).toBeInTheDocument();

    // Empty state appears (no members loaded) - multiple variants (mobile & desktop)
    const emptyStatesInitial = await screen.findAllByText(/No members in this center yet/i);
    expect(emptyStatesInitial.length).toBeGreaterThan(0);

    // Change search to unmatched term keeps empty state visible
    fireEvent.change(searchInput, { target: { value: 'zzz' } });
    const emptyStatesAfterSearch = await screen.findAllByText(/No members in this center yet/i);
    expect(emptyStatesAfterSearch.length).toBeGreaterThan(0);

    // Back navigation
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
