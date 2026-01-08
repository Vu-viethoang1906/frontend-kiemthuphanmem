import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupportCenter from '../../../components/SupportCenter';

describe('SupportCenter Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the support center heading', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      expect(screen.getByText('Support Center')).toBeInTheDocument();
    });

    it('should render the description text', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      expect(
        screen.getByText(/A quick guide to using the project management system/i)
      ).toBeInTheDocument();
    });

    it('should render all three support cards', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      expect(screen.getByText('How to Create Project')).toBeInTheDocument();
      expect(screen.getByText('Task Management Guide')).toBeInTheDocument();
      expect(screen.getByText('Team Collaboration')).toBeInTheDocument();
    });

    it('should render card descriptions', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      expect(
        screen.getByText(/Guide to creating a new project, setting up boards/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/How to create, edit, and move tasks/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Work effectively with realtime updates/i)
      ).toBeInTheDocument();
    });

    it('should render card images with correct alt text', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const createProjectImg = screen.getByAltText('How to Create Project');
      const taskManagementImg = screen.getByAltText('Task Management Guide');
      const teamCollabImg = screen.getByAltText('Team Collaboration');

      expect(createProjectImg).toBeInTheDocument();
      expect(taskManagementImg).toBeInTheDocument();
      expect(teamCollabImg).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose multiple times on single click', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card Content', () => {
    it('should display correct image sources for cards', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const createProjectImg = screen.getByAltText('How to Create Project') as HTMLImageElement;
      const taskManagementImg = screen.getByAltText('Task Management Guide') as HTMLImageElement;
      const teamCollabImg = screen.getByAltText('Team Collaboration') as HTMLImageElement;

      expect(createProjectImg.src).toContain('/icons/projectcreate.jpg');
      expect(taskManagementImg.src).toContain('/icons/TaskManagement.avif');
      expect(teamCollabImg.src).toContain('/icons/TeamCollaboration.jpeg');
    });

    it('should render all card titles as headings', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const titles = screen.getAllByRole('heading', { level: 3 });
      expect(titles).toHaveLength(3);
      expect(titles[0]).toHaveTextContent('How to Create Project');
      expect(titles[1]).toHaveTextContent('Task Management Guide');
      expect(titles[2]).toHaveTextContent('Team Collaboration');
    });
  });

  describe('Visual Structure', () => {
    it('should render modal overlay', () => {
      const { container } = render(<SupportCenter onClose={mockOnClose} />);

      // Modal should have fixed positioning (testing outcome, not styling details)
      const modalOverlay = container.firstChild;
      expect(modalOverlay).toBeInTheDocument();
    });

    it('should render three cards in grid', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      // All three card titles should be present
      expect(screen.getByText('How to Create Project')).toBeInTheDocument();
      expect(screen.getByText('Task Management Guide')).toBeInTheDocument();
      expect(screen.getByText('Team Collaboration')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeEnabled();
    });

    it('should have descriptive image alt texts', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('should render headings with proper hierarchy', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Support Center');

      const cardHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(cardHeadings).toHaveLength(3);
    });
  });

  describe('Content Completeness', () => {
    it('should render complete project creation guide info', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      expect(screen.getByText('How to Create Project')).toBeInTheDocument();
      expect(
        screen.getByText(/Guide to creating a new project, setting up boards/i)
      ).toBeInTheDocument();
    });

    it('should render complete task management guide info', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      expect(screen.getByText('Task Management Guide')).toBeInTheDocument();
      expect(
        screen.getByText(/How to create, edit, and move tasks/i)
      ).toBeInTheDocument();
    });

    it('should render complete team collaboration guide info', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      expect(screen.getByText('Team Collaboration')).toBeInTheDocument();
      // Component shows English description
      expect(screen.getByText(/Work effectively with realtime updates/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle onClose prop correctly', () => {
      const customClose = jest.fn();
      render(<SupportCenter onClose={customClose} />);

      const closeButton = screen.getByRole('button');
      userEvent.click(closeButton);

      expect(customClose).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should render without errors when mounted', () => {
      expect(() => {
        render(<SupportCenter onClose={mockOnClose} />);
      }).not.toThrow();
    });

    it('should display all content on initial render', () => {
      render(<SupportCenter onClose={mockOnClose} />);

      // Verify all key elements are present
      expect(screen.getByText('Support Center')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getAllByRole('img')).toHaveLength(3);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    });
  });
});
