import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utility Functions Tests', () => {
  describe('cn (class name utility)', () => {
    it('should merge basic class names', () => {
      const result = cn('text-red-500', 'bg-blue-100');
      expect(result).toBe('text-red-500 bg-blue-100');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      expect(result).toBe('base-class active-class');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['text-lg', 'font-bold'], ['text-center', 'mt-4']);
      expect(result).toBe('text-lg font-bold text-center mt-4');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'text-red-500': true,
        'text-blue-500': false,
        'font-bold': true,
        'italic': false,
      });
      expect(result).toBe('text-red-500 font-bold');
    });

    it('should handle mixed input types', () => {
      const isActive = true;
      const result = cn(
        'base-class',
        ['array-class-1', 'array-class-2'],
        {
          'object-class-1': true,
          'object-class-2': false,
        },
        isActive && 'conditional-class'
      );
      expect(result).toBe('base-class array-class-1 array-class-2 object-class-1 conditional-class');
    });

    it('should handle null and undefined values', () => {
      const result = cn(
        'base-class',
        null,
        undefined,
        'valid-class'
      );
      expect(result).toBe('base-class valid-class');
    });

    it('should handle empty strings', () => {
      const result = cn(
        'base-class',
        '',
        'valid-class',
        ''
      );
      expect(result).toBe('base-class valid-class');
    });

    it('should handle whitespace-only strings', () => {
      const result = cn(
        'base-class',
        '   ',
        'valid-class',
        '\t\n'
      );
      expect(result).toBe('base-class valid-class');
    });

    it('should deduplicate conflicting Tailwind classes', () => {
      // This tests the tailwind-merge functionality
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500'); // Last one wins
    });

    it('should handle complex Tailwind class conflicts', () => {
      const result = cn(
        'p-4 p-6', // Conflicting padding
        'm-2 m-4', // Conflicting margin
        'text-sm text-lg' // Conflicting text size
      );
      expect(result).toBe('p-6 m-4 text-lg'); // Last values should win
    });

    it('should handle responsive classes correctly', () => {
      const result = cn(
        'text-sm md:text-lg',
        'text-base lg:text-xl'
      );
      expect(result).toBe('md:text-lg text-base lg:text-xl');
    });

    it('should handle pseudo-class variants', () => {
      const result = cn(
        'hover:bg-blue-500',
        'focus:bg-blue-600',
        'active:bg-blue-700'
      );
      expect(result).toBe('hover:bg-blue-500 focus:bg-blue-600 active:bg-blue-700');
    });

    it('should handle dark mode classes', () => {
      const result = cn(
        'bg-white dark:bg-gray-900',
        'text-gray-900 dark:text-white'
      );
      expect(result).toBe('bg-white dark:bg-gray-900 text-gray-900 dark:text-white');
    });

    it('should handle arbitrary values', () => {
      const result = cn(
        'w-[100px]',
        'h-[200px]',
        'bg-[#ff0000]'
      );
      expect(result).toBe('w-[100px] h-[200px] bg-[#ff0000]');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle single class', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('should handle deeply nested arrays and objects', () => {
      const result = cn([
        'array-1',
        ['nested-array-1', 'nested-array-2'],
        {
          'nested-object-1': true,
          'nested-object-2': false,
        }
      ]);
      expect(result).toBe('array-1 nested-array-1 nested-array-2 nested-object-1');
    });

    it('should handle function calls that return classes', () => {
      const getClasses = () => 'function-class-1 function-class-2';
      const result = cn('base-class', getClasses());
      expect(result).toBe('base-class function-class-1 function-class-2');
    });

    it('should handle complex real-world scenario', () => {
      const isLoading = true;
      const isError = false;
      const variant = 'primary';
      const size = 'large';
      
      const result = cn(
        // Base classes
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        
        // Variant classes
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        
        // Size classes
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
        },
        
        // State classes
        isLoading && 'animate-pulse',
        isError && 'border-red-500 bg-red-50',
        
        // Custom classes
        'custom-class'
      );
      
      expect(result).toContain('inline-flex items-center justify-center');
      expect(result).toContain('bg-primary text-primary-foreground');
      expect(result).toContain('animate-pulse');
      expect(result).toContain('custom-class');
      expect(result).not.toContain('border-red-500');
    });

    it('should handle performance with many classes', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const start = performance.now();
      const result = cn(...manyClasses);
      const end = performance.now();
      
      expect(result).toContain('class-0');
      expect(result).toContain('class-99');
      expect(end - start).toBeLessThan(10); // Should complete in less than 10ms
    });
  });
});
