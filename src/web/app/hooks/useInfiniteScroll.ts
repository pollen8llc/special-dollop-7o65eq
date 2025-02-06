import { useRef, useEffect, useCallback, useState } from 'react'; // v18.0.0
import { PaginationMetadata } from '../types/common.types';

/**
 * Configuration options for the infinite scroll hook
 */
interface InfiniteScrollOptions {
  /** Callback function to load more data when scrolling threshold is reached */
  onLoadMore: (page: number) => Promise<void> | void;
  /** Intersection observer threshold (0 to 1), defaults to 0.1 */
  threshold?: number;
  /** Enable/disable infinite scroll functionality */
  enabled?: boolean;
  /** Indicates if there are more items to load */
  hasMore: boolean;
  /** Indicates if data is currently being loaded */
  isLoading: boolean;
}

/**
 * Custom hook that implements infinite scrolling using Intersection Observer API
 * with enhanced error handling, loading states, and accessibility features.
 * 
 * @param options - Configuration options for infinite scroll behavior
 * @returns Object containing container ref and scroll state
 */
export const useInfiniteScroll = ({
  onLoadMore,
  threshold = 0.1,
  enabled = true,
  hasMore,
  isLoading
}: InfiniteScrollOptions) => {
  // Refs for DOM element and intersection observer
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Internal state management
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Loading state management with request tracking
  const loadingRef = useRef<boolean>(false);

  /**
   * Memoized intersection observer callback
   * Handles intersection state and triggers data loading
   */
  const handleIntersection = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      setIsIntersecting(entry.isIntersecting);

      if (
        entry.isIntersecting &&
        enabled &&
        hasMore &&
        !loadingRef.current &&
        !isLoading
      ) {
        try {
          loadingRef.current = true;
          await onLoadMore(currentPage + 1);
          setCurrentPage(prev => prev + 1);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to load more items'));
          // Reset loading state on error to allow retry
          loadingRef.current = false;
        } finally {
          loadingRef.current = false;
        }
      }
    },
    [currentPage, enabled, hasMore, isLoading, onLoadMore]
  );

  /**
   * Effect to initialize and cleanup intersection observer
   * with configurable threshold and error handling
   */
  useEffect(() => {
    if (!enabled) return;

    const options: IntersectionObserverInit = {
      root: null, // Use viewport as root
      rootMargin: '20px', // Load slightly before reaching threshold
      threshold: Math.min(Math.max(threshold, 0), 1) // Ensure threshold is between 0 and 1
    };

    try {
      if (containerRef.current) {
        observerRef.current = new IntersectionObserver(handleIntersection, options);
        observerRef.current.observe(containerRef.current);
      }
    } catch (err) {
      console.error('Failed to initialize IntersectionObserver:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize scroll observer'));
    }

    // Cleanup observer on unmount or when enabled changes
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      loadingRef.current = false;
    };
  }, [enabled, handleIntersection, threshold]);

  /**
   * Effect to update ARIA attributes for accessibility
   */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setAttribute('role', 'feed');
      containerRef.current.setAttribute('aria-busy', isLoading.toString());
      containerRef.current.setAttribute('aria-live', 'polite');
    }
  }, [isLoading]);

  return {
    containerRef,
    isLoading,
    hasMore,
    error,
    isIntersecting
  };
};