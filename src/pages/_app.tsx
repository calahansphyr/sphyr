import type { AppProps } from 'next/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { initializeMonitoring } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import React, { useEffect } from 'react';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps): React.JSX.Element {
  // Initialize monitoring service on app start
  useEffect(() => {
    initializeMonitoring().catch((error) => {
      logger.error('Failed to initialize monitoring service on app start', error, {
        operation: 'app_initialization',
        service: 'monitoring',
        component: '_app'
      });
    });
  }, []);

  return (
    <ErrorBoundary
      maxRetries={3}
      resetOnPropsChange={true}
      resetKeys={[Component.name, JSON.stringify(pageProps)]}
      onError={(error, errorInfo) => {
        // Additional error handling can be added here
        logger.error('App-level error caught by ErrorBoundary', error, {
          operation: 'error_boundary_catch',
          component: '_app',
          errorInfo: errorInfo
        });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Component {...pageProps} />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
