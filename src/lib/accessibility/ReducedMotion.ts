// Reduced motion utilities and CSS classes
import { useState, useEffect } from 'react';

export interface MotionPreferences {
  prefersReducedMotion: boolean;
  prefersReducedData: boolean;
  prefersReducedTransparency: boolean;
}

export const reducedMotionCSS = `
  /* Reduced motion styles */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }

    /* Disable specific animations */
    .animate-spin,
    .animate-pulse,
    .animate-bounce,
    .animate-ping,
    .animate-pulse {
      animation: none !important;
    }

    /* Disable transforms */
    .transform,
    .scale,
    .rotate,
    .translate {
      transform: none !important;
    }

    /* Disable transitions */
    .transition,
    .transition-all,
    .transition-colors,
    .transition-opacity,
    .transition-transform {
      transition: none !important;
    }

    /* Disable hover effects */
    .hover\\:scale-105:hover,
    .hover\\:scale-110:hover,
    .hover\\:scale-125:hover,
    .hover\\:scale-150:hover {
      transform: none !important;
    }

    /* Disable focus effects */
    .focus\\:scale-105:focus,
    .focus\\:scale-110:focus,
    .focus\\:scale-125:focus,
    .focus\\:scale-150:focus {
      transform: none !important;
    }

    /* Disable active effects */
    .active\\:scale-95:active,
    .active\\:scale-100:active {
      transform: none !important;
    }

    /* Disable group hover effects */
    .group:hover .group-hover\\:scale-105,
    .group:hover .group-hover\\:scale-110,
    .group:hover .group-hover\\:scale-125,
    .group:hover .group-hover\\:scale-150 {
      transform: none !important;
    }

    /* Disable group focus effects */
    .group:focus .group-focus\\:scale-105,
    .group:focus .group-focus\\:scale-110,
    .group:focus .group-focus\\:scale-125,
    .group:focus .group-focus\\:scale-150 {
      transform: none !important;
    }

    /* Disable group active effects */
    .group:active .group-active\\:scale-95,
    .group:active .group-active\\:scale-100 {
      transform: none !important;
    }

    /* Disable motion-safe animations */
    .motion-safe\\:animate-spin,
    .motion-safe\\:animate-pulse,
    .motion-safe\\:animate-bounce,
    .motion-safe\\:animate-ping,
    .motion-safe\\:animate-pulse {
      animation: none !important;
    }

    /* Disable motion-safe transforms */
    .motion-safe\\:transform,
    .motion-safe\\:scale,
    .motion-safe\\:rotate,
    .motion-safe\\:translate {
      transform: none !important;
    }

    /* Disable motion-safe transitions */
    .motion-safe\\:transition,
    .motion-safe\\:transition-all,
    .motion-safe\\:transition-colors,
    .motion-safe\\:transition-opacity,
    .motion-safe\\:transition-transform {
      transition: none !important;
    }

    /* Disable motion-safe hover effects */
    .motion-safe\\:hover\\:scale-105:hover,
    .motion-safe\\:hover\\:scale-110:hover,
    .motion-safe\\:hover\\:scale-125:hover,
    .motion-safe\\:hover\\:scale-150:hover {
      transform: none !important;
    }

    /* Disable motion-safe focus effects */
    .motion-safe\\:focus\\:scale-105:focus,
    .motion-safe\\:focus\\:scale-110:focus,
    .motion-safe\\:focus\\:scale-125:focus,
    .motion-safe\\:focus\\:scale-150:focus {
      transform: none !important;
    }

    /* Disable motion-safe active effects */
    .motion-safe\\:active\\:scale-95:active,
    .motion-safe\\:active\\:scale-100:active {
      transform: none !important;
    }

    /* Disable motion-safe group hover effects */
    .group:hover .motion-safe\\:group-hover\\:scale-105,
    .group:hover .motion-safe\\:group-hover\\:scale-110,
    .group:hover .motion-safe\\:group-hover\\:scale-125,
    .group:hover .motion-safe\\:group-hover\\:scale-150 {
      transform: none !important;
    }

    /* Disable motion-safe group focus effects */
    .group:focus .motion-safe\\:group-focus\\:scale-105,
    .group:focus .motion-safe\\:group-focus\\:scale-110,
    .group:focus .motion-safe\\:group-focus\\:scale-125,
    .group:focus .motion-safe\\:group-focus\\:scale-150 {
      transform: none !important;
    }

    /* Disable motion-safe group active effects */
    .group:active .motion-safe\\:group-active\\:scale-95,
    .group:active .motion-safe\\:group-active\\:scale-100 {
      transform: none !important;
    }
  }
`;

// Utility function to detect reduced motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Utility function to detect reduced data preference
export function prefersReducedData(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-data: reduce)').matches;
}

