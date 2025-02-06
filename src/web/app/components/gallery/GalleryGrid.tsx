import React, { useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual'; // @tanstack/react-virtual@3.0.0
import clsx from 'clsx'; // clsx@2.0.0
import ProfileCard from './ProfileCard';
import FilterControls from './FilterControls';
import { useProfiles } from '../../hooks/useProfiles';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useGalleryAnimation } from '../../hooks/useAnimation';
import { GALLERY_GRID_VARIANTS } from '../../constants/animations';
import type { Profile } from '../../types/profile.types';

interface GalleryGridProps {
  /** Optional additional CSS classes */
  className?: string;
  /** Optional initial filter state */
  initialFilters?: Record<string, any>;
  /** Optional callback for profile view tracking */
  onProfileView?: (profileId: string) => void;
}

/**
 * Main container component for the LinkedIn Profiles Gallery.
 * Implements virtualized scrolling, real-time animations, and accessibility features.
 */
const GalleryGrid: React.FC<GalleryGridProps> = React.memo(({
  className,
  initialFilters = {},
  onProfileView
}) => {
  // Initialize profile data management with caching
  const {
    profiles,
    isLoading,
    error,
    containerRef,
    hasMore,
    refreshProfiles,
    isRefreshing,
    retryFetch
  } = useProfiles({
    filters: initialFilters,
    pageSize: 12,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes cache
  });

  // State for filter management
  const [currentFilters, setCurrentFilters] = useState(initialFilters);

  // Initialize gallery animations with stagger effect
  const { controls, variants } = useGalleryAnimation(0.05, 12);

  // Setup virtualization for performance
  const virtualizer = useVirtualizer({
    count: profiles.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 400, // Estimated height of profile card
    overscan: 5
  });

  /**
   * Handle filter changes with debouncing and optimistic updates
   */
  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    refreshProfiles();
  }, [refreshProfiles]);

  /**
   * Track profile views for analytics
   */
  const handleProfileView = useCallback((profileId: string) => {
    onProfileView?.(profileId);
  }, [onProfileView]);

  // Update document title for accessibility
  useEffect(() => {
    document.title = 'LinkedIn Profiles Gallery';
  }, []);

  // Generate responsive grid classes
  const gridClasses = clsx(
    'grid gap-4 md:gap-6 lg:gap-8',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'auto-rows-max',
    'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    className
  );

  return (
    <ErrorBoundary>
      <div className="w-full min-h-screen bg-background">
        {/* Filter controls section */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
          <FilterControls
            onFilterChange={handleFilterChange}
            currentFilters={currentFilters}
            isLoading={isLoading}
            error={error}
            onReset={refreshProfiles}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          />
        </div>

        {/* Main grid container */}
        <div
          ref={containerRef}
          className="relative w-full"
          role="feed"
          aria-busy={isLoading}
          aria-live="polite"
        >
          {/* Loading state */}
          {isLoading && !profiles.length && (
            <div className="w-full py-20 text-center">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-80 bg-muted rounded-lg mx-auto max-w-sm"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !profiles.length && (
            <div className="w-full py-20 text-center">
              <div className="max-w-md mx-auto px-4">
                <h2 className="text-lg font-semibold text-error mb-2">
                  Unable to load profiles
                </h2>
                <p className="text-muted-foreground mb-4">{error.message}</p>
                <button
                  onClick={retryFetch}
                  className="btn-primary"
                  aria-label="Retry loading profiles"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Virtualized grid */}
          {profiles.length > 0 && (
            <div className={gridClasses}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const profile = profiles[virtualItem.index];
                if (!profile) return null;

                return (
                  <div
                    key={profile.id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                      willChange: 'transform',
                      contain: 'content'
                    }}
                  >
                    <ProfileCard
                      profile={profile}
                      onClick={() => handleProfileView(profile.id)}
                      className="h-full"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && profiles.length === 0 && (
            <div className="w-full py-20 text-center">
              <p className="text-muted-foreground">
                No profiles found matching your criteria
              </p>
            </div>
          )}

          {/* Loading more indicator */}
          {hasMore && (
            <div className="w-full py-8 text-center">
              <div
                className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"
                role="status"
                aria-label="Loading more profiles"
              />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
});

GalleryGrid.displayName = 'GalleryGrid';

export default GalleryGrid;