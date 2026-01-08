import {
  getSystemTheme,
  getEffectiveTheme,
  getStoredTheme,
  applyTheme,
  setTheme,
  watchSystemTheme,
  AppTheme,
} from '../../../utils/theme';

describe('theme utils', () => {
  let originalMatchMedia: any;
  let mockMatchMedia: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    
    originalMatchMedia = window.matchMedia;
    mockMatchMedia = jest.fn();
    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('getSystemTheme', () => {
    it('should return dark when system prefers dark mode', () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = getSystemTheme();

      expect(result).toBe('dark');
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should return light when system prefers light mode', () => {
      mockMatchMedia.mockReturnValue({ matches: false });

      const result = getSystemTheme();

      expect(result).toBe('light');
    });

    it('should return light when matchMedia is not available', () => {
      window.matchMedia = undefined as any;

      const result = getSystemTheme();

      expect(result).toBe('light');
    });
  });

  describe('getStoredTheme', () => {
    it('should return stored theme from localStorage', () => {
      localStorage.setItem('app_theme', 'dark');

      const result = getStoredTheme();

      expect(result).toBe('dark');
    });

    it('should return system as default when no theme stored', () => {
      const result = getStoredTheme();

      expect(result).toBe('system');
    });

    it('should return system when invalid theme is stored', () => {
      localStorage.setItem('app_theme', 'invalid');

      const result = getStoredTheme();

      expect(result).toBe('system');
    });

    it('should handle light theme', () => {
      localStorage.setItem('app_theme', 'light');

      const result = getStoredTheme();

      expect(result).toBe('light');
    });
  });

  describe('getEffectiveTheme', () => {
    it('should return dark when stored theme is dark', () => {
      localStorage.setItem('app_theme', 'dark');

      const result = getEffectiveTheme();

      expect(result).toBe('dark');
    });

    it('should return light when stored theme is light', () => {
      localStorage.setItem('app_theme', 'light');

      const result = getEffectiveTheme();

      expect(result).toBe('light');
    });

    it('should resolve system theme to actual theme', () => {
      localStorage.setItem('app_theme', 'system');
      mockMatchMedia.mockReturnValue({ matches: true });

      const result = getEffectiveTheme();

      expect(result).toBe('dark');
    });
  });

  describe('applyTheme', () => {
    it('should add dark class when theme is dark', () => {
      applyTheme('dark');

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when theme is light', () => {
      document.documentElement.classList.add('dark');

      applyTheme('light');

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should resolve system theme and apply it', () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      applyTheme('system');

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('setTheme', () => {
    it('should store theme in localStorage and apply it', () => {
      setTheme('dark');

      expect(localStorage.getItem('app_theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should handle light theme', () => {
      setTheme('light');

      expect(localStorage.getItem('app_theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should handle system theme', () => {
      mockMatchMedia.mockReturnValue({ matches: false });

      setTheme('system');

      expect(localStorage.getItem('app_theme')).toBe('system');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('watchSystemTheme', () => {
    it('should listen to system theme changes with modern API', () => {
      const callback = jest.fn();
      const mockAddEventListener = jest.fn();
      const mockRemoveEventListener = jest.fn();
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const cleanup = watchSystemTheme(callback);

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      // Simulate system theme change
      const handler = mockAddEventListener.mock.calls[0][1];
      handler({ matches: true });

      expect(callback).toHaveBeenCalledWith('dark');

      cleanup();
      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', handler);
    });

    it('should use fallback addListener for older browsers', () => {
      const callback = jest.fn();
      const mockAddListener = jest.fn();
      const mockRemoveListener = jest.fn();
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      });

      const cleanup = watchSystemTheme(callback);

      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));

      cleanup();
      expect(mockRemoveListener).toHaveBeenCalled();
    });

    it('should call callback with light when system changes to light', () => {
      const callback = jest.fn();
      const mockAddEventListener = jest.fn();
      
      mockMatchMedia.mockReturnValue({
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn(),
      });

      watchSystemTheme(callback);

      const handler = mockAddEventListener.mock.calls[0][1];
      handler({ matches: false });

      expect(callback).toHaveBeenCalledWith('light');
    });

    it('should return no-op cleanup when window is undefined', () => {
      const originalWindow = globalThis.window;
      const originalMatchMedia = globalThis.window.matchMedia;
      
      delete (globalThis as any).window;

      const callback = jest.fn();
      const cleanup = watchSystemTheme(callback);

      expect(cleanup).toBeDefined();
      cleanup(); // Should not throw

      (globalThis as any).window = originalWindow;
      globalThis.window.matchMedia = originalMatchMedia;
    });
  });

  describe('SSR scenarios', () => {
    it('getSystemTheme should return light when globalThis is undefined', () => {
      const originalGlobalThis = global.globalThis;
      (global as any).globalThis = undefined;

      const result = getSystemTheme();
      expect(result).toBe('light');

      (global as any).globalThis = originalGlobalThis;
    });

    it('getStoredTheme should return system when window is undefined', () => {
      const originalWindow = globalThis.window;
      (globalThis as any).window = undefined;

      const result = getStoredTheme();
      expect(result).toBe('system');

      (globalThis as any).window = originalWindow;
    });

    it('applyTheme should not throw when document is undefined', () => {
      const originalDocument = globalThis.document;
      (globalThis as any).document = undefined;

      expect(() => applyTheme('dark')).not.toThrow();

      (globalThis as any).document = originalDocument;
    });

    it('setTheme should not throw when window is undefined', () => {
      const originalWindow = globalThis.window;
      (globalThis as any).window = undefined;

      expect(() => setTheme('dark')).not.toThrow();

      (globalThis as any).window = originalWindow;
    });
  });
});
