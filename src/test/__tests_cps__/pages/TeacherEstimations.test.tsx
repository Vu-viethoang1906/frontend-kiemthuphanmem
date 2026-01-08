import React from 'react';
import { render, screen } from '@testing-library/react';
import TeacherEstimations from '../../../pages/Analytics/TeacherEstimations';

jest.mock('../../../components/Teacher/EstimationPanel', () => () => (
  <div data-testid="estimation-panel">Estimation Panel Stub</div>
));

describe('TeacherEstimations page', () => {
  it('renders the estimation panel inside the padded wrapper', () => {
    const { container } = render(<TeacherEstimations />);

    expect(screen.getByTestId('estimation-panel')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('p-6');
  });
});
