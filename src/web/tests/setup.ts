// @testing-library/jest-dom v5.16.5 - Custom DOM element matchers for Jest
import '@testing-library/jest-dom';
// whatwg-fetch v3.6.2 - Fetch API polyfill for tests
import 'whatwg-fetch';

/**
 * Configure mock implementation of window.matchMedia for testing responsive design features
 */
function setupMatchMedia(): void {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

/**
 * Configure mock implementation of ResizeObserver for testing components that observe element dimensions
 */
function setupResizeObserver(): void {
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

/**
 * Configure mock implementation of IntersectionObserver for infinite scroll and lazy loading tests
 */
function setupIntersectionObserver(): void {
  window.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));
}

// Mock Framer Motion animations for testing
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    img: 'img',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Clerk authentication for testing auth flows
jest.mock('@clerk/remix', () => ({
  getAuth: jest.fn(),
  requireAuth: jest.fn(),
}));

// Configure global fetch mock
global.fetch = jest.fn();

// Setup all required browser API mocks
setupMatchMedia();
setupResizeObserver();
setupIntersectionObserver();

// Configure additional test environment settings
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});