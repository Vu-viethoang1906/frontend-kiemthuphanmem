import { boardCache, invalidateBoardCache } from '../../../utils/boardCache';

describe('boardCache', () => {
  beforeEach(() => {
    localStorage.clear();
    boardCache.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('set and get', () => {
    it('should cache and retrieve data', () => {
      const params = { boardId: '123', page: 1 };
      const data = [{ id: 1, name: 'Task 1' }];
      const pagination = { total: 10, pages: 2, page: 1, limit: 5 };

      boardCache.set(params, data, pagination);
      const cached = boardCache.get(params);

      expect(cached).not.toBeNull();
      expect(cached!.data).toEqual(data);
      expect(cached!.pagination).toEqual(pagination);
    });

    it('should return null for non-existent cache', () => {
      const result = boardCache.get({ boardId: 'nonexistent' });
      expect(result).toBeNull();
    });

    it('should generate consistent cache keys for same params', () => {
      const params1 = { boardId: '123', page: 1 };
      const params2 = { page: 1, boardId: '123' }; // Different order

      boardCache.set(params1, [{ id: 1 }]);
      const cached = boardCache.get(params2);

      expect(cached).not.toBeNull();
      expect(cached!.data).toEqual([{ id: 1 }]);
    });

    it('should store timestamp with cached item', () => {
      const params = { boardId: '123' };
      const now = Date.now();
      jest.setSystemTime(now);

      boardCache.set(params, [{ id: 1 }]);
      const cached = boardCache.get(params);

      expect(cached!.timestamp).toBe(now);
    });
  });

  describe('expiry', () => {
    it('should return null for expired cache', () => {
      const params = { boardId: '123' };
      boardCache.set(params, [{ id: 1 }]);

      // Fast-forward 6 minutes (default maxAge is 5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);

      const cached = boardCache.get(params);
      expect(cached).toBeNull();
    });

    it('should return cached data within expiry time', () => {
      const params = { boardId: '123' };
      boardCache.set(params, [{ id: 1 }]);

      // Fast-forward 4 minutes (still within 5-minute expiry)
      jest.advanceTimersByTime(4 * 60 * 1000);

      const cached = boardCache.get(params);
      expect(cached).not.toBeNull();
      expect(cached!.data).toEqual([{ id: 1 }]);
    });

    it('should remove expired items from localStorage on get', () => {
      const params = { boardId: '123' };
      boardCache.set(params, [{ id: 1 }]);

      const key = Object.keys(localStorage).find((k) => k.startsWith('board_cache_'));
      expect(localStorage.getItem(key!)).not.toBeNull();

      jest.advanceTimersByTime(6 * 60 * 1000);
      boardCache.get(params);

      expect(localStorage.getItem(key!)).toBeNull();
    });
  });

  describe('localStorage persistence', () => {
    it('should persist cache to localStorage', () => {
      const params = { boardId: '123' };
      const data = [{ id: 1 }];

      boardCache.set(params, data);

      const keys = Object.keys(localStorage).filter((k) => k.startsWith('board_cache_'));
      expect(keys.length).toBeGreaterThan(0);

      const stored = JSON.parse(localStorage.getItem(keys[0])!);
      expect(stored.data).toEqual(data);
    });

    it('should persist cache to localStorage', () => {
      const params = { boardId: '123' };
      const data = [{ id: 1 }];

      // Set cache which should persist to localStorage
      boardCache.set(params, data);

      // Verify it's in localStorage
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('board_cache_'));
      expect(keys.length).toBeGreaterThan(0);

      const storedData = localStorage.getItem(keys[0]);
      expect(storedData).not.toBeNull();

      const parsed = JSON.parse(storedData!);
      expect(parsed.data).toEqual(data);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should skip loading expired items from localStorage', () => {
      const params = { boardId: '123' };
      boardCache.set(params, [{ id: 1 }]);

      // Manually expire the item in localStorage
      const key = Object.keys(localStorage).find((k) => k.startsWith('board_cache_'))!;
      const item = JSON.parse(localStorage.getItem(key)!);
      item.timestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      localStorage.setItem(key, JSON.stringify(item));

      // Reload cache
      boardCache.clear();
      boardCache['loadFromStorage']();

      expect(boardCache.get(params)).toBeNull();
      expect(localStorage.getItem(key)).toBeNull();
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('board_cache_meta', 'invalid-json');

      // Should not throw
      boardCache['loadFromStorage']();
      expect(boardCache.getStats().size).toBe(0);
    });

    it('should clear cache on loadFromStorage error', () => {
      const params = { boardId: '123' };
      boardCache.set(params, [{ id: 1 }]);

      localStorage.setItem('board_cache_meta', 'invalid-json');
      boardCache['loadFromStorage']();

      expect(boardCache.getStats().size).toBe(0);
    });
  });

  describe('size limit', () => {
    it('should enforce max size limit', () => {
      // Add 51 items (maxSize is 50)
      for (let i = 0; i < 51; i++) {
        boardCache.set({ boardId: `board${i}` }, [{ id: i }]);
      }

      const meta = JSON.parse(localStorage.getItem('board_cache_meta')!);
      expect(meta.length).toBeLessThanOrEqual(50);
    });

    it('should remove oldest item when exceeding size limit', () => {
      boardCache.set({ boardId: '1' }, [{ id: 1 }]);
      const firstKey = Object.keys(localStorage).find((k) => k.includes('board1'));

      // Add 50 more items
      for (let i = 2; i <= 51; i++) {
        boardCache.set({ boardId: `${i}` }, [{ id: i }]);
      }

      expect(localStorage.getItem(firstKey!)).toBeNull();
    });
  });

  describe('quota exceeded error', () => {
    it('should clear cache on QuotaExceededError', () => {
      const params = { boardId: '123' };
      boardCache.set(params, [{ id: 1 }]);

      // Mock QuotaExceededError
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw error;
      });

      boardCache.set({ boardId: '456' }, [{ id: 2 }]);

      expect(boardCache.getStats().size).toBe(0);

      Storage.prototype.setItem = originalSetItem;
    });

    it('should log error on other storage errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Unknown storage error');
      });

      boardCache.set({ boardId: '123' }, [{ id: 1 }]);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save cache to storage:',
        expect.any(Error),
      );

      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('invalidate', () => {
    it('should invalidate cache by pattern', () => {
      boardCache.set({ boardId: '123', page: 1 }, [{ id: 1 }]);
      boardCache.set({ boardId: '456', page: 1 }, [{ id: 2 }]);
      boardCache.set({ columnId: '789' }, [{ id: 3 }]);

      boardCache.invalidate('boardId');

      expect(boardCache.get({ boardId: '123', page: 1 })).toBeNull();
      expect(boardCache.get({ boardId: '456', page: 1 })).toBeNull();
      expect(boardCache.get({ columnId: '789' })).not.toBeNull();
    });

    it('should clear all cache when no pattern provided', () => {
      boardCache.set({ boardId: '123' }, [{ id: 1 }]);
      boardCache.set({ boardId: '456' }, [{ id: 2 }]);

      boardCache.invalidate();

      expect(boardCache.getStats().size).toBe(0);
      expect(boardCache.get({ boardId: '123' })).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cache', () => {
      boardCache.set({ boardId: '123' }, [{ id: 1 }]);
      boardCache.set({ boardId: '456' }, [{ id: 2 }]);

      boardCache.clear();

      expect(boardCache.getStats().size).toBe(0);
      expect(localStorage.getItem('board_cache_meta')).toBeNull();
    });

    it('should remove all cache entries from localStorage', () => {
      boardCache.set({ boardId: '123' }, [{ id: 1 }]);
      boardCache.set({ boardId: '456' }, [{ id: 2 }]);

      const keysBefore = Object.keys(localStorage).filter((k) => k.startsWith('board_cache_'));
      expect(keysBefore.length).toBeGreaterThan(0);

      boardCache.clear();

      const keysAfter = Object.keys(localStorage).filter((k) => k.startsWith('board_cache_'));
      expect(keysAfter.length).toBe(0);
    });

    it('should handle clear errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      localStorage.setItem('board_cache_meta', 'invalid-json');
      boardCache.clear();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear cache:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      boardCache.set({ boardId: '123' }, [{ id: 1 }]);
      boardCache.set({ boardId: '456' }, [{ id: 2 }]);

      const stats = boardCache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys.length).toBe(2);
      expect(stats.keys.some((k) => k.includes('123'))).toBe(true);
      expect(stats.keys.some((k) => k.includes('456'))).toBe(true);
    });

    it('should return empty stats for cleared cache', () => {
      boardCache.clear();
      const stats = boardCache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('invalidateBoardCache', () => {
    it('should invalidate only matching cache when boardId provided', () => {
      boardCache.set({ boardId: '123' }, [{ id: 1 }]);
      boardCache.set({ boardId: '456' }, [{ id: 2 }]);

      invalidateBoardCache('123');

      expect(boardCache.getStats().size).toBe(1);
      expect(boardCache.getStats().keys.some((k) => k.includes('123'))).toBe(false);
      expect(boardCache.getStats().keys.some((k) => k.includes('456'))).toBe(true);
    });

    it('should clear all cache when no boardId provided', () => {
      boardCache.set({ boardId: '123' }, [{ id: 1 }]);
      invalidateBoardCache();

      expect(boardCache.getStats().size).toBe(0);
    });
  });
});
