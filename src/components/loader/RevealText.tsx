// RevealText.tsx - FAANG Colors + Vapor-Synced Timing
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface RevealTextProps {
  text: string;
  trigger: boolean;
  className?: string;
  onComplete?: () => void;
}

// FAANG brand colors
const FAANG_COLORS = {
  google: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
  apple: ['#A2AAAD', '#C0C0C0', '#E8E8E8'],
  meta: ['#0668E1', '#0081FB'],
  microsoft: ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'],
  amazon: ['#FF9900', '#FF9900'],
};

// Map each character to a FAANG color
// "Now working for you" - distribute colors meaningfully
function getCharColor(index: number, char: string): string {
  if (char === ' ') return 'transparent';
  
  // Color mapping for "Now working for you" (19 chars, 15 non-space)
  // N=0, o=1, w=2, w=4, o=5, r=6, k=7, i=8, n=9, g=10, f=12, o=13, r=14, y=16, o=17, u=18
  const colorSequence = [
    FAANG_COLORS.google[0],    // N - Google Blue
    FAANG_COLORS.google[1],    // o - Google Red
    FAANG_COLORS.google[2],    // w - Google Yellow
    null,                       // space
    FAANG_COLORS.google[3],    // w - Google Green
    FAANG_COLORS.apple[0],     // o - Apple Silver
    FAANG_COLORS.apple[1],     // r - Apple Silver
    FAANG_COLORS.meta[0],      // k - Meta Blue
    FAANG_COLORS.meta[1],      // i - Meta Light Blue
    FAANG_COLORS.microsoft[0], // n - Microsoft Red
    FAANG_COLORS.microsoft[1], // g - Microsoft Green
    null,                       // space
    FAANG_COLORS.microsoft[2], // f - Microsoft Blue
    FAANG_COLORS.microsoft[3], // o - Microsoft Yellow
    FAANG_COLORS.amazon[0],    // r - Amazon Orange
    null,                       // space
    FAANG_COLORS.amazon[0],    // y - Amazon Orange
    FAANG_COLORS.google[0],    // o - Google Blue (loop back)
    FAANG_COLORS.google[1],    // u - Google Red
  ];
  
  return colorSequence[index] || '#FFFFFF';
}

/**
 * Apple-style text materialization with FAANG colors
 * Timing synced to vapor dissolve (~1.5s for vapor to clear)
 */
export function RevealText({ 
  text, 
  trigger, 
  className = '', 
  onComplete 
}: RevealTextProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  const chars = useMemo(() => text.split(''), [text]);

  useEffect(() => {
    if (trigger) {
      // Sync with vapor: vapor takes ~1.2s to mostly fade
      // Start reveal as vapor is clearing (overlap slightly for smooth transition)
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 200); // Start while vapor is still fading
      
      // Complete after all letters + settle time
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 200 + chars.length * 70 + 400);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [trigger, chars.length, onComplete]);

  if (!trigger) return null;

  return (
    <div 
      className={`relative ${className}`}
      style={{ background: 'transparent' }}
    >
      {/* Text container */}
      <div 
        className="relative z-10 flex flex-wrap justify-center select-none"
        style={{ background: 'transparent' }}
      >
        {chars.map((ch, i) => {
          const isSpace = ch === ' ';
          const color = getCharColor(i, ch);
          
          // Timing synced to vapor:
          // - Vapor drifts up slowly over ~1.5s
          // - Letters should appear in same rhythm (not too fast)
          // - Stagger: ~70ms per letter (slower than before)
          const delay = shouldAnimate ? i * 0.07 : 0;

          return (
            <motion.span
              key={`${ch}-${i}`}
              className="relative inline-block"
              initial={{ 
                opacity: 0,
                y: -20,           // Start higher (matches vapor going up)
                filter: 'blur(12px)',
                scale: 0.9,
              }}
              animate={shouldAnimate ? {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                scale: 1,
              } : {
                opacity: 0,
                y: -20,
                filter: 'blur(12px)',
                scale: 0.9,
              }}
              transition={{
                duration: 0.7,    // Slower, matches vapor drift
                delay,
                ease: [0.23, 1, 0.32, 1], // Smooth exponential out
                y: {
                  duration: 0.8,
                  delay,
                  ease: [0.34, 1.02, 0.68, 1], // Tiny overshoot for settle
                },
                filter: {
                  duration: 0.6,
                  delay: delay + 0.1, // Blur clears slightly after position
                },
              }}
              style={{
                marginRight: isSpace ? '0.28em' : '0.015em',
                color: color,
                textShadow: shouldAnimate && !isSpace
                  ? `0 0 20px ${color}66, 0 0 40px ${color}33, 0 0 60px ${color}22`
                  : 'none',
                willChange: 'transform, opacity, filter',
              }}
            >
              {isSpace ? '\u00A0' : ch}
            </motion.span>
          );
        })}
      </div>

      {/* Subtle color-matched underline */}
      <motion.div
        className="absolute left-1/2 pointer-events-none"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={shouldAnimate ? { opacity: 0.6, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ 
          duration: 1, 
          delay: chars.length * 0.07 + 0.3,
          ease: [0.23, 1, 0.32, 1],
        }}
        style={{
          bottom: '-6px',
          transform: 'translateX(-50%)',
          transformOrigin: 'center',
          width: '90%',
          height: '1px',
          background: `linear-gradient(90deg, 
            transparent 0%, 
            ${FAANG_COLORS.google[0]}88 15%, 
            ${FAANG_COLORS.meta[0]}88 35%, 
            ${FAANG_COLORS.microsoft[2]}88 55%, 
            ${FAANG_COLORS.amazon[0]}88 75%, 
            transparent 100%
          )`,
          filter: 'blur(4px)',
          borderRadius: '999px',
          zIndex: 5,
        }}
      />
    </div>
  );
}

export default RevealText;