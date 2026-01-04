'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RevealTextProps {
  text: string;
  trigger: boolean;
  className?: string;
  onComplete?: () => void;
}

type Phase = 'idle' | 'gather' | 'reveal' | 'complete';

type Dust = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: string; // rgba
  life: number; // 0..1
  spin: number;
  rot: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Palette (cyan → blue → indigo → purple → pink)
const PALETTE = [
  { r: 78, g: 205, b: 196 }, // #4ECDC4
  { r: 66, g: 133, b: 244 }, // #4285F4
  { r: 6, g: 104, b: 225 },  // #0668E1
  { r: 139, g: 92, b: 246 }, // #8B5CF6
  { r: 236, g: 72, b: 153 }, // #EC4899
];

function rgba(i: number, a: number): string {
  const c = PALETTE[i % PALETTE.length];
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

/**
 * "Neural Convergence" Reveal (fixed)
 *
 * - Uses refs for phase/gather/reveal so rAF loops are stable.
 * - No background boxes; only glow/shadows/gradients.
 * - Canvas is positioned over text bounds for dust (fixed positioning).
 */
export function RevealText({ text, trigger, className = '', onComplete }: RevealTextProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [gatherT, setGatherT] = useState(0);
  const [revealT, setRevealT] = useState(0);
  const [loopShimmer, setLoopShimmer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);

  const isMountedRef = useRef(true);

  const dustRafRef = useRef<number | null>(null);
  const timeRafRef = useRef<number | null>(null);

  const dustRef = useRef<Dust[]>([]);
  const dprRef = useRef(1);

  // Refs mirror (prevents dependency thrash / effect reset loop)
  const phaseRef = useRef<Phase>('idle');
  const gatherTRef = useRef(0);
  const revealTRef = useRef(0);

  const chars = useMemo(() => text.split(''), [text]);

  const setPhaseSafe = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const setGatherTSafe = useCallback((t: number) => {
    gatherTRef.current = t;
    setGatherT(t);
  }, []);

  const setRevealTSafe = useCallback((t: number) => {
    revealTRef.current = t;
    setRevealT(t);
  }, []);

  const stopAll = useCallback(() => {
    if (dustRafRef.current) {
      cancelAnimationFrame(dustRafRef.current);
      dustRafRef.current = null;
    }
    if (timeRafRef.current) {
      cancelAnimationFrame(timeRafRef.current);
      timeRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopAll();
      dustRef.current = [];
    };
  }, [stopAll]);

  const setupCanvasToTextBounds = useCallback(() => {
    const canvas = dustCanvasRef.current;
    const containerEl = containerRef.current;
    if (!canvas || !containerEl) return;

    const rect = containerEl.getBoundingClientRect();
    const pad = 120;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    // Place canvas exactly over the text bounds (+ pad)
    canvas.style.position = 'fixed';
    canvas.style.left = `${rect.left - pad}px`;
    canvas.style.top = `${rect.top - pad}px`;
    canvas.style.width = `${rect.width + pad * 2}px`;
    canvas.style.height = `${rect.height + pad * 2}px`;
    canvas.style.pointerEvents = 'none';
    canvas.style.background = 'transparent';
    canvas.style.zIndex = '2';

    const cssW = rect.width + pad * 2;
    const cssH = rect.height + pad * 2;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const spawnDust = useCallback(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const rect = containerEl.getBoundingClientRect();
    const pad = 120;

    const count = window.innerWidth < 768 ? 220 : 340;

    // Local coords inside the canvas:
    const cx = rect.width / 2 + pad;
    const cy = rect.height / 2 + pad;

    const maxR = Math.max(rect.width, rect.height) * 0.8 + 140;
    const minR = Math.max(rect.width, rect.height) * 0.45 + 60;

    const next: Dust[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = lerp(minR, maxR, Math.random());
      const x = cx + Math.cos(a) * r + (Math.random() - 0.5) * 20;
      const y = cy + Math.sin(a) * r + (Math.random() - 0.5) * 20;

      const colIdx = Math.floor(Math.random() * PALETTE.length);

      next.push({
        id: Date.now() + i,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 1.2 + Math.random() * 2.2,
        alpha: 0,
        hue: rgba(colIdx, 1),
        life: 0,
        spin: (Math.random() - 0.5) * 0.12,
        rot: Math.random() * Math.PI * 2,
      });
    }

    dustRef.current = next;
  }, []);

  const startDustLoop = useCallback(() => {
    const tick = (ts: number) => {
      if (!isMountedRef.current) return;

      const canvas = dustCanvasRef.current;
      const containerEl = containerRef.current;
      if (!canvas || !containerEl) {
        dustRafRef.current = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        dustRafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Re-setup occasionally (font/layout)
      const frame = Math.floor(ts / 16);
      if (frame % 10 === 0) setupCanvasToTextBounds();

      const rect = containerEl.getBoundingClientRect();
      const pad = 120;

      // Local centre inside canvas
      const localCX = rect.width / 2 + pad;
      const localCY = rect.height / 2 + pad;

      const gt = easeInOutCubic(gatherTRef.current);
      const rt = revealTRef.current;
      const p = phaseRef.current;

      const cssW = parseFloat(canvas.style.width || '0');
      const cssH = parseFloat(canvas.style.height || '0');

      ctx.clearRect(0, 0, cssW, cssH);

      // Halo (light only)
      if (p === 'gather' || p === 'reveal' || p === 'complete') {
        const haloR = Math.max(rect.width, rect.height) * (0.55 + 0.15 * gt);
        const halo = ctx.createRadialGradient(localCX, localCY, 0, localCX, localCY, haloR);
        halo.addColorStop(0, 'rgba(255,255,255,0)');
        halo.addColorStop(0.35, 'rgba(66,133,244,0.08)');
        halo.addColorStop(0.6, 'rgba(78,205,196,0.06)');
        halo.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(localCX, localCY, haloR, 0, Math.PI * 2);
        ctx.fill();
      }

      const dust = dustRef.current;

      // Fade dust faster once text is arriving
      const revealFade = p === 'reveal' || p === 'complete' ? 0.92 : 0.985;

      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];

        d.life = clamp(d.life + 0.018, 0, 1);
        const appearA = easeOutCubic(d.life);

        const dx = localCX - d.x;
        const dy = localCY - d.y;

        // Swirl strength grows with gather
        const swirl = 0.012 + gt * 0.05;

        const ax = dx * (0.0008 + gt * 0.006) + (-dy) * swirl;
        const ay = dy * (0.0008 + gt * 0.006) + (dx) * swirl;

        d.vx += ax;
        d.vy += ay;

        const damp = 0.90 - gt * 0.08;
        d.vx *= damp;
        d.vy *= damp;

        d.x += d.vx;
        d.y += d.vy;

        // jitter reduces with gather
        d.x += (Math.random() - 0.5) * (1.2 - gt);
        d.y += (Math.random() - 0.5) * (1.2 - gt);

        d.rot += d.spin;

        const baseAlpha = 0.55 * appearA;
        d.alpha = lerp(d.alpha, baseAlpha, 0.12);
        d.alpha *= revealFade;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);

        const glow = d.size * 4.2;

        // Glow
        ctx.globalAlpha = d.alpha * 0.35;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, glow);
        g.addColorStop(0, d.hue);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, glow, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.hue;
        ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);

        ctx.restore();
      }

      // Cull dust as text completes (keep residual ambience)
      if ((p === 'reveal' || p === 'complete') && rt > 0.55 && dust.length > 120) {
        dustRef.current = dust.slice(0, 120);
      }

      dustRafRef.current = requestAnimationFrame(tick);
    };

    dustRafRef.current = requestAnimationFrame(tick);
  }, [setupCanvasToTextBounds]);

  const startTimeLoop = useCallback(
    (onDone?: () => void) => {
      const gatherDuration = 520;
      const revealDuration = 760;
      const settleDuration = 420;

      const start = performance.now();

      const tick = (ts: number) => {
        if (!isMountedRef.current) return;

        const elapsed = ts - start;

        // Gather
        if (elapsed <= gatherDuration) {
          const t = clamp(elapsed / gatherDuration, 0, 1);
          setPhaseSafe('gather');
          setGatherTSafe(t);
          setRevealTSafe(0);
          timeRafRef.current = requestAnimationFrame(tick);
          return;
        }

        // Reveal
        if (elapsed <= gatherDuration + revealDuration) {
          const t = clamp((elapsed - gatherDuration) / revealDuration, 0, 1);
          setPhaseSafe('reveal');
          setGatherTSafe(1);
          setRevealTSafe(t);
          timeRafRef.current = requestAnimationFrame(tick);
          return;
        }

        // Settle -> complete
        const settleT = clamp(
          (elapsed - (gatherDuration + revealDuration)) / settleDuration,
          0,
          1
        );

        setPhaseSafe('complete');
        setGatherTSafe(1);
        setRevealTSafe(1);

        if (settleT >= 1) {
          onDone?.();
          return;
        }

        timeRafRef.current = requestAnimationFrame(tick);
      };

      timeRafRef.current = requestAnimationFrame(tick);
    },
    [setGatherTSafe, setPhaseSafe, setRevealTSafe]
  );

  // Main sequence
  useEffect(() => {
    if (!trigger) return;

    stopAll();

    // Reset
    setLoopShimmer(false);
    setPhaseSafe('gather');
    setGatherTSafe(0);
    setRevealTSafe(0);

    // Setup
    setupCanvasToTextBounds();
    spawnDust();

    // Start loops
    startDustLoop();
    startTimeLoop(() => {
      if (!isMountedRef.current) return;
      setLoopShimmer(true);
      onComplete?.();
    });

    const onResize = () => {
      setupCanvasToTextBounds();
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      stopAll();
    };
  }, [trigger, onComplete, setupCanvasToTextBounds, spawnDust, startDustLoop, startTimeLoop, stopAll, setPhaseSafe, setGatherTSafe, setRevealTSafe]);

  if (!trigger && phase === 'idle') return null;

  const isRevealing = phase === 'reveal' || phase === 'complete';
  const waveT = easeOutCubic(revealT);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ background: 'transparent', backgroundColor: 'transparent' }}
    >
      {/* Dust canvas overlay (no background) */}
      <canvas
        ref={dustCanvasRef}
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: 'fixed',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Core “spark” (light only) */}
      <AnimatePresence>
        {(phase === 'gather' || phase === 'reveal') && (
          <motion.div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: phase === 'gather' ? [0, 0.75, 0.25] : [0.15, 0.35, 0.2],
              scale: phase === 'gather' ? [0.6, 1.15, 1.0] : [1.0, 1.08, 1.0],
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              transform: 'translate(-50%, -50%)',
              width: 10,
              height: 10,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.92)',
              boxShadow:
                '0 0 24px rgba(255,255,255,0.75), 0 0 70px rgba(66,133,244,0.45), 0 0 110px rgba(78,205,196,0.25)',
              zIndex: 3,
            }}
          />
        )}
      </AnimatePresence>

      {/* Text */}
      <div className="relative z-[4] flex flex-wrap justify-center select-none" style={{ background: 'transparent' }}>
        {chars.map((ch, i) => {
          const isSpace = ch === ' ';
          const p = (i + 0.5) / Math.max(1, chars.length);

          // deterministic-ish jitter (avoid mechanical sweep)
          const noise = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1; // force 0..1
          const jitter = (noise - 0.5) * 0.05;
          const threshold = clamp(p + jitter - 0.12, 0, 1);

          const shown = isRevealing && waveT >= threshold;

          const localT = shown ? clamp((waveT - threshold) / 0.22, 0, 1) : 0;
          const pop = easeOutCubic(localT);

          const hasFullGlow = phase === 'complete';
          const shimmer = hasFullGlow ? 1 : clamp(pop * 0.8, 0, 0.8);

          const gradient =
            'linear-gradient(135deg, #4ECDC4 0%, #4285F4 28%, #0668E1 45%, #8B5CF6 72%, #EC4899 100%)';

          return (
            <motion.span
              key={`${ch}-${i}`}
              className="relative inline-block"
              initial={false}
              animate={{
                opacity: shown ? 1 : 0,
                y: shown ? lerp(14, 0, pop) : 18,
                scale: shown ? lerp(0.92, 1, pop) : 0.85,
                rotateX: shown ? lerp(-85, 0, pop) : -90,
              }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                transformStyle: 'preserve-3d',
                perspective: 900,
                marginRight: isSpace ? '0.26em' : '0.015em',

                background: shown ? gradient : 'transparent',
                WebkitBackgroundClip: shown ? 'text' : undefined,
                backgroundClip: shown ? 'text' : undefined,
                WebkitTextFillColor: shown ? 'transparent' : 'transparent',

                textShadow: shown
                  ? `
                    0 0 ${8 + shimmer * 10}px rgba(66,133,244,${0.55 + shimmer * 0.2}),
                    0 0 ${18 + shimmer * 18}px rgba(78,205,196,${0.22 + shimmer * 0.2}),
                    0 0 ${38 + shimmer * 40}px rgba(139,92,246,${0.16 + shimmer * 0.14})
                  `
                  : 'none',

                filter: shown ? `brightness(${1.02 + shimmer * 0.12})` : 'none',
              }}
            >
              {isSpace ? '\u00A0' : ch}

              {/* micro spark collapse */}
              <AnimatePresence>
                {phase === 'reveal' && shown && pop < 0.98 && !isSpace && (
                  <motion.i
                    className="pointer-events-none absolute left-1/2 top-1/2"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.15, 0.9] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    style={{
                      transform: 'translate(-50%, -50%)',
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.95)',
                      boxShadow:
                        '0 0 14px rgba(255,255,255,0.65), 0 0 30px rgba(66,133,244,0.35), 0 0 46px rgba(78,205,196,0.2)',
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.span>
          );
        })}
      </div>

      {/* Under-glow baseline (light only) */}
      {(phase === 'complete' || phase === 'reveal') && (
        <motion.div
          className="pointer-events-none absolute left-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'complete' ? 1 : 0.65 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            top: '62%',
            transform: 'translateX(-50%)',
            width: '120%',
            height: 4,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(78,205,196,0.45) 18%, rgba(66,133,244,0.65) 50%, rgba(139,92,246,0.45) 82%, transparent 100%)',
            filter: 'blur(22px)',
            borderRadius: 999,
            zIndex: 3,
          }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.35, 0.65, 0.35], scaleX: [1.0, 1.06, 1.0] }}
            transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(66,133,244,0.35) 30%, rgba(236,72,153,0.22) 60%, transparent 100%)',
              filter: 'blur(18px)',
              borderRadius: 999,
            }}
          />
        </motion.div>
      )}

      {/* Loop shimmer */}
      {loopShimmer && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ background: 'transparent', zIndex: 5 }}
        >
          <motion.div
            className="absolute top-0 bottom-0"
            initial={{ left: '-30%', opacity: 0 }}
            animate={{ left: ['-30%', '130%'], opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1.6,
              ease: [0.4, 0, 0.2, 1],
              repeat: Infinity,
              repeatDelay: 3.8,
            }}
            style={{
              width: '18%',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), rgba(255,255,255,0.42), rgba(255,255,255,0.22), transparent)',
              filter: 'blur(10px)',
              transform: 'skewX(-18deg)',
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default RevealText;
