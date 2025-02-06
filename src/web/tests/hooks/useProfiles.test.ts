import { renderHook, act, waitFor } from '@testing-library/react-hooks'; // ^8.0.1
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'; // ^29.5.0
import { useProfiles } from '../../app/hooks/useProfiles';
import { Profile, ProfileListResponse } from '../../app/types/profile.types';

// Mock data generation utility
const generateMockProfiles = (count: number, overrides = {}): Profile[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `profile-${index}`,
    userId: `user-${index}`,
    headline: `Test Profile ${index}`,
    bio: `Test bio for profile ${index}`,
    avatarUrl: `https://example.com/avatar/${index}.jpg`,
    socialLinks: {
      linkedin: `https://linkedin.com/in/test${index}`,
      github: `https://github.com/test${index}`,
      website: null
    },
    experiences: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }));
};

// Mock fetch implementation
const mockFetch = (mockData: Partial<ProfileListResponse>, delay = 0, shouldFail = false): jest.Mock => {
  const fetchMock = jest.fn().mockImplementation(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(new Error('Failed to fetch'));
        } else {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: mockData.data || [],
              pagination: {
                currentPage: mockData.pagination?.currentPage || 1,
                totalPages: mockData.pagination?.totalPages || 1,
                pageSize: mockData.pagination?.pageSize || 10,
                totalItems: mockData.pagination?.totalItems || 0,
                hasNextPage: mockData.pagination?.hasNextPage || false,
                hasPreviousPage: mockData.pagination?.hasPreviousPage || false,
                nextPageUrl: mockData.pagination?.nextPageUrl || null,
                previousPageUrl: mockData.pagination?.previousPageUrl || null
              },
              error: null,
              timestamp: new Date().toISOString()
            })
          });
        }
      }, delay);
    });
  });

  global.fetch = fetchMock;
  return fetchMock;
};

// Mock IntersectionObserver
const setupIntersectionObserverMock = (intersectionCallback: Function): void => {
  class MockIntersectionObserver {
    private callback: Function;

    constructor(callback: Function) {
      this.callback = callback;
    }

    observe(): void {
      // Simulate intersection after a short delay
      setTimeout(() => {
        this.callback([
          {
            isIntersecting: true,
            target: document.createElement('div')
          }
        ]);
      }, 100);
    }

    disconnect(): void {
      // Clean up
    }
  }

  global.IntersectionObserver = MockIntersectionObserver as any;
};

describe('useProfiles hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupIntersectionObserverMock((entries: IntersectionObserverEntry[]) => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Initial Data Loading', () => {
    it('should load initial profiles successfully', async () => {
      const mockProfiles = generateMockProfiles(10);
      const fetchMock = mockFetch({
        data: mockProfiles,
        pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 10 }
      });

      const { result } = renderHook(() => useProfiles({ pageSize: 10 }));

      // Verify loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.profiles).toHaveLength(0);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profiles).toEqual(mockProfiles);
      expect(result.current.error).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should handle API response time under 200ms', async () => {
      const mockProfiles = generateMockProfiles(10);
      const startTime = Date.now();
      mockFetch({ data: mockProfiles }, 100);

      const { result } = renderHook(() => useProfiles({}));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Pagination and Infinite Scroll', () => {
    it('should load more profiles on scroll', async () => {
      const initialProfiles = generateMockProfiles(10);
      const additionalProfiles = generateMockProfiles(10, { id: 'next-' });
      
      const fetchMock = mockFetch({
        data: initialProfiles,
        pagination: { currentPage: 1, totalPages: 2, pageSize: 10, totalItems: 20, hasNextPage: true }
      });

      const { result } = renderHook(() => useProfiles({ pageSize: 10 }));

      await waitFor(() => {
        expect(result.current.profiles).toHaveLength(10);
      });

      // Mock second page response
      fetchMock.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: additionalProfiles,
          pagination: { currentPage: 2, totalPages: 2, pageSize: 10, totalItems: 20, hasNextPage: false }
        })
      }));

      // Trigger infinite scroll
      await act(async () => {
        await result.current.containerRef.current?.dispatchEvent(
          new Event('scroll')
        );
      });

      await waitFor(() => {
        expect(result.current.profiles).toHaveLength(20);
      });

      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const fetchMock = mockFetch({}, 0, true);

      const { result } = renderHook(() => useProfiles({}));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.profiles).toHaveLength(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should allow retry after error', async () => {
      const mockProfiles = generateMockProfiles(10);
      const fetchMock = mockFetch({}, 0, true);

      const { result } = renderHook(() => useProfiles({}));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Mock successful retry
      fetchMock.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockProfiles,
          pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 10 }
        })
      }));

      await act(async () => {
        await result.current.retryFetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.profiles).toEqual(mockProfiles);
    });
  });

  describe('Cache Management', () => {
    it('should use cached data within timeout period', async () => {
      const mockProfiles = generateMockProfiles(10);
      const fetchMock = mockFetch({ data: mockProfiles });

      const { result, rerender } = renderHook(() => 
        useProfiles({ cacheTimeout: 5000 })
      );

      await waitFor(() => {
        expect(result.current.profiles).toHaveLength(10);
      });

      // Rerender with same props
      rerender();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.current.profiles).toEqual(mockProfiles);
    });

    it('should invalidate cache after timeout', async () => {
      const mockProfiles = generateMockProfiles(10);
      const fetchMock = mockFetch({ data: mockProfiles });

      const { result, rerender } = renderHook(() => 
        useProfiles({ cacheTimeout: 1000 })
      );

      await waitFor(() => {
        expect(result.current.profiles).toHaveLength(10);
      });

      // Fast-forward past cache timeout
      jest.advanceTimersByTime(1500);

      // Rerender to trigger cache check
      rerender();

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Profile Refresh', () => {
    it('should refresh profiles and update cache', async () => {
      const initialProfiles = generateMockProfiles(10);
      const updatedProfiles = generateMockProfiles(10, { headline: 'Updated' });
      
      const fetchMock = mockFetch({ data: initialProfiles });

      const { result } = renderHook(() => useProfiles({}));

      await waitFor(() => {
        expect(result.current.profiles).toEqual(initialProfiles);
      });

      // Mock refresh response
      fetchMock.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: updatedProfiles,
          pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 10 }
        })
      }));

      await act(async () => {
        await result.current.refreshProfiles();
      });

      expect(result.current.profiles).toEqual(updatedProfiles);
      expect(result.current.isRefreshing).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});