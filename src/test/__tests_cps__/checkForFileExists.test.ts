import fileExists from './_utils/fileExists';

describe('checkForFileExists (components/pages/services)', () => {
  const componentPaths = [
    'components/CommentSection',
    'components/CustomToast',
    'components/DocumentationModal',
    'components/LoadingScreen',
    'components/LoginForm',
    'components/ModalProvider',
    'components/NotificationBell',
    'components/PageWrapper',
    'components/Pagination',
    'components/ProtectedRoute',
    'components/Sidebar',
    'components/SupportCenter',
    'components/ToastNotification',
    'components/BoardDetail/CreateTaskModal',
    'components/BoardDetail/EditTaskModal',
    'components/BoardDetail/FilterDropdown',
    'components/BoardDetail/TagManagerModal',
    'components/BoardDetail/TaskCard',
    'components/BoardSetting/ColumnManager',
    'components/BoardSetting/SwimlaneManager',
    'components/HelpButton/AIChatModal',
    'components/HelpButton/GuideModal',
    'components/HelpButton/HelpButton',
    'components/Group/GroupCard',
    'components/Group/GroupFormModal',
    'components/Group/GroupGrid',
    'components/Group/GroupHeader',
    'components/Group/GroupMemberCard',
  ];

  const pagePaths = [
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

  const servicePaths = [
    'services/geminiService',
  ];

  const allPaths = [
    ...componentPaths.map((p) => ({ kind: 'component', p })),
    ...pagePaths.map((p) => ({ kind: 'page', p })),
    ...servicePaths.map((p) => ({ kind: 'service', p })),
  ];

  it.each(allPaths)('%s: %s should exist on disk', ({ kind, p }) => {
    expect(fileExists(p)).toBe(true);
  });
});
