// Performance utilities exports
export { 
  performanceMonitor, 
  defaultThresholds 
} from './PerformanceMonitor';
export type { 
  PerformanceMetrics, 
  PerformanceThresholds
} from './PerformanceMonitor';
export { 
  usePerformanceMonitoring, 
  usePerformanceMeasurement, 
  useInteractionTracking 
} from '../../hooks/usePerformanceMonitoring';
export { 
  createLazyComponent, 
  createLazyRoute, 
  createLazyFeature, 
  preloadComponent, 
  preloadComponents, 
  analyzeBundle, 
  checkPerformanceBudget, 
  getUnusedExports, 
  getOptimizationSuggestions, 
  dynamicImport, 
  ComponentPreloader, 
  componentPreloader 
} from './CodeSplitting';
export { 
  apiCache, 
  cachedFetch, 
  CacheInvalidation, 
  CacheWarmer, 
  CacheAnalytics 
} from './APICache';
