import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupGrid from '../../../components/Group/GroupGrid';

// Mock GroupCard component
jest.mock('../../../components/Group/GroupCard', () => ({
  __esModule: true,
  default: ({ group, memberCount, userRole, onSelect, onDelete, onEdit }: any) => (
    <div data-testid={`group-card-${group._id}`}>
      <h3>{group.name}</h3>
      <p>Members: {memberCount}</p>
      <p>Role: {userRole}</p>
      <button onClick={() => onSelect(group)}>Select</button>
      <button onClick={() => onDelete(group._id)}>Delete</button>
      {onEdit && <button onClick={() => onEdit(group)}>Edit</button>}
    </div>
  ),
}));

describe('GroupGrid', () => {
  const mockOnSelectGroup = jest.fn();
  const mockOnDeleteGroup = jest.fn();
  const mockOnEditGroup = jest.fn();

  const mockGroups = [
    { _id: '1', name: 'Group 1', description: 'Description 1' },
    { _id: '2', name: 'Group 2', description: 'Description 2' },
    { _id: '3', name: 'Group 3', description: 'Description 3' },
  ];

  const mockMemberCounts = {
    '1': 5,
    '2': 10,
    '3': 3,
  };

  const mockUserRoleMap = {
    '1': 'admin',
    '2': 'member',
    '3': 'viewer',
  };

  const defaultProps = {
    groups: mockGroups,
    loading: false,
    memberCounts: mockMemberCounts,
    userRoleMap: mockUserRoleMap,
    onSelectGroup: mockOnSelectGroup,
    onDeleteGroup: mockOnDeleteGroup,
    onEditGroup: mockOnEditGroup,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display loading message when loading is true', () => {
      render(<GroupGrid {...defaultProps} loading={true} />);
      
      expect(screen.getByText(/loading groups/i)).toBeInTheDocument();
    });

    it('should not display groups when loading', () => {
      render(<GroupGrid {...defaultProps} loading={true} />);
      
      expect(screen.queryByTestId(/group-card/i)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty message when no groups exist', () => {
      render(<GroupGrid {...defaultProps} groups={[]} />);
      
      expect(screen.getByText(/no groups found/i)).toBeInTheDocument();
    });

    it('should suggest creating a new group in empty state', () => {
      render(<GroupGrid {...defaultProps} groups={[]} />);
      
      expect(screen.getByText(/create group/i)).toBeInTheDocument();
    });

    it('should not display loading or group cards when empty', () => {
      render(<GroupGrid {...defaultProps} groups={[]} />);
      
      expect(screen.queryByText(/loading groups/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId(/group-card/i)).not.toBeInTheDocument();
    });
  });

  describe('groups display', () => {
    it('should render all groups when data is provided', () => {
      render(<GroupGrid {...defaultProps} />);
      
      expect(screen.getByTestId('group-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('group-card-3')).toBeInTheDocument();
    });

    it('should display group names correctly', () => {
      render(<GroupGrid {...defaultProps} />);
      
      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
      expect(screen.getByText('Group 3')).toBeInTheDocument();
    });

    it('should pass member counts to group cards', () => {
      render(<GroupGrid {...defaultProps} />);
      
      expect(screen.getByText('Members: 5')).toBeInTheDocument();
      expect(screen.getByText('Members: 10')).toBeInTheDocument();
      expect(screen.getByText('Members: 3')).toBeInTheDocument();
    });

    it('should pass user roles to group cards', () => {
      render(<GroupGrid {...defaultProps} />);
      
      expect(screen.getByText('Role: admin')).toBeInTheDocument();
      expect(screen.getByText('Role: member')).toBeInTheDocument();
      expect(screen.getByText('Role: viewer')).toBeInTheDocument();
    });

    it('should display 0 members when member count is not provided', () => {
      const propsWithoutCounts = {
        ...defaultProps,
        memberCounts: {},
      };
      
      render(<GroupGrid {...propsWithoutCounts} />);
      
      expect(screen.getAllByText('Members: 0')).toHaveLength(3);
    });

    it('should display empty role when role is not provided', () => {
      const propsWithoutRoles = {
        ...defaultProps,
        userRoleMap: {},
      };
      
      render(<GroupGrid {...propsWithoutRoles} />);
      
      expect(screen.getAllByText('Role:')).toHaveLength(3);
    });
  });

  describe('user interactions', () => {
    it('should call onSelectGroup when a group is selected', () => {
      render(<GroupGrid {...defaultProps} />);
      
      const selectButton = screen.getAllByText('Select')[0];
      userEvent.click(selectButton);
      
      expect(mockOnSelectGroup).toHaveBeenCalledWith(mockGroups[0]);
    });

    it('should call onDeleteGroup with correct group ID', () => {
      render(<GroupGrid {...defaultProps} />);
      
      const deleteButton = screen.getAllByText('Delete')[0];
      userEvent.click(deleteButton);
      
      expect(mockOnDeleteGroup).toHaveBeenCalledWith('1');
    });

    it('should call onEditGroup when edit is triggered', () => {
      render(<GroupGrid {...defaultProps} />);
      
      const editButton = screen.getAllByText('Edit')[0];
      userEvent.click(editButton);
      
      expect(mockOnEditGroup).toHaveBeenCalledWith(mockGroups[0]);
    });

    it('should handle selecting different groups', () => {
      render(<GroupGrid {...defaultProps} />);
      
      const selectButtons = screen.getAllByText('Select');
      
      userEvent.click(selectButtons[0]);
      expect(mockOnSelectGroup).toHaveBeenCalledWith(mockGroups[0]);
      
      userEvent.click(selectButtons[1]);
      expect(mockOnSelectGroup).toHaveBeenCalledWith(mockGroups[1]);
    });
  });

  describe('grid layout', () => {
    it('should render groups in a grid layout', () => {
      const { container } = render(<GroupGrid {...defaultProps} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should handle single group', () => {
      const singleGroupProps = {
        ...defaultProps,
        groups: [mockGroups[0]],
      };
      
      render(<GroupGrid {...singleGroupProps} />);
      
      expect(screen.getByTestId('group-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('group-card-2')).not.toBeInTheDocument();
    });

    it('should handle large number of groups', () => {
      const manyGroups = Array.from({ length: 10 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Group ${i + 1}`,
        description: `Description ${i + 1}`,
      }));
      
      const manyGroupsProps = {
        ...defaultProps,
        groups: manyGroups,
      };
      
      render(<GroupGrid {...manyGroupsProps} />);
      
      expect(screen.getAllByTestId(/group-card/i)).toHaveLength(10);
    });
  });

  describe('edge cases', () => {
    it('should handle groups with id instead of _id', () => {
      const groupsWithId = [
        { id: '1', name: 'Group 1' },
        { id: '2', name: 'Group 2' },
      ];
      
      const propsWithId = {
        ...defaultProps,
        groups: groupsWithId,
        memberCounts: { '1': 5, '2': 3 },
        userRoleMap: { '1': 'admin', '2': 'member' },
      };
      
      render(<GroupGrid {...propsWithId} />);
      
      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
    });

    it('should handle groups without onEditGroup callback', () => {
      const propsWithoutEdit = {
        ...defaultProps,
        onEditGroup: undefined,
      };
      
      render(<GroupGrid {...propsWithoutEdit} />);
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should not crash with undefined member counts', () => {
      const propsWithUndefinedCounts = {
        ...defaultProps,
        memberCounts: { '1': undefined as any },
      };
      
      render(<GroupGrid {...propsWithUndefinedCounts} />);
      
      expect(screen.getByTestId('group-card-1')).toBeInTheDocument();
    });
  });

  describe('state transitions', () => {
    it('should transition from loading to showing groups', () => {
      const { rerender } = render(<GroupGrid {...defaultProps} loading={true} />);
      
      expect(screen.getByText(/loading groups/i)).toBeInTheDocument();
      
      rerender(<GroupGrid {...defaultProps} loading={false} />);
      
      expect(screen.queryByText(/loading groups/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('group-card-1')).toBeInTheDocument();
    });

    it('should transition from empty to showing groups', () => {
      const { rerender } = render(<GroupGrid {...defaultProps} groups={[]} />);
      
      expect(screen.getByText(/no groups found/i)).toBeInTheDocument();
      
      rerender(<GroupGrid {...defaultProps} groups={mockGroups} />);
      
      expect(screen.queryByText(/no groups found/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('group-card-1')).toBeInTheDocument();
    });

    it('should transition from groups to empty state', () => {
      const { rerender } = render(<GroupGrid {...defaultProps} />);
      
      expect(screen.getByTestId('group-card-1')).toBeInTheDocument();
      
      rerender(<GroupGrid {...defaultProps} groups={[]} />);
      
      expect(screen.queryByTestId('group-card-1')).not.toBeInTheDocument();
      expect(screen.getByText(/no groups found/i)).toBeInTheDocument();
    });
  });
});
