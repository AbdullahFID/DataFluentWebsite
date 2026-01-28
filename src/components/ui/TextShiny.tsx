// TextShiny.tsx — Optimized for performance
'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

const getDeviceCapabilities = () => {
  if (typeof window === 'undefined') {
    return { isLowPower: false, prefersReducedMotion: false };
  }
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Detect low-power devices
  const isLowPower = 
    // Mobile devices
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    // Low core count
    (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4) ||
    // Small screen (likely mobile)
    window.innerWidth < 768 ||
    // Safari on iOS (often throttled)
    (/Safari/.test(navigator.userAgent) && /iPhone|iPad|iPod/.test(navigator.userAgent));
  
  return { isLowPower, prefersReducedMotion };
};

// ============================================================================
// TYPES
// ============================================================================

interface TextShinyProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  direction?: 'left' | 'right';
  delay?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const TextShiny: React.FC<TextShinyProps> = ({
  text,
  disabled = false,
  speed = 3,
  className = '',
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
  delay = 0,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Use lazy initializer to avoid setState in effect
  const [capabilities, setCapabilities] = useState(() => getDeviceCapabilities());
  
  const progress = useMotionValue(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const directionRef = useRef(direction === 'left' ? 1 : -1);
  const rafIdRef = useRef<number | null>(null);

  // Listen for reduced motion changes (this is a valid use of setState in effect - responding to external system)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setCapabilities(prev => ({ ...prev, prefersReducedMotion: e.matches }));
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Derived values
  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;
  
  // Adjust frame interval based on device - lower FPS on mobile
  const frameInterval = capabilities.isLowPower ? 1000 / 20 : 1000 / 60; // 20fps vs 60fps

  // Intersection Observer for visibility detection
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation loop with throttling
  useEffect(() => {
    // Skip animation entirely if reduced motion or disabled
    if (capabilities.prefersReducedMotion || disabled) {
      progress.set(50); // Set to middle position
      return;
    }

    let lastFrameTime = 0;

    const animate = (time: number) => {
      // Skip if not visible or paused
      if (!isVisible || isPaused) {
        lastTimeRef.current = null;
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // Throttle frame rate
      const elapsed = time - lastFrameTime;
      if (elapsed < frameInterval) {
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = time - (elapsed % frameInterval);

      // Initialize time tracking
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      elapsedRef.current += deltaTime;

      // Calculate progress
      if (yoyo) {
        const cycleDuration = animationDuration + delayDuration;
        const fullCycle = cycleDuration * 2;
        const cycleTime = elapsedRef.current % fullCycle;

        if (cycleTime < animationDuration) {
          const p = (cycleTime / animationDuration) * 100;
          progress.set(directionRef.current === 1 ? p : 100 - p);
        } else if (cycleTime < cycleDuration) {
          progress.set(directionRef.current === 1 ? 100 : 0);
        } else if (cycleTime < cycleDuration + animationDuration) {
          const reverseTime = cycleTime - cycleDuration;
          const p = 100 - (reverseTime / animationDuration) * 100;
          progress.set(directionRef.current === 1 ? p : 100 - p);
        } else {
          progress.set(directionRef.current === 1 ? 0 : 100);
        }
      } else {
        const cycleDuration = animationDuration + delayDuration;
        const cycleTime = elapsedRef.current % cycleDuration;

        if (cycleTime < animationDuration) {
          const p = (cycleTime / animationDuration) * 100;
          progress.set(directionRef.current === 1 ? p : 100 - p);
        } else {
          progress.set(directionRef.current === 1 ? 100 : 0);
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [
    isVisible,
    isPaused,
    disabled,
    yoyo,
    animationDuration,
    delayDuration,
    frameInterval,
    capabilities.prefersReducedMotion,
    progress,
  ]);

  // Reset on direction change
  useEffect(() => {
    directionRef.current = direction === 'left' ? 1 : -1;
    elapsedRef.current = 0;
    progress.set(0);
  }, [direction, progress]);

  const backgroundPosition = useTransform(progress, (p) => `${150 - p * 2}% center`);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  // Memoize gradient style
  const gradientStyle = useMemo((): React.CSSProperties => ({
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    // Performance hints
    willChange: isVisible && !capabilities.prefersReducedMotion ? 'background-position' : 'auto',
    contain: 'layout style paint',
  }), [spread, color, shineColor, isVisible, capabilities.prefersReducedMotion]);

  // For reduced motion, render static gradient
  if (capabilities.prefersReducedMotion) {
    return (
      <span
        ref={containerRef}
        className={`inline-block ${className}`}
        style={{
          ...gradientStyle,
          backgroundPosition: '50% center',
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block ${className}`}
      style={{ ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </motion.span>
  );
};

export default TextShiny;