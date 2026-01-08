import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useUrlState } from '../../../hooks/useUrlState';

let mockSearch = '';
let mockPathname = '/x';
let mockNavigate: jest.Mock;

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname, search: mockSearch }),
  useNavigate: () => mockNavigate,
}), { virtual: true });

const TestHookComp: React.FC<{ initialState?: any }> = ({ initialState = { page: '1', q: '' } }) => {
  const [urlState, setUrlState] = useUrlState(initialState);
  return (
    <div>
      <div data-testid="q">{String(urlState.q ?? '')}</div>
      <div data-testid="page">{String(urlState.page ?? '')}</div>
      <button onClick={() => setUrlState({ q: 'abc' })}>set-q</button>
      <button onClick={() => setUrlState({ page: '3' }, true)}>set-page-replace</button>
    </div>
  );
};

describe('useUrlState hook', () => {
  it('merges initial state with URL query params', () => {
  mockNavigate = jest.fn();
    mockPathname = '/x';
    mockSearch = '?q=hello';

    render(<TestHookComp />);

    expect(screen.getByTestId('q').textContent).toBe('hello');
    // page comes from initial state since not in URL
    expect(screen.getByTestId('page').textContent).toBe('1');
  });

  it('updates the browser URL when setUrlState is called (push)', () => {
  mockNavigate = jest.fn();
    mockPathname = '/x';
    mockSearch = '';

    render(<TestHookComp />);

    fireEvent.click(screen.getByText('set-q'));
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  const [url, opts] = mockNavigate.mock.calls[0];
    expect(String(url)).toContain('/x?');
    expect(String(url)).toContain('q=abc');
    expect(String(url)).toContain('page=1');
    expect(opts?.replace).toBeFalsy();
  });

  it('supports replace navigation when second argument is true', () => {
  mockNavigate = jest.fn();
    mockPathname = '/x';
    mockSearch = '?q=one&page=1';

    render(<TestHookComp />);

    fireEvent.click(screen.getByText('set-page-replace'));
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  const [url, opts] = mockNavigate.mock.calls[0];
    const search = String(url).split('?')[1] || '';
    expect(search).toContain('page=3');
    // q should be preserved from prior state
    expect(search).toContain('q=one');
    expect(opts?.replace).toBe(true);
  });
});
