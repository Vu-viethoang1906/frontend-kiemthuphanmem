import '@testing-library/jest-dom';
import axiosInstance from '../../../api/axiosInstance';
import { reorderColumns, setDoneColumn, getDoneColumn, updataIsDone } from '../../../api/columnApi';

jest.mock('../../../api/axiosInstance');

describe('columnApi additional endpoints', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reorderColumns: calls endpoint and returns data', async () => {
    mockAxios.put.mockResolvedValueOnce({ data: { success: true } } as any);
    const res = await reorderColumns('b1', { column_ids: ['c1', 'c2'] });
    expect(mockAxios.put).toHaveBeenCalledWith('/column/board/b1/reorder', { column_ids: ['c1', 'c2'] });
    expect(res).toEqual({ success: true });
  });

  test('setDoneColumn and updataIsDone: hit endpoints and return data', async () => {
    mockAxios.put.mockResolvedValueOnce({ data: { ok: 1 } } as any);
    const setRes = await setDoneColumn('b2', 'c9');
    expect(mockAxios.put).toHaveBeenCalledWith('/column/board/b2/isdoneColumn/c9');
    expect(setRes).toEqual({ ok: 1 });

    mockAxios.put.mockResolvedValueOnce({ data: { ok: 2 } } as any);
    const updRes = await updataIsDone('b3', 'c0');
    expect(mockAxios.put).toHaveBeenCalledWith('/column/board/b3/isdoneColumn/c0');
    expect(updRes).toEqual({ ok: 2 });
  });

  test('getDoneColumn: extracts done column from response data', async () => {
    // Case 1: res.data.data array exists
    mockAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 'a', isDone: false }, { id: 'b', isDone: true }] } } as any);
    let res = await getDoneColumn('b4');
    expect(mockAxios.get).toHaveBeenCalledWith('/column/board/b4');
    expect(res).toEqual({ data: { id: 'b', isDone: true } });

    // Case 2: res.data array directly
    mockAxios.get.mockResolvedValueOnce({ data: [{ id: 'x', isDone: true }] } as any);
    res = await getDoneColumn('b5');
    expect(res).toEqual({ data: { id: 'x', isDone: true } });

    // Case 3: no data
    mockAxios.get.mockResolvedValueOnce({ data: null } as any);
    res = await getDoneColumn('b6');
    expect(res).toEqual({ data: undefined });
  });
});
