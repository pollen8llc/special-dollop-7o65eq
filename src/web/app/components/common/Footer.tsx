import React from 'react'; // ^18.0.0
import { Link } from '@remix-run/react'; // ^1.19.0
import { ROUTES } from '../../constants/routes';
import { COLORS } from '../../constants/theme';

/**
 * Props interface for Footer component
 */
interface FooterProps {
  /**
   * Optional CSS class names for custom styling and theme overrides
   */
  className?: string;
}

/**
 * A responsive, accessible footer component that provides consistent navigation
 * and branding across the LinkedIn Profiles Gallery application.
 * 
 * @accessibility WCAG 2.1 Level AA compliant with proper heading structure,
 * ARIA labels, and keyboard navigation support
 */
const Footer = React.memo(({ className = '' }: FooterProps): JSX.Element => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 ${className}`}
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation Section */}
          <nav
            className="flex flex-col space-y-4"
            aria-label="Footer navigation"
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Navigation
            </h2>
            <ul className="space-y-3">
              <li>
                <Link
                  to={ROUTES.HOME}
                  className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                  prefetch="intent"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.GALLERY}
                  className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                  prefetch="intent"
                >
                  Profile Gallery
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources Section */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Resources
            </h2>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://linkedin.com/help"
                  className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Help (opens in new tab)"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/legal"
                  className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Legal Information (opens in new tab)"
                >
                  Legal
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Contact
            </h2>
            <address className="not-italic">
              <p className="text-gray-600 dark:text-gray-400">
                LinkedIn Profiles Gallery
              </p>
              <a
                href="mailto:support@linkedinprofiles.gallery"
                className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                aria-label="Email support"
              >
                support@linkedinprofiles.gallery
              </a>
            </address>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <span aria-label={`Copyright ${currentYear}`}>
              &copy; {currentYear}
            </span>{' '}
            LinkedIn Profiles Gallery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;