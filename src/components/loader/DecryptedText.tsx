'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  trigger?: boolean;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  revealDirection?: 'start' | 'end' | 'center' | 'random';
  className?: string;
  encryptedClassName?: string;
  onComplete?: () => void;
  useGradient?: boolean;
  gradient?: string;
}

const DEFAULT_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export function DecryptedText({
  text,
  trigger = true,
  speed = 50,
  maxIterations = 10,
  characters = DEFAULT_CHARS,
  revealDirection = 'start',
  className = '',
  encryptedClassName = '',
  onComplete,
  useGradient = false,
  gradient = 'linear-gradient(90deg, #4ECDC4 0%, #4285F4 25%, #0668E1 50%, #8B5CF6 75%, #EC4899 100%)',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const iterationsRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const getRandomChar = useCallback(() => {
    return characters[Math.floor(Math.random() * characters.length)];
  }, [characters]);

  const getRevealOrder = useCallback(
    (length: number): number[] => {
      const indices = Array.from({ length }, (_, i) => i);

      switch (revealDirection) {
        case 'end':
          return indices.reverse();
        case 'center': {
          const result: number[] = [];
          let left = Math.floor(length / 2);
          let right = left + 1;
          let toggle = true;
          while (result.length < length) {
            if (toggle && left >= 0) {
              result.push(left--);
            } else if (right < length) {
              result.push(right++);
            } else if (left >= 0) {
              result.push(left--);
            }
            toggle = !toggle;
          }
          return result;
        }
        case 'random':
          return indices.sort(() => Math.random() - 0.5);
        default:
          return indices;
      }
    },
    [revealDirection]
  );

  const startDecryption = useCallback(() => {
    if (!isMountedRef.current) return;

    const chars = text.split('');
    const revealOrder = getRevealOrder(chars.length);

    iterationsRef.current = chars.map(() => 0);
    setRevealed(chars.map(() => false));
    setDisplayText(chars.map((c) => (c === ' ' ? ' ' : getRandomChar())));
    setIsComplete(false);

    let currentRevealIndex = 0;

    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setDisplayText((prev) => {
        const next = [...prev];

        for (let i = 0; i < next.length; i++) {
          if (chars[i] !== ' ' && iterationsRef.current[i] < maxIterations) {
            iterationsRef.current[i]++;
            next[i] = getRandomChar();
          }
        }

        if (currentRevealIndex < revealOrder.length) {
          const idx = revealOrder[currentRevealIndex];
          if (
            iterationsRef.current[idx] >= maxIterations ||
            chars[idx] === ' '
          ) {
            next[idx] = chars[idx];
            setRevealed((r) => {
              const newR = [...r];
              newR[idx] = true;
              return newR;
            });
            currentRevealIndex++;
          }
        }

        const allRevealed = revealOrder.every(
          (idx) =>
            chars[idx] === ' ' || iterationsRef.current[idx] >= maxIterations
        );

        if (allRevealed && currentRevealIndex >= revealOrder.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsComplete(true);
          onComplete?.();
          return chars;
        }

        return next;
      });
    }, speed);
  }, [text, speed, maxIterations, getRandomChar, getRevealOrder, onComplete]);

  useEffect(() => {
    isMountedRef.current = true;

    if (trigger) {
      startDecryption();
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [trigger, startDecryption]);

  useEffect(() => {
    if (!trigger) {
      setDisplayText(
        text.split('').map((c) => (c === ' ' ? ' ' : getRandomChar()))
      );
      setRevealed(text.split('').map(() => false));
    }
  }, [text, trigger, getRandomChar]);

  const textStyle: React.CSSProperties =
    useGradient && isComplete
      ? {
          background: gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }
      : {};

  return (
    <motion.span
      className={className}
      style={textStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayText.map((char, i) => (
        <span
          key={i}
          className={revealed[i] ? '' : encryptedClassName}
          style={{
            opacity: revealed[i] ? 1 : 0.7,
            transition: 'opacity 0.1s ease',
          }}
        >
          {char}
        </span>
      ))}
    </motion.span>
  );
}

export default DecryptedText;