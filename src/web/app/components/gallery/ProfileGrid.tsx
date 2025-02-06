import React, { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion'; // framer-motion@10.x
import clsx from 'clsx'; // clsx@2.0.x
import { useInView } from 'react-intersection-observer'; // react-intersection-observer@9.0.0
import VirtualScroller from 'react-virtual-scroller'; // react-virtual-scroller@2.0.0

import ProfileCard from './ProfileCard';
import { useProfiles } from '../../hooks/useProfiles';
import ErrorBoundary from '../common/ErrorBoundary';
import { useGalleryAnimation } from '../../hooks/useAnimation';
import { GALLERY_GRID_VARIANTS } from '../../constants/animations';
import type { Profile } from '../../types/profile.types';
import type { ErrorResponse } from '../../types/common.types';

interface ProfileGridProps {
  /** Optional filters for profile data querying */
  filters?: Record<string, any>;
  /** Optional additional CSS classes */
  className?: string;
  /** Number of items to load per page */
  itemsPerPage?: number;
  /** Optional error callback handler */
  onError?: (error: Error) => void;
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * A production-ready grid component that displays profile cards with
 * virtualization, infinite scrolling, and optimized performance.
 */
const ProfileGrid: React.FC<ProfileGridProps> = React.memo(({
  filters = {},
  className = '',
  itemsPerPage = 12,
  onError,
  testId = 'profile-grid'
}) => {
  // Initialize profile data management with caching
  const {
    profiles,
    isLoading,
    error,
    containerRef,
    hasMore,
    refreshProfiles,
    retryFetch
  } = useProfiles({
    filters,
    pageSize: itemsPerPage,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes cache
  });

  // Initialize gallery animations with stagger effect
  const { controls, variants, loadNextBatch } = useGalleryAnimation(0.05, itemsPerPage);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Handle infinite scroll loading
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadNextBatch();
    }
  }, [inView, hasMore, isLoading, loadNextBatch]);

  // Error handling callback
  const handleError = useCallback((error: ErrorResponse) => {
    console.error('Profile grid error:', error);
    onError?.(new Error(error.message));
  }, [onError]);

  // Generate responsive grid classes
  const gridClasses = clsx(
    'grid gap-4 md:gap-6',
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'auto-rows-max',
    className
  );

  // Render loading skeleton
  if (isLoading && !profiles.length) {
    return (
      <div 
        className="w-full min-h-screen animate-pulse"
        data-testid={`${testId}-loading`}
      >
        <div className={gridClasses}>
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !profiles.length) {
    return (
      <ErrorBoundary
        fallback={({ message }) => (
          <div 
            className="w-full p-4 text-center"
            data-testid={`${testId}-error`}
          >
            <p className="text-red-500 mb-4">{message}</p>
            <button
              onClick={retryFetch}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry Loading
            </button>
          </div>
        )}
        onError={handleError}
      />
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <div
        ref={containerRef}
        className="w-full min-h-screen"
        data-testid={testId}
      >
        <VirtualScroller
          totalCount={profiles.length}
          itemHeight={320} // Approximate height of profile card
          overscan={5}
          className={gridClasses}
        >
          {({ index, style }) => {
            const profile = profiles[index];
            if (!profile) return null;

            return (
              <motion.div
                key={profile.id}
                variants={variants}
                initial="initial"
                animate={controls}
                style={style}
                layout
              >
                <ProfileCard
                  profile={profile}
                  className="h-full"
                />
              </motion.div>
            );
          }}
        </VirtualScroller>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={loadMoreRef}
            className="w-full h-20 flex items-center justify-center"
          >
            {isLoading && (
              <div className="loading-spinner" aria-label="Loading more profiles" />
            )}
          </div>
        )}

        {/* No results message */}
        {!isLoading && !profiles.length && (
          <div 
            className="w-full p-8 text-center text-gray-500"
            data-testid={`${testId}-empty`}
          >
            No profiles found
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});

ProfileGrid.displayName = 'ProfileGrid';

export default ProfileGrid;