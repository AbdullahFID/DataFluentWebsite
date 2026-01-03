'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type AnimationPhase =
  | 'idle'
  | 'background'
  | 'logo-appear'
  | 'tagline-appear'
  | 'google'
  | 'apple'
  | 'meta'
  | 'microsoft'
  | 'amazon'
  | 'final'
  | 'transition'
  | 'complete';

interface AnimationTiming {
  phase: AnimationPhase;
  startTime: number;
}

const ANIMATION_TIMELINE: AnimationTiming[] = [
  { phase: 'idle', startTime: 0 },
  { phase: 'background', startTime: 0 },
  { phase: 'logo-appear', startTime: 800 },
  { phase: 'tagline-appear', startTime: 1000 },
  { phase: 'google', startTime: 1600 },
  { phase: 'apple', startTime: 2100 },
  { phase: 'meta', startTime: 2600 },
  { phase: 'microsoft', startTime: 3100 },
  { phase: 'amazon', startTime: 3600 },
  { phase: 'final', startTime: 4200 },
  { phase: 'transition', startTime: 5200 },
  { phase: 'complete', startTime: 5700 },
];

// Helper to get phase for time (pure function)
function getPhaseForTime(time: number): AnimationPhase {
  let phase: AnimationPhase = 'idle';
  for (const timing of ANIMATION_TIMELINE) {
    if (time >= timing.startTime) {
      phase = timing.phase;
    }
  }
  return phase;
}

interface UseAnimationSequenceReturn {
  currentPhase: AnimationPhase;
  elapsedTime: number;
  isComplete: boolean;
  skip: () => void;
  restart: () => void;
  getPhaseProgress: (phase: AnimationPhase) => number;
  isPhaseActive: (phase: AnimationPhase) => boolean;
  isPhaseComplete: (phase: AnimationPhase) => boolean;
}

export function useAnimationSequence(
  autoStart: boolean = true,
  skipAnimation: boolean = false
): UseAnimationSequenceReturn {
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>(
    skipAnimation ? 'complete' : 'idle'
  );
  const [elapsedTime, setElapsedTime] = useState(skipAnimation ? 6000 : 0);
  const [isComplete, setIsComplete] = useState(skipAnimation);
  
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Get progress within a phase (0-1)
  const getPhaseProgress = useCallback(
    (phase: AnimationPhase): number => {
      const phaseIndex = ANIMATION_TIMELINE.findIndex((t) => t.phase === phase);
      if (phaseIndex === -1) return 0;

      const phaseStart = ANIMATION_TIMELINE[phaseIndex].startTime;
      const phaseEnd =
        phaseIndex < ANIMATION_TIMELINE.length - 1
          ? ANIMATION_TIMELINE[phaseIndex + 1].startTime
          : phaseStart + 500;

      if (elapsedTime < phaseStart) return 0;
      if (elapsedTime >= phaseEnd) return 1;

      return (elapsedTime - phaseStart) / (phaseEnd - phaseStart);
    },
    [elapsedTime]
  );

  // Check if a phase is currently active
  const isPhaseActive = useCallback(
    (phase: AnimationPhase): boolean => {
      return currentPhase === phase;
    },
    [currentPhase]
  );

  // Check if a phase has completed
  const isPhaseComplete = useCallback(
    (phase: AnimationPhase): boolean => {
      const phaseIndex = ANIMATION_TIMELINE.findIndex((t) => t.phase === phase);
      const currentIndex = ANIMATION_TIMELINE.findIndex(
        (t) => t.phase === currentPhase
      );
      return currentIndex > phaseIndex;
    },
    [currentPhase]
  );

  // Skip to the end
  const skip = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    isRunningRef.current = false;
    setCurrentPhase('complete');
    setIsComplete(true);
    setElapsedTime(6000);
  }, []);

  // Restart the animation
  const restart = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    startTimeRef.current = null;
    isRunningRef.current = true;
    setCurrentPhase('idle');
    setElapsedTime(0);
    setIsComplete(false);

    const runFrame = (timestamp: number) => {
      if (!isRunningRef.current) return;
      
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const newPhase = getPhaseForTime(elapsed);
      
      setElapsedTime(elapsed);
      setCurrentPhase(newPhase);

      if (newPhase === 'complete') {
        setIsComplete(true);
        isRunningRef.current = false;
        return;
      }

      animationFrameRef.current = requestAnimationFrame(runFrame);
    };

    animationFrameRef.current = requestAnimationFrame(runFrame);
  }, []);

  // Auto-start effect - uses requestAnimationFrame to avoid sync setState
  useEffect(() => {
    if (!autoStart || skipAnimation) return;

    // Use rAF to defer the animation start (async, not sync setState)
    const frameId = requestAnimationFrame(() => {
      startTimeRef.current = null;
      isRunningRef.current = true;

      const runFrame = (timestamp: number) => {
        if (!isRunningRef.current) return;

        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const newPhase = getPhaseForTime(elapsed);

        setElapsedTime(elapsed);
        setCurrentPhase(newPhase);

        if (newPhase === 'complete') {
          setIsComplete(true);
          isRunningRef.current = false;
          return;
        }

        animationFrameRef.current = requestAnimationFrame(runFrame);
      };

      animationFrameRef.current = requestAnimationFrame(runFrame);
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isRunningRef.current = false;
    };
  }, [autoStart, skipAnimation]);

  return {
    currentPhase,
    elapsedTime,
    isComplete,
    skip,
    restart,
    getPhaseProgress,
    isPhaseActive,
    isPhaseComplete,
  };
}

// Export timeline for reference
export { ANIMATION_TIMELINE };