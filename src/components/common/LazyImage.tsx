import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLazyImage } from '@/hooks/useLazyLoading';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  fallback,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true
}) => {
  const { ref, imageSrc, isLoaded, hasError } = useLazyImage(src, {
    threshold,
    rootMargin,
    triggerOnce
  });

  const [showPlaceholder, setShowPlaceholder] = useState(true);

  React.useEffect(() => {
    if (isLoaded) {
      setShowPlaceholder(false);
      onLoad?.();
    }
  }, [isLoaded, onLoad]);

  React.useEffect(() => {
    if (hasError) {
      setShowPlaceholder(false);
      onError?.();
    }
  }, [hasError, onError]);

  if (hasError) {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-center bg-background-secondary text-text-muted ${className}`}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-2 p-4">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm">Failed to load image</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {showPlaceholder && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center bg-background-secondary"
        >
          {placeholder ? (
            <Image
              src={placeholder}
              alt=""
              fill
              className="object-cover opacity-50"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-muted">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">Loading image...</span>
            </div>
          )}
        </motion.div>
      )}
      
      {imageSrc && (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
};

export default LazyImage;
