import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
// Mock useUrlState to simplify URL state behavior within this hook test
jest.mock('../../../hooks/useUrlState', () => {
  const React = require('react');
  return {
    useUrlState: (initialState: any) => {
      const [state, setState] = React.useState(initialState);
      const setUrlState = (newState: any) => setState((prev: any) => ({ ...prev, ...newState }));
      return [state, setUrlState] as const;
    },
  };
});

import { useVietnameseSearch } from '../../../hooks/useVietnameseSearch';

let mockSearch = '';
let mockPathname = '/search';
let mockNavigate: jest.Mock;

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname, search: mockSearch }),
  useNavigate: () => mockNavigate,
}), { virtual: true });

const TestComp: React.FC = () => {
  const { searchValue, handleInputChange, handleCompositionStart, handleCompositionEnd, searchTerm } = useVietnameseSearch({ q: '', page: '1' });
  return (
    <div>
      <input
        aria-label="search"
        value={searchValue}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
      <div data-testid="term">{searchTerm}</div>
    </div>
  );
};

describe('useVietnameseSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debounces URL updates when typing', () => {
    mockNavigate = jest.fn();
    mockPathname = '/search';
    mockSearch = '';
    render(<TestComp />);

    const input = screen.getByLabelText('search') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'a' } });
    expect(screen.getByTestId('term').textContent).toBe('');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('term').textContent).toBe('a');
  });

  it('defers updates while composing and applies on composition end', () => {
    mockNavigate = jest.fn();
    mockPathname = '/search';
    mockSearch = '';
    render(<TestComp />);

    const input = screen.getByLabelText('search') as HTMLInputElement;

  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'ti' } });
  // update underlying input to the composed final value while still composing
  fireEvent.change(input, { target: { value: 'tiếng' } });
  // still composing: no update to searchTerm yet
    act(() => {
      jest.advanceTimersByTime(500);
    });
  expect(screen.getByTestId('term').textContent).toBe('');

  // end composition, handler should pick up the DOM value 'tiếng'
  fireEvent.compositionEnd(input);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByTestId('term').textContent).toBe('tiếng');
  });
});
