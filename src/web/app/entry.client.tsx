import * as React from 'react'; // react@18.x
import { hydrateRoot } from 'react-dom/client'; // react-dom@18.x
import { RemixBrowser } from '@remix-run/react'; // @remix-run/react@1.19.x
import { LazyMotion, domAnimation, m } from 'framer-motion'; // framer-motion@10.x
import { fadePreset } from './lib/framer-motion';

/**
 * Main hydration function that initializes the client-side application
 * with Framer Motion animation support and error handling
 */
function hydrate() {
  const AnimatedRemixBrowser = () => (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={fadePreset.initial}
        animate={fadePreset.animate}
        exit={fadePreset.exit}
      >
        <RemixBrowser />
      </m.div>
    </LazyMotion>
  );

  // Use React 18's concurrent features for hydration
  const root = hydrateRoot(
    document,
    <React.StrictMode>
      <AnimatedRemixBrowser />
    </React.StrictMode>
  );

  // Error boundary for hydration errors
  if (process.env.NODE_ENV === 'development') {
    window.onerror = (error) => {
      if (error.toString().includes('Hydration')) {
        root.unmount();
        document.location.reload();
      }
    };
  }
}

/**
 * Client-side hydration handler with transition management
 * Ensures smooth page load and animation initialization
 */
const clientHydrate = () => {
  return new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => {
        React.startTransition(() => {
          hydrate();
          resolve();
        });
      });
    } else {
      React.startTransition(() => {
        hydrate();
        resolve();
      });
    }
  });
};

// Initialize hydration when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    clientHydrate();
  });
} else {
  clientHydrate();
}

export default clientHydrate;