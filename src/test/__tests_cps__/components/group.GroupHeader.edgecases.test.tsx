import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupHeader from '../../../components/Group/GroupHeader';

describe('components/Group/GroupHeader edge cases', () => {
  it('renders provided searchValue as controlled input', () => {
    render(
      <GroupHeader
        groupCount={10}
        searchValue={'prefilled'}
        onSearchChange={() => {}}
        onCreateClick={() => {}}
      />
    );
    const input = screen.getByPlaceholderText('Search groups by name or description...') as HTMLInputElement;
    expect(input.value).toBe('prefilled');
  });
});
