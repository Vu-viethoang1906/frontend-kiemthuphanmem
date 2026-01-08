// BoardMember.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBoardMember } from "../../api/boardApi";
// Using Tailwind styles to match Groups list page
const BoardMember: React.FC = () => {
  const { userId, groupId } = useParams<{ userId: string; groupId: string }>();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !groupId) return;

    const getBoards = async () => {
      try {
        setLoading(true);
        const res = await fetchBoardMember(userId, groupId);
        setBoards(res.data || []);
      } catch (err: any) {
        console.error("Error fetching board:", err);
        setError(err.message || "Unable to fetch board list");
      } finally {
        setLoading(false);
      }
    };

    getBoards();
  }, [userId, groupId]);

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  if (!boards.length) {
    return <div className="text-center text-yellow-600 font-semibold">No boards found for this user.</div>;
  }

  return (
  <div className="px-6 sm:px-8 py-8 max-w-6xl mx-auto">
      {/* Back button top-right */}
      <div className="flex items-start justify-end">
        <button
          onClick={() => {
            const basePath = window.location.pathname.includes('/admin') ? '/admin' : '/dashboard';
            if (groupId) {
              // go directly to group's members list
              navigate(`${basePath}/groups/${groupId}`);
            } else {
              navigate(`${basePath}/groups`);
            }
          }}
          className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          aria-label="Back to group members"
        >
          Back
        </button>
      </div>

      {/* Title */}
      <div className="mt-6 mb-4">
        <h1 className="text-2xl font-bold text-blue-600 tracking-wide uppercase">Boards for User</h1>
      </div>

      {/* Content area */}
      <div className="mt-8">
        {boards.map((board) => (
          <div
            key={board.board_id?._id || board.board_id?.id}
            className="border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div>
              <h3 className="text-base font-semibold text-gray-900">{board.board_id?.title || 'No title'}</h3>
              <p className="text-sm"><span className="font-semibold text-gray-800">Board ID:</span> {board.board_id?._id}</p>
              <p className="text-sm"><span className="font-semibold text-gray-800">Role:</span> {board.role_in_board}</p>
              <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">Joined at:</span> {new Date(board.createdAt).toLocaleString('en-US')}</p>
            </div>
            <div className="mt-5">
              <button
                onClick={() => {
                  const id = board.board_id?._id;
                  navigate(`/project/${id}`);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow"
              >
                Open Board
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardMember;