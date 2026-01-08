import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import FilterDropdown from '../../../components/BoardDetail/FilterDropdown';

const sampleTags = [
  { _id: '1', name: 'Bug', color: '#f00' },
  { _id: '2', name: 'Feature', color: '#0f0' },
  { _id: '3', name: 'Chore', color: '#00f' },
];

describe('FilterDropdown interactions', () => {
  it('does not render when show=false', () => {
    const { container } = render(
      <FilterDropdown
        show={false}
        allTags={sampleTags}
        selectedFilterTagIds={[]}
        onToggleTag={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders and filters tags by search; toggles and clears', () => {
    const onToggleTag = jest.fn();
    const onClearAll = jest.fn();
    const onSearchChange = jest.fn();

    const utils = render(
      <FilterDropdown
        show
        allTags={sampleTags}
        selectedFilterTagIds={["2"]}
        onToggleTag={onToggleTag}
        onClearAll={onClearAll}
        searchQuery=""
        onSearchChange={onSearchChange}
      />
    );

    // Title and Clear all visible because one selected
    expect(screen.getByText('Filter by Tags')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();

    // Search narrows to Bug
    const search = screen.getByPlaceholderText('Filter by Tags');
    fireEvent.change(search, { target: { value: 'bug' } });
    expect(onSearchChange).toHaveBeenCalledWith('bug');

    // Because the component is controlled for search, simulate re-render with filtered state
    utils.rerender(
      <FilterDropdown
        show
        allTags={sampleTags}
        selectedFilterTagIds={["2"]}
        onToggleTag={onToggleTag}
        onClearAll={onClearAll}
        searchQuery="bug"
        onSearchChange={onSearchChange}
      />
    );

    const list = document.querySelector('.filter-tags-list') as HTMLElement;
    expect(within(list).getByText('Bug')).toBeInTheDocument();
    expect(screen.queryByText('Feature')).toBeNull();

    // Toggle tag
    fireEvent.click(within(list).getByText('Bug'));
    expect(onToggleTag).toHaveBeenCalledWith('1');

    // Clear all
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('shows empty states correctly', () => {
    const { rerender } = render(
      <FilterDropdown
        show
        allTags={[]}
        selectedFilterTagIds={[]}
        onToggleTag={jest.fn()}
        onClearAll={jest.fn()}
        searchQuery=""
        onSearchChange={jest.fn()}
      />
    );
    expect(screen.getByText('No tags available')).toBeInTheDocument();

    rerender(
      <FilterDropdown
        show
        allTags={sampleTags}
        selectedFilterTagIds={[]}
        onToggleTag={jest.fn()}
        onClearAll={jest.fn()}
        searchQuery="zzz"
        onSearchChange={jest.fn()}
      />
    );
    expect(screen.getByText('No tags match your search')).toBeInTheDocument();
  });

  it('stops click propagation from dropdown and search input', () => {
    const onToggleTag = jest.fn();
    const onClearAll = jest.fn();
    const onSearchChange = jest.fn();
    const onParentClick = jest.fn();

    render(
      <div onClick={onParentClick}>
        <FilterDropdown
          show
          allTags={sampleTags}
          selectedFilterTagIds={[]}
          onToggleTag={onToggleTag}
          onClearAll={onClearAll}
          searchQuery=""
          onSearchChange={onSearchChange}
        />
      </div>
    );

    // Click inside the dropdown wrapper
    fireEvent.click(screen.getByText('Filter by Tags'));
    // Click the search input
    const search = screen.getByPlaceholderText('Filter by Tags');
    fireEvent.click(search);
    // Neither should bubble to parent
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
