import fileExists from '../_utils/fileExists';

describe('components folder integrity', () => {
  const paths = [
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

  it.each(paths)('%s should exist on disk', (p) => {
    expect(fileExists(p)).toBe(true);
  });
});
