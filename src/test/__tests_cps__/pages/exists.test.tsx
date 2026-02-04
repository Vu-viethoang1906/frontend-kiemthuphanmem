import fileExists from '../_utils/fileExists';

describe('pages folder integrity', () => {
  const paths = [
    'pages/Admin/Admin',
    'pages/Admin/AdminHome',
    'pages/Admin/RoleAndPermission',
    'pages/Admin/RolePermissionEdit',
    'pages/Admin/UserManagement',
    'pages/Admin/UserPermissions',
    'pages/Admin/UserPointsManagement',
    'pages/Board/BoardDetail',
    'pages/Board/BoardMember',
    'pages/Board/BoardMembers',
    'pages/Board/BoardSettings',
    'pages/Board/BoardSummary',
    'pages/Board/lineChart',
    'pages/Center/CenterManagement',
    'pages/Center/CenterMembersPage',
    'pages/DashBoard/Dashboard',
    'pages/DashBoard/DashboardHome',
    'pages/Filters/Filters',
    'pages/Group/Groups',
    'pages/Introduction/Introduction',
    'pages/Login/Login',
    'pages/Login/CodeGymLogin',
    'pages/Project/Projects',
    'pages/Reports/Reports',
    'pages/Settings/Settings',
    'pages/Template/TemplateManagement',
    'pages/User/UserProfilePage',
  ];

  it.each(paths)('%s should exist on disk', (p) => {
    expect(fileExists(p)).toBe(true);
  });
});
