import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminHome from '../../../pages/Admin/AdminHome';
// Provide a lightweight virtual mock for react-router-dom to satisfy imports
jest.mock('react-router-dom', () => ({
  useNavigate: () => () => {}
}), { virtual: true });

// Behavior-focused, semantic assertions; avoids implementation details
describe('AdminHome visibility (additional)', () => {
  it('renders Admin Home page headings and key labels', async () => {
    render(<AdminHome />);

    // Prefer resilient labels already used in existing tests
    // Check for presence of common Admin labels without strict DOM structure
    const adminLabels = await screen.findAllByText(/Admin/i);
    const adminLabel = adminLabels[0];
    expect(adminLabel).toBeInTheDocument();

    const users = screen.queryAllByText(/Users|User Management/i);
    const roles = screen.queryAllByText(/Roles|Permissions/i);
    expect(users.length + roles.length).toBeGreaterThan(0);
  });
});
