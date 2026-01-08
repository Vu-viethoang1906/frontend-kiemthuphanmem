interface BoardCacheItem {
  data: any[];
  pagination?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
  timestamp: number;
  params: string;
}

interface CacheConfig {
  maxAge: number;
  maxSize: number;
}

const CACHE_CONFIG: CacheConfig = {
  maxAge: 5 * 60 * 1000,
  maxSize: 50,
};

const CACHE_KEY_PREFIX = 'board_cache_';
const CACHE_META_KEY = 'board_cache_meta';

class BoardCache {
  private memoryCache: Map<string, BoardCacheItem> = new Map();
  private cacheConfig: CacheConfig = CACHE_CONFIG;

  constructor() {
    this.loadFromStorage();
  }

  private getCacheKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${CACHE_KEY_PREFIX}${sortedParams}`;
  }

  private isExpired(item: BoardCacheItem): boolean {
    return Date.now() - item.timestamp > this.cacheConfig.maxAge;
  }

  private loadFromStorage(): void {
    try {
      const meta = localStorage.getItem(CACHE_META_KEY);
      if (!meta) return;

      const keys = JSON.parse(meta);
      keys.forEach((key: string) => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const item: BoardCacheItem = JSON.parse(cached);
          if (!this.isExpired(item)) {
            this.memoryCache.set(key, item);
          } else {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
      this.clear();
    }
  }

  private saveToStorage(key: string, item: BoardCacheItem): void {
    try {
      localStorage.setItem(key, JSON.stringify(item));

      const meta = localStorage.getItem(CACHE_META_KEY);
      const keys = meta ? JSON.parse(meta) : [];
      if (!keys.includes(key)) {
        keys.push(key);
        if (keys.length > this.cacheConfig.maxSize) {
          const oldestKey = keys.shift();
          if (oldestKey) {
            localStorage.removeItem(oldestKey);
          }
        }
        localStorage.setItem(CACHE_META_KEY, JSON.stringify(keys));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clear();
        console.warn('Storage quota exceeded, cache cleared');
      } else {
        console.error('Failed to save cache to storage:', error);
      }
    }
  }

  get(params: Record<string, any>): BoardCacheItem | null {
    const key = this.getCacheKey(params);
    const cached = this.memoryCache.get(key);

    if (!cached) {
      return null;
    }

    if (this.isExpired(cached)) {
      this.memoryCache.delete(key);
      localStorage.removeItem(key);
      return null;
    }

    return cached;
  }

  set(params: Record<string, any>, data: any[], pagination?: any): void {
    const key = this.getCacheKey(params);
    const item: BoardCacheItem = {
      data,
      pagination,
      timestamp: Date.now(),
      params: key,
    };

    this.memoryCache.set(key, item);
    this.saveToStorage(key, item);
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      const keysToDelete: string[] = [];
      this.memoryCache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => {
        this.memoryCache.delete(key);
        localStorage.removeItem(key);
      });
    } else {
      this.clear();
    }
  }

  clear(): void {
    this.memoryCache.clear();
    try {
      const meta = localStorage.getItem(CACHE_META_KEY);
      if (meta) {
        const keys = JSON.parse(meta);
        keys.forEach((key: string) => {
          localStorage.removeItem(key);
        });
      }
      localStorage.removeItem(CACHE_META_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    };
  }
}

export const boardCache = new BoardCache();

export const invalidateBoardCache = (boardId?: string) => {
  if (boardId) {
    // Invalidate only cache entries that contain the boardId pattern
    boardCache.invalidate(boardId);
  } else {
    // Clear entire cache
    boardCache.clear();
  }
};
