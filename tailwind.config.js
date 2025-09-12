import { designTokens } from './src/lib/design-tokens';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
    './src/config/**/*.{js,ts,jsx,tsx,mdx}',
    './src/types/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Design System Colors
      colors: {
        // Primary Brand Colors
        primary: designTokens.colors.primary,
        secondary: designTokens.colors.secondary,
        accent: designTokens.colors.accent,
        semantic: designTokens.colors.semantic,
        neutral: designTokens.colors.neutral,
        background: designTokens.colors.background,
        text: designTokens.colors.text,
        border: designTokens.colors.border,
        
        // Legacy shadcn/ui colors for compatibility
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      
      // Typography
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      lineHeight: designTokens.typography.lineHeight,
      
      // Spacing
      spacing: designTokens.spacing,
      
      // Border Radius
      borderRadius: designTokens.borderRadius,
      
      // Shadows
      boxShadow: designTokens.boxShadow,
      
      // Z-Index
      zIndex: designTokens.zIndex,
      
      // Breakpoints
      screens: designTokens.breakpoints,
      
      // Animation
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          from: {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeOut: {
          from: {
            opacity: '1',
            transform: 'translateY(0)',
          },
          to: {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
        },
        slideIn: {
          from: {
            opacity: '0',
            transform: 'translateX(-100%)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideOut: {
          from: {
            opacity: '1',
            transform: 'translateX(0)',
          },
          to: {
            opacity: '0',
            transform: 'translateX(-100%)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
