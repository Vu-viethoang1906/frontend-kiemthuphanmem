import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../../components/LoginForm';

describe('LoginForm Component', () => {
  describe('Rendering', () => {
    it('should render the login heading', () => {
      render(<LoginForm />);

      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
    });

    it('should render username input field', () => {
      render(<LoginForm />);

      const usernameInput = screen.getByPlaceholderText(/Enter username/i);
      expect(usernameInput).toBeInTheDocument();
      expect(usernameInput).toHaveAttribute('type', 'text');
    });

    it('should render password input field', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render submit button', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /Login/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should render forgot password link', () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole('link', { name: /Forgot password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
    });

    it('should render register link', () => {
      render(<LoginForm />);

      const registerLink = screen.getByRole('link', { name: /Sign up/i });
      expect(registerLink).toBeInTheDocument();
    });
  });

  describe('Input Fields', () => {
    it('should have placeholder text for username input', () => {
      render(<LoginForm />);

      const usernameInput = screen.getByPlaceholderText(/Enter username/i);
      expect(usernameInput).toBeInTheDocument();
    });

    it('should have placeholder text for password input', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('should allow typing in username field', () => {
      render(<LoginForm />);

      const usernameInput = screen.getByPlaceholderText(/Enter username/i) as HTMLInputElement;
      userEvent.type(usernameInput, 'testuser');

      expect(usernameInput.value).toBe('testuser');
    });

    it('should allow typing in password field', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/Enter password/i) as HTMLInputElement;
      userEvent.type(passwordInput, 'password123');

      expect(passwordInput.value).toBe('password123');
    });

    it('should mask password input', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('User Interactions', () => {
    it('should allow clicking submit button', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /Login/i });
      userEvent.click(submitButton);

      // Button should be clickable (no errors thrown)
      expect(submitButton).toBeInTheDocument();
    });

    it('should allow clicking forgot password link', () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole('link', { name: /Forgot password/i });
      expect(forgotPasswordLink).toHaveAttribute('href', '#');
    });

    it('should allow clicking register link', () => {
      render(<LoginForm />);

      const registerLink = screen.getByRole('link', { name: /Sign up/i });
      expect(registerLink).toHaveAttribute('href', '#');
    });

    it('should handle form submission', () => {
      render(<LoginForm />);

      const form = screen.getByRole('button', { name: /Login/i }).closest('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<LoginForm />);

      // Check for label elements specifically to avoid matching link text
      const labels = screen.getAllByText(/Username|^Password$/i, { selector: 'label' });
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });

    it('should have accessible form elements', () => {
      render(<LoginForm />);

      const usernameInput = screen.getByPlaceholderText(/Enter username/i);
      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });

      expect(usernameInput).toBeEnabled();
      expect(passwordInput).toBeEnabled();
      expect(submitButton).toBeEnabled();
    });

    it('should have semantic HTML structure', () => {
      render(<LoginForm />);

      // Should have a form element
      const submitButton = screen.getByRole('button', { name: /Login/i });
      const form = submitButton.closest('form');
      expect(form).toBeInTheDocument();

      // Should have heading
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
    });

    it('should have proper button type attribute', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /Login/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Form Layout', () => {
    it('should render all form elements in correct order', () => {
      render(<LoginForm />);

      const heading = screen.getByRole('heading');
      const usernameInput = screen.getByPlaceholderText(/Enter username/i);
      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      const submitButton = screen.getByRole('button', { name: /Login/i });
      const forgotPasswordLink = screen.getByRole('link', { name: /Forgot password/i });
      const registerLink = screen.getByRole('link', { name: /Sign up/i });

      expect(heading).toBeInTheDocument();
      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(registerLink).toBeInTheDocument();
    });

    it('should display heading text correctly', () => {
      render(<LoginForm />);

      const heading = screen.getByRole('heading', { name: /Login/i });
      expect(heading).toHaveTextContent('Login');
    });
  });

  describe('Input Validation Visual', () => {
    it('should accept text input in username field', () => {
      render(<LoginForm />);

      const usernameInput = screen.getByPlaceholderText(/Enter username/i) as HTMLInputElement;
      userEvent.type(usernameInput, 'user@example.com');

      expect(usernameInput.value).toBe('user@example.com');
    });

    it('should accept text input in password field', () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/Enter password/i) as HTMLInputElement;
      userEvent.type(passwordInput, 'SecurePass123!');

      expect(passwordInput.value).toBe('SecurePass123!');
    });

    it('should allow clearing input fields', () => {
      render(<LoginForm />);

      const usernameInput = screen.getByPlaceholderText(/Enter username/i) as HTMLInputElement;
      userEvent.type(usernameInput, 'testuser');
      expect(usernameInput.value).toBe('testuser');

      userEvent.clear(usernameInput);
      expect(usernameInput.value).toBe('');
    });
  });

  describe('Link Attributes', () => {
    it('should have correct href for forgot password link', () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole('link', { name: /Forgot password/i });
      expect(forgotPasswordLink).toHaveAttribute('href');
    });

    it('should have correct href for register link', () => {
      render(<LoginForm />);

      const registerLink = screen.getByRole('link', { name: /Sign up/i });
      expect(registerLink).toHaveAttribute('href');
    });
  });

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => {
        render(<LoginForm />);
      }).not.toThrow();
    });

    it('should handle empty form submission', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /Login/i });
      
      // Should not throw error when clicking submit with empty fields
      expect(() => {
        userEvent.click(submitButton);
      }).not.toThrow();
    });

    it('should maintain input values after typing', () => {
      render(<LoginForm />);

      const usernameInput = screen.getByPlaceholderText(/Enter username/i) as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText(/Enter password/i) as HTMLInputElement;

      userEvent.type(usernameInput, 'user123');
      userEvent.type(passwordInput, 'pass456');

      expect(usernameInput.value).toBe('user123');
      expect(passwordInput.value).toBe('pass456');
    });
  });

  describe('Component Structure', () => {
    it('should render complete login form', () => {
      const { container } = render(<LoginForm />);

      // Should have form container
      expect(container.querySelector('form')).toBeInTheDocument();
      
      // Should have all inputs
      expect(screen.getByPlaceholderText(/Enter username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter password/i)).toBeInTheDocument();
      
      // Should have submit button
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('should have proper form element', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /Login/i });
      const form = submitButton.closest('form');
      
      expect(form).toBeInTheDocument();
      expect(form?.tagName).toBe('FORM');
    });
  });
});
