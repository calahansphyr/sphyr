// High contrast mode utilities and CSS classes
import { useState, useEffect } from 'react';

export interface HighContrastColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  shadow: string;
  focus: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export const highContrastColors: HighContrastColors = {
  background: '#000000',
  foreground: '#FFFFFF',
  primary: '#00BFFF',
  secondary: '#FFD700',
  accent: '#FF6B6B',
  border: '#FFFFFF',
  shadow: '#FFFFFF',
  focus: '#00BFFF',
  error: '#FF0000',
  warning: '#FFD700',
  success: '#00FF00',
  info: '#00BFFF'
};

export const highContrastCSS = `
  /* High contrast mode styles */
  @media (prefers-contrast: high) {
    :root {
      --background-primary: ${highContrastColors.background};
      --background-secondary: #1a1a1a;
      --background-tertiary: #333333;
      --text-primary: ${highContrastColors.foreground};
      --text-secondary: #CCCCCC;
      --text-muted: #999999;
      --primary-500: ${highContrastColors.primary};
      --primary-600: #0099CC;
      --primary-700: #007399;
      --secondary-500: ${highContrastColors.secondary};
      --accent-500: ${highContrastColors.accent};
      --border-color: ${highContrastColors.border};
      --shadow-color: ${highContrastColors.shadow};
      --focus-ring: ${highContrastColors.focus};
      --error-500: ${highContrastColors.error};
      --warning-500: ${highContrastColors.warning};
      --success-500: ${highContrastColors.success};
      --info-500: ${highContrastColors.info};
    }

    /* Ensure all text has sufficient contrast */
    * {
      color: var(--text-primary) !important;
    }

    /* High contrast borders */
    .border,
    .border-t,
    .border-r,
    .border-b,
    .border-l {
      border-color: var(--border-color) !important;
      border-width: 2px !important;
    }

    /* High contrast buttons */
    .btn,
    button,
    [role="button"] {
      background-color: var(--background-primary) !important;
      color: var(--text-primary) !important;
      border: 2px solid var(--border-color) !important;
    }

    .btn:hover,
    button:hover,
    [role="button"]:hover {
      background-color: var(--primary-500) !important;
      color: var(--background-primary) !important;
    }

    .btn:focus,
    button:focus,
    [role="button"]:focus {
      outline: 3px solid var(--focus-ring) !important;
      outline-offset: 2px !important;
    }

    /* High contrast inputs */
    input,
    textarea,
    select {
      background-color: var(--background-primary) !important;
      color: var(--text-primary) !important;
      border: 2px solid var(--border-color) !important;
    }

    input:focus,
    textarea:focus,
    select:focus {
      outline: 3px solid var(--focus-ring) !important;
      outline-offset: 2px !important;
    }

    /* High contrast links */
    a {
      color: var(--primary-500) !important;
      text-decoration: underline !important;
    }

    a:hover {
      color: var(--secondary-500) !important;
    }

    a:focus {
      outline: 3px solid var(--focus-ring) !important;
      outline-offset: 2px !important;
    }

    /* High contrast cards */
    .card {
      background-color: var(--background-primary) !important;
      border: 2px solid var(--border-color) !important;
    }

    /* High contrast shadows */
    .shadow,
    .shadow-sm,
    .shadow-md,
    .shadow-lg {
      box-shadow: 0 0 0 2px var(--shadow-color) !important;
    }

    /* High contrast status indicators */
    .text-success {
      color: var(--success-500) !important;
    }

    .text-warning {
      color: var(--warning-500) !important;
    }

    .text-error,
    .text-danger {
      color: var(--error-500) !important;
    }

    .text-info {
      color: var(--info-500) !important;
    }

    /* High contrast badges */
    .badge {
      background-color: var(--background-primary) !important;
      color: var(--text-primary) !important;
      border: 2px solid var(--border-color) !important;
    }

    /* High contrast icons */
    svg {
      fill: var(--text-primary) !important;
    }

    /* High contrast images */
    img {
      filter: contrast(1.5) brightness(1.2) !important;
    }

    /* High contrast tables */
    table {
      border: 2px solid var(--border-color) !important;
    }

    th,
    td {
      border: 1px solid var(--border-color) !important;
      background-color: var(--background-primary) !important;
      color: var(--text-primary) !important;
    }

    th {
      background-color: var(--background-secondary) !important;
    }

    /* High contrast navigation */
    nav {
      background-color: var(--background-primary) !important;
      border: 2px solid var(--border-color) !important;
    }

    nav a {
      color: var(--text-primary) !important;
      border: 1px solid transparent !important;
    }

    nav a:hover,
    nav a:focus {
      background-color: var(--primary-500) !important;
      color: var(--background-primary) !important;
      border-color: var(--border-color) !important;
    }

    /* High contrast modals */
    .modal {
      background-color: var(--background-primary) !important;
      border: 3px solid var(--border-color) !important;
    }

    .modal-backdrop {
      background-color: rgba(0, 0, 0, 0.8) !important;
    }

    /* High contrast tooltips */
    .tooltip {
      background-color: var(--background-primary) !important;
      color: var(--text-primary) !important;
      border: 2px solid var(--border-color) !important;
    }

    /* High contrast dropdowns */
    .dropdown {
      background-color: var(--background-primary) !important;
      border: 2px solid var(--border-color) !important;
    }

    .dropdown-item {
      color: var(--text-primary) !important;
      border: 1px solid transparent !important;
    }

    .dropdown-item:hover,
    .dropdown-item:focus {
      background-color: var(--primary-500) !important;
      color: var(--background-primary) !important;
      border-color: var(--border-color) !important;
    }

    /* High contrast progress bars */
    .progress {
      background-color: var(--background-secondary) !important;
      border: 2px solid var(--border-color) !important;
    }

    .progress-bar {
      background-color: var(--primary-500) !important;
      border: 1px solid var(--border-color) !important;
    }

    /* High contrast alerts */
    .alert {
      background-color: var(--background-primary) !important;
      border: 2px solid var(--border-color) !important;
      color: var(--text-primary) !important;
    }

    .alert-success {
      border-color: var(--success-500) !important;
    }

    .alert-warning {
      border-color: var(--warning-500) !important;
    }

    .alert-error,
    .alert-danger {
      border-color: var(--error-500) !important;
    }

    .alert-info {
      border-color: var(--info-500) !important;
    }
  }
`;

// Utility function to detect high contrast mode
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Utility function to apply high contrast styles
export function applyHighContrastStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'high-contrast-styles';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = highContrastCSS;
}

// Utility function to remove high contrast styles
export function removeHighContrastStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleElement = document.getElementById('high-contrast-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

// Hook for high contrast mode detection
export function useHighContrastMode(): boolean {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    setIsHighContrast(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return isHighContrast;
}

// Utility function to get high contrast color
export function getHighContrastColor(color: keyof HighContrastColors): string {
  return highContrastColors[color];
}

// Utility function to create high contrast variant of a color
export function createHighContrastVariant(color: string): string {
  // Simple algorithm to create high contrast variant
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

const highContrastMode = {
  highContrastColors,
  highContrastCSS,
  isHighContrastMode,
  applyHighContrastStyles,
  removeHighContrastStyles,
  useHighContrastMode,
  getHighContrastColor,
  createHighContrastVariant
};

export default highContrastMode;
