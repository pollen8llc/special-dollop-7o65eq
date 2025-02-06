import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // @testing-library/react@13.x
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest'; // vitest@0.34.x
import { useNavigate } from '@remix-run/react'; // @remix-run/react@1.19.x
import { AnimatePresence, motion } from 'framer-motion'; // framer-motion@10.x
import { axe } from '@axe-core/react'; // @axe-core/react@4.x
import ProfileCard from '../../app/components/gallery/ProfileCard';
import type { Profile } from '../../app/types/profile.types';

// Mock dependencies
vi.mock('@remix-run/react', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('ProfileCard Component', () => {
  // Mock navigation function
  const mockNavigate = vi.fn();

  // Mock profile data
  const mockProfile: Profile = {
    id: 'test-profile-123',
    userId: 'user-123',
    headline: 'Senior Software Engineer',
    bio: 'Passionate about web development',
    avatarUrl: 'https://example.com/avatar.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/test',
      github: 'https://github.com/test',
      website: 'https://test.com'
    },
    experiences: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    // Set viewport size for responsive tests
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile card with correct data and styling', async () => {
    const { container } = render(<ProfileCard profile={mockProfile} />);

    // Verify avatar rendering
    const avatar = screen.getByRole('img', { name: /Senior Software Engineer/i });
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', mockProfile.avatarUrl);

    // Verify headline rendering
    const headline = screen.getByRole('heading', { level: 3 });
    expect(headline).toHaveTextContent(mockProfile.headline);

    // Verify social indicators
    const socialIndicators = screen.getByLabelText('Social media links');
    expect(socialIndicators).toBeInTheDocument();
    expect(within(socialIndicators).getAllByRole('generic')).toHaveLength(3);

    // Verify base styling
    expect(container.firstChild).toHaveClass(
      'w-full',
      'max-w-sm',
      'rounded-lg',
      'overflow-hidden'
    );

    // Run accessibility audit
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('handles animation states correctly', async () => {
    render(<ProfileCard profile={mockProfile} />);
    const card = screen.getByRole('button');

    // Test hover animation
    fireEvent.mouseEnter(card);
    await waitFor(() => {
      expect(card).toHaveStyle({
        transform: expect.stringContaining('scale(1.05)'),
        transition: expect.stringContaining('transform')
      });
    });

    // Test exit animation
    fireEvent.mouseLeave(card);
    await waitFor(() => {
      expect(card).toHaveStyle({
        transform: 'none',
      });
    });
  });

  it('implements keyboard navigation correctly', async () => {
    render(<ProfileCard profile={mockProfile} />);
    const card = screen.getByRole('button');

    // Test keyboard focus
    fireEvent.focus(card);
    expect(card).toHaveClass('focus-within:ring-2');

    // Test Enter key navigation
    fireEvent.keyPress(card, { key: 'Enter', code: 13, charCode: 13 });
    expect(mockNavigate).toHaveBeenCalledWith(`/profiles/${mockProfile.id}`);
  });

  it('handles error states and fallbacks gracefully', () => {
    const profileWithoutAvatar = { ...mockProfile, avatarUrl: null };
    render(<ProfileCard profile={profileWithoutAvatar} />);

    // Verify fallback avatar
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('alt', profileWithoutAvatar.headline);
    expect(avatar).toHaveClass('ring-4');
  });

  it('manages touch interactions on mobile devices', async () => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });

    render(<ProfileCard profile={mockProfile} />);
    const card = screen.getByRole('button');

    // Test touch events
    fireEvent.touchStart(card);
    await waitFor(() => {
      expect(card).toHaveStyle({
        transform: expect.stringContaining('scale(1.05)'),
      });
    });

    fireEvent.touchEnd(card);
    await waitFor(() => {
      expect(card).toHaveStyle({
        transform: 'none',
      });
    });
  });

  it('handles navigation correctly', () => {
    render(<ProfileCard profile={mockProfile} />);
    const card = screen.getByRole('button');

    // Test click navigation
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith(`/profiles/${mockProfile.id}`);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('maintains responsive layout across breakpoints', () => {
    const { rerender } = render(<ProfileCard profile={mockProfile} />);

    // Test desktop layout
    expect(screen.getByRole('button')).toHaveClass('max-w-sm');

    // Test tablet layout
    Object.defineProperty(window, 'innerWidth', { value: 768 });
    fireEvent(window, new Event('resize'));
    rerender(<ProfileCard profile={mockProfile} />);
    expect(screen.getByRole('button')).toHaveClass('max-w-sm');

    // Test mobile layout
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    fireEvent(window, new Event('resize'));
    rerender(<ProfileCard profile={mockProfile} />);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('applies dark mode styles correctly', () => {
    render(<ProfileCard profile={mockProfile} />);
    const card = screen.getByRole('button');

    // Test light mode
    expect(card).toHaveClass('bg-white');

    // Test dark mode
    document.documentElement.classList.add('dark');
    expect(card).toHaveClass('dark:bg-gray-800');
    document.documentElement.classList.remove('dark');
  });
});