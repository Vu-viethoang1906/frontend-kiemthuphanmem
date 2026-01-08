import '@testing-library/jest-dom';

jest.mock('../../../api/axiosInstance', () => {
  return {
    __esModule: true,
    default: { get: jest.fn((url: string) => Promise.resolve({ data: { url, ok: true } })) },
  };
});

describe('boarmemberApi fetchColumnsByBoard', () => {
  test('returns data from axiosInstance.get', async () => {
    const { fetchColumnsByBoard } = await import('../../../api/boarmemberApi');
    const data = await fetchColumnsByBoard('board-123');
    expect(data).toEqual({ url: '/column/board/board-123', ok: true });
  });
});
