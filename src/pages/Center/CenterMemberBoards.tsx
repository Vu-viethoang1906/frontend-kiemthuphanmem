// CenterMemberBoards.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCenterMemberBoards } from "../../api/centerApi";

const CenterMemberBoards: React.FC = () => {
  const { userId, centerId } = useParams<{ userId: string; centerId: string }>();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>("Member");
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !centerId) return;

    const getBoards = async () => {
      try {
        setLoading(true);
        const res = await fetchCenterMemberBoards(userId, centerId);
        setBoards(res.data || res || []);
        
        // Try to extract member name from first board
        if (res.data && res.data.length > 0) {
          const memberData = res.data[0].user_id || res.data[0].user;
          if (typeof memberData === 'object' && memberData?.full_name) {
            setMemberName(memberData.full_name);
          }
        }
      } catch (err: any) {
        console.error("Error fetching boards:", err);
        // Handle 404 or other errors gracefully
        if (err?.response?.status === 404) {
          setError("No boards found for this member in this center");
        } else {
          setError(err.message || "Unable to fetch board list");
        }
      } finally {
        setLoading(false);
      }
    };

    getBoards();
  }, [userId, centerId]);

  const basePath = window.location.pathname.includes('/admin') ? '/admin' : '/dashboard';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading boards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 sm:px-8 py-8 max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Error Loading Boards</h1>
            <p className="text-sm text-gray-500 mt-1">Unable to fetch member's boards</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/center/${centerId}/members`)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Members
          </button>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <div className="px-6 sm:px-8 py-8 max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Boards for {memberName}</h1>
            <p className="text-sm text-gray-500 mt-1">No boards assigned to this member</p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/center/${centerId}/members`)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Members
          </button>
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 font-medium">No boards found</p>
          <p className="text-sm text-gray-500 mt-1">This member doesn't have any boards in this center yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boards for {memberName}</h1>
          <p className="text-sm text-gray-500 mt-1">Showing {boards.length} board{boards.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate(`${basePath}/center/${centerId}/members`)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Members
        </button>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => {
          const boardId = board.board_id?._id || board.board_id?.id || board._id;
          const boardTitle = board.board_id?.title || board.title || 'No title';
          const boardDescription = board.board_id?.description || board.description || '';
          const roleInBoard = board.role_in_board || 'Member';
          const createdAt = board.createdAt || board.created_at;

          return (
            <div
              key={boardId}
              className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-5">
                {/* Board Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {boardTitle}
                </h3>

                {/* Board Description */}
                {boardDescription && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {boardDescription}
                  </p>
                )}

                {/* Board Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Board ID:</span>
                    <span className="text-gray-900 font-mono text-xs">{boardId?.substring(0, 12)}...</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Role:</span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {roleInBoard}
                    </span>
                  </div>
                  {createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Joined:</span>
                      <span className="text-gray-700 text-xs">
                        {new Date(createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    navigate(`/project/${boardId}`);
                  }}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Open Board
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CenterMemberBoards;
