import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss';
import forms from '@tailwindcss/forms'; // v0.5.x
import typography from '@tailwindcss/typography'; // v0.5.x
import { BREAKPOINTS } from './app/constants/breakpoints';
import { COLORS } from './app/constants/theme';

const config: Config = {
  // Content paths for template scanning
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './app/components/**/*.{js,jsx,ts,tsx}',
    './app/routes/**/*.{js,jsx,ts,tsx}'
  ],

  // Dark mode configuration using class strategy for explicit control
  darkMode: 'class',

  theme: {
    // Base screen breakpoints aligned with design requirements
    screens: {
      sm: `${BREAKPOINTS.MOBILE}px`,
      md: `${BREAKPOINTS.TABLET}px`,
      lg: `${BREAKPOINTS.DESKTOP}px`,
    },

    extend: {
      // Color palette extension using imported theme colors
      colors: {
        primary: COLORS.primary,
        secondary: COLORS.secondary,
        background: COLORS.background,
        text: COLORS.text,
        border: COLORS.border,
        error: COLORS.error,
        success: COLORS.success,
      },

      // Custom spacing values for specific layout requirements
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },

      // Custom border radius for profile cards
      borderRadius: {
        'profile': '1.5rem',
      },

      // Animation configurations for profile card interactions
      animation: {
        'card-hover': 'card-hover 0.3s ease-in-out forwards',
        'card-rotate': 'card-rotate 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
      },

      // Keyframe definitions for custom animations
      keyframes: {
        'card-hover': {
          '0%': {
            transform: 'translateZ(0) rotateX(0) rotateY(0)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
          '100%': {
            transform: 'translateZ(20px) rotateX(2deg) rotateY(-2deg)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          },
        },
        'card-rotate': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      // Transform configurations for 3D effects
      transformOrigin: {
        'card': 'center center -20px',
      },

      // Backdrop blur effects for card overlays
      backdropBlur: {
        'card': '12px',
      },

      // Custom transition timing functions
      transitionTimingFunction: {
        'card': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // Typography scale adjustments
      fontSize: {
        'profile-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'profile-subtitle': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
      },

      // Box shadow variations for different elevations
      boxShadow: {
        'card-hover': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
        'card-active': '0 25px 30px -5px rgb(0 0 0 / 0.15), 0 15px 15px -5px rgb(0 0 0 / 0.08)',
      },
    },
  },

  // Plugin configurations
  plugins: [
    forms,
    typography,
    plugin(({ addUtilities }) => {
      addUtilities({
        // Custom utilities for 3D card effects
        '.transform-3d': {
          'transform-style': 'preserve-3d',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        // Glass morphism effect utilities
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    }),
  ],
};

export default config;