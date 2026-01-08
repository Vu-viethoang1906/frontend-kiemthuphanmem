import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBoardMembers } from '../../api/boardMemberApi';
import { fetchBoardById } from '../../api/boardApi';
import { toast } from 'react-hot-toast';

// Function to get avatar color from name
const getAvatarColor = (name: string): string => {
  const colors = [
    '#4F46E5', // indigo-600
    '#7C3AED', // violet-600
    '#10B981', // emerald-500
    '#3B82F6', // blue-500
    '#EC4899', // pink-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#6366F1', // indigo-500
    '#8B5CF6', // violet-500
    '#06B6D4'  // cyan-500
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + code;
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const BoardMembersPage: React.FC = () => {
  const { id: boardId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get role color based on role name
  const getRoleColor = useMemo(() => {
    const colorMap: Record<string, string> = {};
    const colors = [
      'bg-red-100 text-red-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
    ];
    
    // Assign colors to roles as they appear in members
    if (members.length > 0) {
      let colorIndex = 0;
      members.forEach(member => {
        const role = member.role_in_board || 'Member';
        if (!colorMap[role] && colorIndex < colors.length) {
          colorMap[role] = colors[colorIndex];
          colorIndex++;
        } else if (!colorMap[role]) {
          // Fallback to gray if we run out of colors
          colorMap[role] = 'bg-gray-100 text-gray-800';
        }
      });
    }
    
    return (role: string) => colorMap[role] || 'bg-gray-100 text-gray-800';
  }, [members]);

  useEffect(() => {
    const loadData = async () => {
      if (!boardId) return;
      
      try {
        setLoading(true);
        const boardRes = await fetchBoardById(boardId);
        setBoard(boardRes.data || boardRes);
        
        const membersRes = await fetchBoardMembers(boardId);
        const membersData = membersRes?.data?.data || membersRes?.data || [];
        setMembers(membersData);
        
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load member information');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [boardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">
              Board Members
            </h1>
            {board?.title && (
              <p className="mt-1 text-sm text-gray-500">
                Board: {board.title}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
          >
            Back
          </button>
        </div>

        {/* Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No members in this board yet
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const user = member.user_id || {};
                    const userName = user.full_name || user.username || 'Member';
                    const userEmail = user.email || 'No email';
                    const role = member.role_in_board || 'Member';
                    const isAdmin = role === 'admin' || role === 'System_Manager';
                    const isCreator = role === 'Creator';
                    
                    return (
                      <tr key={member._id || member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: getAvatarColor(userName) }}
                            >
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{userName}</div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {userEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(role)}`}>
                              {role}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardMembersPage;
