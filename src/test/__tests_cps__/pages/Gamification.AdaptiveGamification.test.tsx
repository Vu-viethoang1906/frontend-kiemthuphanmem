import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGetDashboard = jest.fn();
const mockTrack = jest.fn();
const mockAnalyze = jest.fn();
const mockGetCenters = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn() };

jest.mock('../../../../src/api/adaptiveGamificationApi', () => ({
  __esModule: true,
  getAdaptiveGamificationDashboard: (...args: any[]) => mockGetDashboard(...args),
  trackBehavior: (...args: any[]) => mockTrack(...args),
  analyzeBehavior: (...args: any[]) => mockAnalyze(...args),
}));

jest.mock('../../../../src/api/centerApi', () => ({
  __esModule: true,
  getAllCenters: (...args: any[]) => mockGetCenters(...args),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
}));

// Disable motion side effects
jest.mock('framer-motion', () => ({
  __esModule: true,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('AdaptiveGamification page', () => {
  const dashboard = {
    motivation_profile: {
      onboarding_stage: 'STABLE',
      confidence: 80,
      competitive_score: 70,
      collaborative_score: 65,
      short_term_score: 50,
      long_term_score: 60,
      insights: ['Insight 1'],
      recommendations: ['Rec 1'],
    },
    personalization: {
      current_strategy: 'BALANCED',
      leaderboard_weight: 0.3,
      badges_weight: 0.3,
      goals_weight: 0.4,
      reward_multipliers: { leaderboard: 1.1 },
    },
    my_badges: {
      total: 1,
      badges: [
        {
          _id: 'b1',
          name: 'My Badge',
          description: '',
          icon_url: '',
          points_reward: 10,
          earned_at: new Date().toISOString(),
        },
      ],
    },
    recent_badges: {
      badges: [
        {
          badge: {
            _id: 'b2',
            name: 'Recent Badge',
            description: '',
            points_reward: 10,
            icon_url: '',
          },
          user: { username: 'user1', full_name: 'User One' },
          earned_at: new Date().toISOString(),
        },
      ],
    },
    personalized_badges: {
      total: 2,
      badges: [
        {
          _id: 'b1',
          name: 'Badge 1',
          description: 'Desc 1',
          points_reward: 10,
          adjusted_points_reward: 12,
          is_recommended: true,
          category: 'engagement',
          icon_url: '',
        },
        {
          _id: 'b3',
          name: 'Badge 3',
          description: 'Desc 3',
          points_reward: 5,
          is_recommended: false,
          category: 'skill',
          icon_url: '',
        },
      ],
      recommended: [
        {
          _id: 'br1',
          name: 'Rec Badge',
          description: '',
          points_reward: 20,
          adjusted_points_reward: 25,
          multiplier_applied: 1.2,
          icon_url: '',
        },
      ],
    },
    behavior: {
      stats: {
        leaderboard_views: 3,
        task_completions: 4,
        collaboration_events: 2,
      },
      analytics: {
        total_events: 12,
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCenters.mockResolvedValue({ success: true, data: [{ _id: 'c1', name: 'Center 1' }] });
    mockGetDashboard.mockResolvedValue(dashboard);
    mockTrack.mockResolvedValue({});
    mockAnalyze.mockResolvedValue({});
  });

  const renderPage = async () => {
    const { default: Page } = await import(
      '../../../../src/pages/Gamification/AdaptiveGamification'
    );
    return render(<Page />);
  };

  it('renders dashboard data and triggers analyze flow', async () => {
    await renderPage();

    // Wait for dashboard to load
    expect(
      await screen.findByRole('heading', { name: /Adaptive Gamification/i }),
    ).toBeInTheDocument();
    expect(mockGetDashboard).toHaveBeenCalledWith('c1', 30, 10);
    expect(mockTrack).toHaveBeenCalledWith('c1', 'view_points', 'points');

    // Assert key sections rendered
    expect(screen.getByText('Motivation Profile')).toBeInTheDocument();
    expect(screen.getByText(/Cá nhân hóa|Personalization/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Recommended Badges|Suggested Badges|Badges Đề Xuất/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Behavior Stats|Behavior Statistics|Thống Kê Hành Vi/i),
    ).toBeInTheDocument();

    // Trigger analyze button
    await userEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    await waitFor(() => {
      expect(mockAnalyze).toHaveBeenCalledWith('c1');
      expect(mockToast.success).toHaveBeenCalled();
      expect(mockGetDashboard).toHaveBeenCalledTimes(2); // initial + reload
    });
  });

  it('shows empty state and surfaces dashboard load error', async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error('fail'));

    await renderPage();

    expect(await screen.findByText(/No data/i)).toBeInTheDocument();
    expect(mockToast.error).toHaveBeenCalled();
  });
});
