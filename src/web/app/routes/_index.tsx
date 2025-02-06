import React from 'react';
import { json, type MetaFunction, type HeadersFunction } from '@remix-run/node';
import { useLoaderData, useTransition } from '@remix-run/react';
import Layout from '../components/common/Layout';
import ProfileGrid from '../components/gallery/ProfileGrid';
import SEO from '../components/common/SEO';
import type { Profile } from '../types/profile.types';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Loader function for fetching initial profile data with pagination and caching
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Parse pagination parameters from URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      throw new Error('Invalid page parameter');
    }
    if (isNaN(limit) || limit < 1 || limit > 50) {
      throw new Error('Invalid limit parameter');
    }

    // Fetch profiles data with pagination
    const response = await fetch(
      `${process.env.API_URL}/profiles?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch profiles');
    }

    const data = await response.json();

    // Set cache headers for performance
    const headers = new Headers({
      'Cache-Control': 'public, max-age=60, s-maxage=30',
      'Vary': 'Accept-Encoding',
    });

    return json(
      { 
        profiles: data.profiles,
        pagination: data.pagination 
      },
      {
        headers,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Loader error:', error);
    return json(
      { 
        profiles: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0 },
        error: 'Failed to load profiles'
      },
      {
        headers: { 'Cache-Control': 'no-cache' },
        status: 500,
      }
    );
  }
};

/**
 * Headers function for setting response headers including cache and security
 */
export const headers: HeadersFunction = () => {
  return {
    'Cache-Control': 'public, max-age=60, s-maxage=30',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' https:; style-src 'self' 'unsafe-inline';",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

/**
 * Meta function for SEO optimization
 */
export const meta: MetaFunction = () => {
  return [
    { title: 'LinkedIn Profiles Gallery - Discover Professional Profiles' },
    { name: 'description', content: 'Browse and connect with professionals through our interactive profile gallery. Discover talents and opportunities in our growing network.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'LinkedIn Profiles Gallery' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
};

/**
 * Main index route component with optimized profile gallery and real-time animations
 */
const Index: React.FC = () => {
  const { profiles, pagination } = useLoaderData<typeof loader>();
  const transition = useTransition();

  // Configure virtualization settings for performance
  const virtualizationConfig = {
    itemHeight: 320, // Approximate height of profile card
    overscan: 5,
    threshold: 0.1,
  };

  return (
    <Layout>
      <SEO
        title="LinkedIn Profiles Gallery - Discover Professional Profiles"
        description="Browse and connect with professionals through our interactive profile gallery. Discover talents and opportunities in our growing network."
      />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Professional Profiles
        </h1>

        <ProfileGrid
          className="min-h-screen"
          filters={{}}
          itemsPerPage={12}
          virtualization={virtualizationConfig}
        />

        {/* Loading state indicator */}
        {transition.state === 'loading' && (
          <div
            className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Loading more profiles...
            </p>
          </div>
        )}
      </main>
    </Layout>
  );
};

export default Index;