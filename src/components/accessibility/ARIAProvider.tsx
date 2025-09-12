import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ARIAUtils, generateARIAId } from '@/lib/accessibility/ARIAUtils';

interface ARIAContextType {
  // ID management
  generateId: (prefix?: string) => string;
  registerElement: (id: string, element: HTMLElement) => void;
  unregisterElement: (id: string) => void;
  getElement: (id: string) => HTMLElement | null;
  
  // Live regions
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Focus management
  setFocus: (id: string) => void;
  trapFocus: (containerId: string) => void;
  releaseFocus: () => void;
  
  // ARIA utilities
  ariaUtils: typeof ARIAUtils;
  
  // Accessibility preferences
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
}

const ARIAContext = createContext<ARIAContextType | null>(null);

interface ARIAProviderProps {
  children: React.ReactNode;
}

export const ARIAProvider: React.FC<ARIAProviderProps> = ({ children }) => {
  const [elements, setElements] = useState<Map<string, HTMLElement>>(new Map());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [prefersColorScheme, setPrefersColorScheme] = useState<'light' | 'dark' | 'no-preference'>('no-preference');
  const [focusTrap, setFocusTrap] = useState<string | null>(null);

  // Generate unique IDs
  const generateId = useCallback((prefix: string = 'aria') => {
    return generateARIAId(prefix);
  }, []);

  // Register/unregister elements
  const registerElement = useCallback((id: string, element: HTMLElement) => {
    setElements(prev => new Map(prev).set(id, element));
  }, []);

  const unregisterElement = useCallback((id: string) => {
    setElements(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getElement = useCallback((id: string) => {
    return elements.get(id) || null;
  }, [elements]);

  // Live regions for announcements
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  // Focus management
  const setFocus = useCallback((id: string) => {
    const element = getElement(id);
    if (element) {
      element.focus();
    }
  }, [getElement]);

  const trapFocus = useCallback((containerId: string) => {
    setFocusTrap(containerId);
  }, []);

  const releaseFocus = useCallback(() => {
    setFocusTrap(null);
  }, []);

  // Handle focus trap
  useEffect(() => {
    if (!focusTrap) return;

    const container = getElement(focusTrap);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusTrap, getElement]);

  // Monitor accessibility preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)')
    };

    const updatePreferences = () => {
      setPrefersReducedMotion(mediaQueries.reducedMotion.matches);
      setPrefersHighContrast(mediaQueries.highContrast.matches);
      setPrefersColorScheme(mediaQueries.colorScheme.matches ? 'dark' : 'light');
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    mediaQueries.reducedMotion.addEventListener('change', updatePreferences);
    mediaQueries.highContrast.addEventListener('change', updatePreferences);
    mediaQueries.colorScheme.addEventListener('change', updatePreferences);

    return () => {
      mediaQueries.reducedMotion.removeEventListener('change', updatePreferences);
      mediaQueries.highContrast.removeEventListener('change', updatePreferences);
      mediaQueries.colorScheme.removeEventListener('change', updatePreferences);
    };
  }, []);

  const contextValue: ARIAContextType = {
    generateId,
    registerElement,
    unregisterElement,
    getElement,
    announce,
    setFocus,
    trapFocus,
    releaseFocus,
    ariaUtils: ARIAUtils,
    prefersReducedMotion,
    prefersHighContrast,
    prefersColorScheme
  };

  return (
    <ARIAContext.Provider value={contextValue}>
      {children}
    </ARIAContext.Provider>
  );
};

// Hook to use ARIA context
export const useARIA = (): ARIAContextType => {
  const context = useContext(ARIAContext);
  if (!context) {
    throw new Error('useARIA must be used within an ARIAProvider');
  }
  return context;
};

// Hook for ARIA element registration
export const useARIAElement = (prefix?: string) => {
  const { generateId, registerElement, unregisterElement } = useARIA();
  const [id] = useState(() => generateId(prefix));

  const ref = useCallback((element: HTMLElement | null) => {
    if (element) {
      registerElement(id, element);
    } else {
      unregisterElement(id);
    }
  }, [id, registerElement, unregisterElement]);

  return { id, ref };
};

// Hook for ARIA announcements
export const useARIAAnnounce = () => {
  const { announce } = useARIA();
  return announce;
};

// Hook for focus management
export const useARIAFocus = () => {
  const { setFocus, trapFocus, releaseFocus } = useARIA();
  return { setFocus, trapFocus, releaseFocus };
};

// Hook for accessibility preferences
export const useAccessibilityPreferences = () => {
  const { prefersReducedMotion, prefersHighContrast, prefersColorScheme } = useARIA();
  return { prefersReducedMotion, prefersHighContrast, prefersColorScheme };
};

export default ARIAProvider;
