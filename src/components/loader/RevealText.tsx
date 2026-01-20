// RevealText.tsx - Slide-in from bottom-left (opposite of dust direction)
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
function getCharColor(index: number, char: string): string {
  if (char === ' ') return 'transparent';
  
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
    FAANG_COLORS.google[0],    // o - Google Blue
    FAANG_COLORS.google[1],    // u - Google Red
  ];
  
  return colorSequence[index] || '#FFFFFF';
}

/**
 * Text reveal that slides in from BOTTOM-LEFT
 * (Opposite direction of dust sweep = creates "whoosh through" effect)
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
      // Start reveal quickly after dust clears
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 100);
      
      // Complete after all letters + settle time
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 100 + chars.length * 50 + 400);
      
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
          
          // Stagger: ~50ms per letter (snappy)
          const delay = shouldAnimate ? i * 0.05 : 0;

          return (
            <motion.span
              key={`${ch}-${i}`}
              className="relative inline-block"
              initial={{ 
                opacity: 0,
                x: -30,           // Start from LEFT
                y: 20,            // Start from BELOW
                filter: 'blur(8px)',
                scale: 0.85,
              }}
              animate={shouldAnimate ? {
                opacity: 1,
                x: 0,
                y: 0,
                filter: 'blur(0px)',
                scale: 1,
              } : {
                opacity: 0,
                x: -30,
                y: 20,
                filter: 'blur(8px)',
                scale: 0.85,
              }}
              transition={{
                duration: 0.5,
                delay,
                ease: [0.16, 1, 0.3, 1], // Expo out - fast start, smooth end
                x: {
                  duration: 0.6,
                  delay,
                  ease: [0.22, 1, 0.36, 1],
                },
                y: {
                  duration: 0.55,
                  delay,
                  ease: [0.34, 1.02, 0.68, 1], // Tiny overshoot
                },
                filter: {
                  duration: 0.4,
                  delay: delay + 0.05,
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

      {/* Subtle color-matched underline - sweeps in from left */}
      <motion.div
        className="absolute left-1/2 pointer-events-none"
        initial={{ opacity: 0, scaleX: 0, x: '-80%' }}
        animate={shouldAnimate ? { opacity: 0.6, scaleX: 1, x: '-50%' } : { opacity: 0, scaleX: 0, x: '-80%' }}
        transition={{ 
          duration: 0.8, 
          delay: chars.length * 0.05 + 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          bottom: '-6px',
          transformOrigin: 'left center',
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