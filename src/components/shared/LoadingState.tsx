import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  type?: 'default' | 'search' | 'ai' | 'sync';
  message?: string;
  submessage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'default',
  message,
  submessage,
  className = "",
  size = 'md'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return Search;
      case 'ai':
        return Brain;
      case 'sync':
        return Zap;
      default:
        return Loader2;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'search':
        return 'Searching across your platforms...';
      case 'ai':
        return 'AI is analyzing your data...';
      case 'sync':
        return 'Syncing your integrations...';
      default:
        return 'Loading...';
    }
  };

  const getDefaultSubmessage = () => {
    switch (type) {
      case 'search':
        return 'This may take a few moments';
      case 'ai':
        return 'Processing your request with advanced AI';
      case 'sync':
        return 'Updating your connected apps';
      default:
        return '';
    }
  };

  const Icon = getIcon();
  const displayMessage = message || getDefaultMessage();
  const displaySubmessage = submessage || getDefaultSubmessage();

  const sizeClasses = {
    sm: {
      icon: 'h-6 w-6',
      message: 'text-base',
      submessage: 'text-sm',
      container: 'py-8'
    },
    md: {
      icon: 'h-8 w-8',
      message: 'text-lg',
      submessage: 'text-base',
      container: 'py-12'
    },
    lg: {
      icon: 'h-12 w-12',
      message: 'text-xl',
      submessage: 'text-lg',
      container: 'py-16'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        currentSize.container,
        className
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={cn(
          "text-[#3A8FCD] mb-4",
          currentSize.icon
        )}
      >
        <Icon className="h-full w-full" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={cn(
          "font-semibold text-gray-900 mb-2",
          currentSize.message
        )}
      >
        {displayMessage}
      </motion.h3>

      {displaySubmessage && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={cn(
            "text-gray-600 max-w-md",
            currentSize.submessage
          )}
        >
          {displaySubmessage}
        </motion.p>
      )}

      {/* Progress dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex items-center gap-2 mt-4"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-[#3A8FCD] rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default LoadingState;
