import React from 'react';
import { render, screen } from '@testing-library/react';
import TeacherThroughput from '../../../pages/Analytics/TeacherThroughput';

jest.mock('../../../components/Teacher/ThroughputPanel', () => () => (
  <div data-testid="throughput-panel">Throughput Panel Stub</div>
));

describe('TeacherThroughput page', () => {
  it('renders the throughput panel inside the padded wrapper', () => {
    const { container } = render(<TeacherThroughput />);

    expect(screen.getByTestId('throughput-panel')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('p-6');
  });
});
