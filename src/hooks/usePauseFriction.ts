import { useRef, useCallback, useEffect } from 'react';

export function usePauseFriction(callback: () => void, delay: number = 12000) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return reset;
} 