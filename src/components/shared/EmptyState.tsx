import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-sm',
      container: 'py-8'
    },
    md: {
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base',
      container: 'py-12'
    },
    lg: {
      icon: 'h-16 w-16',
      title: 'text-2xl',
      description: 'text-lg',
      container: 'py-16'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        currentSize.container,
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={cn(
          "text-gray-400 mb-4",
          currentSize.icon
        )}
      >
        <Icon className="h-full w-full" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={cn(
          "font-semibold text-gray-900 mb-2",
          currentSize.title
        )}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className={cn(
          "text-gray-600 max-w-md",
          currentSize.description
        )}
      >
        {description}
      </motion.p>

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex items-center gap-3 mt-6"
        >
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-colors",
                action.variant === 'secondary'
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-[#3A8FCD] text-white hover:bg-[#4D70B6]"
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
