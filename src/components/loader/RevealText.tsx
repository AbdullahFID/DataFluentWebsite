// RevealText.tsx - BIG BOLD text, fast reveal
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

function getCharColor(index: number, char: string): string {
  if (char === ' ') return 'transparent';
  
  const colorSequence = [
    FAANG_COLORS.google[0],    // N
    FAANG_COLORS.google[1],    // o
    FAANG_COLORS.google[2],    // w
    null,                       // space
    FAANG_COLORS.google[3],    // w
    FAANG_COLORS.apple[0],     // o
    FAANG_COLORS.apple[1],     // r
    FAANG_COLORS.meta[0],      // k
    FAANG_COLORS.meta[1],      // i
    FAANG_COLORS.microsoft[0], // n
    FAANG_COLORS.microsoft[1], // g
    null,                       // space
    FAANG_COLORS.microsoft[2], // f
    FAANG_COLORS.microsoft[3], // o
    FAANG_COLORS.amazon[0],    // r
    null,                       // space
    FAANG_COLORS.amazon[0],    // y
    FAANG_COLORS.google[0],    // o
    FAANG_COLORS.google[1],    // u
  ];
  
  return colorSequence[index] || '#FFFFFF';
}

/**
 * BIG BOLD text reveal - fast and punchy
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
      // Start immediately
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 50);
      
      // Complete callback
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 50 + chars.length * 30 + 300);
      
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
          
          // FAST stagger - 30ms per letter
          const delay = shouldAnimate ? i * 0.03 : 0;

          return (
            <motion.span
              key={`${ch}-${i}`}
              className="relative inline-block"
              initial={{ 
                opacity: 0,
                x: -40,
                y: 30,
                scale: 0.8,
              }}
              animate={shouldAnimate ? {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
              } : {
                opacity: 0,
                x: -40,
                y: 30,
                scale: 0.8,
              }}
              transition={{
                duration: 0.35,
                delay,
                ease: [0.16, 1, 0.3, 1], // Expo out - FAST
                x: {
                  duration: 0.4,
                  delay,
                  ease: [0.22, 1, 0.36, 1],
                },
                y: {
                  duration: 0.35,
                  delay,
                  ease: [0.22, 1, 0.36, 1],
                },
                scale: {
                  duration: 0.3,
                  delay,
                  ease: [0.34, 1.56, 0.64, 1], // Overshoot for punch
                },
              }}
              style={{
                marginRight: isSpace ? '0.25em' : '0.01em',
                color: color,
                textShadow: shouldAnimate && !isSpace
                  ? `0 0 30px ${color}88, 0 0 60px ${color}44, 0 0 90px ${color}22`
                  : 'none',
                willChange: 'transform, opacity',
              }}
            >
              {isSpace ? '\u00A0' : ch}
            </motion.span>
          );
        })}
      </div>


    </div>
  );
}

export default RevealText;