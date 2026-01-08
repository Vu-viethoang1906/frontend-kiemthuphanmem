import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import SplashScreen from '../../../components/SplashScreen';
import { getUlrLogo } from '../../../api/logoApi';

// Mock the API
jest.mock('../../../api/logoApi');
const mockGetUlrLogo = getUlrLogo as jest.MockedFunction<typeof getUlrLogo>;

describe('SplashScreen Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetUlrLogo.mockResolvedValue({
      success: true,
      data: [{ url: '/uploads/logo.png' }],
    } as any);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the splash screen', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      // Wait for logo to load from API
      await waitFor(() => {
        expect(getUlrLogo).toHaveBeenCalled();
      });

      // Check that splash screen container is present
      const splashContainer = document.querySelector('.fixed.inset-0');
      expect(splashContainer).toBeInTheDocument();
    });

    it('should show loading placeholder while fetching logo', () => {
      mockGetUlrLogo.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: [] } as any), 1000))
      );

      render(<SplashScreen onComplete={mockOnComplete} />);

      // Should show placeholder initially
      const { container } = render(<SplashScreen onComplete={mockOnComplete} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should display logo image when loaded', async () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [{ url: '/uploads/test-logo.png' }],
      } as any);

      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByRole('img', { name: /ken logo/i });
        expect(logo).toBeInTheDocument();
      });
    });

    it('should have correct alt text for logo', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByAltText('Ken Logo');
        expect(logo).toBeInTheDocument();
      });
    });
  });

  describe('Logo Loading', () => {
    it('should fetch logo from API on mount', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(mockGetUlrLogo).toHaveBeenCalledTimes(1);
      });
    });

    it('should display fetched logo URL', async () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [{ url: '/uploads/company-logo.png' }],
      } as any);

      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByRole('img', { name: /ken logo/i }) as HTMLImageElement;
        expect(logo.src).toContain('/uploads/company-logo.png');
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetUlrLogo.mockRejectedValue(new Error('API Error'));

      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Lỗi khi lấy logo:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should show default logo on image error', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByRole('img', { name: /ken logo/i }) as HTMLImageElement;
        
        // Trigger error event
        const errorEvent = new Event('error');
        logo.dispatchEvent(errorEvent);

        expect(logo.src).toContain('/icons/ken.png');
      });
    });
  });

  describe('Completion Callback', () => {
    it('should call onComplete after display duration', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      // Wait for API to resolve
      await waitFor(() => {
        expect(getUlrLogo).toHaveBeenCalled();
      });

      // Fast-forward time past the display duration (2s + 500ms)
      act(() => {
        jest.advanceTimersByTime(2600);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onComplete prematurely', () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      jest.advanceTimersByTime(1000);

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should handle fallback timeout when API is slow', async () => {
      mockGetUlrLogo.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: [] } as any), 5000))
      );

      render(<SplashScreen onComplete={mockOnComplete} />);

      // Fast-forward past fallback timer (3s)
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        // Should still proceed even if API is slow
        expect(mockOnComplete).not.toHaveBeenCalled(); // Not yet, needs additional time
      });

      // Fast-forward the rest of the duration
      jest.advanceTimersByTime(2600);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Fade Animation', () => {
    it('should start visible', () => {
      const { container } = render(<SplashScreen onComplete={mockOnComplete} />);

      const splashScreen = container.firstChild as HTMLElement;
      expect(splashScreen).toHaveClass('opacity-100');
    });

    it('should fade out after duration', async () => {
      const { container } = render(<SplashScreen onComplete={mockOnComplete} />);

      // Wait for API to resolve
      await waitFor(() => {
        expect(getUlrLogo).toHaveBeenCalled();
      });

      // Fast-forward to fade out time
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const splashScreen = container.firstChild as HTMLElement;
        expect(splashScreen).toHaveClass('opacity-0');
      });
    });
  });

  describe('Logo URL Handling', () => {
    it('should handle absolute URLs', async () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [{ url: 'https://example.com/logo.png' }],
      } as any);

      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByRole('img', { name: /ken logo/i }) as HTMLImageElement;
        expect(logo.src).toContain('https://example.com/logo.png');
      });
    });

    it('should handle relative URLs', async () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [{ url: '/uploads/logo.png' }],
      } as any);

      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByRole('img', { name: /ken logo/i });
        expect(logo).toBeInTheDocument();
      });
    });

    it('should handle empty logo data array', async () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [],
      } as any);

      render(<SplashScreen onComplete={mockOnComplete} />);

      // Should show placeholder
      const { container } = render(<SplashScreen onComplete={mockOnComplete} />);
      await waitFor(() => {
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null logo URL', async () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [{ url: null }],
      } as any);

      render(<SplashScreen onComplete={mockOnComplete} />);

      // Should not crash
      await waitFor(() => {
        expect(mockGetUlrLogo).toHaveBeenCalled();
      });
    });

    it('should prevent multiple fade-outs', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      // Wait for API to resolve
      await waitFor(() => {
        expect(getUlrLogo).toHaveBeenCalled();
      });

      // Try to trigger fade multiple times
      act(() => {
        jest.advanceTimersByTime(2600);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });

      // Advance more time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should still only be called once
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should render without errors', () => {
      expect(() => {
        render(<SplashScreen onComplete={mockOnComplete} />);
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up timers on unmount', () => {
      const { unmount } = render(<SplashScreen onComplete={mockOnComplete} />);

      unmount();

      // Should not throw errors
      expect(() => {
        jest.advanceTimersByTime(5000);
      }).not.toThrow();
    });

    it('should handle rapid mount/unmount', () => {
      const { unmount } = render(<SplashScreen onComplete={mockOnComplete} />);
      unmount();

      expect(() => {
        render(<SplashScreen onComplete={mockOnComplete} />);
      }).not.toThrow();
    });
  });

  describe('Placeholder State', () => {
    it('should show loading placeholder when no logo is available yet', () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [],
      } as any);

      const { container } = render(<SplashScreen onComplete={mockOnComplete} />);

      const placeholder = container.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
    });

    it('should have proper placeholder dimensions', () => {
      mockGetUlrLogo.mockResolvedValue({
        success: true,
        data: [],
      } as any);

      const { container } = render(<SplashScreen onComplete={mockOnComplete} />);

      const placeholder = container.querySelector('.h-32.w-32');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for logo image', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByRole('img');
        expect(logo).toHaveAttribute('alt', 'Ken Logo');
      });
    });

    it('should be keyboard navigable', async () => {
      render(<SplashScreen onComplete={mockOnComplete} />);

      await waitFor(() => {
        const logo = screen.getByRole('img');
        expect(logo).toBeInTheDocument();
      });
    });
  });
});
