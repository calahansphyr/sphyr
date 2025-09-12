import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseLazyLoadingReturn<T extends HTMLElement = HTMLElement> {
  isVisible: boolean;
  ref: React.RefObject<T | null>;
  hasTriggered: boolean;
}

export function useLazyLoading<T extends HTMLElement = HTMLElement>(
  options: UseLazyLoadingOptions = {}
): UseLazyLoadingReturn<T> {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<T>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          setHasTriggered(true);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    },
    [triggerOnce]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleIntersection, threshold, rootMargin]);

  return {
    isVisible: triggerOnce ? hasTriggered : isVisible,
    ref,
    hasTriggered
  };
}

// Hook for lazy loading images
export function useLazyImage<T extends HTMLElement = HTMLDivElement>(src: string, options?: UseLazyLoadingOptions) {
  const { isVisible, ref } = useLazyLoading<T>(options);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setHasError(false);
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(false);
      };
      
      img.src = src;
    }
  }, [isVisible, src]);

  return {
    ref,
    imageSrc,
    isLoaded,
    hasError,
    isVisible
  };
}

// Hook for lazy loading components
export function useLazyComponent<T>(
  importFn: () => Promise<T>,
  options?: UseLazyLoadingOptions
) {
  const { isVisible, ref } = useLazyLoading(options);
  const [component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !component && !isLoading) {
      setIsLoading(true);
      setHasError(false);
      
      importFn()
        .then((loadedComponent) => {
          setComponent(loadedComponent);
          setIsLoading(false);
        })
        .catch((error) => {
          logger.error('Failed to load component', error as Error, {
            operation: 'lazyLoadComponent',
            componentName: component
          });
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isVisible, component, isLoading, importFn]);

  return {
    ref,
    component,
    isLoading,
    hasError,
    isVisible
  };
}
