import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Timer from './Timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('displays initial time in mm:ss format', () => {
      render(<Timer seconds={90} running={false} />);
      expect(screen.getByText(/01:30/)).toBeInTheDocument();
    });

    it('displays single digit seconds with padding', () => {
      render(<Timer seconds={65} running={false} />);
      expect(screen.getByText(/01:05/)).toBeInTheDocument();
    });

    it('displays zero time correctly', () => {
      render(<Timer seconds={0} running={false} />);
      expect(screen.getByText(/00:00/)).toBeInTheDocument();
    });

    it('displays large time values correctly', () => {
      render(<Timer seconds={3600} running={false} />);
      expect(screen.getByText(/60:00/)).toBeInTheDocument();
    });

    it('includes timer emoji', () => {
      render(<Timer seconds={60} running={false} />);
      expect(screen.getByText(/⏱/)).toBeInTheDocument();
    });
  });

  describe('Countdown behavior', () => {
    it('counts down when running', async () => {
      render(<Timer seconds={5} />);

      expect(screen.getByText(/00:05/)).toBeInTheDocument();

      // Advance time and wait for update
      await vi.advanceTimersByTimeAsync(1200);

      await waitFor(() => {
        expect(screen.getByText(/00:04/)).toBeInTheDocument();
      });
    });

    it('does not count down when running is false', async () => {
      render(<Timer seconds={10} running={false} />);

      expect(screen.getByText(/00:10/)).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(2000);

      expect(screen.getByText(/00:10/)).toBeInTheDocument();
    });

    it('stops at zero', async () => {
      render(<Timer seconds={1} />);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(screen.getByText(/00:00/)).toBeInTheDocument();
      });
    });
  });

  describe('onFinish callback', () => {
    it('calls onFinish when timer reaches zero', async () => {
      const onFinish = vi.fn();
      render(<Timer seconds={1} onFinish={onFinish} />);

      await vi.advanceTimersByTimeAsync(1500);

      await waitFor(() => {
        expect(onFinish).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onFinish if timer does not reach zero', async () => {
      const onFinish = vi.fn();
      render(<Timer seconds={10} onFinish={onFinish} />);

      await vi.advanceTimersByTimeAsync(2000);

      expect(onFinish).not.toHaveBeenCalled();
    });
  });

  describe('Start/Stop behavior', () => {
    it('starts timer when running changes to true', async () => {
      const { rerender } = render(<Timer seconds={5} running={false} />);

      expect(screen.getByText(/00:05/)).toBeInTheDocument();

      rerender(<Timer seconds={5} running={true} />);

      await vi.advanceTimersByTimeAsync(1200);

      await waitFor(() => {
        expect(screen.getByText(/00:04/)).toBeInTheDocument();
      });
    });

    it('pauses timer when running changes to false', async () => {
      const { rerender } = render(<Timer seconds={10} running={true} />);

      await vi.advanceTimersByTimeAsync(2200);

      await waitFor(() => {
        expect(screen.getByText(/00:08/)).toBeInTheDocument();
      });

      rerender(<Timer seconds={10} running={false} />);

      await vi.advanceTimersByTimeAsync(2000);

      // Should still be at 8 seconds
      expect(screen.getByText(/00:08/)).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('clears interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      const { unmount } = render(<Timer seconds={60} />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('handles very short timers', async () => {
      const onFinish = vi.fn();
      render(<Timer seconds={0} onFinish={onFinish} />);

      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(onFinish).toHaveBeenCalled();
      });
    });

    it('defaults to running when prop not specified', async () => {
      render(<Timer seconds={5} />);

      await vi.advanceTimersByTimeAsync(1200);

      await waitFor(() => {
        expect(screen.getByText(/00:04/)).toBeInTheDocument();
      });
    });
  });
});
