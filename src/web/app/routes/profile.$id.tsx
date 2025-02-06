import { json, LoaderFunction, redirect } from '@remix-run/node';
import { useLoaderData, useParams, useNavigation } from '@remix-run/react';
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion@10.0.0
import type { Profile } from '../../types/profile.types';
import ProfileDetail from '../../components/profile/ProfileDetail';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Server-side loader function to fetch and validate profile data
 * Implements caching, authentication checks, and error handling
 */
export const loader: LoaderFunction = async ({ params, request }) => {
  try {
    const profileId = params.id;
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    // Validate authentication status
    const authSession = await validateSession(request);
    if (!authSession) {
      return redirect('/login', {
        headers: {
          'Set-Cookie': `redirectTo=${request.url}; Path=/; HttpOnly; SameSite=Lax`
        }
      });
    }

    // Fetch profile data with error handling
    const response = await fetch(`${process.env.API_URL}/profiles/${profileId}`, {
      headers: {
        Authorization: `Bearer ${authSession.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Profile not found');
      }
      throw new Error('Failed to fetch profile data');
    }

    const profile: Profile = await response.json();

    return json({ profile }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'Vary': 'Cookie'
      }
    });
  } catch (error) {
    console.error('Profile loader error:', error);
    throw error;
  }
};

/**
 * Profile route component with animations and loading states
 * Implements accessibility features and error handling
 */
const ProfileRoute: React.FC = () => {
  const { profile } = useLoaderData<{ profile: Profile }>();
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { id } = useParams();

  // Animation variants with GPU acceleration
  const pageVariants = {
    initial: { 
      opacity: 0,
      y: 20,
      willChange: 'transform, opacity'
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  // Show loading state during navigation
  if (navigation.state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner 
          size="lg"
          className="text-primary-500"
          aria-label="Loading profile"
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="container mx-auto px-4 py-8"
        role="main"
        aria-label={`Profile details for ${profile.headline}`}
      >
        <ProfileDetail
          profile={profile}
          className="bg-card rounded-lg shadow-lg"
          isLoading={navigation.state === 'loading'}
        />
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Error boundary component for handling route errors
 * Provides user feedback and recovery options
 */
export function ErrorBoundary({ error }: { error: Error }) {
  const { showToast } = useToast();

  React.useEffect(() => {
    showToast('ERROR', error.message || 'An error occurred while loading the profile');
  }, [error, showToast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-error-50 border border-error-200 rounded-lg p-6">
        <h1 className="text-xl font-semibold text-error-700 mb-4">
          Error Loading Profile
        </h1>
        <p className="text-error-600 mb-4">
          {error.message || 'An error occurred while loading the profile'}
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-error-600 text-white rounded-md hover:bg-error-700
                     focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-error-300 text-error-700 rounded-md
                     hover:bg-error-50 focus:outline-none focus:ring-2 
                     focus:ring-error-500 focus:ring-offset-2"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default ProfileRoute;