import type { AppProps } from 'next/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { initializeMonitoring } from '@/lib/monitoring';
import React, { useEffect } from 'react';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps): React.JSX.Element {
  // Initialize monitoring service on app start
  useEffect(() => {
    initializeMonitoring().catch(console.error);
  }, []);

  return (
    <ErrorBoundary
      maxRetries={3}
      resetOnPropsChange={true}
      resetKeys={[Component.name, JSON.stringify(pageProps)]}
      onError={(error, errorInfo) => {
        // Additional error handling can be added here
        console.error('App-level error caught by ErrorBoundary:', error, errorInfo);
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
