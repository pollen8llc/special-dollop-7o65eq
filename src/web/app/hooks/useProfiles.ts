import { useState, useCallback, useEffect, useRef } from 'react'; // ^18.0.0
import { debounce } from 'lodash'; // ^4.17.21
import { Profile, ProfileListResponse } from '../types/profile.types';
import { useInfiniteScroll } from './useInfiniteScroll';

// Cache configuration type
interface ProfileCache {
  data: Profile[];
  timestamp: number;
  filters: Record<string, any>;
}

/**
 * Custom hook for managing profile data with infinite scrolling, caching, and optimistic updates
 * @param initialProfiles - Initial array of profiles
 * @param filters - Filter criteria for profile queries
 * @param pageSize - Number of profiles per page
 * @param cacheTimeout - Cache expiration in milliseconds
 */
export const useProfiles = ({
  initialProfiles = [],
  filters = {},
  pageSize = 10,
  cacheTimeout = 5 * 60 * 1000 // 5 minutes default cache timeout
}: {
  initialProfiles?: Profile[];
  filters?: Record<string, any>;
  pageSize?: number;
  cacheTimeout?: number;
}) => {
  // State management
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs for cache and request management
  const cacheRef = useRef<ProfileCache | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Internal function to fetch profiles with caching and retry logic
   */
  const fetchProfiles = async (
    page: number,
    filters: Record<string, any>,
    signal: AbortSignal
  ): Promise<ProfileListResponse> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...filters
    });

    try {
      const response = await fetch(`/api/profiles?${queryParams}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProfileListResponse = await response.json();
      return data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw err;
    }
  };

  /**
   * Debounced profile fetching to prevent excessive API calls
   */
  const debouncedFetch = useCallback(
    debounce(async (page: number) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetchProfiles(
          page,
          filters,
          abortControllerRef.current.signal
        );

        if (page === 1) {
          setProfiles(response.data);
        } else {
          setProfiles(prev => [...prev, ...response.data]);
        }

        // Update cache
        cacheRef.current = {
          data: page === 1 ? response.data : [...profiles, ...response.data],
          timestamp: Date.now(),
          filters
        };

        setError(null);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profiles'));
      }
    }, 300),
    [filters, profiles]
  );

  /**
   * Setup infinite scroll with loading and pagination management
   */
  const { containerRef, isLoading, hasMore, error: scrollError } = useInfiniteScroll({
    onLoadMore: async (nextPage: number) => {
      await debouncedFetch(nextPage);
    },
    threshold: 0.1,
    enabled: !error && !isRefreshing,
    hasMore: profiles.length % pageSize === 0,
    isLoading: isRefreshing
  });

  /**
   * Function to refresh profiles with optimistic updates
   */
  const refreshProfiles = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetchProfiles(1, filters, new AbortController().signal);
      setProfiles(response.data);
      setCurrentPage(1);
      setError(null);

      // Update cache
      cacheRef.current = {
        data: response.data,
        timestamp: Date.now(),
        filters
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh profiles'));
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Retry function for error recovery
   */
  const retryFetch = async () => {
    setError(null);
    await debouncedFetch(currentPage);
  };

  /**
   * Effect to check cache validity and load initial data
   */
  useEffect(() => {
    const loadInitialData = async () => {
      const cache = cacheRef.current;
      const isValidCache =
        cache &&
        cache.timestamp + cacheTimeout > Date.now() &&
        JSON.stringify(cache.filters) === JSON.stringify(filters);

      if (isValidCache) {
        setProfiles(cache.data);
      } else {
        await debouncedFetch(1);
      }
    };

    loadInitialData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, debouncedFetch, cacheTimeout]);

  return {
    profiles,
    isLoading: isLoading || isRefreshing,
    error: error || scrollError,
    containerRef,
    hasMore,
    refreshProfiles,
    isRefreshing,
    retryFetch
  };
};