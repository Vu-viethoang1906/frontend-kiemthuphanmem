import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CloneTemplateSection from '../../../components/CloneTemplateSection';

describe('CloneTemplateSection Component', () => {
  const mockOnBackClick = jest.fn();
  const mockOnTemplateClick = jest.fn();

  const mockTemplates = [
    {
      _id: 'template-1',
      name: 'Agile Sprint Board',
      description: 'Template for managing agile sprints',
    },
    {
      id: 'template-2',
      name: 'Kanban Board',
      description: 'Simple kanban workflow',
    },
    {
      _id: 'template-3',
      name: 'Project Tracker',
      description: 'Track project milestones and deliverables',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading screen when loadingTemplates is true', () => {
      render(
        <CloneTemplateSection
          templates={[]}
          loadingTemplates={true}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      // Click Clone Template to show template list area
      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      // LoadingScreen shows "Please wait..." text
      expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    });

    it('should not show template content while loading', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={true}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.queryByText('Agile Sprint Board')).not.toBeInTheDocument();
    });
  });

  describe('Template Actions Menu', () => {
    it('should render all template action options', () => {
      render(
        <CloneTemplateSection
          templates={[]}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      expect(screen.getByText('Clone Template')).toBeInTheDocument();
      expect(screen.getByText('Create Template')).toBeInTheDocument();
      expect(screen.getByText('Manage Templates')).toBeInTheDocument();
      expect(screen.getByText('Import Template')).toBeInTheDocument();
    });

    it('should show descriptions for each action', () => {
      render(
        <CloneTemplateSection
          templates={[]}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      expect(screen.getByText(/browse and clone from existing templates/i)).toBeInTheDocument();
      expect(screen.getByText(/create a new template from scratch/i)).toBeInTheDocument();
      expect(screen.getByText(/edit and organize your templates/i)).toBeInTheDocument();
      expect(screen.getByText(/import templates from external sources/i)).toBeInTheDocument();
    });

    it('should show "Coming Soon" badge for unavailable features', () => {
      render(
        <CloneTemplateSection
          templates={[]}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const comingSoonBadges = screen.getAllByText(/coming soon/i);
      expect(comingSoonBadges.length).toBeGreaterThanOrEqual(3);
    });

    it('should render action icons', () => {
      const { container } = render(
        <CloneTemplateSection
          templates={[]}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Template List Display', () => {
    it('should show template list when Clone Template action is clicked', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Agile Sprint Board')).toBeInTheDocument();
      expect(screen.getByText('Kanban Board')).toBeInTheDocument();
      expect(screen.getByText('Project Tracker')).toBeInTheDocument();
    });

    it('should render all template cards with names', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      mockTemplates.forEach((template) => {
        expect(screen.getByText(template.name)).toBeInTheDocument();
      });
    });

    it('should render template descriptions', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Template for managing agile sprints')).toBeInTheDocument();
      expect(screen.getByText('Simple kanban workflow')).toBeInTheDocument();
      expect(screen.getByText('Track project milestones and deliverables')).toBeInTheDocument();
    });

    it('should show empty message when no templates available', () => {
      render(
        <CloneTemplateSection
          templates={[]}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText(/no templates available/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onBackClick when back button is clicked', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      userEvent.click(backButton);

      expect(mockOnBackClick).toHaveBeenCalledTimes(1);
    });

    it('should call onTemplateClick when a template is clicked', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      const templateCard = screen.getByText('Agile Sprint Board');
      userEvent.click(templateCard);

      expect(mockOnTemplateClick).toHaveBeenCalledTimes(1);
      expect(mockOnTemplateClick).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it('should call onTemplateClick with correct template data', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      const kanbanTemplate = screen.getByText('Kanban Board');
      userEvent.click(kanbanTemplate);

      expect(mockOnTemplateClick).toHaveBeenCalledWith(mockTemplates[1]);
    });

    it('should not trigger click for disabled/coming soon actions', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const createOption = screen.getByText('Create Template');
      userEvent.click(createOption);

      // Should not show template list or call any callbacks
      expect(screen.queryByText('Agile Sprint Board')).not.toBeInTheDocument();
      expect(mockOnTemplateClick).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Flow', () => {
    it('should navigate from action menu to template list', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      // Initially show actions
      expect(screen.getByText('Clone Template')).toBeInTheDocument();
      expect(screen.queryByText('Agile Sprint Board')).not.toBeInTheDocument();

      // Click to show templates
      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Agile Sprint Board')).toBeInTheDocument();
    });

    it('should show back button in template list view', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Template ID Handling', () => {
    it('should handle templates with _id field', () => {
      const templatesWithUnderscoreId = [
        { _id: 'mongo-id-1', name: 'Template A', description: 'Test A' },
      ];

      render(
        <CloneTemplateSection
          templates={templatesWithUnderscoreId}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Template A')).toBeInTheDocument();
    });

    it('should handle templates with id field', () => {
      const templatesWithId = [
        { id: 'regular-id-1', name: 'Template B', description: 'Test B' },
      ];

      render(
        <CloneTemplateSection
          templates={templatesWithId}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Template B')).toBeInTheDocument();
    });

    it('should handle templates with both id and _id fields', () => {
      const mixedTemplates = [
        { _id: 'mongo-id', id: 'regular-id', name: 'Mixed Template', description: 'Mixed' },
      ];

      render(
        <CloneTemplateSection
          templates={mixedTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Mixed Template')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render back button with accessible label', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should render template cards as clickable elements', () => {
      render(
        <CloneTemplateSection
          templates={mockTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      const templateCards = screen.getAllByRole('button');
      expect(templateCards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle template without description gracefully', () => {
      const templatesWithoutDesc = [
        { _id: '1', name: 'No Description Template' },
      ];

      render(
        <CloneTemplateSection
          templates={templatesWithoutDesc}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('No Description Template')).toBeInTheDocument();
    });

    it('should handle single template correctly', () => {
      const singleTemplate = [mockTemplates[0]];

      render(
        <CloneTemplateSection
          templates={singleTemplate}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Agile Sprint Board')).toBeInTheDocument();
      expect(screen.queryByText('Kanban Board')).not.toBeInTheDocument();
    });

    it('should handle many templates without breaking', () => {
      const manyTemplates = Array.from({ length: 20 }, (_, i) => ({
        _id: `template-${i}`,
        name: `Template ${i + 1}`,
        description: `Description ${i + 1}`,
      }));

      render(
        <CloneTemplateSection
          templates={manyTemplates}
          loadingTemplates={false}
          onBackClick={mockOnBackClick}
          onTemplateClick={mockOnTemplateClick}
        />
      );

      const cloneOption = screen.getByText('Clone Template');
      userEvent.click(cloneOption);

      expect(screen.getByText('Template 1')).toBeInTheDocument();
      expect(screen.getByText('Template 20')).toBeInTheDocument();
    });
  });
});
