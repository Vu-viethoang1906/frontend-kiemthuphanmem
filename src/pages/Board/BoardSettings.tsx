import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ColumnManager from "../../components/BoardSetting/ColumnManager";
import SwimlaneManager from "../../components/BoardSetting/SwimlaneManager";
import SlackSettings from "../../components/BoardSetting/SlackSettings";
import { fetchBoardById, updateBoard } from "../../api/boardApi";
import toast from "react-hot-toast";

const BoardSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "boardInfo" | "columns" | "swimlanes" | "slack"
  >("boardInfo");

  // Board info states
  const [board, setBoard] = useState<any>(null);
  const [boardTitle, setBoardTitle] = useState("");
  const [boardDescription, setBoardDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load board data
  useEffect(() => {
    const loadBoard = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetchBoardById(id);
        const boardData = res?.data || res;
        setBoard(boardData);
        setBoardTitle(boardData?.title || "");
        setBoardDescription(boardData?.description || "");
      } catch (error) {
        toast.error(
          <div>
            <div className="font-semibold mb-1">Unable to load board info!</div>
            <div className="text-sm text-gray-500">Please try again later.</div>
          </div>
        );
      } finally {
        setLoading(false);
      }
    };
    loadBoard();
  }, [id]);

  // Handle save board info
  const handleSaveBoardInfo = async () => {
    if (!id) return;

    if (!boardTitle.trim()) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Invalid board name!</div>
          <div className="text-sm text-gray-500">Please enter a board name.</div>
        </div>
      );
      return;
    }

    try {
      setSaving(true);
      await updateBoard(id, {
        title: boardTitle.trim(),
        description: boardDescription.trim(),
      });

      toast.success(
        <div>
          <div className="font-semibold mb-1">Board updated successfully!</div>
          <div className="text-sm text-gray-500">Board information has been saved.</div>
        </div>
      );

      // Reload board data
      const res = await fetchBoardById(id);
      const boardData = res?.data || res;
      setBoard(boardData);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Failed to update board!</div>
          <div className="text-sm text-gray-500">{error?.response?.data?.message || "Please try again later."}</div>
        </div>
      );
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return <div>Board ID not found</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-800">
          <span className="inline-block w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-base font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 md:px-6 py-5">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="m-0 text-slate-900 text-[28px] font-bold leading-tight">Board Settings</h1>
          <button
            type="button"
            onClick={() => navigate(`/project/${id}`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
            aria-label="Back to Board"
            title="Back to Board"
          >
            <i className="bi bi-arrow-left-short text-xl" />
            <span className="text-sm font-semibold">Back</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-end gap-2 mb-6 border-b border-blue-200">
          <button
            onClick={() => setActiveTab("boardInfo")}
            className={`px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 transition ${
              activeTab === "boardInfo"
                ? "bg-blue-600 text-white border-blue-600 shadow"
                : "text-slate-800 border-transparent hover:bg-blue-50"
            }`}
          >
            Board Info
          </button>
          <button
            onClick={() => setActiveTab("columns")}
            className={`px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 transition ${
              activeTab === "columns"
                ? "bg-blue-600 text-white border-blue-600 shadow"
                : "text-slate-800 border-transparent hover:bg-blue-50"
            }`}
          >
            Columns
          </button>
          <button
            onClick={() => setActiveTab("swimlanes")}
            className={`px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 transition ${
              activeTab === "swimlanes"
                ? "bg-blue-600 text-white border-blue-600 shadow"
                : "text-slate-800 border-transparent hover:bg-blue-50"
            }`}
          >
            Swimlanes
          </button>
          <button
            onClick={() => setActiveTab("slack")}
            className={`px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 transition ${
              activeTab === "slack"
                ? "bg-blue-600 text-white border-blue-600 shadow"
                : "text-slate-800 border-transparent hover:bg-blue-50"
            }`}
          >
            Slack
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
          {activeTab === "boardInfo" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-800 m-0">Board Info</h2>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 rounded-md font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBoardInfo}
                      disabled={saving || !boardTitle.trim()}
                      className={`px-5 py-2.5 rounded-md font-semibold text-sm ${
                        saving || !boardTitle.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                      }`}
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setBoardTitle(board?.title || '');
                        setBoardDescription(board?.description || '');
                      }}
                      className="px-5 py-2.5 rounded-md font-semibold text-sm bg-gray-100 text-slate-700 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium text-slate-800 text-sm">
                  Board Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  placeholder="Enter board name..."
                  disabled={!isEditing}
                  className={`w-full px-3 py-3 border border-slate-300 rounded-none text-base text-slate-800 outline-none focus:border-blue-600 transition-colors ${
                    isEditing ? 'bg-white' : 'bg-slate-50 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="mb-8">
                <label className="block mb-2 font-medium text-slate-800 text-sm">
                  Description
                </label>
                <textarea
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  placeholder="Enter board description..."
                  rows={5}
                  disabled={!isEditing}
                  className={`w-full px-3 py-3 border border-slate-300 rounded-none text-base text-slate-800 outline-none focus:border-blue-600 transition-colors resize-vertical ${
                    isEditing ? 'bg-white' : 'bg-slate-50 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          )}
          {activeTab === "columns" && <ColumnManager boardId={id} />}
          {activeTab === "swimlanes" && <SwimlaneManager boardId={id} />}
          {activeTab === "slack" && <SlackSettings boardId={id} />}
        </div>
      </div>
    </div>
  );
};

export default BoardSettings;
