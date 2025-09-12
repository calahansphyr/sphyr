import React, { createContext, useContext, useState, useEffect } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or component ref
  action?: () => void;
  completed?: boolean;
}

export interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  isOnboarding: boolean;
  steps: OnboardingStep[];
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  goToStep: (step: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
  steps: OnboardingStep[];
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children, steps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('sphyr-onboarding-completed');
    if (!hasCompletedOnboarding) {
      setIsOnboarding(true);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('sphyr-onboarding-completed', 'true');
    setIsOnboarding(false);
    setCurrentStep(0);
  };

  const skipOnboarding = () => {
    localStorage.setItem('sphyr-onboarding-completed', 'true');
    setIsOnboarding(false);
    setCurrentStep(0);
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const value: OnboardingContextType = {
    currentStep,
    totalSteps: steps.length,
    isOnboarding,
    steps,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    goToStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
