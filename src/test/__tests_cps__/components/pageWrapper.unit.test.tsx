import React from 'react';
import { render, screen } from '@testing-library/react';
// Mock framer-motion to avoid animation side effects in tests
jest.mock('framer-motion', () => ({ motion: { div: ({ children }: any) => <div data-testid="motion-div">{children}</div> } }));

import PageWrapper from '../../../components/PageWrapper';

describe('PageWrapper component', () => {
  it('renders children content', () => {
    render(
      <PageWrapper>
        <span>Wrapped content</span>
      </PageWrapper>
    );
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    expect(screen.getByText('Wrapped content')).toBeInTheDocument();
  });
});
