import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupMemberCard from '../../../components/Group/GroupMemberCard';

describe('components/Group/GroupMemberCard', () => {
  const baseMember = {
    role_in_group: 'Administrator',
    user_id: {
      _id: 'u1',
      full_name: 'Alice',
      avatar_url: '',
    },
  };

  it('renders with initial when no avatar and handles click', () => {
    const onClick = jest.fn();
    render(
      <GroupMemberCard
        member={baseMember}
        baseUrl={'http://localhost:3005'}
        onClick={onClick}
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
    fireEvent.click(screen.getByText("View User's Board"));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders image when avatar path provided and hides placeholder', () => {
    const onClick = jest.fn();
    const memberWithAvatar = {
      ...baseMember,
      user_id: { ...baseMember.user_id, avatar_url: 'uploads/avatar.png' },
    };
    render(
      <GroupMemberCard
        member={memberWithAvatar}
        baseUrl={'http://localhost:3005'}
        onClick={onClick}
      />
    );
    const img = screen.getByRole('img', { name: 'Alice' }) as HTMLImageElement;
    expect(img.src).toContain('http://localhost:3005/uploads/avatar.png');
  });

  it('shows role badge text', () => {
    const onClick = jest.fn();
    const member = { ...baseMember, role_in_group: 'Viewer' };
    render(
      <GroupMemberCard
        member={member}
        baseUrl={'http://localhost:3005'}
        onClick={onClick}
      />
    );
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });
});
