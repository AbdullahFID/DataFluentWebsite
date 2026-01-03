'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';
import { BRAND_COLORS, Company } from '@/lib/brandColors';

interface HeroLogoProps {
  scrollProgress: MotionValue<number>;
}

const LETTERS: { char: string; company: Company; colorIndex: number }[] = [
  { char: 'D', company: 'google', colorIndex: 0 },
  { char: 'a', company: 'google', colorIndex: 1 },
  { char: 't', company: 'google', colorIndex: 2 },
  { char: 'a', company: 'google', colorIndex: 3 },
  { char: 'f', company: 'apple', colorIndex: 0 },
  { char: 'l', company: 'meta', colorIndex: 0 },
  { char: 'u', company: 'meta', colorIndex: 1 },
  { char: 'e', company: 'microsoft', colorIndex: 0 },
  { char: 'n', company: 'microsoft', colorIndex: 1 },
  { char: 't', company: 'amazon', colorIndex: 0 },
];

const DRAIN_TIMING: Record<Company, { start: number; end: number }> = {
  google: { start: 0.08, end: 0.22 },
  apple: { start: 0.18, end: 0.32 },
  meta: { start: 0.28, end: 0.42 },
  microsoft: { start: 0.38, end: 0.52 },
  amazon: { start: 0.48, end: 0.62 },
};

export function HeroLogo({ scrollProgress }: HeroLogoProps) {
  return (
    <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold tracking-tight flex select-none">
      {LETTERS.map((letter, i) => (
        <DrainLetter
          key={i}
          char={letter.char}
          color={BRAND_COLORS[letter.company][letter.colorIndex]}
          timing={DRAIN_TIMING[letter.company]}
          scrollProgress={scrollProgress}
        />
      ))}
    </h1>
  );
}

interface DrainLetterProps {
  char: string;
  color: string;
  timing: { start: number; end: number };
  scrollProgress: MotionValue<number>;
}

function DrainLetter({ char, color, timing, scrollProgress }: DrainLetterProps) {
  const colorIntensity = useTransform(
    scrollProgress,
    [timing.start, timing.end],
    [1, 0]
  );

  const glowSize = useTransform(
    scrollProgress,
    [timing.start, timing.end],
    [20, 0]
  );

  return (
    <span className="relative inline-block">
      {/* Gray base */}
      <span className="text-white/20">{char}</span>

      {/* Colored overlay */}
      <motion.span
        className="absolute inset-0"
        style={{
          color: color,
          opacity: colorIntensity,
          textShadow: useTransform(
            glowSize,
            (size) => `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}50`
          ),
        }}
      >
        {char}
      </motion.span>
    </span>
  );
}

export default HeroLogo;