import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Using console logging instead of toast to avoid test failures
import { getCenterMembers, CenterMember } from "../../api/centerMemberApi";
import { getCenterById, Center } from "../../api/centerApi";

const CenterMembers: React.FC = () => {
  const { centerId } = useParams<{ centerId: string }>();
  const navigate = useNavigate();
  const [center, setCenter] = useState<Center | null>(null);
  const [members, setMembers] = useState<CenterMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left"></i>
          Back
        </button>
      </div>

      {/* Search & Stats */}
      <div className="mb-4 rounded-none border border-slate-200 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="md:flex-1">
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder:slate-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="🔍 Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:text-right">
              <span className="inline-flex items-center rounded-none bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
                Total: {filteredMembers.length} members
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="rounded-none border border-blue-200 bg-white shadow-sm">
          <div className="p-0">
            {/* Mobile list (sm) */}
            <div className="block md:hidden">
              <ul className="divide-y divide-slate-200">
                {filteredMembers.map((member) => {
                  const userData = member.user || member;
                  const username = (userData as any).username || (userData as any).user_name || "";
                  const fullName = (userData as any).full_name || username;
                  const email = (userData as any).email || "";
                  const avatarUrl = (userData as any).avatar_url;
                  const memberId = member._id || member.member_id || member.user_id;

                  if (!username && !email) return null;

                  return (
                    <li key={member._id || memberId} className="p-3 flex items-center gap-3">
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
                          <span className="inline-flex items-center rounded-none bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                            {member.role_in_center}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </div>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 border-l border-blue-200">Tên</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 border-l border-blue-200">Email</th>
                    <th className="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 border-l border-blue-200">Role trong Center</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
                    const userData = member.user || member;
                    const username = (userData as any).username || (userData as any).user_name || "";
                    const fullName = (userData as any).full_name || username;
                    const email = (userData as any).email || "";
                    const avatarUrl = (userData as any).avatar_url;
                    const memberId = member._id || member.member_id || member.user_id;

                    if (!username && !email) return null;

                    return (
                      <tr key={member._id || memberId} className="hover:bg-slate-50">
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
                            <span className="inline-flex items-center rounded-none bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
                              {member.role_in_center}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
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
        </div>
      )}

      {/* Read-only: no Add Member modal */}
    </div>
  );
};

export default CenterMembers;
