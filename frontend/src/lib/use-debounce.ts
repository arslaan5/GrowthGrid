import { useEffect, useState } from "react";

/**
 * Debounce a value by the given delay (ms).
 * Returns the debounced value that only updates after
 * the user stops changing it for `delay` milliseconds.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
