import React, { useState, useEffect } from 'react';
import {
  getAdaptiveGamificationDashboard,
  trackBehavior,
  analyzeBehavior,
  AdaptiveGamificationDashboard,
  MotivationProfile,
} from '../../api/adaptiveGamificationApi';
import { getAllCenters, Center } from '../../api/centerApi';
import toast from 'react-hot-toast';
import {
  Loader2,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  Clock,
  Zap,
  Lightbulb,
  AlertCircle,
  Star,
  Flame,
  Heart,
  Calendar,
  Activity,
  Info,
} from 'lucide-react';

const AdaptiveGamification: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [dashboard, setDashboard] = useState<AdaptiveGamificationDashboard | null>(null);

  // Load centers
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const centersRes = await getAllCenters();
        let centersList: any[] = [];
        if (centersRes?.success && centersRes?.data) {
          centersList = Array.isArray(centersRes.data) ? centersRes.data : [centersRes.data];
        } else if (Array.isArray(centersRes)) {
          centersList = centersRes;
        }
        const validCenters = centersList.filter((c) => c && (c._id || c.id));
        setCenters(validCenters);

        if (validCenters.length > 0) {
          const firstCenterId = validCenters[0]._id || validCenters[0].id;
          setSelectedCenterId(firstCenterId);
        }
      } catch (error) {
        console.error('Error loading centers:', error);
        toast.error('Unable to load centers');
      }
    };
    loadCenters();
  }, []);

  // Load dashboard when center changes
  useEffect(() => {
    if (selectedCenterId) {
      loadDashboard();
      // Track view behavior
      trackBehavior(selectedCenterId, 'view_points', 'points').catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenterId]);

  const loadDashboard = async () => {
    if (!selectedCenterId) return;

    setLoading(true);
    try {
      const data = await getAdaptiveGamificationDashboard(selectedCenterId, 30, 10);
      setDashboard(data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error(error?.response?.data?.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCenterId) return;

    setAnalyzing(true);
    try {
      await analyzeBehavior(selectedCenterId);
      toast.success('Analysis completed');
      await loadDashboard();
    } catch (error: any) {
      console.error('Error analyzing:', error);
      toast.error(error?.response?.data?.message || 'Unable to analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const getOnboardingStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      AWAITING_INITIAL_DATA: 'Awaiting initial data',
      TESTING_COMPETITIVE: 'Testing - Competitive',
      TESTING_COLLABORATIVE: 'Testing - Collaborative',
      TESTING_SHORT_TERM: 'Testing - Short term',
      TESTING_LONG_TERM: 'Testing - Long term',
      STABLE: 'Stable',
    };
    return labels[stage] || stage;
  };

  const getOnboardingStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      AWAITING_INITIAL_DATA: 'bg-gray-500',
      TESTING_COMPETITIVE: 'bg-red-500',
      TESTING_COLLABORATIVE: 'bg-blue-500',
      TESTING_SHORT_TERM: 'bg-yellow-500',
      TESTING_LONG_TERM: 'bg-green-500',
      STABLE: 'bg-indigo-500',
    };
    return colors[stage] || 'bg-gray-500';
  };

  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      UNIFORM_PUSH: 'Uniform Push',
      COMPETITIVE_FOCUS: 'Competitive Focus',
      COLLABORATIVE_FOCUS: 'Collaborative Focus',
      SHORT_TERM_FOCUS: 'Short Term Focus',
      LONG_TERM_FOCUS: 'Long Term Focus',
      BALANCED: 'Balanced',
    };
    return labels[strategy] || strategy;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 60) return 'text-green-600 bg-green-50';
    if (confidence >= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const ScoreCard: React.FC<{
    title: string;
    score: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, score, icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color.replace('text-', 'bg-').replace('-50', '-500')}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
        <div className="bg-white dark:bg-slate-800 shadow-lg p-8 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No data. Please select a Center and try again.
          </p>
        </div>
      </div>
    );
  }

  const {
    motivation_profile,
    personalization,
    my_badges,
    recent_badges,
    personalized_badges,
    behavior,
  } = dashboard;

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-indigo-600" />
              Adaptive Gamification
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Adaptive gamification tailored to your preferences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCenterId}
              onChange={(e) => setSelectedCenterId(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading || analyzing}
            >
              {centers.map((center) => (
                <option key={center._id} value={center._id}>
                  {center.name || 'Untitled Center'}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !selectedCenterId}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Motivation Profile Card */}
      <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Motivation Profile
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${getOnboardingStageColor(
                motivation_profile.onboarding_stage,
              )} text-white`}
            >
              {getOnboardingStageLabel(motivation_profile.onboarding_stage)}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(
                motivation_profile.confidence,
              )}`}
            >
              Confidence: {motivation_profile.confidence}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <ScoreCard
            title="Competitive"
            score={motivation_profile.competitive_score}
            icon={<Flame className="w-4 h-4 text-white" />}
            color="text-red-600 bg-red-50"
          />
          <ScoreCard
            title="Collaborative"
            score={motivation_profile.collaborative_score}
            icon={<Heart className="w-4 h-4 text-white" />}
            color="text-blue-600 bg-blue-50"
          />
          <ScoreCard
            title="Short-term"
            score={motivation_profile.short_term_score}
            icon={<Zap className="w-4 h-4 text-white" />}
            color="text-yellow-600 bg-yellow-50"
          />
          <ScoreCard
            title="Long-term"
            score={motivation_profile.long_term_score}
            icon={<Calendar className="w-4 h-4 text-white" />}
            color="text-green-600 bg-green-50"
          />
        </div>

        {/* Insights & Recommendations */}
        {(motivation_profile.insights.length > 0 ||
          motivation_profile.recommendations.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            {motivation_profile.insights.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Insights
                </h3>
                <ul className="space-y-1">
                  {motivation_profile.insights.map((insight, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                    >
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {motivation_profile.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-indigo-500" />
                  Recommendations
                </h3>
                <ul className="space-y-1">
                  {motivation_profile.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                    >
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Personalization Card */}
      <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Personalization
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Strategy</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
              {getStrategyLabel(personalization.current_strategy)}
            </div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Leaderboard</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-300">
              {(personalization.leaderboard_weight * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-3 bg-pink-50 dark:bg-pink-900 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Badges</div>
            <div className="text-lg font-bold text-pink-600 dark:text-pink-300">
              {(personalization.badges_weight * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Goals</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-300">
              {(personalization.goals_weight * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        {personalization.reward_multipliers && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reward Multipliers
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(personalization.reward_multipliers).map(([key, value]) => (
                <span
                  key={key}
                  className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full text-sm font-medium"
                >
                  {key}: {value.toFixed(2)}x
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Badges - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personalized Badges */}
          <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Recommended Badges
              </h2>
              {motivation_profile.confidence < 30 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>More data needed to make recommendations</span>
                </div>
              )}
            </div>
            {motivation_profile.confidence < 30 ? (
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How to get Recommended Badges?
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  The system needs to analyze your behavior to recommend suitable badges. Try the
                  following activities:
                </p>
                <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>
                      <strong>View the leaderboard</strong> - Helps the system understand if you
                      prefer competition
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>
                      <strong>Complete tasks</strong> - Shows your activity level
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>
                      <strong>Collaborate with your team</strong> - Helps the system know you like
                      working in teams
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>
                      <strong>View scores</strong> - Shows interest in gamification
                    </span>
                  </li>
                </ul>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">
                  After 7–30 days of usage, the system will have enough data to recommend badges
                  matching your preferences!
                </p>
              </div>
            ) : personalized_badges.recommended.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalized_badges.recommended.map((badge) => (
                  <div
                    key={badge._id}
                    className="p-4 border-2 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900 rounded-lg relative"
                  >
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-indigo-500 text-white text-xs font-semibold rounded">
                        Recommended
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      {badge.icon_url ? (
                        <img src={badge.icon_url} alt={badge.name} className="w-12 h-12 rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-500 rounded flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                          {badge.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {badge.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {badge.points_reward} points
                          </span>
                          {badge.adjusted_points_reward &&
                            badge.adjusted_points_reward !== badge.points_reward && (
                              <>
                                <span className="text-gray-400">→</span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
                                  {badge.adjusted_points_reward} points
                                </span>
                                {badge.multiplier_applied && (
                                  <span className="text-xs text-indigo-500">
                                    ({badge.multiplier_applied.toFixed(1)}x)
                                  </span>
                                )}
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recommended badges
              </p>
            )}
          </div>

          {/* All Badges */}
          <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-500" />
              All Badges ({personalized_badges.total})
            </h2>
            {personalized_badges.badges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalized_badges.badges.map((badge) => {
                  const isRecommended = badge.is_recommended;
                  const hasBadge = my_badges.badges.some((b) => b._id === badge._id);
                  return (
                    <div
                      key={badge._id}
                      className={`p-4 border rounded-lg ${
                        isRecommended
                          ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900'
                          : 'border-gray-200 dark:border-slate-700'
                      } ${hasBadge ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {badge.icon_url ? (
                          <img
                            src={badge.icon_url}
                            alt={badge.name}
                            className="w-10 h-10 rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-500 rounded flex items-center justify-center">
                            <Award className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {badge.name}
                            </h3>
                            {hasBadge && (
                              <span title="Owned">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                              {badge.adjusted_points_reward || badge.points_reward} points
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded">
                              {badge.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No badges</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* My Badges */}
          <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              My Badges ({my_badges.total})
            </h2>
            {my_badges.badges.length > 0 ? (
              <div className="space-y-3">
                {my_badges.badges.slice(0, 5).map((badge) => (
                  <div
                    key={badge._id}
                    className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg flex items-center gap-3"
                  >
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="w-10 h-10 rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {badge.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(badge.earned_at).toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No badges</p>
            )}
          </div>

          {/* Recent Badges */}
          <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Recent Badges
            </h2>
            {recent_badges.badges.length > 0 ? (
              <div className="space-y-3">
                {recent_badges.badges.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg flex items-center gap-3"
                  >
                    {item.badge.icon_url ? (
                      <img
                        src={item.badge.icon_url}
                        alt={item.badge.name}
                        className="w-8 h-8 rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
                        {item.badge.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.user.full_name || item.user.username}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(item.earned_at).toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent badges
              </p>
            )}
          </div>

          {/* Behavior Stats */}
          <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Behavior Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Leaderboard views</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {behavior.stats.leaderboard_views}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tasks completed</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {behavior.stats.task_completions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Collaboration events
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {behavior.stats.collaboration_events}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total events</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {behavior.analytics.total_events}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveGamification;
