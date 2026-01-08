import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMe } from '../api/authApi';
import { getGroupsByUser } from '../api/groupUserApi';
import { getUlrLogo } from '../api/logoApi';
interface MenuItem {
  name: string;
  icon: string;
  path: string;
  badge?: number;
  iconUrl?: string | null;
  submenu?: MenuItem[];
}

interface SidebarProps {
  mainMenu: MenuItem[];
  personalMenu: MenuItem[];
  adminMenu: MenuItem[];
  teams?: { id: string; name: string; initial: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ mainMenu, personalMenu, adminMenu, teams = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTeamsExpanded, setIsTeamsExpanded] = useState(true);
  const [userGroups, setUserGroups] = useState<{ id: string; name: string; initial: string }[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('app_logo_url') || '';
  });
  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to convert logo URL to full URL
  const getFullLogoUrl = (url: string | null): string => {
    if (!url) return '/icons/ken.png';

    // If it's already a full URL, return as is
    if (url.startsWith('http')) {
      return url;
    }

    // Convert relative path to full URL
    const baseUrl = process.env.REACT_APP_SOCKET_URL
      ? process.env.REACT_APP_SOCKET_URL.replace('/api', '')
      : 'http://localhost:3005';

    // Handle both /api/uploads and /uploads paths
    if (url.startsWith('/api/uploads')) {
      return `${baseUrl}${url}`;
    } else if (url.startsWith('/uploads')) {
      return `${baseUrl}/api${url}`;
    } else {
      // Relative path, assume it needs /api/uploads prefix
      const cleanPath = url.startsWith('/') ? url : `/${url}`;
      return `${baseUrl}/api/uploads${cleanPath}`;
    }
  };

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await getUlrLogo();
        // Giả sử API trả về mảng như bạn gửi
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const url = res.data[0].url;
          setLogoUrl(url); // lấy logo đầu tiên
          localStorage.setItem('app_logo_url', url);
        }
      } catch (error) {
        // Failed to load logo — silently ignore to avoid disrupting UI
      }
    };
    loadLogo();
  }, []);

  // Get icon path from public/icons folder or use iconUrl from backend
  const getIconPath = (item: MenuItem) => {
    // Priority: use iconUrl from backend if available, otherwise fallback to default icon path
    if (item.iconUrl) {
      // Nếu là URL đầy đủ thì dùng luôn
      if (item.iconUrl.startsWith('http')) {
        return item.iconUrl;
      }
      // Nếu icon nằm trong public/icons thì trả nguyên (không prepend /api/uploads)
      if (item.iconUrl.startsWith('/icons')) {
        return item.iconUrl;
      }

      // Convert relative path (upload) sang full URL
      const baseUrl = process.env.REACT_APP_SOCKET_URL
        ? process.env.REACT_APP_SOCKET_URL.replace('/api', '')
        : 'http://localhost:3005';

      if (item.iconUrl.startsWith('/api/uploads')) {
        return `${baseUrl}${item.iconUrl}`;
      } else if (item.iconUrl.startsWith('/uploads')) {
        return `${baseUrl}/api${item.iconUrl}`;
      } else {
        const cleanPath = item.iconUrl.startsWith('/') ? item.iconUrl : `/${item.iconUrl}`;
        return `${baseUrl}/api/uploads${cleanPath}`;
      }
    }
    return `/icons/icon-${item.icon}.png`;
  };

  const [isAdminExpanded, setIsAdminExpanded] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Detect base path for navigation
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/dashboard';

  // Auto-expand menu if any submenu is active (consider child routes)
  useEffect(() => {
    const checkActiveSubmenu = () => {
      const allMenus = [...mainMenu, ...personalMenu, ...adminMenu];
      allMenus.forEach((menu) => {
        if (menu.submenu && menu.submenu.length > 0) {
          const hasActiveSubmenu = menu.submenu.some(
            (sub) => location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`),
          );
          if (hasActiveSubmenu) {
            setExpandedMenus((prev) => new Set(prev).add(menu.name));
          }
        }
      });
    };
    checkActiveSubmenu();
  }, [location.pathname, mainMenu, personalMenu, adminMenu]);

  // Close mobile sidebar overlay when route changes to a different base (admin vs dashboard)
  // Keep overlay open for intra-base navigations (e.g., /admin/centers -> /admin/centers/:id/members)
  const prevPathRef = useRef<string>(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current || '';
    const getBase = (p: string) => p.split('/')[1] || '';
    const prevBase = getBase(prev);
    const newBase = getBase(location.pathname);

    // Only close the mobile overlay when switching between bases (e.g., /dashboard -> /admin)
    if (prev && prevBase !== newBase) {
      setIsMobileMenuOpen(false);
    }

    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  // Load real groups for current user
  useEffect(() => {
    const loadGroups = async () => {
      try {
        let userId = localStorage.getItem('userId') || '';
        if (!userId) {
          const me = await getMe();
          if (me?.success && me.data?._id) userId = me.data._id;
        }
        if (!userId) return;
        const res = await getGroupsByUser(userId);
        const raw = res?.data;
        if (!Array.isArray(raw)) return;
        const groups = raw
          .filter((gm: any) => gm?.group_id)
          .map((gm: any) => {
            const g = gm.group_id;
            const name = g?.name || g?.title || 'Group';
            const initial = (name || 'G').toString().trim().charAt(0).toUpperCase();
            return { id: g._id || g.id, name, initial };
          });
        setUserGroups(groups);
      } catch {
        setUserGroups([]);
      }
    };
    loadGroups();
  }, []);

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus.has(item.name);
    const isRootPath = item.path === '/admin' || item.path === '/dashboard' || item.path === '/';
    const isActive =
      location.pathname === item.path ||
      (!isRootPath && location.pathname.startsWith(`${item.path}/`)) ||
      (hasSubmenu &&
        item.submenu?.some(
          (sub) => location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`),
        ));

    const stateClasses = isActive
      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-100 font-bold'
      : 'text-gray-600 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white';

    if (hasSubmenu && !isCollapsed) {
      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleMenu(item.name)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${stateClasses}`}
          >
            <img
              src={getIconPath(item)}
              alt={item.name}
              className={`w-5 h-5 object-contain transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-50'
              } ${!isActive ? 'dark:brightness-75' : ''}`}
              onError={(e) => {
                if (item.iconUrl && item.icon) {
                  e.currentTarget.src = `/icons/icon-${item.icon}.png`;
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
            <span className="flex-1 text-left">{item.name}</span>
            {item.badge && (
              <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-100 rounded-full">
                {item.badge}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.submenu?.map((subItem) => {
                const isSubActive = location.pathname === subItem.path;
                const subStateClasses = isSubActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-100 font-bold'
                  : 'text-gray-600 dark:text-slate-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white';
                return (
                  <button
                    key={subItem.name}
                    onClick={() => navigate(subItem.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${subStateClasses}`}
                  >
                    <span className="flex-1 text-left">{subItem.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.name}
        onClick={() => navigate(item.path)}
        className={`w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-lg text-sm transition-all ${stateClasses} ${
          isCollapsed ? 'justify-center px-2' : ''
        }`}
        title={isCollapsed ? item.name : ''}
      >
        <img
          src={getIconPath(item)}
          alt={item.name}
          className={`w-5 h-5 object-contain transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-50'
          } ${!isActive ? 'dark:brightness-75' : ''}`}
          onError={(e) => {
            // Fallback to default icon if iconUrl fails
            if (item.iconUrl && item.icon) {
              e.currentTarget.src = `/icons/icon-${item.icon}.png`;
            } else {
              e.currentTarget.style.display = 'none';
            }
          }}
        />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.name}</span>
            {item.badge && (
              <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-100 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-screen overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'w-16 lg:w-20' : 'w-64'
        } ${
          isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : ''
        } lg:relative lg:shadow-none`}
        style={
          {
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties
        }
      >
        <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        {/* Logo and Toggle Button */}
        <div className="flex items-center justify-between px-3 py-4 relative">
          {!isCollapsed && (
            <img
              src={getFullLogoUrl(logoUrl)}
              alt="Ken Logo"
              className="h-12 sm:h-14 lg:h-16 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`${basePath}/landing`)}
              title="Go to Landing"
              onError={(e) => {
                // Fallback to default logo if custom logo fails to load
                (e.currentTarget as HTMLImageElement).src = '/icons/ken.png';
              }}
            />
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block hover:scale-110 transition-all z-10 text-gray-400 dark:text-slate-500"
            style={{
              position: isCollapsed ? 'relative' : 'absolute',
              right: isCollapsed ? 'auto' : '8px',
              top: isCollapsed ? 'auto' : '32px',
              margin: isCollapsed ? '0 auto' : '0',
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-6 h-6 text-gray-400 hover:text-indigo-600" />
            ) : (
              <ChevronLeft className="w-6 h-6 text-gray-400 hover:text-indigo-600" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 py-2 ${isCollapsed ? 'px-0' : 'px-3'}`}>
          {/* Main Menu */}
          {/*
            Hide the global '/dashboard' menu item when not inside the dashboard area.
            Some backend configs include a Dashboard entry that was showing on every page.
            We only show it when the current path is under '/dashboard' so it's visible
            in the Dashboard area and not duplicated across other pages.
          */}
          {mainMenu
            .filter((item) => {
              if (item.path === '/dashboard' && !location.pathname.startsWith('/dashboard')) {
                return false;
              }
              return true;
            })
            .map(renderMenuItem)}

          {/* Personal Menu */}
          {personalMenu.map(renderMenuItem)}

          {/* Admin Section */}
          {adminMenu.length > 0 && (
            <div className="mt-4">
              {!isCollapsed ? (
                <>
                  <button
                    onClick={() => setIsAdminExpanded(!isAdminExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <span>Quản trị</span>
                    {isAdminExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {isAdminExpanded && <div className="mt-1">{adminMenu.map(renderMenuItem)}</div>}
                </>
              ) : (
                <div className="border-t border-gray-200 dark:border-slate-800 pt-2 mt-2">
                  {adminMenu.map(renderMenuItem)}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Your Teams Section */}
        {(userGroups.length > 0 || teams.length > 0) && (
          <div
            className={`pb-4 border-t border-gray-200 dark:border-slate-800 pt-4 ${
              isCollapsed ? 'px-0' : 'px-3'
            }`}
          >
            {!isCollapsed ? (
              <>
                <button
                  onClick={() => setIsTeamsExpanded(!isTeamsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <span>Your teams</span>
                  {isTeamsExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isTeamsExpanded && (
                  <div className="mt-2 space-y-1">
                    {(userGroups.length > 0 ? userGroups : teams).slice(0, 5).map((team) => (
                      <button
                        key={team.id}
                        onClick={() => navigate(`${basePath}/groups/${team.id}`)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-slate-200">
                          {team.initial}
                        </div>
                        <span className="flex-1 text-left">{team.name}</span>
                      </button>
                    ))}
                    {(userGroups.length > 5 ? userGroups.length : teams.length) > 5 && (
                      <button
                        onClick={() => navigate(`${basePath}/groups`)}
                        className="w-full px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg"
                        title="View all groups"
                      >
                        …
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2 space-y-1">
                {(userGroups.length > 0 ? userGroups : teams).slice(0, 3).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => navigate(`${basePath}/groups/${team.id}`)}
                    className="w-full flex items-center justify-center px-2 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                    title={team.name}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-slate-200">
                      {team.initial}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
