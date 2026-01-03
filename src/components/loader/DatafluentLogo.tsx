'use client';

import { forwardRef } from 'react';
import { FINAL_GRADIENT } from '@/lib/brandColors';

interface Props {
  letterColors: string[];
  showFinalGradient: boolean;
  gradientProgress: number; // 0 = letters only, 1 = full gradient
  visible: boolean;
  settled: boolean;
}

const LETTERS = ['D', 'a', 't', 'a', 'f', 'l', 'u', 'e', 'n', 't'];

function isCounterWeird(letter: string) {
  return letter === 'a' || letter === 'e';
}

export const DatafluentLogo = forwardRef<HTMLDivElement, Props>(function DatafluentLogo(
  { letterColors, showFinalGradient, gradientProgress, visible, settled },
  ref
) {
  return (
    <div
      ref={ref}
      className={`relative transition-all ease-out ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${settled ? 'scale-[0.985]' : ''}`}
      style={{
        transitionDuration: settled ? '800ms' : '1000ms',
      }}
    >
      {/* Ambient glow - cross-fades to final gradient colors */}
      <div
        className="absolute inset-0 blur-3xl -z-10 transition-all duration-1000"
        style={{
          background: showFinalGradient
            ? FINAL_GRADIENT
            : 'radial-gradient(ellipse at center, rgba(255,255,255,0.12), transparent 70%)',
          transform: 'scale(1.8)',
          opacity: settled ? 0.45 : showFinalGradient ? 0.35 : 0.22,
        }}
      />

      <h1
        className="relative text-7xl md:text-9xl font-extrabold tracking-tight select-none flex items-start leading-none"
        style={{
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* Layer 1: Individual colored letters (fades out as gradient fades in) */}
        <span
          className="flex items-start transition-opacity duration-700"
          style={{
            opacity: 1 - gradientProgress,
            position: gradientProgress >= 1 ? 'absolute' : 'relative',
            visibility: gradientProgress >= 1 ? 'hidden' : 'visible',
          }}
        >
          {LETTERS.map((letter, i) => {
            const painted = Boolean(letterColors[i]);
            const baseStroke = painted ? 1.35 : 1.65;
            const fillAlpha = painted ? 0.12 : isCounterWeird(letter) ? 0.07 : 0.045;

            return (
              <span
                key={i}
                data-letter-index={i}
                className="inline-block transition-all duration-500 ease-out relative"
                style={{
                  paintOrder: 'stroke fill',
                  WebkitTextStroke: painted
                    ? `${baseStroke}px ${letterColors[i]}`
                    : `${baseStroke}px rgba(255,255,255,0.52)`,
                  WebkitTextFillColor: `rgba(255,255,255,${fillAlpha})`,
                  textShadow: painted
                    ? `0 0 34px ${letterColors[i]}, 0 0 70px ${letterColors[i]}45`
                    : '0 0 18px rgba(255,255,255,0.08)',
                  transform: painted ? 'scale(1.045)' : 'scale(1)',
                  filter: painted ? 'brightness(1.14)' : 'none',
                }}
              >
                {letter}
              </span>
            );
          })}
          <span
            data-letter-index={10}
            className="text-4xl md:text-5xl ml-2 -mt-2 inline-block transition-all duration-500 ease-out"
            style={{
              paintOrder: 'stroke fill',
              WebkitTextStroke: letterColors[10]
                ? `1.35px ${letterColors[10]}`
                : '1.35px rgba(255,255,255,0.45)',
              WebkitTextFillColor: letterColors[10]
                ? 'rgba(255,255,255,0.14)'
                : 'rgba(255,255,255,0.05)',
              textShadow: letterColors[10]
                ? `0 0 26px ${letterColors[10]}`
                : '0 0 12px rgba(255,255,255,0.08)',
            }}
          >
            •
          </span>
        </span>

        {/* Layer 2: Full gradient text (fades in) */}
        <span
          className="flex items-start transition-all duration-700"
          style={{
            opacity: gradientProgress,
            position: gradientProgress < 1 ? 'absolute' : 'relative',
            left: 0,
            top: 0,
          }}
        >
          <span
            className="transition-all duration-700"
            style={{
              background: FINAL_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: settled
                ? 'drop-shadow(0 0 60px rgba(66,133,244,0.55)) brightness(1.08)'
                : 'drop-shadow(0 0 32px rgba(66,133,244,0.28))',
            }}
          >
            {/* Hidden spans for data-letter-index when in gradient mode */}
            {LETTERS.map((letter, i) => (
              <span key={i} data-letter-index={i} className="inline">
                {letter}
              </span>
            ))}
          </span>
          <span
            data-letter-index={10}
            className="text-4xl md:text-5xl ml-2 -mt-2 transition-all duration-700"
            style={{
              background: FINAL_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: settled ? 'drop-shadow(0 0 18px rgba(255,153,0,0.55))' : undefined,
            }}
          >
            •
          </span>
        </span>
      </h1>
    </div>
  );
});