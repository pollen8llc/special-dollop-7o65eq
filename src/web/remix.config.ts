import type { RemixConfig } from "@remix-run/dev"; // v1.19.0

/**
 * Remix configuration for LinkedIn Profiles Gallery application
 * Optimized for production performance and modern browser support
 * 
 * Browser Support:
 * - Chrome 90+
 * - Firefox 88+
 * - Safari 14+
 */
export default {
  /**
   * Server build configuration
   * Optimized for Node.js environment with CommonJS modules
   */
  serverBuildTarget: "node-cjs",
  server: "server.ts",
  serverBuildPath: "build/index.js",
  serverMainFields: ["module", "main"],
  serverModuleFormat: "cjs",
  serverPlatform: "node",
  serverMinify: true,

  /**
   * Application build configuration
   * Defines directory structure and asset management
   */
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  
  /**
   * Development configuration
   * Enables file watching and live reload functionality
   */
  watchPaths: ["./app/**/*"],
  devServerPort: 3000,
  devServerBroadcastDelay: 1000,
  
  /**
   * Route configuration
   * Defines application routing structure for profile management
   */
  routes: {
    // Root route - Main application layout
    root: {
      path: "",
      file: "root.tsx"
    },
    // Gallery route - Profile browsing interface
    gallery: {
      path: "gallery",
      file: "routes/gallery.tsx"
    },
    // Individual profile view
    profile: {
      path: "profile/:id",
      file: "routes/profile.$id.tsx"
    },
    // Profile editing interface
    profileEdit: {
      path: "profile/:id/edit",
      file: "routes/profile.$id.edit.tsx"
    },
    // New profile creation
    profileNew: {
      path: "profile/new",
      file: "routes/profile.new.tsx"
    },
    // Authentication routes
    auth: {
      path: "auth/*",
      file: "routes/auth.$.tsx"
    }
  },

  /**
   * Ignored route files
   * Excludes hidden files and directories from route generation
   */
  ignoredRouteFiles: ["**/.*"],

  /**
   * Future features configuration
   * Enables v2 features for enhanced functionality
   */
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true
  }
} as RemixConfig;