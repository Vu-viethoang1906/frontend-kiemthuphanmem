import fileExists from '../_utils/fileExists';

// Mock groq-sdk
const mockCreate = jest.fn();
jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (...args: any[]) => mockCreate(...args) } },
  })),
}));

import aiService from '../../../services/geminiService';

describe('services/geminiService', () => {
  it('should exist on disk', () => {
    expect(fileExists('services/geminiService')).toBe(true);
  });

  it('chat returns content on success', async () => {
  mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'Hello!' } }] });
    await expect(aiService.chat('Hi')).resolves.toBe('Hello!');
  });

  it('chat throws friendly API key error for 401', async () => {
    mockCreate.mockRejectedValueOnce({ message: 'bad key', status: 401 });
    await expect(aiService.chat('Hi')).rejects.toThrow(/Invalid API key/);
  });

  it('chat throws generic error message', async () => {
    mockCreate.mockRejectedValueOnce({ message: 'network down' });
    await expect(aiService.chat('Hi')).rejects.toThrow(/Cannot connect to AI/);
  });

  it('getSuggestions returns split top 3 on success', async () => {
  mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'A\nB\nC\nD' } }] });
    await expect(aiService.getSuggestions('ctx')).resolves.toEqual(['A', 'B', 'C']);
  });

  it('getSuggestions returns default list on error', async () => {
  mockCreate.mockRejectedValueOnce(new Error('x'));
    await expect(aiService.getSuggestions('ctx')).resolves.toEqual([
      'Create new task', 'View project progress', 'Manage team',
    ]);
  });
});
