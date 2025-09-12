import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Loader,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Database,
  Search,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  variant = 'default',
  showPercentage = true,
  animated = true,
  className = '',
  label
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-4';
      default:
        return 'h-3';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-[#3A8FCD]';
    }
  };

  const getVariantTextColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-[#3A8FCD]';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className={cn("text-sm font-medium", getVariantTextColor())}>
              {Math.round(displayProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        getSizeStyles()
      )}>
        <motion.div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            getVariantStyles()
          )}
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: animated ? 0.5 : 0 }}
        />
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bounce';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  if (variant === 'dots') {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-current rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn(
          "rounded-full bg-current",
          getSizeStyles(),
          className
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity
        }}
      />
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-current rounded-full"
            animate={{
              y: [0, -10, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "border-2 border-gray-300 border-t-current rounded-full",
        getSizeStyles(),
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

interface OperationProgressProps {
  operation: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  details?: string;
  onCancel?: () => void;
  className?: string;
}

export const OperationProgress: React.FC<OperationProgressProps> = ({
  operation,
  progress,
  status,
  message,
  details,
  onCancel,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'running':
        return Loader;
      case 'completed':
        return CheckCircle;
      case 'error':
        return XCircle;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-[#3A8FCD]';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  const getOperationIcon = () => {
    switch (operation.toLowerCase()) {
      case 'upload':
        return Upload;
      case 'download':
        return Download;
      case 'sync':
        return Database;
      case 'search':
        return Search;
      case 'process':
        return Zap;
      case 'analyze':
        return TrendingUp;
      default:
        return Loader;
    }
  };

  const StatusIcon = getStatusIcon();
  const OperationIcon = getOperationIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <OperationIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900 capitalize">{operation}</span>
        </div>
        
        <div className="flex-1" />
        
        <div className={cn("flex items-center gap-1", getStatusColor())}>
          <StatusIcon className={cn(
            "w-4 h-4",
            status === 'running' && "animate-spin"
          )} />
          <span className="text-sm font-medium capitalize">{status}</span>
        </div>
      </div>

      {message && (
        <p className="text-sm text-gray-600 mb-3">{message}</p>
      )}

      <ProgressBar
        progress={progress}
        variant={status === 'error' ? 'error' : status === 'completed' ? 'success' : 'default'}
        showPercentage={true}
        animated={true}
      />

      {details && (
        <p className="text-xs text-gray-500 mt-2">{details}</p>
      )}

      {onCancel && status === 'running' && (
        <div className="flex justify-end mt-3">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
};

interface MultiStepProgressProps {
  steps: {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'current' | 'completed' | 'error';
  }[];
  className?: string;
}

export const MultiStepProgress: React.FC<MultiStepProgressProps> = ({
  steps,
  className = ''
}) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isError = step.status === 'error';
          const isPending = step.status === 'pending';

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="relative">
                <motion.div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-[#3A8FCD] border-[#3A8FCD] text-white",
                    isError && "bg-red-500 border-red-500 text-white",
                    isPending && "bg-white border-gray-300 text-gray-400"
                  )}
                  animate={{
                    scale: isCurrent ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isCurrent ? Infinity : 0,
                    repeatDelay: 1
                  }}
                >
                  {isCompleted && <CheckCircle className="w-4 h-4" />}
                  {isError && <XCircle className="w-4 h-4" />}
                  {isCurrent && <Loader className="w-4 h-4 animate-spin" />}
                  {isPending && <span className="text-sm font-medium">{index + 1}</span>}
                </motion.div>
              </div>

              {/* Step Content */}
              <div className="ml-3 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-green-600",
                  isCurrent && "text-[#3A8FCD]",
                  isError && "text-red-600",
                  isPending && "text-gray-500"
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500">{step.description}</p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-200 relative">
                    <motion.div
                      className="h-full bg-[#3A8FCD]"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: isCompleted ? '100%' : '0%' 
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressIndicatorComponents = {
  ProgressBar,
  LoadingSpinner,
  OperationProgress,
  MultiStepProgress
};

export default ProgressIndicatorComponents;
