import React from 'react'; // react@18.0.0
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // @testing-library/react@14.0.0
import { vi, describe, it, expect, beforeEach } from 'vitest'; // vitest@0.34.0
import { AnimatePresence, motion } from 'framer-motion'; // framer-motion@10.0.0
import axe from '@axe-core/react'; // @axe-core/react@4.7.0

import ProfileDetail from '../../app/components/profile/ProfileDetail';
import type { Profile } from '../../app/types/profile.types';
import { useAuth } from '../../app/hooks/useAuth';
import { useTheme } from '../../app/hooks/useTheme';

// Mock dependencies
vi.mock('../../app/hooks/useAuth');
vi.mock('../../app/hooks/useTheme');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock profile data
const mockProfile: Profile = {
  id: '123',
  userId: 'user123',
  headline: 'Senior Software Engineer',
  bio: 'Experienced developer with focus on React',
  avatarUrl: 'https://example.com/avatar.jpg',
  socialLinks: {
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.com',
  },
  experiences: [
    {
      id: 'exp1',
      profileId: '123',
      title: 'Senior Developer',
      company: 'Tech Corp',
      startDate: new Date('2020-01-01'),
      endDate: null,
      description: 'Leading frontend development',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper function to render ProfileDetail with necessary providers
const renderProfileDetail = (profile: Profile, options = {}) => {
  const mockAuth = {
    isAuthenticated: true,
    user: { id: 'user123' },
  };
  const mockTheme = {
    theme: 'light',
    toggleTheme: vi.fn(),
  };

  (useAuth as jest.Mock).mockReturnValue(mockAuth);
  (useTheme as jest.Mock).mockReturnValue(mockTheme);

  return render(
    <AnimatePresence>
      <ProfileDetail profile={profile} {...options} />
    </AnimatePresence>
  );
};

// Helper function for responsive testing
const setupResponsiveTest = (viewportWidth: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewportWidth,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('ProfileDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Display', () => {
    it('renders profile header with correct data', () => {
      renderProfileDetail(mockProfile);
      
      expect(screen.getByText(mockProfile.headline)).toBeInTheDocument();
      expect(screen.getByAltText(/profile image/i)).toHaveAttribute('src', mockProfile.avatarUrl);
      expect(screen.getByText(/senior software engineer/i)).toBeInTheDocument();
    });

    it('displays experience list in chronological order', () => {
      renderProfileDetail(mockProfile);
      
      const experiences = screen.getAllByRole('article');
      expect(experiences).toHaveLength(mockProfile.experiences.length);
      expect(experiences[0]).toHaveTextContent('Senior Developer');
      expect(experiences[0]).toHaveTextContent('Tech Corp');
    });

    it('shows appropriate loading states', async () => {
      const { rerender } = renderProfileDetail({ ...mockProfile, experiences: [] });
      
      expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true');
      
      rerender(<ProfileDetail profile={mockProfile} />);
      await waitFor(() => {
        expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'false');
      });
    });

    it('handles error states gracefully', () => {
      const errorProfile = { ...mockProfile, experiences: null };
      renderProfileDetail(errorProfile as unknown as Profile);
      
      expect(screen.getByText(/error loading experiences/i)).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('applies entry animations correctly', async () => {
      renderProfileDetail(mockProfile);
      
      const container = screen.getByRole('article');
      expect(container).toHaveStyle('opacity: 0');
      
      await waitFor(() => {
        expect(container).toHaveStyle('opacity: 1');
      });
    });

    it('handles hover animations smoothly', async () => {
      renderProfileDetail(mockProfile);
      
      const container = screen.getByRole('article');
      fireEvent.mouseEnter(container);
      
      await waitFor(() => {
        expect(container).toHaveStyle('transform: scale(1.05)');
      });
    });
  });

  describe('Interactions', () => {
    it('handles edit mode toggle correctly', async () => {
      renderProfileDetail(mockProfile);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });
    });

    it('validates form inputs properly', async () => {
      renderProfileDetail(mockProfile);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);
      
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile viewport', () => {
      setupResponsiveTest(375);
      renderProfileDetail(mockProfile);
      
      const container = screen.getByRole('article');
      expect(container).toHaveClass('md:flex-row');
    });

    it('optimizes display for desktop viewport', () => {
      setupResponsiveTest(1024);
      renderProfileDetail(mockProfile);
      
      const container = screen.getByRole('article');
      expect(container).toHaveClass('flex-row');
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 Level AA requirements', async () => {
      const { container } = renderProfileDetail(mockProfile);
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', () => {
      renderProfileDetail(mockProfile);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      editButton.focus();
      
      expect(document.activeElement).toBe(editButton);
    });

    it('provides appropriate ARIA labels', () => {
      renderProfileDetail(mockProfile);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', expect.stringContaining(mockProfile.headline));
    });
  });

  describe('Theme Support', () => {
    it('applies light theme correctly', () => {
      (useTheme as jest.Mock).mockReturnValue({ theme: 'light' });
      renderProfileDetail(mockProfile);
      
      const container = screen.getByRole('article');
      expect(container).toHaveClass('bg-white');
    });

    it('applies dark theme correctly', () => {
      (useTheme as jest.Mock).mockReturnValue({ theme: 'dark' });
      renderProfileDetail(mockProfile);
      
      const container = screen.getByRole('article');
      expect(container).toHaveClass('dark:bg-gray-800');
    });
  });
});