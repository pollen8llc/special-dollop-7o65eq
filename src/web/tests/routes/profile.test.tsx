import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRemixStub, createRemixStubClient } from '@remix-run/testing';
import { axe } from '@axe-core/react';
import ProfileRoute, { loader, ErrorBoundary } from '../../app/routes/profile.$id';
import type { Profile } from '../../app/types/profile.types';
import { mockProfileData } from '../../cypress/fixtures/profiles';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: '7c4dfb24-0cb8-4774-8f73-7a147834ad0f' },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Test utilities
const mockProfile = mockProfileData[0];

const setupTests = () => {
  const RemixStub = createRemixStub([
    {
      path: '/profile/:id',
      Component: ProfileRoute,
      loader,
      ErrorBoundary,
    },
  ]);

  return render(<RemixStub initialEntries={[`/profile/${mockProfile.id}`]} />);
};

describe('ProfileRoute Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Data Display', () => {
    it('should render profile details correctly', async () => {
      setupTests();

      await waitFor(() => {
        expect(screen.getByText(mockProfile.headline)).toBeInTheDocument();
      });

      // Verify profile sections
      expect(screen.getByRole('img', { name: /profile image/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: mockProfile.headline })).toBeInTheDocument();
      expect(screen.getByText(mockProfile.bio || '')).toBeInTheDocument();

      // Verify social links
      if (mockProfile.socialLinks.linkedin) {
        expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
          'href',
          mockProfile.socialLinks.linkedin
        );
      }
    });

    it('should handle missing optional profile data gracefully', async () => {
      const incompleteProfile = { ...mockProfile, bio: null, avatarUrl: null };
      vi.mocked(loader).mockResolvedValueOnce({ profile: incompleteProfile });

      setupTests();

      await waitFor(() => {
        expect(screen.getByText(incompleteProfile.headline)).toBeInTheDocument();
      });

      // Verify fallback avatar is displayed
      const avatar = screen.getByRole('img', { name: /profile image/i });
      expect(avatar).toHaveAttribute('src', 'data:image/svg+xml,...'); // Default avatar
    });
  });

  describe('Experience Section', () => {
    it('should render experience list correctly', async () => {
      setupTests();

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /professional experience/i })).toBeInTheDocument();
      });

      // Verify each experience entry
      mockProfile.experiences.forEach((exp) => {
        expect(screen.getByText(exp.title)).toBeInTheDocument();
        expect(screen.getByText(exp.company)).toBeInTheDocument();
      });
    });

    it('should handle empty experience list', async () => {
      const profileWithNoExp = { ...mockProfile, experiences: [] };
      vi.mocked(loader).mockResolvedValueOnce({ profile: profileWithNoExp });

      setupTests();

      await waitFor(() => {
        expect(screen.getByText(/no experience listed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Features', () => {
    it('should handle favorite toggle correctly', async () => {
      setupTests();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /favorite/i })).toBeInTheDocument();
      });

      const favoriteButton = screen.getByRole('button', { name: /favorite/i });
      await user.click(favoriteButton);

      expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/favorited/i)).toBeInTheDocument();
    });

    it('should handle connect action correctly', async () => {
      setupTests();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
      });

      const connectButton = screen.getByRole('button', { name: /connect/i });
      await user.click(connectButton);

      expect(screen.getByText(/connection request sent/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = setupTests();

      await waitFor(() => {
        expect(screen.getByText(mockProfile.headline)).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it('should handle keyboard navigation correctly', async () => {
      setupTests();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /connect/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /favorite/i })).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should display error boundary on loader error', async () => {
      vi.mocked(loader).mockRejectedValueOnce(new Error('Failed to load profile'));

      setupTests();

      await waitFor(() => {
        expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      vi.mocked(loader).mockRejectedValueOnce(new Error('Network error'));

      setupTests();

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should adjust layout for mobile viewport', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      setupTests();

      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('flex-col');
      });
    });

    it('should adjust layout for desktop viewport', async () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      setupTests();

      await waitFor(() => {
        const header = screen.getByRole('banner');
        expect(header).toHaveClass('flex-row');
      });
    });
  });
});