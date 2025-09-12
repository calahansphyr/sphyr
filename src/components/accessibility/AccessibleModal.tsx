import React, { useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  trapFocus?: boolean;
  restoreFocus?: boolean;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  description,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  initialFocusRef,
  trapFocus = true,
  restoreFocus = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Handle focus management
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Get all focusable elements
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current = focusableElements[focusableElements.length - 1];
    }

    // Set initial focus
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    } else {
      modal.focus();
    }

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      if (!trapFocus) return;

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableRef.current) {
            event.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableRef.current) {
            event.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape, trapFocus, restoreFocus, initialFocusRef]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-full h-full';
      default:
        return 'max-w-lg';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleOverlayClick}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative bg-white rounded-xl shadow-2xl w-full",
              getSizeClasses(),
              className
            )}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                  {title}
                </h2>
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:ring-offset-2"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  type?: 'alert' | 'confirm' | 'info';
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
      variant?: 'default' | 'destructive';
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  className?: string;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
  actions,
  className = ''
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'alert':
        return AlertCircle;
      case 'confirm':
        return AlertCircle;
      case 'info':
        return AlertCircle;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'alert':
        return 'text-red-600';
      case 'confirm':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className={className}
    >
      <div className="flex items-start gap-4">
        <div className={cn("flex-shrink-0", getTypeColor())}>
          <TypeIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-700 mb-6">
            {children}
          </div>
          
          {actions && (
            <div className="flex justify-end gap-3">
              {actions.secondary && (
                <button
                  onClick={actions.secondary.onClick}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:ring-offset-2 transition-colors"
                >
                  {actions.secondary.label}
                </button>
              )}
              {actions.primary && (
                <button
                  onClick={actions.primary.onClick}
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
                    actions.primary.variant === 'destructive'
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-[#3A8FCD] hover:bg-[#4D70B6] focus:ring-[#3A8FCD]"
                  )}
                >
                  {actions.primary.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AccessibleModal>
  );
};

const AccessibleModalComponents = {
  AccessibleModal,
  AccessibleDialog
};

export default AccessibleModalComponents;
