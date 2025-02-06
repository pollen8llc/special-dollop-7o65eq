import React from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  LiveReload,
} from '@remix-run/react';
import { ClerkProvider } from '@clerk/remix';
import * as Sentry from '@sentry/remix';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import Layout from './components/common/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { handleError } from './utils/error';

// Initialize Sentry for error tracking
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    integrations: [new Sentry.BrowserTracing()],
  });
}

/**
 * Root component that sets up the application shell and global providers
 */
export default function Root() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-background text-foreground antialiased">
        <ReactErrorBoundary
          onError={(error) => {
            handleError(error);
            Sentry.captureException(error);
          }}
          fallback={({ error }) => (
            <div role="alert" className="p-4">
              <h1>Application Error</h1>
              <pre>{error.message}</pre>
            </div>
          )}
        >
          <ClerkProvider
            publishableKey={process.env.CLERK_PUBLISHABLE_KEY}
            navigate={(to) => window.location.href = to}
          >
            <ThemeProvider>
              <ToastProvider>
                <Layout>
                  <Outlet />
                </Layout>
              </ToastProvider>
            </ThemeProvider>
          </ClerkProvider>
        </ReactErrorBoundary>
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

/**
 * Meta tags for SEO and social sharing
 */
export function meta() {
  return {
    title: 'LinkedIn Profiles Gallery',
    description: 'Browse and discover professional LinkedIn profiles',
    'og:type': 'website',
    'og:site_name': 'LinkedIn Profiles Gallery',
    'twitter:card': 'summary_large_image',
    'theme-color': '#0A66C2',
  };
}

/**
 * Links for stylesheets and preload directives
 */
export function links() {
  return [
    // Base styles
    { rel: 'stylesheet', href: '/styles/tailwind.css' },
    { rel: 'stylesheet', href: '/styles/animations.css' },
    
    // Fonts preload
    {
      rel: 'preload',
      href: '/fonts/inter-var.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    
    // Favicon and PWA icons
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' },
    
    // Theme color
    {
      rel: 'alternate',
      href: '/styles/dark.css',
      media: '(prefers-color-scheme: dark)',
    },
  ];
}

/**
 * Error boundary for handling root-level errors
 */
export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  Sentry.captureException(error);

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Error - LinkedIn Profiles Gallery</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <div className="min-h-screen bg-background px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div className="max-w-max mx-auto">
            <main className="sm:flex">
              <p className="text-4xl font-bold text-primary-500 sm:text-5xl">500</p>
              <div className="sm:ml-6">
                <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                  <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl">
                    An error occurred
                  </h1>
                  <p className="mt-1 text-base text-muted-foreground">
                    Please try again later or contact support if the problem persists.
                  </p>
                </div>
                <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go back home
                  </a>
                  <a
                    href="/support"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Contact support
                  </a>
                </div>
              </div>
            </main>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}