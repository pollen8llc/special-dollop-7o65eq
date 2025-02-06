// react@18.x - Core React functionality and TypeScript types
import React from 'react';
// framer-motion@10.x - Animation capabilities for interactive social icons
import { motion } from 'framer-motion';

// Internal imports
import { SocialLinks } from '../../types/profile.types';
import { LinkedInIcon } from '../common/Icons';

// Interface for component props
interface ProfileSocialProps {
  socialLinks: SocialLinks;
  className?: string;
}

// URL validation regex patterns
const URL_PATTERNS = {
  linkedin: /^https?:\/\/([\w]+\.)?linkedin\.com\/in\/[\w-]+\/?$/,
  github: /^https?:\/\/([\w]+\.)?github\.com\/[\w-]+\/?$/,
  website: /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w-]*)*\/?$/
};

// Animation variants for social icons
const iconAnimationVariants = {
  initial: { scale: 1, opacity: 1 },
  hover: { 
    scale: 1.1,
    opacity: 0.8,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  },
  tap: { 
    scale: 0.95,
    opacity: 0.6
  }
};

// Container animation variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
};

/**
 * ProfileSocial Component
 * Renders an accessible section of animated social media links
 */
export const ProfileSocial: React.FC<ProfileSocialProps> = ({ 
  socialLinks,
  className = ''
}) => {
  // URL validation function
  const isValidUrl = (url: string | null, type: keyof typeof URL_PATTERNS): boolean => {
    if (!url) return false;
    return URL_PATTERNS[type].test(url);
  };

  // Error boundary handler
  const handleLinkError = (e: React.SyntheticEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.error('Social link navigation failed');
  };

  // Render social link with animation and accessibility features
  const renderSocialLink = (
    url: string | null,
    type: 'linkedin' | 'github' | 'website',
    icon: JSX.Element,
    label: string
  ) => {
    if (!url || !isValidUrl(url, type)) return null;

    return (
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        variants={iconAnimationVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onError={handleLinkError}
        className="social-link"
        aria-label={`Visit ${label} profile`}
        role="link"
        tabIndex={0}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </motion.a>
    );
  };

  return (
    <motion.div
      className={`profile-social ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      role="list"
      aria-label="Social media links"
    >
      {renderSocialLink(
        socialLinks.linkedin,
        'linkedin',
        <LinkedInIcon 
          size={24} 
          color="#0A66C2"
          className="social-icon linkedin"
          ariaLabel="LinkedIn profile"
        />,
        'LinkedIn'
      )}
      
      {/* Additional social links can be added here following the same pattern */}
      
      <style jsx>{`
        .profile-social {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding: 0.5rem;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background-color: transparent;
          transition: background-color 0.2s ease;
        }

        .social-link:focus-visible {
          outline: 2px solid #0A66C2;
          outline-offset: 2px;
        }

        .social-icon {
          width: 24px;
          height: 24px;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 640px) {
          .social-icon {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ProfileSocial;