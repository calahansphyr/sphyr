import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  isRequired: boolean;
  estimatedTime: number; // in minutes
  prerequisites?: string[];
}

export interface OnboardingStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

export interface OnboardingData {
  profile: {
    name: string;
    email: string;
    company: string;
    role: string;
    goals: string[];
  };
  integrations: {
    selected: string[];
    priority: string[];
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    dataSharing: boolean;
  };
}

export interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  isOnboarding: boolean;
  steps: OnboardingStep[];
  data: OnboardingData;
  progress: number;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  goToStep: (step: number) => void;
  updateData: (data: Partial<OnboardingData>) => void;
  startOnboarding: () => void;
}

// Context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Hook
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

// Provider Props
interface OnboardingProviderProps {
  children: ReactNode;
  steps: OnboardingStep[];
}

// Provider Component
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ 
  children, 
  steps 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    profile: {
      name: '',
      email: '',
      company: '',
      role: '',
      goals: []
    },
    integrations: {
      selected: [],
      priority: []
    },
    preferences: {
      theme: 'auto',
      notifications: true,
      dataSharing: true
    }
  });

  // Check if user has completed onboarding
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasCompletedOnboarding = localStorage.getItem('sphyr-onboarding-completed');
      const onboardingData = localStorage.getItem('sphyr-onboarding-data');
      
      if (!hasCompletedOnboarding) {
        setIsOnboarding(true);
      }
      
      if (onboardingData) {
        try {
          const parsedData = JSON.parse(onboardingData);
          setData(parsedData);
        } catch (error) {
          console.error('Failed to parse onboarding data:', error);
        }
      }
    }
  }, []);

  const progress = ((currentStep + 1) / steps.length) * 100;

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
    if (typeof window !== 'undefined') {
      localStorage.setItem('sphyr-onboarding-completed', 'true');
      localStorage.setItem('sphyr-onboarding-data', JSON.stringify(data));
    }
    setIsOnboarding(false);
    setCurrentStep(0);
  };

  const skipOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sphyr-onboarding-completed', 'true');
      localStorage.setItem('sphyr-onboarding-data', JSON.stringify(data));
    }
    setIsOnboarding(false);
    setCurrentStep(0);
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep(0);
  };

  const value: OnboardingContextType = {
    currentStep,
    totalSteps: steps.length,
    isOnboarding,
    steps,
    data,
    progress,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    goToStep,
    updateData,
    startOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
