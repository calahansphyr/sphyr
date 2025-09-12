import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useReducedMotion } from '@/lib/accessibility/ReducedMotion';

interface MotionSafeWrapperProps extends Omit<MotionProps, 'children'> {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const MotionSafeWrapper: React.FC<MotionSafeWrapperProps> = ({
  children,
  fallback,
  className = '',
  ...motionProps
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={className}>
        {fallback || children}
      </div>
    );
  }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  );
};

export default MotionSafeWrapper;
