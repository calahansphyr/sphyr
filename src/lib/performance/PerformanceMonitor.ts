// Performance monitoring and metrics collection
import { userBehaviorTracker } from '@/lib/analytics/UserBehaviorTracker';
import { logger } from '@/lib/logger';
import { PERFORMANCE_THRESHOLDS } from '../constants';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  componentRenderTime?: number;
  apiResponseTime?: number;
  searchResponseTime?: number;
  
  // Resource metrics
  bundleSize?: number;
  imageLoadTime?: number;
  fontLoadTime?: number;
  
  // User interaction metrics
  clickResponseTime?: number;
  scrollPerformance?: number;
  keyboardResponseTime?: number;
  
  // Memory metrics
  memoryUsage?: number;
  heapSize?: number;
  
  // Network metrics
  networkLatency?: number;
  bandwidth?: number;
}

export interface PerformanceThresholds {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1.8s
  ttfb: number; // 600ms
  pageLoadTime: number; // 3s
  componentRenderTime: number; // 100ms
  apiResponseTime: number; // 500ms
  searchResponseTime: number; // 1s
  clickResponseTime: number; // 100ms
}

export const defaultThresholds: PerformanceThresholds = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  fcp: 1800,
  ttfb: PERFORMANCE_THRESHOLDS.TTFB,
  pageLoadTime: PERFORMANCE_THRESHOLDS.PAGE_LOAD_TIME,
  componentRenderTime: PERFORMANCE_THRESHOLDS.COMPONENT_RENDER_TIME,
  apiResponseTime: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME,
  searchResponseTime: PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME,
  clickResponseTime: PERFORMANCE_THRESHOLDS.CLICK_RESPONSE_TIME
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor(thresholds: PerformanceThresholds = defaultThresholds) {
    this.thresholds = thresholds;
  }

  // Initialize performance monitoring
  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupCoreWebVitals();
    this.setupCustomMetrics();
    this.setupResourceMonitoring();
    this.setupMemoryMonitoring();
    this.setupNetworkMonitoring();

    this.isInitialized = true;
  }

  // Setup Core Web Vitals monitoring
  private setupCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.checkThreshold('lcp', this.metrics.lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fid = (entry as PerformanceEntry & { processingStart: number }).processingStart - entry.startTime;
          this.checkThreshold('fid', this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
            clsValue += (entry as PerformanceEntry & { value: number }).value;
          }
        });
        this.metrics.cls = clsValue;
        this.checkThreshold('cls', this.metrics.cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }

    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fcp = entry.startTime;
          this.checkThreshold('fcp', this.metrics.fcp);
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    }
  }

  // Setup custom metrics monitoring
  private setupCustomMetrics(): void {
    // Page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.checkThreshold('pageLoadTime', this.metrics.pageLoadTime);
    });

    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.ttfb = navigation.responseStart - navigation.fetchStart;
      this.checkThreshold('ttfb', this.metrics.ttfb);
    });
  }

  // Setup resource monitoring
  private setupResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('.js') || entry.name.includes('.css')) {
            this.metrics.bundleSize = (entry as PerformanceEntry & { transferSize: number }).transferSize;
          }
          if (entry.name.includes('.jpg') || entry.name.includes('.png') || entry.name.includes('.webp')) {
            this.metrics.imageLoadTime = entry.duration;
          }
          if (entry.name.includes('.woff') || entry.name.includes('.woff2')) {
            this.metrics.fontLoadTime = entry.duration;
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  // Setup memory monitoring
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      this.metrics.heapSize = memory.totalJSHeapSize;
    }
  }

  // Setup network monitoring
  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: { effectiveType: string; downlink: number; rtt: number } }).connection;
      this.metrics.networkLatency = connection.rtt;
      this.metrics.bandwidth = connection.downlink;
    }
  }

  // Check if metric exceeds threshold
  private checkThreshold(metric: keyof PerformanceThresholds, value: number): void {
    if (value > this.thresholds[metric]) {
      this.reportPerformanceIssue(metric, value, this.thresholds[metric]);
    }
  }

  // Report performance issue
  private reportPerformanceIssue(metric: string, actual: number, threshold: number): void {
    const issue = {
      type: 'performance_issue',
      metric,
      actual,
      threshold,
      severity: actual > threshold * 2 ? 'high' : 'medium',
      timestamp: Date.now()
    };

    // Log performance issue
    logger.warn(`Performance issue detected: ${metric}`, {
      operation: 'detectPerformanceIssue',
      metric,
      actual,
      threshold,
      severity: issue.severity
    });

    // Track with analytics
    userBehaviorTracker.trackEvent('performance', {
      metric,
      actual,
      threshold,
      severity: issue.severity,
      event_type: 'performance_issue'
    });
  }

  // Measure component render time
  public measureComponentRender(componentName: string, renderFn: () => void): void {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    const renderTime = end - start;
    
    this.metrics.componentRenderTime = renderTime;
    this.checkThreshold('componentRenderTime', renderTime);
    
    userBehaviorTracker.trackEvent('performance', {
      component: componentName,
      renderTime,
      event_type: 'component_render'
    });
  }

  // Measure API response time
  public measureAPIResponse(url: string, responseTime: number): void {
    this.metrics.apiResponseTime = responseTime;
    this.checkThreshold('apiResponseTime', responseTime);
    
    userBehaviorTracker.trackEvent('performance', {
      url,
      responseTime,
      event_type: 'api_response'
    });
  }

  // Measure search response time
  public measureSearchResponse(query: string, responseTime: number): void {
    this.metrics.searchResponseTime = responseTime;
    this.checkThreshold('searchResponseTime', responseTime);
    
    userBehaviorTracker.trackEvent('performance', {
      query,
      responseTime,
      event_type: 'search_response'
    });
  }

  // Measure click response time
  public measureClickResponse(element: string, responseTime: number): void {
    this.metrics.clickResponseTime = responseTime;
    this.checkThreshold('clickResponseTime', responseTime);
    
    userBehaviorTracker.trackEvent('performance', {
      element,
      responseTime,
      event_type: 'click_response'
    });
  }

  // Get current metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance score
  public getPerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;
    
    // Deduct points for each metric that exceeds threshold
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics];
      if (value && value > threshold) {
        const penalty = Math.min(20, (value - threshold) / threshold * 10);
        score -= penalty;
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  // Get performance report
  public getPerformanceReport(): {
    score: number;
    metrics: PerformanceMetrics;
    issues: Array<{ metric: string; actual: number; threshold: number; severity: string }>;
  } {
    const metrics = this.getMetrics();
    const issues: Array<{ metric: string; actual: number; threshold: number; severity: string }> = [];
    
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics];
      if (value && value > threshold) {
        issues.push({
          metric,
          actual: value,
          threshold,
          severity: value > threshold * 2 ? 'high' : 'medium'
        });
      }
    });
    
    return {
      score: this.getPerformanceScore(),
      metrics,
      issues
    };
  }

  // Cleanup observers
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize automatically
if (typeof window !== 'undefined') {
  performanceMonitor.initialize();
}

export default performanceMonitor;
