'use client';

import { motion } from 'framer-motion';
import type { Company } from '@/lib/brandColors';

const LETTERS = ['D', 'a', 't', 'a', 'f', 'l', 'u', 'e', 'n', 't'] as const;

export const LETTER_OWNERSHIP: Record<Company, readonly number[]> = {
  google: [0, 1],      // D a
  apple: [2, 3],       // t a
  meta: [4, 5],        // f l
  microsoft: [6, 7],   // u e
  amazon: [8, 9],      // n t
};

const FILL_DIR: Record<Company, 'left' | 'right' | 'up' | 'down'> = {
  google: 'left',
  apple: 'up',
  meta: 'right',
  microsoft: 'down',
  amazon: 'down',
};

function fillBackground(dir: 'left' | 'right' | 'up' | 'down', color: string) {
  if (dir === 'up' || dir === 'down') {
    const gradientDir = dir === 'up' ? 'to top' : 'to bottom';
    return {
      backgroundImage: `linear-gradient(${gradientDir}, ${color} 50%, transparent 50%)`,
      backgroundSize: '100% 200%',
    } as const;
  }
  const gradientDir = dir === 'left' ? 'to right' : 'to left';
  return {
    backgroundImage: `linear-gradient(${gradientDir}, ${color} 50%, transparent 50%)`,
    backgroundSize: '200% 100%',
  } as const;
}

function filledPosition(dir: 'left' | 'right' | 'up' | 'down', filled: boolean) {
  if (dir === 'up') return filled ? '0% 0%' : '0% 100%';
  if (dir === 'down') return filled ? '0% 100%' : '0% 0%';
  if (dir === 'left') return filled ? '0% 0%' : '100% 0%';
  return filled ? '0% 0%' : '100% 0%';
}

export function DatafluentText({
  hovered,
  companyColor,
  rainbow,
  className = '',
}: {
  hovered: Company | null;
  companyColor: string | null;
  rainbow?: boolean;
  className?: string;
}) {
  const owned = hovered ? LETTER_OWNERSHIP[hovered] : [];
  const dir = hovered ? FILL_DIR[hovered] : 'up';

  return (
    <div className={`relative select-none ${className}`}>
      <div className="flex items-baseline justify-center leading-none">
        {LETTERS.map((ch, i) => {
          const isOwned = hovered ? owned.includes(i) : false;
          const color = companyColor ?? '#ffffff';
          const delay = isOwned ? (i % 2) * 0.06 : 0; // small stagger for the 2 owned letters

          return (
            <span key={`${ch}-${i}`} className="relative inline-block">
              {/* frosted base */}
              <span
                className="datafluent-letter-base"
                aria-hidden="true"
              >
                {ch}
              </span>

              {/* filled overlay */}
              <motion.span
                className="datafluent-letter-fill"
                aria-hidden="true"
                style={{
                  ...(rainbow
                    ? {
                        backgroundImage:
                          'linear-gradient(90deg,#4ECDC4 0%,#4285F4 26%,#0668E1 46%,#8B5CF6 72%,#EC4899 100%)',
                        backgroundSize: '200% 100%',
                      }
                    : fillBackground(dir, color)),
                }}
                animate={{
                  opacity: rainbow ? 1 : isOwned ? 1 : 0,
                  backgroundPosition: rainbow
                    ? ['0% 0%', '100% 0%']
                    : filledPosition(dir, isOwned),
                  textShadow: isOwned
                    ? `0 0 26px ${color}, 0 0 56px ${color}55`
                    : 'none',
                }}
                transition={{
                  duration: rainbow ? 1.4 : 0.42,
                  ease: 'easeOut',
                  delay,
                  repeat: rainbow ? Infinity : 0,
                }}
              >
                {ch}
              </motion.span>

              {/* real text for accessibility */}
              <span className="sr-only">{ch}</span>
            </span>
          );
        })}
      </div>

      {/* nucleus glass plate */}
      <div className="nucleus-glass pointer-events-none absolute -inset-5.5 -z-10 rounded-[28px]" />
    </div>
  );
}
