import type { Config } from 'postcss'; // v8.4.x
import tailwindcss from 'tailwindcss'; // v3.3.x
import autoprefixer from 'autoprefixer'; // v10.4.x
import cssnano from 'cssnano'; // v6.0.x
import tailwindConfig from './tailwind.config';

/**
 * PostCSS configuration for LinkedIn Profiles Gallery application
 * Integrates Tailwind CSS with optimizations for production builds
 * @version 1.0.0
 */
const config: Config = {
  plugins: [
    // Initialize Tailwind CSS with custom configuration
    tailwindcss(tailwindConfig),

    // Add vendor prefixes for browser compatibility
    autoprefixer({
      // Target last 2 versions of each browser and browsers with >1% market share
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead'
      ],
      // Enable grid properties prefixing
      grid: true
    }),

    // Optimize and minify CSS in production
    process.env.NODE_ENV === 'production' && cssnano({
      preset: [
        'default',
        {
          // Optimize CSS structure
          normalizeWhitespace: true,
          // Remove all comments
          discardComments: {
            removeAll: true
          },
          // Merge identical selectors
          mergeLonghand: true,
          // Optimize @media queries
          mergeMediaQueries: true,
          // Minify gradients
          minifyGradients: true,
          // Normalize URLs
          normalizeUrl: true,
          // Reduce calc expressions
          reduceCalc: true
        }
      ]
    })
  ].filter(Boolean)
};

export default config;