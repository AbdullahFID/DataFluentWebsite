'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RevealTextProps {
  text: string;
  trigger: boolean;
  className?: string;
  onComplete?: () => void;
}

/**
 * Quantum Materialization Text Reveal
 * 
 * Sequence:
 * 1. Pulse - central light point appears
 * 2. Expand - light expands into horizontal scan line  
 * 3. Scan - line sweeps across, materializing characters
 * 4. Glow - characters gain holographic glow
 * 5. Shimmer - traveling light effect loops
 */
export function RevealText({
  text,
  trigger,
  className = '',
  onComplete,
}: RevealTextProps) {
  const [phase, setPhase] = useState<'idle' | 'pulse' | 'expand' | 'scan' | 'glow' | 'complete'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [shimmerActive, setShimmerActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const animFrameRef = useRef<number | null>(null);

  const chars = useMemo(() => text.split(''), [text]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Main animation sequence
  useEffect(() => {
    if (!trigger || !isMountedRef.current) return;

    // Phase 1: Pulse (200ms)
    setPhase('pulse');
    
    const expandTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      // Phase 2: Expand (300ms)
      setPhase('expand');
      
      const scanTimer = setTimeout(() => {
        if (!isMountedRef.current) return;
        // Phase 3: Scan across text
        setPhase('scan');
        
        const startTime = performance.now();
        const scanDuration = 800; // ms to scan across
        
        const animate = (now: number) => {
          if (!isMountedRef.current) return;
          
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / scanDuration);
          setScanProgress(progress);
          
          if (progress < 1) {
            animFrameRef.current = requestAnimationFrame(animate);
          } else {
            // Phase 4: Glow
            setPhase('glow');
            
            setTimeout(() => {
              if (!isMountedRef.current) return;
              // Phase 5: Complete with shimmer
              setPhase('complete');
              setShimmerActive(true);
              onComplete?.();
            }, 400);
          }
        };
        
        animFrameRef.current = requestAnimationFrame(animate);
      }, 350);

      return () => clearTimeout(scanTimer);
    }, 250);

    return () => {
      clearTimeout(expandTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [trigger, onComplete]);

  if (!trigger && phase === 'idle') return null;

  const isScanning = phase === 'scan' || phase === 'glow' || phase === 'complete';

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        // Ensure no background whatsoever
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
    >
      {/* Central pulse point */}
      <AnimatePresence>
        {(phase === 'pulse' || phase === 'expand') && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: phase === 'pulse' ? [0, 1, 0.8] : 0,
              scale: phase === 'pulse' ? [0, 1.5, 1] : 2,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 0 30px 15px rgba(66, 133, 244, 0.8), 0 0 60px 30px rgba(78, 205, 196, 0.4)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Horizontal scan line */}
      <AnimatePresence>
        {(phase === 'expand' || phase === 'scan') && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ left: '50%', width: 0, opacity: 0 }}
            animate={{ 
              left: phase === 'scan' ? `${scanProgress * 100}%` : '0%',
              width: phase === 'expand' ? '100%' : 4,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: phase === 'expand' ? 0.3 : 0.05,
              ease: 'linear',
            }}
            style={{
              height: phase === 'scan' ? 80 : 2,
              background: phase === 'scan' 
                ? 'linear-gradient(90deg, transparent, rgba(66, 133, 244, 0.9), white, rgba(78, 205, 196, 0.9), transparent)'
                : 'linear-gradient(90deg, transparent, white, transparent)',
              boxShadow: phase === 'scan'
                ? '0 0 40px 20px rgba(66, 133, 244, 0.6)'
                : '0 0 20px 5px rgba(255, 255, 255, 0.5)',
              filter: 'blur(1px)',
              transform: phase === 'scan' ? 'translateX(-50%)' : undefined,
            }}
          />
        )}
      </AnimatePresence>

      {/* Main text */}
      <div 
        className="relative flex flex-wrap justify-center"
        style={{ background: 'transparent' }}
      >
        {chars.map((char, i) => {
          const isSpace = char === ' ';
          const charPosition = (i + 0.5) / chars.length; // 0 to 1 position
          const isRevealed = isScanning && scanProgress >= charPosition;
          const hasGlow = phase === 'glow' || phase === 'complete';
          
          return (
            <motion.span
              key={i}
              className="relative inline-block"
              initial={{ opacity: 0 }}
              animate={{
                opacity: isRevealed ? 1 : 0,
                y: isRevealed ? 0 : 20,
                scale: isRevealed ? 1 : 0.7,
                rotateX: isRevealed ? 0 : -90,
              }}
              transition={{
                duration: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                transformStyle: 'preserve-3d',
                perspective: 1000,
                // Gradient text - applied via background clip
                background: isRevealed
                  ? 'linear-gradient(135deg, #4ECDC4 0%, #4285F4 30%, #667eea 50%, #8B5CF6 70%, #EC4899 100%)'
                  : 'transparent',
                WebkitBackgroundClip: isRevealed ? 'text' : undefined,
                WebkitTextFillColor: isRevealed ? 'transparent' : 'transparent',
                backgroundClip: isRevealed ? 'text' : undefined,
                // Text shadow for glow - no box!
                textShadow: hasGlow && isRevealed
                  ? `
                      0 0 10px rgba(66, 133, 244, 0.8),
                      0 0 20px rgba(66, 133, 244, 0.6),
                      0 0 40px rgba(78, 205, 196, 0.4),
                      0 0 80px rgba(139, 92, 246, 0.3)
                    `
                  : isRevealed 
                    ? '0 0 20px rgba(66, 133, 244, 0.9)'
                    : 'none',
                // Spacing
                marginRight: isSpace ? '0.25em' : '0.01em',
                // Filter for extra glow
                filter: hasGlow && isRevealed ? 'brightness(1.1)' : 'none',
              }}
            >
              {isSpace ? '\u00A0' : char}
            </motion.span>
          );
        })}
      </div>

      {/* Shimmer sweep - travels across completed text */}
      {shimmerActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ background: 'transparent' }}
        >
          <motion.div
            className="absolute top-0 bottom-0"
            initial={{ left: '-20%', opacity: 0 }}
            animate={{ 
              left: ['−20%', '120%'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              ease: [0.4, 0, 0.2, 1],
              repeat: Infinity,
              repeatDelay: 4,
            }}
            style={{
              width: '15%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), rgba(255,255,255,0.6), rgba(255,255,255,0.4), transparent)',
              filter: 'blur(8px)',
            }}
          />
        </motion.div>
      )}

      {/* Subtle under-glow - uses filter, NOT a background box */}
      {(phase === 'glow' || phase === 'complete') && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'transparent',
            filter: 'blur(0px)', // Container doesn't blur, children do via text-shadow
          }}
        >
          {/* Radial glow underneath - positioned below text */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2"
            animate={{
              opacity: [0.4, 0.6, 0.4],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
            style={{
              width: '120%',
              height: 4,
              marginTop: 30,
              background: 'linear-gradient(90deg, transparent 0%, rgba(78,205,196,0.6) 20%, rgba(66,133,244,0.8) 50%, rgba(139,92,246,0.6) 80%, transparent 100%)',
              filter: 'blur(20px)',
              borderRadius: '50%',
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default RevealText;