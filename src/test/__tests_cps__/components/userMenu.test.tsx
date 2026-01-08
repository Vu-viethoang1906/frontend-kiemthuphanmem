import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from '../../../components/UserMenu';

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

describe('UserMenu component', () => {
  const defaultProps = {
    avatarUrl: 'https://example.com/avatar.jpg',
    email: 'user@example.com',
    displayName: 'John Doe',
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user menu button with avatar', () => {
    render(<UserMenu {...defaultProps} />);
    
    const button = screen.getByRole('button', { expanded: false });
    expect(button).toBeInTheDocument();
    
    const avatar = screen.getByAltText('User avatar');
    expect(avatar).toHaveAttribute('src', defaultProps.avatarUrl);
  });

  it('should display user information when menu is opened', async () => {
    render(<UserMenu {...defaultProps} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(screen.getByText(defaultProps.displayName!)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.email)).toBeInTheDocument();
  });

  it('should toggle menu when button is clicked', async () => {
    render(<UserMenu {...defaultProps} />);
    
    const button = screen.getByRole('button');
    
    // Initially closed
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    // Open menu
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Close menu
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should call onLogout when logout button is clicked', async () => {
    render(<UserMenu {...defaultProps} />);
    
    const menuButton = screen.getByRole('button');
    await userEvent.click(menuButton);

    const logoutButton = screen.getByRole('button', { name: /Log out/i });
    await userEvent.click(logoutButton);

    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1);
  });

  it('should close menu when clicking outside', async () => {
    render(
      <div>
        <UserMenu {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const menuButton = screen.getByRole('button');
    await userEvent.click(menuButton);
    
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    const outside = screen.getByTestId('outside');
    await userEvent.click(outside);

    await waitFor(() => {
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('should close menu when pressing Escape key', async () => {
    render(<UserMenu {...defaultProps} />);
    
    const menuButton = screen.getByRole('button');
    await userEvent.click(menuButton);
    
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('should render with gray accent by default', () => {
    render(<UserMenu {...defaultProps} />);
    
    const avatar = screen.getByAltText('User avatar');
    expect(avatar).toHaveClass('border-gray-200');
  });

  it('should render with red accent when specified', () => {
    render(<UserMenu {...defaultProps} accent="red" />);
    
    const avatar = screen.getByAltText('User avatar');
    expect(avatar).toHaveClass('border-red-500');
  });

  it('should display email when displayName is not provided', () => {
    const propsWithoutName = { ...defaultProps, displayName: undefined };
    render(<UserMenu {...propsWithoutName} />);
    
    const menuButton = screen.getByRole('button');
    userEvent.click(menuButton);

    waitFor(() => {
      expect(screen.getByText(defaultProps.email)).toBeInTheDocument();
    });
  });
});
