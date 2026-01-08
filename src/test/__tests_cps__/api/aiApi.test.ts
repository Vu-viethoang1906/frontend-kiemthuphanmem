import { sendChatMessage, getAISuggestions } from '../../../api/aiApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('aiApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendChatMessage', () => {
    it('should send chat message and receive AI response', async () => {
      const mockRequest = {
        message: 'Hello AI',
        history: [
          { role: 'user' as const, content: 'Previous message' },
          { role: 'assistant' as const, content: 'Previous response' },
        ],
      };

      const mockResponse = {
        success: true,
        data: {
          message: 'Hello! How can I help you?',
          timestamp: '2025-11-21T10:00:00Z',
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await sendChatMessage(mockRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith('/ai/chat', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should send chat message without history', async () => {
      const mockRequest = {
        message: 'What is the weather?',
      };

      const mockResponse = {
        success: true,
        data: {
          message: 'I can help with that.',
          timestamp: '2025-11-21T10:05:00Z',
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await sendChatMessage(mockRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith('/ai/chat', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty message', async () => {
      const mockRequest = { message: '' };
      const mockResponse = {
        success: false,
        data: {
          message: 'Message cannot be empty',
          timestamp: '2025-11-21T10:10:00Z',
        },
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await sendChatMessage(mockRequest);

      expect(result.success).toBe(false);
    });

    it('should propagate API errors', async () => {
      const error = new Error('AI service unavailable');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(sendChatMessage({ message: 'Test' })).rejects.toThrow('AI service unavailable');
    });
  });

  describe('getAISuggestions', () => {
    it('should get AI suggestions based on context', async () => {
      const mockContext = 'board:123';
      const mockSuggestions = {
        suggestions: [
          { id: '1', text: 'Add a new column for testing' },
          { id: '2', text: 'Create sprint planning task' },
        ],
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockSuggestions });

      const result = await getAISuggestions(mockContext);

      expect(mockedAxios.post).toHaveBeenCalledWith('/ai/suggestions', { context: mockContext });
      expect(result).toEqual(mockSuggestions);
    });

    it('should handle task context', async () => {
      const mockContext = 'task:456';
      const mockSuggestions = {
        suggestions: [{ id: '1', text: 'Break down this task into subtasks' }],
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockSuggestions });

      const result = await getAISuggestions(mockContext);

      expect(mockedAxios.post).toHaveBeenCalledWith('/ai/suggestions', { context: mockContext });
      expect(result).toEqual(mockSuggestions);
    });

    it('should handle empty suggestions', async () => {
      const mockContext = 'project:789';
      mockedAxios.post.mockResolvedValueOnce({ data: { suggestions: [] } });

      const result = await getAISuggestions(mockContext);

      expect(result.suggestions).toEqual([]);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Failed to generate suggestions');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(getAISuggestions('board:123')).rejects.toThrow('Failed to generate suggestions');
    });
  });
});
