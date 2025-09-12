import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useARIA } from './ARIAProvider';
import { useAccessibilityPreferences } from './ARIAProvider';

interface SkipLink {
  id: string;
  label: string;
  target: string;
  description?: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultSkipLinks: SkipLink[] = [
  {
    id: 'skip-to-main',
    label: 'Skip to main content',
    target: 'main',
    description: 'Skip to the main content of the page'
  },
  {
    id: 'skip-to-navigation',
    label: 'Skip to navigation',
    target: 'navigation',
    description: 'Skip to the main navigation menu'
  },
  {
    id: 'skip-to-search',
    label: 'Skip to search',
    target: 'search',
    description: 'Skip to the search functionality'
  }
];

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultSkipLinks,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { announce } = useARIA();
  const { prefersReducedMotion } = useAccessibilityPreferences();

  // Show skip links when Tab is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        setIsVisible(true);
        setFocusedIndex(0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        // Hide skip links after a delay if no focus
        setTimeout(() => {
          if (document.activeElement?.tagName !== 'A') {
            setIsVisible(false);
            setFocusedIndex(-1);
          }
        }, 100);
      }
    };

    const handleClick = () => {
      setIsVisible(false);
      setFocusedIndex(-1);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const handleSkipLinkClick = (link: SkipLink) => {
    const target = document.getElementById(link.target);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
      announce(`Skipped to ${link.label}`);
    }
    setIsVisible(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((index + 1) % links.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(index === 0 ? links.length - 1 : index - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSkipLinkClick(links[index]);
        break;
      case 'Escape':
        e.preventDefault();
        setIsVisible(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className={`fixed top-0 left-0 right-0 z-50 bg-background-primary border-b border-border shadow-lg ${className}`}
          role="navigation"
          aria-label="Skip links"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {links.map((link, index) => (
                <motion.a
                  key={link.id}
                  href={`#${link.target}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSkipLinkClick(link);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`
                    inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    transition-colors duration-200
                    ${focusedIndex === index
                      ? 'bg-primary-500 text-white'
                      : 'bg-background-secondary text-text-primary hover:bg-background-tertiary'
                    }
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  `}
                  aria-describedby={link.description ? `${link.id}-desc` : undefined}
                >
                  {link.label}
                  {link.description && (
                    <span id={`${link.id}-desc`} className="sr-only">
                      {link.description}
                    </span>
                  )}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Component for creating skip link targets
export const SkipLinkTarget: React.FC<{
  id: string;
  children: React.ReactNode;
  className?: string;
}> = ({ id, children, className = '' }) => {
  return (
    <div
      id={id}
      className={`focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${className}`}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

// Hook for managing skip links
export const useSkipLinks = () => {
  const { announce } = useARIA();
  
  const addSkipLink = (link: SkipLink) => {
    // This would typically be managed by a context or state management system
    console.log('Adding skip link:', link);
  };
  
  const removeSkipLink = (id: string) => {
    console.log('Removing skip link:', id);
  };
  
  const announceSkip = (message: string) => {
    announce(message);
  };
  
  return {
    addSkipLink,
    removeSkipLink,
    announceSkip
  };
};

export default SkipLinks;
