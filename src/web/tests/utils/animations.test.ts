import { describe, it, expect, jest } from '@jest/globals'; // jest@29.x
import { performance } from 'jest-performance'; // jest-performance@1.x
import {
  createProfileCardAnimation,
  createGalleryAnimation,
  createFadeAnimation
} from '../../app/utils/animations';
import type { AnimationVariants, ProfileCardAnimation } from '../../app/types/animation.types';

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }))
  });
};

describe('Profile Card Animations', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('should create GPU-accelerated animations by default', () => {
    const animation = createProfileCardAnimation();
    
    expect(animation.initial.willChange).toBe('transform, opacity');
    expect(animation.initial.transform).toBe('perspective(1000px)');
  });

  it('should respect reduced motion preferences', () => {
    mockMatchMedia(true);
    const animation = createProfileCardAnimation();
    
    expect(animation.hover).toEqual({});
    expect(animation.animate.transition).toBeDefined();
  });

  it('should maintain performance thresholds', async () => {
    const { duration } = await performance.measure(() => {
      const animation = createProfileCardAnimation();
      animation.animate.transition;
    });
    
    expect(duration).toBeLessThan(16); // Target: 60fps frame budget
  });

  it('should handle spring configurations correctly', () => {
    const customSpring: Partial<ProfileCardAnimation> = {
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40
      }
    };
    
    const animation = createProfileCardAnimation(customSpring);
    expect(animation.animate.transition).toMatchObject(customSpring.transition);
  });

  it('should enforce type safety with options', () => {
    const invalidOptions = {
      scale: 'invalid', // Type error expected
      rotate: true // Type error expected
    } as any;
    
    expect(() => createProfileCardAnimation(invalidOptions)).not.toThrow();
    const animation = createProfileCardAnimation(invalidOptions);
    expect(typeof animation.hover?.scale).toBe('number');
  });
});

describe('Gallery Animations', () => {
  it('should calculate correct stagger timing', () => {
    const staggerDelay = 0.1;
    const animation = createGalleryAnimation(staggerDelay);
    
    expect(animation.animate.transition?.staggerChildren).toBe(staggerDelay);
    expect(animation.exit.transition?.staggerChildren).toBe(staggerDelay / 2);
  });

  it('should manage parent-child relationships', () => {
    const animation = createGalleryAnimation();
    
    expect(animation.animate.transition?.when).toBe('beforeChildren');
    expect(animation.exit.transition?.when).toBe('afterChildren');
  });

  it('should maintain frame rate targets', async () => {
    const { duration } = await performance.measure(() => {
      createGalleryAnimation(0.05, 0.2);
    });
    
    expect(duration).toBeLessThan(16); // Target: 60fps frame budget
  });

  it('should optimize performance with willChange', () => {
    const animation = createGalleryAnimation();
    
    expect(animation.initial.willChange).toBe('opacity, transform');
  });

  it('should support dynamic delay adjustments', () => {
    const delayChildren = 0.3;
    const animation = createGalleryAnimation(undefined, delayChildren);
    
    expect(animation.animate.transition?.delayChildren).toBe(delayChildren);
  });
});

describe('Fade Animations', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('should support reduced motion preferences', () => {
    mockMatchMedia(true);
    const animation = createFadeAnimation();
    
    expect(animation.initial.y).toBe(0);
    expect(animation.exit.y).toBe(0);
  });

  it('should calculate correct opacity values', () => {
    const animation = createFadeAnimation();
    
    expect(animation.initial.opacity).toBe(0);
    expect(animation.animate.opacity).toBe(1);
    expect(animation.exit.opacity).toBe(0);
  });

  it('should maintain smooth frame rates', async () => {
    const { duration } = await performance.measure(() => {
      createFadeAnimation(0.3);
    });
    
    expect(duration).toBeLessThan(16); // Target: 60fps frame budget
  });

  it('should handle custom durations correctly', () => {
    const customDuration = 0.5;
    const animation = createFadeAnimation(customDuration);
    
    expect(animation.animate.transition?.duration).toBe(customDuration);
    expect(animation.exit.transition?.duration).toBe(customDuration / 2);
  });

  it('should optimize performance with willChange', () => {
    const animation = createFadeAnimation();
    
    expect(animation.initial.willChange).toBe('opacity, transform');
  });

  it('should provide type-safe animation variants', () => {
    const animation = createFadeAnimation();
    
    const variants: AnimationVariants = animation;
    expect(variants).toHaveProperty('initial');
    expect(variants).toHaveProperty('animate');
    expect(variants).toHaveProperty('exit');
    expect(variants).toHaveProperty('hover');
  });
});

// Test helper functions
const expectAnimationPerformance = async (
  animationFn: () => void,
  maxDuration: number = 16
) => {
  const { duration } = await performance.measure(animationFn);
  expect(duration).toBeLessThan(maxDuration);
};

const expectReducedMotionCompliance = (
  animation: AnimationVariants,
  shouldReduce: boolean = true
) => {
  mockMatchMedia(shouldReduce);
  expect(animation.hover).toBeDefined();
  if (shouldReduce) {
    expect(Object.keys(animation.hover)).toHaveLength(0);
  }
};