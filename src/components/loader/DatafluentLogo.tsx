'use client';

import { forwardRef } from 'react';
import { FINAL_GRADIENT } from '@/lib/brandColors';

interface Props {
  letterColors: string[];
  showFinalGradient: boolean;
  gradientProgress: number;
  visible: boolean;
  settled: boolean;
}

const LETTERS = ['D', 'a', 't', 'a', 'f', 'l', 'u', 'e', 'n', 't'];

function isCounterWeird(letter: string): boolean {
  return letter === 'a' || letter === 'e';
}

export const DatafluentLogo = forwardRef<HTMLDivElement, Props>(
  function DatafluentLogo(
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
          transitionDuration: settled ? '600ms' : '800ms',
        }}
      >
        {/* ================================================================
            LIQUID GLASS AMBIENT GLOW - Blurred, no hard edges
        ================================================================ */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: showFinalGradient
              ? FINAL_GRADIENT
              : 'radial-gradient(ellipse at center, rgba(255,255,255,0.12), transparent 70%)',
            transform: 'scale(2.5)',
            opacity: settled ? 0.45 : showFinalGradient ? 0.35 : 0.2,
            filter: 'blur(80px)',
            zIndex: -1,
          }}
        />

        {/* ================================================================
            MAIN TEXT
        ================================================================ */}
        <h1
          className="relative text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight select-none flex items-start leading-none"
          style={{
            textRendering: 'geometricPrecision',
            WebkitFontSmoothing: 'antialiased',
            fontFamily:
              '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* ================================================================
              LAYER 1: Individual colored letters (fades as gradient fades in)
          ================================================================ */}
          <span
            className="flex items-start transition-opacity duration-500"
            style={{
              opacity: 1 - gradientProgress,
              position: gradientProgress >= 1 ? 'absolute' : 'relative',
              visibility: gradientProgress >= 1 ? 'hidden' : 'visible',
            }}
          >
            {LETTERS.map((letter, i) => {
              const painted = Boolean(letterColors[i]);
              const baseStroke = painted ? 1.2 : 1.4;
              const fillAlpha = painted
                ? 0.08
                : isCounterWeird(letter)
                  ? 0.05
                  : 0.03;

              return (
                <span
                  key={i}
                  data-letter-index={i}
                  className="inline-block transition-all duration-400 ease-out"
                  style={{
                    paintOrder: 'stroke fill',
                    WebkitTextStroke: painted
                      ? `${baseStroke}px ${letterColors[i]}`
                      : `${baseStroke}px rgba(255,255,255,0.45)`,
                    WebkitTextFillColor: `rgba(255,255,255,${fillAlpha})`,
                    textShadow: painted
                      ? `
                          0 0 30px ${letterColors[i]},
                          0 0 60px ${letterColors[i]}40
                        `
                      : '0 0 20px rgba(255,255,255,0.05)',
                    transform: painted ? 'scale(1.03)' : 'scale(1)',
                    filter: painted ? 'brightness(1.1)' : 'none',
                  }}
                >
                  {letter}
                </span>
              );
            })}

            {/* Dot separator */}
            <span
              data-letter-index={10}
              className="text-3xl sm:text-4xl md:text-5xl ml-1.5 sm:ml-2 -mt-1 sm:-mt-2 inline-block transition-all duration-400 ease-out"
              style={{
                paintOrder: 'stroke fill',
                WebkitTextStroke: letterColors[10]
                  ? `1.2px ${letterColors[10]}`
                  : '1.2px rgba(255,255,255,0.35)',
                WebkitTextFillColor: letterColors[10]
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(255,255,255,0.03)',
                textShadow: letterColors[10]
                  ? `0 0 24px ${letterColors[10]}`
                  : '0 0 10px rgba(255,255,255,0.05)',
              }}
            >
              •
            </span>
          </span>

          {/* ================================================================
              LAYER 2: Full gradient text (fades in)
          ================================================================ */}
          <span
            className="flex items-start transition-all duration-500"
            style={{
              opacity: gradientProgress,
              position: gradientProgress < 1 ? 'absolute' : 'relative',
              left: 0,
              top: 0,
            }}
          >
            <span
              className="transition-all duration-500"
              style={{
                background: FINAL_GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: settled
                  ? `
                      drop-shadow(0 0 40px rgba(66,133,244,0.5))
                      drop-shadow(0 0 80px rgba(78,205,196,0.3))
                      brightness(1.05)
                    `
                  : 'drop-shadow(0 0 25px rgba(66,133,244,0.2))',
              }}
            >
              {LETTERS.map((letter, i) => (
                <span key={i} data-letter-index={i} className="inline">
                  {letter}
                </span>
              ))}
            </span>

            {/* Gradient dot */}
            <span
              data-letter-index={10}
              className="text-3xl sm:text-4xl md:text-5xl ml-1.5 sm:ml-2 -mt-1 sm:-mt-2 transition-all duration-500"
              style={{
                background: FINAL_GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: settled
                  ? 'drop-shadow(0 0 16px rgba(255,153,0,0.5))'
                  : undefined,
              }}
            >
              •
            </span>
          </span>
        </h1>

        {/* ================================================================
            SUBTLE TOP HIGHLIGHT - Light refraction effect
        ================================================================ */}
        {visible && settled && (
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 h-px pointer-events-none"
            style={{
              width: '60%',
              background: `linear-gradient(90deg,
                transparent 0%,
                rgba(255,255,255,0.2) 30%,
                rgba(255,255,255,0.35) 50%,
                rgba(255,255,255,0.2) 70%,
                transparent 100%
              )`,
            }}
          />
        )}
      </div>
    );
  }
);