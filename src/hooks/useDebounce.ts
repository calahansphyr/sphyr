import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export function useDebounce<T>(
  value: T,
  delay: number = 300,
  options: UseDebounceOptions = {}
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const { leading = false, trailing = true, maxWait } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const maxTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const lastInvokeTimeRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const isInvoking = leading && lastCallTimeRef.current === undefined;
    
    lastCallTimeRef.current = now;

    if (isInvoking) {
      lastInvokeTimeRef.current = now;
      setDebouncedValue(value);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (maxWait && maxWait > 0) {
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
        }
        
        maxTimeoutRef.current = setTimeout(() => {
          lastInvokeTimeRef.current = now;
          setDebouncedValue(value);
        }, maxWait);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (trailing) {
          lastInvokeTimeRef.current = now;
          setDebouncedValue(value);
        }
        lastCallTimeRef.current = undefined;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  return debouncedValue;
}

// Hook for debounced callback functions
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  options: UseDebounceOptions = {}
): T {
  const { leading = false, trailing = true, maxWait } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const maxTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const lastInvokeTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T> | undefined>(undefined);
  const lastThisRef = useRef<any | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const isInvoking = leading && lastCallTimeRef.current === undefined;
      
      lastCallTimeRef.current = now;
      lastArgsRef.current = args;
      lastThisRef.current = undefined;

      if (isInvoking) {
        lastInvokeTimeRef.current = now;
        return callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        if (maxWait && maxWait > 0) {
          if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
          }
          
          maxTimeoutRef.current = setTimeout(() => {
            lastInvokeTimeRef.current = now;
            callback.apply(lastThisRef.current, lastArgsRef.current!);
          }, maxWait);
        }
        
        timeoutRef.current = setTimeout(() => {
          if (trailing) {
            lastInvokeTimeRef.current = now;
            callback.apply(lastThisRef.current, lastArgsRef.current!);
          }
          lastCallTimeRef.current = undefined;
        }, delay);
      }
    },
    [callback, delay, leading, trailing, maxWait]
  ) as T;

  // Cleanup function
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Hook for debounced search with loading state
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300,
  options: UseDebounceOptions = {}
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const debouncedQuery = useDebounce(query, delay, options);
  const debouncedSearchFn = useDebouncedCallback(searchFn, delay, options);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    debouncedSearchFn(debouncedQuery)
      .then((searchResults) => {
        setResults(searchResults);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [debouncedQuery, debouncedSearchFn]);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    query,
    debouncedQuery,
    results,
    isLoading,
    error,
    search,
    clear
  };
}

export default useDebounce;
