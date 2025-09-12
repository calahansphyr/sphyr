import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  Star,
  Bookmark,
  Share2,
  Download,
  Copy,
  ExternalLink,
  Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  feedback?: 'success' | 'error' | 'info';
  feedbackMessage?: string;
  hapticFeedback?: boolean;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  feedback,
  feedbackMessage,
  hapticFeedback = true
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const controls = useAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      default:
        return 'bg-[#3A8FCD] hover:bg-[#4D70B6] text-white border-[#3A8FCD]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };


  const handleClick = async () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Visual feedback
    setIsPressed(true);
    await controls.start({
      scale: 0.95,
      transition: { duration: 0.1 }
    });
    await controls.start({
      scale: 1,
      transition: { duration: 0.1 }
    });
    setIsPressed(false);

    // Show feedback message if provided
    if (feedback && feedbackMessage) {
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2000);
    }

    onClick?.();
  };

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled || loading}
        animate={controls}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A8FCD] disabled:opacity-50 disabled:cursor-not-allowed",
          getVariantStyles(),
          getSizeStyles(),
          className
        )}
      >
        {/* Loading Spinner */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Loader className="w-4 h-4 animate-spin" />
          </motion.div>
        )}

        {/* Button Content */}
        <motion.div
          animate={{ opacity: loading ? 0 : 1 }}
          className="flex items-center gap-2"
        >
          {children}
        </motion.div>

        {/* Ripple Effect */}
        {isPressed && (
          <motion.div
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white rounded-lg"
          />
        )}
      </motion.button>

      {/* Feedback Message */}
      <AnimatePresence>
        {showFeedback && feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
              {feedbackMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ReactionButtonProps {
  type: 'like' | 'dislike' | 'heart' | 'star' | 'bookmark';
  active?: boolean;
  count?: number;
  onToggle?: (active: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  type,
  active = false,
  count = 0,
  onToggle,
  size = 'md',
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();

  const getIcon = () => {
    switch (type) {
      case 'like':
        return ThumbsUp;
      case 'dislike':
        return ThumbsDown;
      case 'heart':
        return Heart;
      case 'star':
        return Star;
      case 'bookmark':
        return Bookmark;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const handleClick = async () => {
    setIsAnimating(true);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    // Animation
    await controls.start({
      scale: [1, 1.3, 1],
      rotate: [0, 10, -10, 0],
      transition: { duration: 0.3 }
    });

    setIsAnimating(false);
    onToggle?.(!active);
  };

  const Icon = getIcon();

  return (
    <motion.button
      onClick={handleClick}
      animate={controls}
      className={cn(
        "relative flex items-center justify-center rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
        active
          ? "bg-red-500 border-red-500 text-white"
          : "bg-white border-gray-300 text-gray-600 hover:border-gray-400",
        getSizeStyles(),
        className
      )}
    >
      <Icon className={cn(
        "transition-all duration-200",
        active && "fill-current"
      )} />
      
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        >
          {count}
        </motion.span>
      )}

      {/* Particle Effect */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [1, 0],
                x: Math.cos(i * 60 * Math.PI / 180) * 20,
                y: Math.sin(i * 60 * Math.PI / 180) * 20
              }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="absolute w-1 h-1 bg-red-500 rounded-full"
            />
          ))}
        </div>
      )}
    </motion.button>
  );
};

interface ActionButtonProps {
  type: 'share' | 'download' | 'copy' | 'external';
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
  tooltip?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  type,
  onClick,
  size = 'md',
  variant = 'default',
  className = '',
  tooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const controls = useAnimation();

  const getIcon = () => {
    switch (type) {
      case 'share':
        return Share2;
      case 'download':
        return Download;
      case 'copy':
        return Copy;
      case 'external':
        return ExternalLink;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-10 h-10';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-600';
      case 'outline':
        return 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-600';
      default:
        return 'bg-[#3A8FCD] hover:bg-[#4D70B6] text-white';
    }
  };

  const handleClick = async () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }

    // Animation
    await controls.start({
      scale: [1, 0.9, 1],
      transition: { duration: 0.2 }
    });

    onClick?.();
  };

  const Icon = getIcon();

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        animate={controls}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A8FCD]",
          getSizeStyles(),
          getVariantStyles(),
          className
        )}
      >
        <Icon className="w-4 h-4" />
      </motion.button>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
            {tooltip}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const InteractiveFeedbackComponents = {
  InteractiveButton,
  ReactionButton,
  ActionButton
};

export default InteractiveFeedbackComponents;
