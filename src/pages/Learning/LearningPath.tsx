import React, { useState, useEffect } from "react";
import {
  getLearningPath,
  generateLearningPath,
  getSkillRecommendations,
  acceptRecommendation,
  getLearningPathProgress,
  completeStage,
  LearningPath as LearningPathType,
  SkillRecommendation,
} from "../../api/learningPathApi";
import { getAllCenters, Center } from "../../api/centerApi";
import toast from "react-hot-toast";
import {
  Loader2,
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Award,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const LearningPath: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPathType | null>(null);
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [progress, setProgress] = useState({
    progress_percentage: 0,
    current_stage: 1,
    total_stages: 0,
    completed_stages: 0,
  });

  // Load centers
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const centersRes = await getAllCenters();
        let centersList: any[] = [];
        if (centersRes?.success && centersRes?.data) {
          centersList = Array.isArray(centersRes.data)
            ? centersRes.data
            : [centersRes.data];
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
        console.error("Error loading centers:", error);
        console.error("Unable to load centers");
      } finally {
        setLoading(false);
      }
    };
    loadCenters();
  }, []);

  // Load learning path when center changes
  useEffect(() => {
    if (selectedCenterId) {
      loadLearningPath();
      loadRecommendations();
      loadProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenterId]);

  const loadLearningPath = async () => {
    if (!selectedCenterId) return;

    setPathLoading(true);
    try {
      const path = await getLearningPath(selectedCenterId);
      setLearningPath(path);
    } catch (error: any) {
      console.error("Error loading learning path:", error);
      setLearningPath(null);
      toast.error(error?.response?.data?.message || "Unable to load learning path");
    } finally {
      setPathLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!selectedCenterId) return;

    setRecommendationsLoading(true);
    try {
      const recs = await getSkillRecommendations(selectedCenterId, 10);
      setRecommendations(recs);
    } catch (error: any) {
      console.error("Error loading recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!selectedCenterId) return;

    try {
      const prog = await getLearningPathProgress(selectedCenterId);
      setProgress(prog);
    } catch (error: any) {
      console.error("Error loading progress:", error);
    }
  };

  const handleGeneratePath = async () => {
    if (!selectedCenterId) {
      console.error("Please select a Center");
      return;
    }

    setGenerating(true);
    try {
      const newPath = await generateLearningPath(selectedCenterId);
      setLearningPath(newPath);
      toast.success("Created learning path!");
      await loadProgress();
      await loadRecommendations();
    } catch (error: any) {
      console.error("Error generating learning path:", error);
      console.error(error?.response?.data?.message || "Unable to create learning path");
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      await acceptRecommendation(recommendationId);
      toast.success("Accepted recommendation!");
      await loadRecommendations();
    } catch (error: any) {
      console.error("Error accepting recommendation:", error);
      console.error(error?.response?.data?.message || "Unable to accept recommendation");
    }
  };

  const handleCompleteStage = async (stageNumber: number) => {
    if (!selectedCenterId) return;

    try {
      const updatedPath = await completeStage(selectedCenterId, stageNumber);
      setLearningPath(updatedPath);
      toast.success(`Completed Stage ${stageNumber}!`);
      await loadProgress();
    } catch (error: any) {
      console.error("Error completing stage:", error);
      console.error(error?.response?.data?.message || "Unable to complete stage");
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level >= 4) return "text-red-500 bg-red-50";
    if (level >= 3) return "text-orange-500 bg-orange-50";
    if (level >= 2) return "text-yellow-500 bg-yellow-50";
    return "text-green-500 bg-green-50";
  };

  const getDifficultyLabel = (level: number) => {
    if (level >= 5) return "Very Hard";
    if (level >= 4) return "Hard";
    if (level >= 3) return "Medium";
    if (level >= 2) return "Easy";
    return "Very Easy";
  };

  const translateLearningText = (text?: string | null) => {
    if (!text) return text || "";
    const map: Record<string, string> = {
      "Học các kỹ năng cơ bản": "Learn basic skills",
      "Học các kỹ năng phát triển front-end": "Learn front-end development skills",
      "Học các kỹ năng phát triển back-end": "Learn back-end development skills",
      "Kỹ năng cơ bản và quan trọng": "Fundamental and important skill",
      "Kỹ năng cần thiết cho việc thiết lập và quản lý dự án": "Essential skill for project setup and management",
      "Kỹ năng quan trọng cho việc quản lý và tổ chức dự án": "Important skill for project management and organization",
      "Tạo cơ sở dữ liệu cho sản phẩm và người dùng": "Create database for product and users",
      "Xây dựng chức năng đăng ký / đăng nhập người dùng": "Build user registration/login",
      "Cài đặt môi trường": "Environment Setup",
      "Quản lý dự án": "Project Management",
    };

    if (map[text]) return map[text];

    // partial / pattern matches
    if (text.includes("Học các kỹ năng")) {
      if (text.includes("front-end")) return "Learn front-end development skills";
      if (text.includes("back-end")) return "Learn back-end development skills";
      return "Learn the recommended skills";
    }

    if (text.includes("Kỹ năng")) return text.replace(/Kỹ năng/g, "Skill");

    if (text.includes("Tạo cơ sở dữ liệu")) return "Create database for product and users";

    if (text.includes("đăng ký") || text.includes("đăng nhập")) {
      return "Build user registration/login";
    }

    return text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              Learning Path
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized journey based on your current progress and skills.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedCenterId}
              onChange={(e) => setSelectedCenterId(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={pathLoading || generating}
            >
              {centers.map((center) => (
                <option key={center._id} value={center._id}>
                  {center.name || "Untitled Center"}
                </option>
              ))}
            </select>
            <button
              onClick={handleGeneratePath}
              disabled={generating || !selectedCenterId}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                  {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Create New</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {learningPath && (
        <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              {learningPath.path_name}
            </h2>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
              {progress.progress_percentage}% completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.progress_percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Current Stage:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {progress.current_stage}/{progress.total_stages}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Completed:</span>
              <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                {progress.completed_stages} stages
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                {learningPath.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Path Stages - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {pathLoading ? (
            <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading learning path...</span>
            </div>
          ) : learningPath && learningPath.stages.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Learning Stages
              </h2>
              {learningPath.stages.map((stage, index) => {
                const isCurrentStage = stage.stage_number === learningPath.current_stage;
                const isCompleted = stage.is_completed;
                const isPast = stage.stage_number < learningPath.current_stage;

                return (
                  <div
                    key={stage.stage_number}
                    className={`bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border-2 transition-all duration-200 ${
                      isCurrentStage
                        ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900"
                        : isCompleted
                        ? "border-green-500"
                        : "border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                          ) : isCurrentStage ? (
                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center animate-pulse">
                              <span className="text-white font-bold">{stage.stage_number}</span>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center">
                              <span className="text-gray-600 dark:text-gray-300 font-bold">{stage.stage_number}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{stage.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{translateLearningText(stage.description)}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded ${getDifficultyColor(
                                stage.difficulty_level
                              )} font-semibold`}
                            >
                              {getDifficultyLabel(stage.difficulty_level)}
                            </span>
                            {stage.estimated_duration_days > 0 && (
                              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                  {stage.estimated_duration_days} days
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isCurrentStage && !isCompleted && (
                        <button
                          onClick={() => handleCompleteStage(stage.stage_number)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>

                    {/* Skills */}
                    {stage.skills && stage.skills.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {stage.skills.map((skill) => (
                            <span
                              key={skill._id}
                              className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full text-sm font-medium"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Tasks */}
                    {stage.suggested_tasks && stage.suggested_tasks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Suggested Tasks:
                        </h4>
                        <div className="space-y-2">
                              {stage.suggested_tasks.slice(0, 3).map((task) => (
                            <div
                              key={task._id}
                              className="p-2 bg-gray-50 dark:bg-slate-700 rounded text-sm text-gray-700 dark:text-gray-300"
                            >
                                  {translateLearningText(task.title)}
                            </div>
                          ))}
                          {stage.suggested_tasks.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                  +{stage.suggested_tasks.length - 3} other tasks
                                </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 shadow-lg p-8 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                No learning path yet. Create a new learning path!
              </p>
              <button
                onClick={handleGeneratePath}
                disabled={generating || !selectedCenterId}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "Creating..." : "Create Learning Path"}
              </button>
            </div>
          )}
        </div>

        {/* Recommendations - Right Column (1/3) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 shadow-lg p-6 rounded-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Skill Recommendations
            </h2>
            {recommendationsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec._id}
                    className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                        {translateLearningText(rec.recommended_skill_id?.name)}
                      </h3>
                      {!rec.accepted && (
                        <button
                          onClick={() => handleAcceptRecommendation(rec._id)}
                          className="px-2 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{translateLearningText(rec.reason)}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded">
                        Priority: {rec.priority}/10
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded">
                        Confidence: {rec.confidence_score}%
                      </span>
                    </div>
                    {rec.suggested_tasks && rec.suggested_tasks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggested tasks:</p>
                        <div className="space-y-1">
                          {rec.suggested_tasks.slice(0, 2).map((task) => (
                            <div
                              key={task._id}
                              className="text-xs text-gray-600 dark:text-gray-300 pl-2 border-l-2 border-indigo-300"
                            >
                              {translateLearningText(task.title)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recommendations available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPath;

