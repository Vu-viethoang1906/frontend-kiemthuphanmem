import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Using console logging instead of toast to avoid test failures
import { getCenterMembers, CenterMember } from "../../api/centerMemberApi";
import { getCenterById, Center } from "../../api/centerApi";
import CenterMemberCard from "../../components/Center/CenterMemberCard";
import { API_BASE_URL } from "../../utils/apiConfig";

const CenterMembers: React.FC = () => {
  const { centerId } = useParams<{ centerId: string }>();
  const navigate = useNavigate();
  const [center, setCenter] = useState<Center | null>(null);
  const [members, setMembers] = useState<CenterMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Check admin
  const rolesRaw = localStorage.getItem("roles");
  let isAdmin = false;
  try {
    const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
    isAdmin = roles.some((r: string) =>
      ["admin", "System_Manager"].includes(r)
    );
  } catch {
    isAdmin = false;
  }

  useEffect(() => {
    if (centerId) {
      fetchCenter();
      fetchMembers();
    }
  }, [centerId]);

  const fetchCenter = async () => {
    try {
      const response = await getCenterById(centerId!);
      setCenter(response);
    } catch (error: any) {
      console.error("Unable to load center information", error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await getCenterMembers(centerId!);
      
      let membersData = [];
      
      // Handle different response structures
      if (response && response.success && response.data) {
        membersData = response.data;
      } else if (Array.isArray(response)) {
        membersData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        membersData = response.data;
      }
      
      // Filter out invalid members
      const validMembers = membersData.filter((m: any) => {
        const userData = m.user || m;
        return !!(userData.username || userData.user_name || userData.email);
      });
      
      setMembers(validMembers);
    } catch (error: any) {
      console.error("Unable to load members list", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Read-only page: no add/remove actions

  // Handle member click to view their boards
  const handleMemberClick = (memberId: string) => {
    if (memberId && centerId) {
      // Get basePath (e.g., /dashboard or /admin)
      const basePath = window.location.pathname.includes('/admin') ? '/admin' : '/dashboard';
      // Navigate to route showing member's boards in center (using userId as parameter name)
      navigate(`${basePath}/center/${centerId}/member/${memberId}/boards`);
    }
  };

  // Filter members - only show valid members with user data
  const filteredMembers = members.filter((member) => {
    // Check if member has valid user data
    const userData = member.user || member;
    const hasValidData = !!(userData as any).username || !!(userData as any).user_name || !!(userData as any).email;
    
    if (!hasValidData) return false;
    
    const userName = (userData as any).full_name || (userData as any).username || (userData as any).user_name || "";
    const userEmail = (userData as any).email || "";
    
    if (!searchTerm) return true;
    
    return (
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Read-only: no availableUsers needed

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-slate-900 m-0">{center?.name}</h2>
          <p className="text-sm text-slate-500 mt-1">Center Members</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left"></i>
          Back
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search members..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Grid view"
          >
            <i className="bi bi-grid-3x2"></i>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="List view"
          >
            <i className="bi bi-list-ul"></i>
          </button>
          <div className="ml-2">
            <span className="inline-flex items-center rounded-md bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700">
              {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Members List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <p className="text-gray-500">No members found</p>
            </div>
          ) : (
            filteredMembers.map((member, idx) => {
              const userData = member.user || member;
              const currentUserId = (userData as any)._id || (userData as any).id || member.user_id;
              
              return (
                <CenterMemberCard
                  key={member._id || idx}
                  member={member}
                  baseUrl={API_BASE_URL}
                  onClick={() => handleMemberClick(currentUserId)}
                />
              );
            })
          )}
        </div>
      ) : (
        // List View
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Mobile list (sm) */}
          <div className="block md:hidden">
            <ul className="divide-y divide-slate-200">
              {filteredMembers.map((member) => {
                const userData = member.user || member;
                const username = (userData as any).username || (userData as any).user_name || "";
                const fullName = (userData as any).full_name || username;
                const email = (userData as any).email || "";
                const avatarUrl = (userData as any).avatar_url;
                const currentUserId = (userData as any)._id || (userData as any).id || member.user_id;

                if (!username && !email) return null;

                return (
                  <li key={member._id || currentUserId} className="p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
                        }
                        alt={username}
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{fullName}</div>
                        <div className="text-sm text-slate-500 truncate">@{username}</div>
                        {email && <div className="text-sm text-slate-700 truncate">{email}</div>}
                      </div>
                      <div className="whitespace-nowrap">
                        {member.role_in_center ? (
                          <span className="inline-flex items-center rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                            {member.role_in_center}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMemberClick(currentUserId)}
                      className="w-full px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      View Boards
                    </button>
                  </li>
                );
              })}
            </ul>

            {filteredMembers.length === 0 && (
              <div className="p-6 text-center text-slate-600">
                <i className="bi bi-info-circle mr-2"></i>
                No members in this center yet
              </div>
            )}
          </div>

          {/* Table for md+ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-50 border-b border-blue-200">
                <tr>
                  <th className="w-20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">Avatar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 border-l border-blue-200">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 border-l border-blue-200">Email</th>
                  <th className="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 border-l border-blue-200">Role</th>
                  <th className="w-32 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 border-l border-blue-200">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const userData = member.user || member;
                  const username = (userData as any).username || (userData as any).user_name || "";
                  const fullName = (userData as any).full_name || username;
                  const email = (userData as any).email || "";
                  const avatarUrl = (userData as any).avatar_url;
                  const currentUserId = (userData as any)._id || (userData as any).id || member.user_id;

                  if (!username && !email) return null;

                  return (
                    <tr key={member._id || currentUserId} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="px-4 py-3 text-center">
                        <img
                          src={
                            avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
                          }
                          alt={username}
                          className="inline-block h-10 w-10 rounded-full object-cover"
                        />
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="font-semibold text-slate-900">{fullName}</div>
                        <div className="text-sm text-slate-500">@{username}</div>
                      </td>
                      <td className="px-4 py-3 text-left text-slate-700">{email}</td>
                      <td className="px-4 py-3 text-left">
                        {member.role_in_center ? (
                          <span className="inline-flex items-center rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
                            {member.role_in_center}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleMemberClick(currentUserId)}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          View Boards
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredMembers.length === 0 && (
              <div className="border-t border-slate-200 p-6 text-center text-slate-600">
                <i className="bi bi-info-circle mr-2"></i>
                No members in this center yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterMembers;
