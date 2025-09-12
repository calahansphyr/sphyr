import React, { Suspense, lazy, ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 text-text-muted"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Loading...</span>
    </motion.div>
  </div>
);

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <DefaultFallback />,
  className = ''
}) => {
  return (
    <Suspense fallback={fallback}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={className}
      >
        {children}
      </motion.div>
    </Suspense>
  );
};

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function LazyLoadedComponent(props: P) {
    return (
      <LazyWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

// Note: createLazyComponent is now available from @/lib/performance/CodeSplitting
// This provides enhanced lazy loading with error handling and retry functionality

export default LazyWrapper;
