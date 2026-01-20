'use client';

import { useState, useEffect } from 'react';

/**
 * Returns initial reduced-motion preference (SSR-safe)
 */
function getInitialMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to detect if user prefers reduced motion
 * Respects prefers-reduced-motion media query
 */
export function useReducedMotion(): boolean {
  // Lazy initializer—runs once, no effect-based setState needed
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getInitialMotionPreference
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Only setState in callback—compliant with react-hooks/set-state-in-effect
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;