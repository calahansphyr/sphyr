import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/context/AuthContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { initializeMonitoring } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import React, { useEffect } from 'react';
import '@/styles/globals.css';

// Define onboarding steps
import { WelcomeStep, IntegrationsStep, PreferencesStep } from '@/components/onboarding/OnboardingSteps';

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with Sphyr',
    component: WelcomeStep,
    isRequired: true,
    estimatedTime: 2
  },
  {
    id: 'integrations',
    title: 'Connect Integrations',
    description: 'Link your data sources',
    component: IntegrationsStep,
    isRequired: true,
    estimatedTime: 3
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Customize your experience',
    component: PreferencesStep,
    isRequired: false,
    estimatedTime: 1
  }
];

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
    <>
      <Head>
        <title>Sphyr - AI-Powered Search</title>
        <meta name="description" content="Search across all your connected business tools and integrations with the power of AI. Find anything, anywhere, instantly." />
      </Head>
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
            <OnboardingProvider steps={onboardingSteps}>
              <Component {...pageProps} />
              <ReactQueryDevtools initialIsOpen={false} />
            </OnboardingProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </>
  );
}
