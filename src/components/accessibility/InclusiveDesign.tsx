import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Contrast, Type, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  colorBlindFriendly: boolean;
  focusVisible: boolean;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
  defaultPreferences?: Partial<AccessibilityPreferences>;
}

const AccessibilityContext = React.createContext<{
  preferences: AccessibilityPreferences;
  updatePreference: (key: keyof AccessibilityPreferences, value: boolean) => void;
  resetPreferences: () => void;
} | undefined>(undefined);

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  defaultPreferences = {}
}) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    colorBlindFriendly: false,
    focusVisible: true,
    ...defaultPreferences
  });

  const updatePreference = (key: keyof AccessibilityPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      colorBlindFriendly: false,
      focusVisible: true
    });
  };

  // Apply accessibility preferences to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (preferences.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Color blind friendly
    if (preferences.colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }

    // Focus visible
    if (preferences.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [preferences]);

  return (
    <AccessibilityContext.Provider value={{
      preferences,
      updatePreference,
      resetPreferences
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const { preferences, updatePreference, resetPreferences } = useAccessibility();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className={cn(
            "fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto",
            className
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Accessibility Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close accessibility panel"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Contrast className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">High Contrast</h3>
                    <p className="text-sm text-gray-600">Increase color contrast for better visibility</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('highContrast', !preferences.highContrast)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    preferences.highContrast ? "bg-[#3A8FCD]" : "bg-gray-200"
                  )}
                  role="switch"
                  aria-checked={preferences.highContrast}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      preferences.highContrast ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Large Text */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Large Text</h3>
                    <p className="text-sm text-gray-600">Increase text size for better readability</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('largeText', !preferences.largeText)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    preferences.largeText ? "bg-[#3A8FCD]" : "bg-gray-200"
                  )}
                  role="switch"
                  aria-checked={preferences.largeText}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      preferences.largeText ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Reduce Motion</h3>
                    <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    preferences.reducedMotion ? "bg-[#3A8FCD]" : "bg-gray-200"
                  )}
                  role="switch"
                  aria-checked={preferences.reducedMotion}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      preferences.reducedMotion ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Color Blind Friendly */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Color Blind Friendly</h3>
                    <p className="text-sm text-gray-600">Use patterns and shapes instead of colors</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('colorBlindFriendly', !preferences.colorBlindFriendly)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    preferences.colorBlindFriendly ? "bg-[#3A8FCD]" : "bg-gray-200"
                  )}
                  role="switch"
                  aria-checked={preferences.colorBlindFriendly}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      preferences.colorBlindFriendly ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Focus Visible */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Enhanced Focus</h3>
                    <p className="text-sm text-gray-600">Show focus indicators for keyboard navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePreference('focusVisible', !preferences.focusVisible)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    preferences.focusVisible ? "bg-[#3A8FCD]" : "bg-gray-200"
                  )}
                  role="switch"
                  aria-checked={preferences.focusVisible}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      preferences.focusVisible ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={resetPreferences}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3A8FCD] focus:ring-offset-2 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ColorBlindFriendlyBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const ColorBlindFriendlyBadge: React.FC<ColorBlindFriendlyBadgeProps> = ({
  status,
  children,
  className = ''
}) => {
  const { preferences } = useAccessibility();

  const getStatusStyles = () => {
    if (preferences.colorBlindFriendly) {
      // Use patterns and shapes instead of colors
      switch (status) {
        case 'success':
          return 'bg-green-50 border-green-200 text-green-800 before:content-["✓"] before:mr-2';
        case 'error':
          return 'bg-red-50 border-red-200 text-red-800 before:content-["✗"] before:mr-2';
        case 'warning':
          return 'bg-yellow-50 border-yellow-200 text-yellow-800 before:content-["⚠"] before:mr-2';
        case 'info':
          return 'bg-blue-50 border-blue-200 text-blue-800 before:content-["ℹ"] before:mr-2';
      }
    } else {
      // Use colors
      switch (status) {
        case 'success':
          return 'bg-green-50 border-green-200 text-green-800';
        case 'error':
          return 'bg-red-50 border-red-200 text-red-800';
        case 'warning':
          return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        case 'info':
          return 'bg-blue-50 border-blue-200 text-blue-800';
      }
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStatusStyles(),
        className
      )}
    >
      {children}
    </span>
  );
};

interface HighContrastButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const HighContrastButton: React.FC<HighContrastButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  const { preferences } = useAccessibility();

  const getVariantClasses = () => {
    if (preferences.highContrast) {
      switch (variant) {
        case 'primary':
          return 'bg-black text-white border-2 border-black hover:bg-white hover:text-black';
        case 'secondary':
          return 'bg-white text-black border-2 border-black hover:bg-black hover:text-white';
        case 'ghost':
          return 'bg-transparent text-black border-2 border-black hover:bg-black hover:text-white';
      }
    } else {
      switch (variant) {
        case 'primary':
          return 'bg-[#3A8FCD] text-white hover:bg-[#4D70B6]';
        case 'secondary':
          return 'bg-gray-100 text-gray-900 hover:bg-gray-200';
        case 'ghost':
          return 'bg-transparent text-gray-700 hover:bg-gray-100';
      }
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A8FCD] disabled:opacity-50 disabled:cursor-not-allowed",
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
    >
      {children}
    </button>
  );
};

const InclusiveDesignComponents = {
  AccessibilityProvider,
  useAccessibility,
  AccessibilityPanel,
  ColorBlindFriendlyBadge,
  HighContrastButton
};

export default InclusiveDesignComponents;
