import React from 'react'; // v18.0.0
import clsx from 'clsx'; // v2.0.0
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { LoadingSpinner } from '../common/LoadingSpinner';

/**
 * Props interface for the InfiniteScroll component with comprehensive configuration options
 */
interface InfiniteScrollProps {
  /** Child elements to be rendered within the infinite scroll container */
  children: React.ReactNode;
  /** Callback function triggered when more items need to be loaded */
  onLoadMore: (page: number) => Promise<void> | void;
  /** Intersection observer threshold value (0 to 1) */
  threshold?: number;
  /** Enable/disable infinite scroll functionality */
  enabled?: boolean;
  /** Indicates if there are more items to load */
  hasMore: boolean;
  /** Indicates if data is currently being loaded */
  isLoading: boolean;
  /** Additional CSS classes to apply to the container */
  className?: string;
}

/**
 * A reusable infinite scroll component that implements efficient pagination
 * using Intersection Observer API with enhanced accessibility and performance optimizations.
 *
 * @example
 * ```tsx
 * <InfiniteScroll
 *   onLoadMore={loadMoreProfiles}
 *   hasMore={hasMoreProfiles}
 *   isLoading={isLoadingProfiles}
 *   threshold={0.1}
 * >
 *   {profiles.map(profile => (
 *     <ProfileCard key={profile.id} profile={profile} />
 *   ))}
 * </InfiniteScroll>
 * ```
 */
const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  onLoadMore,
  threshold = 0.1,
  enabled = true,
  hasMore = false,
  isLoading = false,
  className,
}) => {
  // Initialize infinite scroll hook with configuration
  const {
    containerRef,
    error,
    isIntersecting
  } = useInfiniteScroll({
    onLoadMore,
    threshold,
    enabled,
    hasMore,
    isLoading
  });

  // Construct container className with conditional styles
  const containerClasses = clsx(
    'relative min-h-[200px]',
    'scroll-smooth',
    'will-change-transform',
    className
  );

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      role="feed"
      aria-busy={isLoading}
      aria-live="polite"
      data-testid="infinite-scroll-container"
    >
      {/* Main content */}
      <div className="space-y-4">
        {children}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className="flex justify-center items-center py-4"
          role="status"
          aria-label="Loading more items"
        >
          <LoadingSpinner
            size="lg"
            color="primary"
            className="animate-loading"
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="text-destructive text-center py-4"
          role="alert"
          aria-live="assertive"
        >
          <p>{error.message}</p>
          <button
            onClick={() => onLoadMore(1)}
            className="mt-2 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Retry loading"
          >
            Retry
          </button>
        </div>
      )}

      {/* Intersection observer trigger element */}
      {hasMore && !isLoading && (
        <div
          className="h-px w-full opacity-0"
          aria-hidden="true"
          data-testid="scroll-trigger"
          style={{
            transform: 'translateY(-200px)',
            willChange: 'transform'
          }}
        />
      )}

      {/* End of content message for screen readers */}
      {!hasMore && (
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          End of content reached
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;