import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';
import { cn } from '@/lib/utils';

interface OnboardingOverlayProps {
  className?: string;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ className }) => {
  const {
    currentStep,
    totalSteps,
    isOnboarding,
    steps,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  if (!isOnboarding || !steps[currentStep]) {
    return null;
  }

  const currentStepData = steps[currentStep];

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
          className
        )}
      >
        {/* Spotlight effect */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#3A8FCD] rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentStepData.title}</h3>
                  <p className="text-sm text-gray-500">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                </div>
              </div>
              <button
                onClick={skipOnboarding}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Skip onboarding"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-[#3A8FCD] h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  currentStep === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex gap-2">
                <button
                  onClick={skipOnboarding}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-[#3A8FCD] text-white rounded-lg hover:bg-[#4D70B6] transition-colors"
                >
                  {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
                  {currentStep < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingOverlay;