// Utility function to detect reduced transparency preference
export function prefersReducedTransparency(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
}

// Utility function to get all motion preferences
export function getMotionPreferences(): MotionPreferences {
  return {
    prefersReducedMotion: prefersReducedMotion(),
    prefersReducedData: prefersReducedData(),
    prefersReducedTransparency: prefersReducedTransparency()
  };
}

// Utility function to apply reduced motion styles
export function applyReducedMotionStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'reduced-motion-styles';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = reducedMotionCSS;
}

// Utility function to remove reduced motion styles
export function removeReducedMotionStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleElement = document.getElementById('reduced-motion-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

// Hook for reduced motion preference detection
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return prefersReducedMotion;
}

// Hook for all motion preferences
export function useMotionPreferences(): MotionPreferences {
  const [preferences, setPreferences] = useState<MotionPreferences>({
    prefersReducedMotion: false,
    prefersReducedData: false,
    prefersReducedTransparency: false
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      reducedData: window.matchMedia('(prefers-reduced-data: reduce)'),
      reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)')
    };
    
    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: mediaQueries.reducedMotion.matches,
        prefersReducedData: mediaQueries.reducedData.matches,
        prefersReducedTransparency: mediaQueries.reducedTransparency.matches
      });
    };
    
    updatePreferences();
    
    mediaQueries.reducedMotion.addEventListener('change', updatePreferences);
    mediaQueries.reducedData.addEventListener('change', updatePreferences);
    mediaQueries.reducedTransparency.addEventListener('change', updatePreferences);
    
    return () => {
      mediaQueries.reducedMotion.removeEventListener('change', updatePreferences);
      mediaQueries.reducedData.removeEventListener('change', updatePreferences);
      mediaQueries.reducedTransparency.removeEventListener('change', updatePreferences);
    };
  }, []);
  
  return preferences;
}

// Utility function to create motion-safe animation
export function createMotionSafeAnimation(
  animation: string,
  fallback: string = 'none'
): string {
  return prefersReducedMotion() ? fallback : animation;
}

// Utility function to create motion-safe transition
export function createMotionSafeTransition(
  transition: string,
  fallback: string = 'none'
): string {
  return prefersReducedMotion() ? fallback : transition;
}

// Utility function to create motion-safe transform
export function createMotionSafeTransform(
  transform: string,
  fallback: string = 'none'
): string {
  return prefersReducedMotion() ? fallback : transform;
}

// Utility function to create motion-safe duration
export function createMotionSafeDuration(
  duration: string,
  fallback: string = '0ms'
): string {
  return prefersReducedMotion() ? fallback : duration;
}

// Utility function to create motion-safe delay
export function createMotionSafeDelay(
  delay: string,
  fallback: string = '0ms'
): string {
  return prefersReducedMotion() ? fallback : delay;
}

// Utility function to create motion-safe easing
export function createMotionSafeEasing(
  easing: string,
  fallback: string = 'linear'
): string {
  return prefersReducedMotion() ? fallback : easing;
}

// Utility function to create motion-safe iteration count
export function createMotionSafeIterationCount(
  count: string,
  fallback: string = '1'
): string {
  return prefersReducedMotion() ? fallback : count;
}

// Utility function to create motion-safe fill mode
export function createMotionSafeFillMode(
  fillMode: string,
  fallback: string = 'none'
): string {
  return prefersReducedMotion() ? fallback : fillMode;
}

// Utility function to create motion-safe direction
export function createMotionSafeDirection(
  direction: string,
  fallback: string = 'normal'
): string {
  return prefersReducedMotion() ? fallback : direction;
}

// Utility function to create motion-safe play state
export function createMotionSafePlayState(
  playState: string,
  fallback: string = 'running'
): string {
  return prefersReducedMotion() ? fallback : playState;
}

// Utility function to create motion-safe timing function
export function createMotionSafeTimingFunction(
  timingFunction: string,
  fallback: string = 'linear'
): string {
  return prefersReducedMotion() ? fallback : timingFunction;
}

const reducedMotion = {
  reducedMotionCSS,
  prefersReducedMotion,
  prefersReducedData,
  prefersReducedTransparency,
  getMotionPreferences,
  applyReducedMotionStyles,
  removeReducedMotionStyles,
  useReducedMotion,
  useMotionPreferences,
  createMotionSafeAnimation,
  createMotionSafeTransition,
  createMotionSafeTransform,
  createMotionSafeDuration,
  createMotionSafeDelay,
  createMotionSafeEasing,
  createMotionSafeIterationCount,
  createMotionSafeFillMode,
  createMotionSafeDirection,
  createMotionSafePlayState,
  createMotionSafeTimingFunction
};

export default reducedMotion;
