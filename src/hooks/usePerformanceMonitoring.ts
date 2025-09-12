import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/lib/performance/PerformanceMonitor';

export interface UsePerformanceMonitoringOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackInteractions?: boolean;
  trackAPI?: boolean;
  trackSearch?: boolean;
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    componentName = 'Unknown',
    trackRenders = true,
    trackInteractions = true,
    trackAPI = true,
    trackSearch = true
  } = options;

  const renderStartRef = useRef<number>(0);
  const interactionStartRef = useRef<number>(0);

  // Track component render time
  const trackRender = useCallback((renderFn: () => void) => {
    if (trackRenders) {
      performanceMonitor.measureComponentRender(componentName, renderFn);
    }
  }, [componentName, trackRenders]);

  // Track interaction response time
  const trackInteraction = useCallback((interactionType: string, element?: string) => {
    if (trackInteractions && interactionStartRef.current > 0) {
      const responseTime = performance.now() - interactionStartRef.current;
      performanceMonitor.measureClickResponse(element || interactionType, responseTime);
      interactionStartRef.current = 0;
    }
  }, [trackInteractions]);

  // Start tracking interaction
  const startTrackingInteraction = useCallback(() => {
    if (trackInteractions) {
      interactionStartRef.current = performance.now();
    }
  }, [trackInteractions]);

  // Track API response time
  const trackAPIResponse = useCallback((url: string, responseTime: number) => {
    if (trackAPI) {
      performanceMonitor.measureAPIResponse(url, responseTime);
    }
  }, [trackAPI]);

  // Track search response time
  const trackSearchResponse = useCallback((query: string, responseTime: number) => {
    if (trackSearch) {
      performanceMonitor.measureSearchResponse(query, responseTime);
    }
  }, [trackSearch]);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    return performanceMonitor.getMetrics();
  }, []);

  // Get performance score
  const getPerformanceScore = useCallback(() => {
    return performanceMonitor.getPerformanceScore();
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return performanceMonitor.getPerformanceReport();
  }, []);

  // Track component mount
  useEffect(() => {
    if (trackRenders) {
      renderStartRef.current = performance.now();
    }
  }, [trackRenders]);

  // Track component unmount
  useEffect(() => {
    return () => {
      if (trackRenders && renderStartRef.current > 0) {
        // const renderTime = performance.now() - renderStartRef.current;
        performanceMonitor.measureComponentRender(componentName, () => {});
      }
    };
  }, [componentName, trackRenders]);

  return {
    trackRender,
    trackInteraction,
    startTrackingInteraction,
    trackAPIResponse,
    trackSearchResponse,
    getMetrics,
    getPerformanceScore,
    getPerformanceReport
  };
}

// Hook for measuring specific operations
export function usePerformanceMeasurement() {
  const measure = useCallback((name: string, operation: () => void | Promise<void>) => {
    const start = performance.now();
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.then(() => {
        const end = performance.now();
        const duration = end - start;
        
        performanceMonitor.measureComponentRender(name, () => {});
        
        return duration;
      });
    } else {
      const end = performance.now();
      const duration = end - start;
      
      performanceMonitor.measureComponentRender(name, () => {});
      
      return duration;
    }
  }, []);

  const measureAsync = useCallback(async (name: string, operation: () => Promise<void>) => {
    const start = performance.now();
    
    await operation();
    
    const end = performance.now();
    const duration = end - start;
    
    performanceMonitor.measureComponentRender(name, () => {});
    
    return duration;
  }, []);

  return {
    measure,
    measureAsync
  };
}

// Hook for tracking user interactions
export function useInteractionTracking() {
  const startTracking = useCallback((interactionType: string) => {
    const start = performance.now();
    
    return {
      end: (element?: string) => {
        const end = performance.now();
        const responseTime = end - start;
        performanceMonitor.measureClickResponse(element || interactionType, responseTime);
      }
    };
  }, []);

  return {
    startTracking
  };
}

export default usePerformanceMonitoring;
