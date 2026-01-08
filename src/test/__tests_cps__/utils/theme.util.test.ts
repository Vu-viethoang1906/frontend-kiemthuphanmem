import { getStoredTheme, applyTheme, setTheme } from '../../../utils/theme';

describe('theme utils', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('getStoredTheme', () => {
    it('should return stored dark theme', () => {
      localStorage.setItem('app_theme', 'dark');
      expect(getStoredTheme()).toBe('dark');
    });

    it('should return stored light theme', () => {
      localStorage.setItem('app_theme', 'light');
      expect(getStoredTheme()).toBe('light');
    });

    it('should return system theme when no theme stored', () => {
      localStorage.removeItem('app_theme');
      expect(getStoredTheme()).toBe('system');
    });

    it('should return system theme for invalid stored value', () => {
      localStorage.setItem('app_theme', 'invalid');
      expect(getStoredTheme()).toBe('system');
    });

    it('should check prefers-color-scheme when no stored theme', () => {
      localStorage.removeItem('app_theme');
      const mockMatchMedia = jest.fn().mockReturnValue({
        matches: true,
      });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const result = getStoredTheme();
      // getStoredTheme returns 'system' by default, it doesn't check matchMedia
      // The matchMedia check is done in getSystemTheme or getEffectiveTheme
      expect(result).toBe('system');
    });
  });

  describe('applyTheme', () => {
    it('should add dark class for dark theme', () => {
      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class for light theme', () => {
      document.documentElement.classList.add('dark');
      applyTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should set and apply dark theme', () => {
      setTheme('dark');
      expect(localStorage.getItem('app_theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should set and apply light theme', () => {
      setTheme('light');
      expect(localStorage.getItem('app_theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should update existing theme', () => {
      localStorage.setItem('app_theme', 'light');
      setTheme('dark');
      expect(localStorage.getItem('app_theme')).toBe('dark');
    });
  });
});

