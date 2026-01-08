import { boardCache, invalidateBoardCache } from '../../../utils/boardCache';

describe('boardCache', () => {
  beforeEach(() => {
    localStorage.clear();
    boardCache.clear();
  });

  afterEach(() => {
    localStorage.clear();
    boardCache.clear();
  });

  describe('get and set', () => {
    it('should return null for non-existent cache', () => {
      const result = boardCache.get({ page: 1 });
      expect(result).toBeNull();
    });

    it('should set and get cache data', () => {
      const params = { page: 1, limit: 10 };
      const data = [{ id: '1', title: 'Board 1' }];
      const pagination = { total: 10, pages: 1, page: 1, limit: 10 };

      boardCache.set(params, data, pagination);
      const result = boardCache.get(params);

      expect(result).not.toBeNull();
      expect(result?.data).toEqual(data);
      expect(result?.pagination).toEqual(pagination);
    });

    it('should handle different params as different cache keys', () => {
      const params1 = { page: 1 };
      const params2 = { page: 2 };
      const data1 = [{ id: '1' }];
      const data2 = [{ id: '2' }];

      boardCache.set(params1, data1);
      boardCache.set(params2, data2);

      expect(boardCache.get(params1)?.data).toEqual(data1);
      expect(boardCache.get(params2)?.data).toEqual(data2);
    });

    it('should handle params with different order as same key', () => {
      const params1 = { page: 1, limit: 10 };
      const params2 = { limit: 10, page: 1 };
      const data = [{ id: '1' }];

      boardCache.set(params1, data);
      const result = boardCache.get(params2);

      expect(result?.data).toEqual(data);
    });
  });

  describe('expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return null for expired cache', () => {
      const params = { page: 1 };
      const data = [{ id: '1' }];

      boardCache.set(params, data);

      jest.advanceTimersByTime(6 * 60 * 1000);

      const result = boardCache.get(params);
      expect(result).toBeNull();
    });

    it('should return data for non-expired cache', () => {
      const params = { page: 1 };
      const data = [{ id: '1' }];

      boardCache.set(params, data);

      jest.advanceTimersByTime(4 * 60 * 1000);

      const result = boardCache.get(params);
      expect(result?.data).toEqual(data);
    });
  });

  describe('invalidate', () => {
    it('should clear all cache when no pattern provided', () => {
      boardCache.set({ page: 1 }, [{ id: '1' }]);
      boardCache.set({ page: 2 }, [{ id: '2' }]);

      boardCache.invalidate();

      expect(boardCache.get({ page: 1 })).toBeNull();
      expect(boardCache.get({ page: 2 })).toBeNull();
    });

    it('should invalidate cache matching pattern', () => {
      boardCache.set({ page: 1, search: 'test' }, [{ id: '1' }]);
      boardCache.set({ page: 2, search: 'other' }, [{ id: '2' }]);

      boardCache.invalidate('test');

      expect(boardCache.get({ page: 1, search: 'test' })).toBeNull();
      expect(boardCache.get({ page: 2, search: 'other' })).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cache and storage', () => {
      boardCache.set({ page: 1 }, [{ id: '1' }]);
      boardCache.set({ page: 2 }, [{ id: '2' }]);

      boardCache.clear();

      expect(boardCache.get({ page: 1 })).toBeNull();
      expect(boardCache.get({ page: 2 })).toBeNull();
      expect(localStorage.getItem('board_cache_meta')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      boardCache.set({ page: 1 }, [{ id: '1' }]);
      boardCache.set({ page: 2 }, [{ id: '2' }]);

      const stats = boardCache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys.length).toBe(2);
    });
  });

  describe('localStorage integration', () => {
    it('should persist cache to localStorage', () => {
      const params = { page: 1 };
      const data = [{ id: '1' }];

      boardCache.set(params, data);

      const meta = localStorage.getItem('board_cache_meta');
      expect(meta).not.toBeNull();
    });

    it('should load cache from localStorage on initialization', () => {
      const params = { page: 1 };
      const data = [{ id: '1' }];

      boardCache.set(params, data);
      const key = 'board_cache_page=1';
      const item = localStorage.getItem(key);
      expect(item).not.toBeNull();
    });
  });

  describe('invalidateBoardCache', () => {
    it('should invalidate only matching cache when boardId provided', () => {
      // set two cache entries, one contains 'board1' in params
      boardCache.set({ page: 1, search: 'board1' }, [{ id: '1' }]);
      boardCache.set({ page: 2, search: 'other' }, [{ id: '2' }]);

      invalidateBoardCache('board1');

      expect(boardCache.get({ page: 1, search: 'board1' })).toBeNull();
      expect(boardCache.get({ page: 2, search: 'other' })).not.toBeNull();
    });

    it('should clear cache when no boardId provided', () => {
      boardCache.set({ page: 1 }, [{ id: '1' }]);

      invalidateBoardCache();

      expect(boardCache.get({ page: 1 })).toBeNull();
    });
  });
});
