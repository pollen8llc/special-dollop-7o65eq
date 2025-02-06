import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import { createRemixStub } from '@remix-run/testing';
import userEvent from '@testing-library/user-event';
import Gallery, { loader, ErrorBoundary } from '../../app/routes/gallery';
import ProfileGrid from '../../app/components/gallery/ProfileGrid';

// Mock intersection observer for infinite scroll testing
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockImplementation((callback) => ({
  observe: () => callback([{ isIntersecting: true }]),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
window.IntersectionObserver = mockIntersectionObserver;

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock profile data for testing
const mockProfiles = Array.from({ length: 12 }, (_, i) => ({
  id: `profile-${i}`,
  headline: `Test Profile ${i}`,
  avatarUrl: `https://example.com/avatar/${i}.jpg`,
  socialLinks: {
    linkedin: i % 2 === 0 ? 'https://linkedin.com/test' : null,
    github: i % 3 === 0 ? 'https://github.com/test' : null,
    website: i % 4 === 0 ? 'https://test.com' : null,
  },
}));

describe('Gallery Route', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock loader response
    vi.mock('../../app/routes/gallery', async () => {
      const actual = await vi.importActual('../../app/routes/gallery');
      return {
        ...actual,
        loader: vi.fn().mockResolvedValue({
          profiles: mockProfiles,
          metadata: { totalItems: mockProfiles.length },
        }),
      };
    });
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it('renders gallery page correctly', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/gallery',
        Component: Gallery,
      },
    ]);

    render(<RemixStub />);

    // Verify header content
    expect(screen.getByRole('heading', { name: /Profile Gallery/i })).toBeInTheDocument();
    expect(screen.getByText(/Professional Profiles Available/i)).toBeInTheDocument();

    // Verify filter controls
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText(/headline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();

    // Verify profile grid
    const grid = await screen.findByTestId('profile-gallery-grid');
    expect(grid).toBeInTheDocument();
    expect(within(grid).getAllByRole('article')).toHaveLength(mockProfiles.length);
  });

  it('handles filter changes', async () => {
    const user = userEvent.setup();
    const RemixStub = createRemixStub([
      {
        path: '/gallery',
        Component: Gallery,
      },
    ]);

    render(<RemixStub />);

    // Input filter values
    const headlineFilter = screen.getByLabelText(/headline/i);
    await user.type(headlineFilter, 'Software Engineer');

    // Wait for debounced filter application
    await waitFor(() => {
      expect(loader).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            url: expect.stringContaining('headline=Software+Engineer'),
          }),
        })
      );
    });

    // Verify loading state during filter application
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Verify filter reset functionality
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);
    expect(headlineFilter).toHaveValue('');
  });

  it('implements infinite scrolling', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/gallery',
        Component: Gallery,
      },
    ]);

    render(<RemixStub />);

    // Verify initial profile load
    const grid = await screen.findByTestId('profile-gallery-grid');
    expect(within(grid).getAllByRole('article')).toHaveLength(mockProfiles.length);

    // Simulate scroll to trigger more profiles
    fireEvent.scroll(window, { target: { scrollY: 1000 } });

    // Verify loader called for next page
    await waitFor(() => {
      expect(loader).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            url: expect.stringContaining('page=2'),
          }),
        })
      );
    });
  });

  it('animates profile cards', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/gallery',
        Component: Gallery,
      },
    ]);

    render(<RemixStub />);

    // Verify initial animation classes
    const cards = await screen.findAllByRole('article');
    cards.forEach(card => {
      expect(card).toHaveClass('animate-fade-in');
    });

    // Verify hover animations
    await userEvent.hover(cards[0]);
    expect(cards[0]).toHaveClass('hover:scale-105');
  });

  it('handles errors gracefully', async () => {
    // Mock loader to throw error
    vi.mocked(loader).mockRejectedValueOnce(new Error('Failed to load profiles'));

    const RemixStub = createRemixStub([
      {
        path: '/gallery',
        Component: Gallery,
        ErrorBoundary,
      },
    ]);

    render(<RemixStub />);

    // Verify error message display
    expect(await screen.findByText(/Failed to load profiles/i)).toBeInTheDocument();

    // Verify retry functionality
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await userEvent.click(retryButton);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('maintains accessibility compliance', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/gallery',
        Component: Gallery,
      },
    ]);

    const { container } = render(<RemixStub />);

    // Verify ARIA landmarks
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();

    // Verify focus management
    const headlineFilter = screen.getByLabelText(/headline/i);
    await userEvent.tab();
    expect(headlineFilter).toHaveFocus();

    // Verify keyboard navigation
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Run accessibility audit
    expect(await axe(container)).toHaveNoViolations();
  });
});