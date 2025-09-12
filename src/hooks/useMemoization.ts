import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { TIME_CONSTANTS } from '@/lib/constants';

// Hook for memoizing expensive calculations with custom comparison
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  compareFn?: (prev: T, next: T) => boolean
): T {
  const ref = useRef<{ value: T; deps: React.DependencyList } | undefined>(undefined);
  
  return useMemo(() => {
    if (!ref.current || !areEqual(ref.current.deps, deps)) {
      const newValue = factory();
      ref.current = { value: newValue, deps: [...deps] };
      return newValue;
    }
    
    if (compareFn && !compareFn(ref.current.value, factory())) {
      const newValue = factory();
      ref.current.value = newValue;
      return newValue;
    }
    
    return ref.current.value;
  }, [compareFn, deps, factory]);
}

// Hook for memoizing callbacks with custom comparison
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList,
  compareFn?: (prev: T, next: T) => boolean
): T {
  const ref = useRef<{ callback: T; deps: React.DependencyList } | undefined>(undefined);
  
  return useCallback((...args: Parameters<T>) => {
    if (!ref.current || !areEqual(ref.current.deps, deps)) {
      ref.current = { callback, deps: [...deps] };
      return callback(...args);
    }
    
    if (compareFn && !compareFn(ref.current.callback, callback)) {
      ref.current.callback = callback;
      return callback(...args);
    }
    
    return ref.current.callback(...args);
  }, [callback, compareFn, deps]) as T;
}

// Hook for memoizing expensive computations with cache
export function useMemoizedComputation<T, R>(
  computeFn: (input: T) => R,
  input: T,
  options: {
    cacheSize?: number;
    compareFn?: (prev: T, next: T) => boolean;
  } = {}
) {
  const { cacheSize = 100, compareFn } = options;
  const cacheRef = useRef<Map<string, R>>(new Map());
  const keysRef = useRef<string[]>([]);
  
  return useMemo(() => {
    const key = JSON.stringify(input);
    
    // Check cache first
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }
    
    // Compute new value
    const result = computeFn(input);
    
    // Add to cache
    cacheRef.current.set(key, result);
    keysRef.current.push(key);
    
    // Maintain cache size
    if (keysRef.current.length > cacheSize) {
      const oldestKey = keysRef.current.shift()!;
      cacheRef.current.delete(oldestKey);
    }
    
    return result;
  }, [computeFn, input, cacheSize]);
}

// Hook for memoizing async computations
export function useMemoizedAsyncComputation<T, R>(
  computeFn: (input: T) => Promise<R>,
  input: T,
  options: {
    cacheSize?: number;
    compareFn?: (prev: T, next: T) => boolean;
    staleTime?: number;
  } = {}
) {
  const { cacheSize = 100, compareFn, staleTime = TIME_CONSTANTS.MEMOIZATION_STALE_TIME } = options;
  const cacheRef = useRef<Map<string, { result: R; timestamp: number }>>(new Map());
  const keysRef = useRef<string[]>([]);
  const [result, setResult] = useState<R | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const key = JSON.stringify(input);
    const now = Date.now();
    
    // Check cache first
    const cached = cacheRef.current.get(key);
    if (cached && (now - cached.timestamp) < staleTime) {
      setResult(cached.result);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Compute new value
    setIsLoading(true);
    setError(null);
    
    computeFn(input)
      .then((newResult) => {
        setResult(newResult);
        setIsLoading(false);
        
        // Add to cache
        cacheRef.current.set(key, { result: newResult, timestamp: now });
        keysRef.current.push(key);
        
        // Maintain cache size
        if (keysRef.current.length > cacheSize) {
          const oldestKey = keysRef.current.shift()!;
          cacheRef.current.delete(oldestKey);
        }
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [computeFn, input, cacheSize, compareFn, staleTime]);
  
  return { result, isLoading, error };
}

// Hook for memoizing expensive array operations
export function useMemoizedArray<T, R>(
  array: T[],
  transformFn: (arr: T[]) => R,
  options: {
    compareFn?: (prev: T[], next: T[]) => boolean;
    cacheSize?: number;
  } = {}
) {
  const { compareFn, cacheSize = 100 } = options;
  const cacheRef = useRef<Map<string, R>>(new Map());
  const keysRef = useRef<string[]>([]);
  
  return useMemo(() => {
    const key = JSON.stringify(array);
    
    // Check cache first
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }
    
    // Transform array
    const result = transformFn(array);
    
    // Add to cache
    cacheRef.current.set(key, result);
    keysRef.current.push(key);
    
    // Maintain cache size
    if (keysRef.current.length > cacheSize) {
      const oldestKey = keysRef.current.shift()!;
      cacheRef.current.delete(oldestKey);
    }
    
    return result;
  }, [array, transformFn, cacheSize]);
}

// Utility function to compare dependency arrays
function areEqual(prev: React.DependencyList, next: React.DependencyList): boolean {
  if (prev.length !== next.length) return false;
  
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) return false;
  }
  
  return true;
}

// Hook for memoizing expensive object operations
export function useMemoizedObject<T, R>(
  obj: T,
  transformFn: (obj: T) => R,
  options: {
    compareFn?: (prev: T, next: T) => boolean;
    cacheSize?: number;
  } = {}
) {
  const { compareFn, cacheSize = 100 } = options;
  const cacheRef = useRef<Map<string, R>>(new Map());
  const keysRef = useRef<string[]>([]);
  
  return useMemo(() => {
    const key = JSON.stringify(obj);
    
    // Check cache first
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }
    
    // Transform object
    const result = transformFn(obj);
    
    // Add to cache
    cacheRef.current.set(key, result);
    keysRef.current.push(key);
    
    // Maintain cache size
    if (keysRef.current.length > cacheSize) {
      const oldestKey = keysRef.current.shift()!;
      cacheRef.current.delete(oldestKey);
    }
    
    return result;
  }, [obj, transformFn, cacheSize]);
}

// All hooks are already exported individually above
