import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupMemberCard from '../../../components/Group/GroupMemberCard';

describe('components/Group/GroupMemberCard edge cases', () => {
  it('supports member.user structure and absolute avatar url', () => {
    const onClick = jest.fn();
    const member = {
      role_in_group: 'Member',
      user: { full_name: 'Bob', avatarUrl: 'https://cdn.example.com/a.png' },
    } as any;
    render(
      <GroupMemberCard
        member={member}
        baseUrl={'http://localhost:3005'}
        onClick={onClick}
      />
    );
  const img = screen.getByRole('img', { name: 'Bob' }) as HTMLImageElement;
  expect(img.src).toBe('https://cdn.example.com/a.png');
  });

  it('falls back to default role style when unknown role', () => {
    const onClick = jest.fn();
    const member = {
      role_in_group: 'Unknown Role',
      user_id: { full_name: 'Zed' },
    } as any;
    render(
      <GroupMemberCard
        member={member}
        baseUrl={'http://localhost:3005'}
        onClick={onClick}
      />
    );
    // Badge text is visible
    expect(screen.getByText('Unknown Role')).toBeInTheDocument();
  });
});
