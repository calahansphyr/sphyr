import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/context/OnboardingContext';

export const OnboardingFlow: React.FC = () => {
  const {
    currentStep,
    totalSteps,
    isOnboarding,
    steps,
    progress,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    data
  } = useOnboarding();

  if (!isOnboarding) return null;

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData?.component;

  if (!CurrentStepComponent) return null;

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      previousStep();
    }
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background-primary"
    >
      {/* Header */}
      <div className="bg-background-secondary border-b border-border-light">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-sm">S</span>
              </div>
              <h1 className="text-xl font-bold text-text-primary">Sphyr Setup</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <div className="w-32">
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="w-4 h-4 mr-2" />
                Skip Setup
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <CurrentStepComponent
            key={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onComplete={completeOnboarding}
            isFirst={currentStep === 0}
            isLast={currentStep === totalSteps - 1}
            progress={progress}
            data={data}
            onUpdate={() => {
              // This will be handled by the context
            }}
          />
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-background-secondary border-t border-border-light">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">
              {currentStepData?.description}
            </div>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={handleNext}
                className="min-w-[100px]"
              >
                {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
                {currentStep < totalSteps - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
