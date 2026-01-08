import React from 'react';
import { render, screen } from '@testing-library/react';
import FilterDropdown from '../../../../components/BoardDetail/FilterDropdown';

describe('FilterDropdown - empty options', () => {
  it('renders empty state when no tags', () => {
    render(
      <FilterDropdown
        show={true}
        allTags={[]}
        selectedFilterTagIds={[]}
        onToggleTag={() => {}}
        onClearAll={() => {}}
      />
    );

    expect(screen.getByText(/no tags available/i)).toBeInTheDocument();
  });
});
