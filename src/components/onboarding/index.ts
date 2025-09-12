/**
 * Onboarding Components Index
 * Central export point for all onboarding components
 */

export { OnboardingFlow } from './OnboardingFlow';
export { WelcomeStep, IntegrationsStep, PreferencesStep } from './OnboardingSteps';
export { useOnboarding } from '@/context/OnboardingContext';
export type { OnboardingStep, OnboardingStepProps, OnboardingData } from '@/context/OnboardingContext';