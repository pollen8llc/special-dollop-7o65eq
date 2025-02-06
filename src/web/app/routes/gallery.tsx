import React, { useCallback, useEffect, useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useTransition } from '@remix-run/react';
import { motion } from 'framer-motion'; // v10.0.0

import Layout from '../components/common/Layout';
import ProfileGrid from '../components/gallery/ProfileGrid';
import FilterControls from '../components/gallery/FilterControls';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useToast } from '../hooks/useToast';
import { GALLERY_GRID_VARIANTS } from '../constants/animations';
import type { Profile, ProfileListResponse } from '../types/profile.types';
import type { LoaderFunction } from '@remix-run/node';
import type { FilterState } from '../components/gallery/FilterControls';

/**
 * Server-side loader function for initial gallery data
 * Implements caching, error handling, and pagination
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const filters = Object.fromEntries(url.searchParams.entries());

    // Fetch initial profiles with error handling
    const response = await fetch(`${process.env.API_URL}/profiles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      },
      body: JSON.stringify({ page, filters })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.statusText}`);
    }

    const data: ProfileListResponse = await response.json();

    return json(
      { profiles: data.data, metadata: data.pagination },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          'Vary': 'Accept-Encoding, Cookie'
        }
      }
    );
  } catch (error) {
    console.error('Gallery loader error:', error);
    throw new Error('Failed to load profiles gallery');
  }
};

/**
 * Enhanced gallery route component with accessibility, animations,
 * and comprehensive error handling
 */
const Gallery: React.FC = () => {
  // Get initial data and loading state
  const { profiles, metadata } = useLoaderData<{ 
    profiles: Profile[],
    metadata: { totalItems: number }
  }>();
  const transition = useTransition();
  const { showToast } = useToast();

  // Local state for filters
  const [currentFilters, setCurrentFilters] = useState<Partial<FilterState>>({});
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  /**
   * Handle filter changes with error boundary and loading states
   */
  const handleFilterChange = useCallback(async (filters: Partial<FilterState>) => {
    setIsFilterLoading(true);
    try {
      setCurrentFilters(filters);
      showToast('SUCCESS', 'Filters applied successfully');
    } catch (error) {
      console.error('Filter error:', error);
      showToast('ERROR', 'Failed to apply filters');
    } finally {
      setIsFilterLoading(false);
    }
  }, [showToast]);

  /**
   * Reset filters with animation and toast notification
   */
  const handleFilterReset = useCallback(() => {
    setCurrentFilters({});
    showToast('INFO', 'Filters have been reset');
  }, [showToast]);

  // Update page title and meta description
  useEffect(() => {
    document.title = 'Profile Gallery | LinkedIn Profiles';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Browse professional profiles in our interactive gallery');
    }
  }, []);

  return (
    <Layout>
      <ErrorBoundary>
        <div className="min-h-screen py-8">
          {/* Page header with animation */}
          <motion.header
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Profile Gallery
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {metadata.totalItems} Professional Profiles Available
            </p>
          </motion.header>

          {/* Filter controls section */}
          <section className="mb-8" aria-label="Filter controls">
            <FilterControls
              onFilterChange={handleFilterChange}
              currentFilters={currentFilters}
              isLoading={isFilterLoading}
              onReset={handleFilterReset}
              className="max-w-3xl mx-auto"
            />
          </section>

          {/* Main gallery grid with loading states */}
          <motion.section
            className="relative"
            variants={GALLERY_GRID_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ProfileGrid
              filters={currentFilters}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
              itemsPerPage={12}
              testId="profile-gallery-grid"
            />

            {/* Loading overlay */}
            {(transition.state === 'loading' || isFilterLoading) && (
              <div
                className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center"
                role="progressbar"
                aria-busy="true"
                aria-label="Loading profiles"
              >
                <div className="loading-spinner" />
              </div>
            )}
          </motion.section>
        </div>
      </ErrorBoundary>
    </Layout>
  );
};

// Export error boundary for route error handling
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Layout>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Gallery Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error.message || 'Failed to load profile gallery'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Gallery;