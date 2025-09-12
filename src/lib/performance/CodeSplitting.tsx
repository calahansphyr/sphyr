// Code splitting and bundle optimization utilities
import React, { ComponentType, lazy, Suspense } from 'react';

export interface CodeSplittingOptions {
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  retry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  preload?: boolean;
  preloadDelay?: number;
}

// Default loading component
const DefaultLoading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
  </div>
);

// Default error component
const DefaultError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-500 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to load component</h3>
    <p className="text-text-secondary mb-4">{error.message}</p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
    >
      Retry
    </button>
  </div>
);

// Enhanced lazy loading with error handling and retry
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: CodeSplittingOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const {
    fallback = <DefaultLoading />,
    error: ErrorComponent = DefaultError,
    retry = true,
    maxRetries = 3,
    retryDelay = 1000,
    preload = false,
    preloadDelay = 2000
  } = options;

  let retryCount = 0;
  let isPreloaded = false;

  // Preload component after delay
  if (preload && typeof window !== 'undefined') {
    setTimeout(() => {
      if (!isPreloaded) {
        importFn().catch(() => {
          // Ignore preload errors
        });
        isPreloaded = true;
      }
    }, preloadDelay);
  }

  const LazyComponent = lazy(async () => {
    try {
      const moduleData = await importFn();
      isPreloaded = true;
      return moduleData;
    } catch (error) {
      if (retry && retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
        return importFn();
      }
      throw error;
    }
  });

  return function WrappedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Route-based code splitting
export function createLazyRoute<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: CodeSplittingOptions = {}
): ComponentType<React.ComponentProps<T>> {
  return createLazyComponent(importFn, {
    ...options,
    preload: true,
    preloadDelay: 1000
  });
}

// Feature-based code splitting
export function createLazyFeature<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: CodeSplittingOptions = {}
): ComponentType<React.ComponentProps<T>> {
  return createLazyComponent(importFn, {
    ...options,
    preload: true,
    preloadDelay: 5000
  });
}

// Component-based code splitting (alias for createLazyComponent)
export const createLazyComponentAlias = createLazyComponent;

// Utility for preloading components
export function preloadComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFn();
}

// Utility for preloading multiple components
export function preloadComponents(
  importFns: Array<() => Promise<unknown>>
): Promise<unknown[]> {
  return Promise.all(importFns.map(fn => fn()));
}

// Bundle analyzer utility
export function analyzeBundle() {
  if (typeof window === 'undefined') return null;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  const images = Array.from(document.querySelectorAll('img[src]'));

  const bundleInfo = {
    scripts: scripts.map(script => ({
      src: script.getAttribute('src'),
      size: script.getAttribute('data-size') || 'unknown'
    })),
    stylesheets: stylesheets.map(link => ({
      href: link.getAttribute('href'),
      size: link.getAttribute('data-size') || 'unknown'
    })),
    images: images.map(img => ({
      src: img.getAttribute('src'),
      size: img.getAttribute('data-size') || 'unknown'
    }))
  };

  return bundleInfo;
}

// Performance budget checker
export function checkPerformanceBudget(thresholds: {
  maxBundleSize?: number;
  maxImageSize?: number;
  maxFontSize?: number;
  maxCSSSize?: number;
}) {
  if (typeof window === 'undefined') return null;

  const resources = performance.getEntriesByType('resource');
  const violations: Array<{ type: string; url: string; size: number; threshold: number }> = [];

  resources.forEach(resource => {
    const url = resource.name;
    const size = (resource as PerformanceEntry & { transferSize?: number }).transferSize || 0;

    if (url.includes('.js') && thresholds.maxBundleSize && size > thresholds.maxBundleSize) {
      violations.push({
        type: 'bundle',
        url,
        size,
        threshold: thresholds.maxBundleSize
      });
    }

    if (url.includes('.css') && thresholds.maxCSSSize && size > thresholds.maxCSSSize) {
      violations.push({
        type: 'css',
        url,
        size,
        threshold: thresholds.maxCSSSize
      });
    }

    if (url.includes('.woff') && thresholds.maxFontSize && size > thresholds.maxFontSize) {
      violations.push({
        type: 'font',
        url,
        size,
        threshold: thresholds.maxFontSize
      });
    }

    if ((url.includes('.jpg') || url.includes('.png') || url.includes('.webp')) && 
        thresholds.maxImageSize && size > thresholds.maxImageSize) {
      violations.push({
        type: 'image',
        url,
        size,
        threshold: thresholds.maxImageSize
      });
    }
  });

  return violations;
}

// Tree shaking utility
export function getUnusedExports(moduleExports: string[], usedExports: string[]): string[] {
  return moduleExports.filter(exportName => !usedExports.includes(exportName));
}

// Bundle size optimization suggestions
export function getOptimizationSuggestions(bundleInfo: Record<string, unknown>): string[] {
  const suggestions: string[] = [];

  if (bundleInfo.scripts.length > 10) {
    suggestions.push('Consider code splitting to reduce the number of JavaScript bundles');
  }

  if (bundleInfo.images.some((img: { size: number }) => img.size > 1000000)) {
    suggestions.push('Optimize large images or use WebP format');
  }

  if (bundleInfo.stylesheets.length > 5) {
    suggestions.push('Consider consolidating CSS files');
  }

  return suggestions;
}

// Dynamic import with error handling
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  options: { retries?: number; delay?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 1000 } = options;
  let lastError: Error;

  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
}

// Component preloader
export class ComponentPreloader {
  private preloadedComponents = new Set<string>();
  private preloadQueue: Array<() => Promise<unknown>> = [];

  public preload(componentName: string, importFn: () => Promise<unknown>): void {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    this.preloadedComponents.add(componentName);
    this.preloadQueue.push(importFn);
  }

  public async executePreload(): Promise<void> {
    const promises = this.preloadQueue.map(fn => fn().catch(() => {
      // Ignore preload errors
    }));

    await Promise.all(promises);
    this.preloadQueue = [];
  }

  public isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }
}

// Create singleton preloader
export const componentPreloader = new ComponentPreloader();

const CodeSplittingModule = {
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
};

export default CodeSplittingModule;
