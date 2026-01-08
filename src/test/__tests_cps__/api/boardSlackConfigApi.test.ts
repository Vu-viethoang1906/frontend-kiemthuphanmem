import {
  getBoardSlackConfig,
  updateBoardSlackConfig,
  toggleBoardSlackNotifications,
  testBoardSlackWebhook,
  deleteBoardSlackConfig,
  BoardSlackConfig,
} from '../../../api/boardSlackConfigApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('boardSlackConfigApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBoardSlackConfig', () => {
    it('should fetch board Slack configuration', async () => {
      const mockConfig: BoardSlackConfig = {
        board_id: 'board-123',
        webhook_url: 'https://hooks.slack.com/test',
        notify_task_created: true,
        notify_task_assigned: true,
        notify_task_completed: false,
        notify_comment_added: true,
        is_active: true,
        channel_name: '#project-updates',
      };
      mockAxios.get.mockResolvedValue({
        data: { success: true, data: mockConfig },
      });

      const result = await getBoardSlackConfig('board-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/boards/slack/board-123/config');
      expect(result).toEqual(mockConfig);
    });

    it('should handle API errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('Config not found'));

      await expect(getBoardSlackConfig('invalid-board')).rejects.toThrow('Config not found');
    });
  });

  describe('updateBoardSlackConfig', () => {
    it('should update Slack configuration', async () => {
      const updateData = {
        webhook_url: 'https://hooks.slack.com/updated',
        notify_task_created: false,
        is_active: true,
      };
      const mockResponse: BoardSlackConfig = {
        board_id: 'board-456',
        ...updateData,
        notify_task_assigned: true,
        notify_task_completed: true,
        notify_comment_added: false,
      };
      mockAxios.put.mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await updateBoardSlackConfig('board-456', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/boards/slack/board-456/config',
        updateData
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update individual notification settings', async () => {
      const updateData = { notify_comment_added: true };
      mockAxios.put.mockResolvedValue({
        data: {
          success: true,
          data: {
            board_id: 'board-789',
            is_active: true,
            notify_task_created: false,
            notify_task_assigned: false,
            notify_task_completed: false,
            notify_comment_added: true,
          },
        },
      });

      await updateBoardSlackConfig('board-789', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/boards/slack/board-789/config',
        updateData
      );
    });
  });

  describe('toggleBoardSlackNotifications', () => {
    it('should enable Slack notifications', async () => {
      mockAxios.put.mockResolvedValue({
        data: { success: true, data: { is_active: true } },
      });

      const result = await toggleBoardSlackNotifications('board-123', true);

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/boards/slack/board-123/config/toggle',
        { is_active: true }
      );
      expect(result.is_active).toBe(true);
    });

    it('should disable Slack notifications', async () => {
      mockAxios.put.mockResolvedValue({
        data: { success: true, data: { is_active: false } },
      });

      const result = await toggleBoardSlackNotifications('board-456', false);

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/boards/slack/board-456/config/toggle',
        { is_active: false }
      );
      expect(result.is_active).toBe(false);
    });
  });

  describe('testBoardSlackWebhook', () => {
    it('should test webhook successfully', async () => {
      mockAxios.post.mockResolvedValue({
        data: { success: true, message: 'Webhook test successful' },
      });

      const result = await testBoardSlackWebhook(
        'board-789',
        'https://hooks.slack.com/test-webhook'
      );

      expect(mockAxios.post).toHaveBeenCalledWith('/boards/slack/board-789/config/test', {
        webhook_url: 'https://hooks.slack.com/test-webhook',
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Webhook test successful');
    });

    it('should handle webhook test failure', async () => {
      mockAxios.post.mockResolvedValue({
        data: { success: false, message: 'Invalid webhook URL' },
      });

      const result = await testBoardSlackWebhook('board-123', 'invalid-url');

      expect(result.success).toBe(false);
    });
  });

  describe('deleteBoardSlackConfig', () => {
    it('should delete Slack configuration', async () => {
      mockAxios.delete.mockResolvedValue({
        data: { success: true, message: 'Configuration deleted' },
      });

      await deleteBoardSlackConfig('board-delete');

      expect(mockAxios.delete).toHaveBeenCalledWith('/boards/slack/board-delete/config');
    });

    it('should handle deletion errors', async () => {
      mockAxios.delete.mockRejectedValue(new Error('Config not found'));

      await expect(deleteBoardSlackConfig('invalid-board')).rejects.toThrow(
        'Config not found'
      );
    });
  });
});
