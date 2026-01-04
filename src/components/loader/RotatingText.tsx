'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface RotatingTextProps {
  texts: string[];
  activeIndex: number;
  transitionDuration?: number;
  staggerDelay?: number;
  splitMode?: 'characters' | 'words' | 'none';
  className?: string;
  textClassName?: string;
  direction?: 'up' | 'down';
  onTransitionComplete?: () => void;
}

export function RotatingText({
  texts,
  activeIndex,
  transitionDuration = 500,
  staggerDelay = 30,
  splitMode = 'characters',
  className = '',
  textClassName = '',
  direction = 'up',
  onTransitionComplete,
}: RotatingTextProps) {
  const currentText = texts[activeIndex] || '';
  const prevIndexRef = useRef(activeIndex);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (prevIndexRef.current !== activeIndex) {
      prevIndexRef.current = activeIndex;
      timer = setTimeout(() => setKey((k) => k + 1), 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeIndex]);

  const splitText = (text: string): string[] => {
    switch (splitMode) {
      case 'words':
        return text.split(' ');
      case 'characters':
        return text.split('');
      default:
        return [text];
    }
  };

  const parts = splitText(currentText);
  const yOffset = direction === 'up' ? 40 : -40;

  const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const containerVariants: Variants = {
    enter: {
      transition: {
        staggerChildren: staggerDelay / 1000,
        delayChildren: 0.05,
      },
    },
    exit: {
      transition: {
        staggerChildren: staggerDelay / 1000,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants: Variants = {
    initial: {
      y: yOffset,
      opacity: 0,
      rotateX: direction === 'up' ? -90 : 90,
    },
    enter: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: transitionDuration / 1000,
        ease: easeOut,
      },
    },
    exit: {
      y: -yOffset,
      opacity: 0,
      rotateX: direction === 'up' ? 90 : -90,
      transition: {
        duration: (transitionDuration * 0.7) / 1000,
        ease: easeOut,
      },
    },
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ perspective: '1000px' }}
    >
      <AnimatePresence mode="wait" onExitComplete={onTransitionComplete}>
        <motion.span
          key={`${activeIndex}-${key}`}
          className={`inline-flex flex-wrap justify-center ${textClassName}`}
          variants={containerVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {parts.map((part, i) => (
            <motion.span
              key={i}
              variants={itemVariants}
              className="inline-block"
              style={{
                transformOrigin: 'center bottom',
                whiteSpace: splitMode === 'characters' ? 'pre' : undefined,
                marginRight: splitMode === 'words' ? '0.3em' : undefined,
              }}
            >
              {part === ' ' ? '\u00A0' : part}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default RotatingText;