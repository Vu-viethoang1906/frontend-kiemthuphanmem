import { render, screen } from '@testing-library/react';
import SlackSettings from '../../../../components/BoardSetting/SlackSettings';
import '@testing-library/jest-dom';

jest.mock('../../../../api/boardSlackConfigApi', () => ({
  getBoardSlackConfig: jest.fn().mockResolvedValue(null),
}));

// Basic behavior: shows loading then resolves.

describe('BoardSetting/slackSettings.behavior', () => {
  it('renders loading state', () => {
    render(<SlackSettings boardId="b1" />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});
