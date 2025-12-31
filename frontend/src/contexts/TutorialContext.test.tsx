import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TutorialProvider, useTutorial } from './TutorialContext';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// Mock the Tutorial component
vi.mock('../components/Tutorial', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="tutorial">
      Tutorial Component
      <button onClick={onComplete}>Complete Tutorial</button>
    </div>
  ),
}));

// Test component that uses the tutorial context
function TestConsumer() {
  const { isVisible, showTutorial, hideTutorial } = useTutorial();
  return (
    <div>
      <span data-testid="visible">{isVisible ? 'visible' : 'hidden'}</span>
      <button onClick={showTutorial}>Show</button>
      <button onClick={hideTutorial}>Hide</button>
    </div>
  );
}

function renderWithRouter(
  ui: React.ReactElement,
  { route = '/' }: { route?: string } = {}
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

describe('TutorialContext', () => {
  let apiMock: typeof import('../lib/api').api;

  beforeEach(async () => {
    vi.clearAllMocks();
    const apiModule = await import('../lib/api');
    apiMock = apiModule.api;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial tutorial check', () => {
    it('shows tutorial when not completed on protected route', async () => {
      (apiMock.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { completed: false },
      });

      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/dashboard' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('visible')).toHaveTextContent('visible');
      });
    });

    it('hides tutorial when already completed', async () => {
      (apiMock.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { completed: true },
      });

      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/dashboard' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('visible')).toHaveTextContent('hidden');
      });
    });

    it('skips API check on public pages', async () => {
      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/login' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('visible')).toHaveTextContent('hidden');
      });

      expect(apiMock.get).not.toHaveBeenCalled();
    });

    it('handles API error gracefully', async () => {
      (apiMock.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/dashboard' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('visible')).toHaveTextContent('hidden');
      });
    });
  });

  describe('Public page detection', () => {
    const publicPaths = ['/login', '/signup', '/auth/verify-email', '/landing', '/'];

    publicPaths.forEach((path) => {
      it(`skips tutorial check on ${path}`, async () => {
        renderWithRouter(
          <TutorialProvider>
            <TestConsumer />
          </TutorialProvider>,
          { route: path }
        );

        await waitFor(() => {
          expect(screen.getByTestId('visible')).toBeInTheDocument();
        });

        expect(apiMock.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('Manual tutorial control', () => {
    it('showTutorial makes tutorial visible', async () => {
      (apiMock.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { completed: true },
      });
      const user = userEvent.setup();

      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/dashboard' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('visible')).toHaveTextContent('hidden');
      });

      await user.click(screen.getByText('Show'));

      expect(screen.getByTestId('visible')).toHaveTextContent('visible');
    });

    it('hideTutorial hides the tutorial', async () => {
      (apiMock.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { completed: false },
      });
      const user = userEvent.setup();

      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/dashboard' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('visible')).toHaveTextContent('visible');
      });

      await user.click(screen.getByText('Hide'));

      expect(screen.getByTestId('visible')).toHaveTextContent('hidden');
    });
  });

  describe('Tutorial component rendering', () => {
    it('renders Tutorial component when visible', async () => {
      (apiMock.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { completed: false },
      });

      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/dashboard' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('tutorial')).toBeInTheDocument();
      });
    });

    it('hides tutorial when onComplete is called', async () => {
      (apiMock.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { completed: false },
      });
      const user = userEvent.setup();

      renderWithRouter(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>,
        { route: '/dashboard' }
      );

      await waitFor(() => {
        expect(screen.getByTestId('tutorial')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Tutorial'));

      await waitFor(() => {
        expect(screen.queryByTestId('tutorial')).not.toBeInTheDocument();
      });
    });
  });

  describe('useTutorial hook', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useTutorial must be used within a TutorialProvider');

      consoleSpy.mockRestore();
    });
  });
});
