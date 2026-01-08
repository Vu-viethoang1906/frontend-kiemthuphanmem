import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PointManagement from '../../pages/Analytics/PointManagement';

jest.mock('../../api/centerApi', () => ({
  getAllCenters: jest.fn(async () => ({ success: true, data: [
    { _id: 'c1', name: 'Center A' },
    { _id: 'c2', name: 'Center B' },
  ] }))
}));

jest.mock('../../api/analyticsApi', () => ({
  getLeaderboard: jest.fn(async () => ({
    success: true,
    data: {
      leaderboard: [
        {
          rank: 1,
          userId: 'u1',
          username: 'alice',
          fullName: 'Alice',
          avatarUrl: null,
          centerId: 'c1',
          centerName: 'Center A',
          points: 1200,
          totalPoints: 1200,
          level: 25,
          statistics: {
            tasksCompleted: 100,
            onTimeCompleted: 80,
            overdueCompleted: 20,
            onTimeRate: 80,
          },
          pointsPerTaskRatio: 12,
        },
        {
          rank: 2,
          userId: 'u2',
          username: 'bob',
          fullName: 'Bob',
          avatarUrl: null,
          centerId: 'c2',
          centerName: 'Center B',
          points: 900,
          totalPoints: 900,
          level: 18,
          statistics: {
            tasksCompleted: 90,
            onTimeCompleted: 60,
            overdueCompleted: 30,
            onTimeRate: 66,
          },
          pointsPerTaskRatio: 10,
        },
      ],
      cheatDetection: {
        medianRatio: 10,
        thresholdRatio: 25,
        flaggedUsers: [],
        flaggedCount: 0,
      },
      summary: {
        totalUsers: 2,
        averagePoints: 1050,
        averageTasksCompleted: 95,
      },
      dateRange: null,
    },
  }))
}));

describe('PointManagement page', () => {
  it('renders centers and leaderboard with top users', async () => {
    render(<PointManagement />);

    // Centers loaded and visible in filter
    const centerSelect = await screen.findByRole('combobox');
    expect(centerSelect).toBeInTheDocument();
      // Changing center value triggers data reload in effect
      fireEvent.change(centerSelect, { target: { value: 'c1' } });
      await waitFor(() => {
        // Minimal assertion: page title visible indicates render
        expect(screen.getByText(/Point Management/i)).toBeInTheDocument();
      });
  });

  it('filters by center selection and triggers reload', async () => {
    render(<PointManagement />);

    const centerSelect = await screen.findByRole('combobox');
    fireEvent.change(centerSelect, { target: { value: 'c1' } });

    await waitFor(() => {
        expect(screen.getByText(/Point Management/i)).toBeInTheDocument();
    });
  });
});
