// LiquidGlassHero.tsx — Using GlassSurface for true chromatic glass effect
'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
} from 'framer-motion';

import { LOGO_COMPONENTS } from '@/components/loader/FaangLogos';
import { BRAND_COLORS, Company } from '@/lib/brandColors';
import LightRays from '@/components/backgrounds/LightRays';
import GlassSurface from '@/components/ui/GlassSurface';
import TextShiny from '@/components/ui/TextShiny';

// ============================================================================
// CONFIG
// ============================================================================
const LIGHT_RAYS_CONFIG = {
  color: '#ffffff',
  origin: 'top-center' as const,
  speed: 0.5,
  lightSpread: 0.6,
  rayLength: 3.2,
  fadeDistance: 1.6,
  saturation: 0.85,
  distortion: 0.08,
  noiseAmount: 0.01,
};

const SPRING_CONFIG = {
  pull: {
    stiffness: 45,
    damping: 26,
    mass: 1.2,
  },
  scale: {
    stiffness: 65,
    damping: 24,
    mass: 0.6,
  },
  pill: {
    stiffness: 45,
    damping: 28,
    mass: 0.9,
  },
};

const FLOAT_CONFIG = {
  xPeriod: 2600,
  yPeriod: 3200,
  amplitudeDesktop: 9,
  amplitudeMobile: 3,
};

type Slot = 'topLeft' | 'top' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface OrbConfig {
  id: Company;
  slot: Slot;
  color: string;
}

const ORBS: OrbConfig[] = [
  { id: 'tesla', slot: 'topLeft', color: '#E82127' },
  { id: 'microsoft', slot: 'top', color: BRAND_COLORS.microsoft?.[2] ?? '#00A4EF' },
  { id: 'meta', slot: 'topRight', color: BRAND_COLORS.meta?.[0] ?? '#0866FF' },
  { id: 'apple', slot: 'bottomLeft', color: '#E8E8E8' },
  { id: 'google', slot: 'bottomRight', color: BRAND_COLORS.google?.[0] ?? '#4285F4' },
];

const LOGO_TUNING: Record<
  Company,
  { mult: number; translateX?: number; translateY?: number }
> = {
  tesla: { mult: 1.1, translateX: 0, translateY: 8 },
  microsoft: { mult: 1.0, translateX: 0, translateY: 0 },
  meta: { mult: 1.05, translateX: 0, translateY: 0 },
  apple: { mult: 1.08, translateX: 0, translateY: -2 },
  google: { mult: 1.05, translateX: 0, translateY: 0 },
  amazon: { mult: 1.0 },
  tiktok: { mult: 1.0 },
};

// ============================================================================
// HELPERS
// ============================================================================
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function useViewportSize() {
  const [vp, setVp] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const update = () => setVp({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return vp;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ width: el.offsetWidth, height: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

function useTransform2(
  a: MotionValue<number>,
  b: MotionValue<number>,
  fn: (a: number, b: number) => number
) {
  return useTransform([a, b], (v) => fn(v[0] as number, v[1] as number));
}

// ============================================================================
// GOOEY FILTER
// ============================================================================
function GooeyFilter({ id }: { id: string }) {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -9"
            result="gooey"
          />
          <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

// ============================================================================
// FAINT STARS
// ============================================================================
function FaintStars() {
  const [stars] = useState(() =>
    Array.from({ length: 80 }, (_, i) => {
      const seed = (i * 9301 + 49297) % 233280;
      const rand1 = seed / 233280;
      const seed2 = (seed * 9301 + 49297) % 233280;
      const rand2 = seed2 / 233280;
      const seed3 = (seed2 * 9301 + 49297) % 233280;
      const rand3 = seed3 / 233280;
      const seed4 = (seed3 * 9301 + 49297) % 233280;
      const rand4 = seed4 / 233280;
      const seed5 = (seed4 * 9301 + 49297) % 233280;
      const rand5 = seed5 / 233280;
      const seed6 = (seed5 * 9301 + 49297) % 233280;
      const rand6 = seed6 / 233280;

      return {
        id: i,
        x: rand1 * 100,
        y: rand2 * 100,
        size: rand3 * 1.5 + 0.5,
        opacity: rand4 * 0.3 + 0.1,
        delay: rand5 * 5,
        duration: 3 + rand6 * 2,
      };
    })
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export function LiquidGlassHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const viewport = useViewportSize();

  const { scrollYProgress: rawScrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const scrollYProgress = useSpring(rawScrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });

  const time = useMotionValue(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      time.set(time.get() + dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [time]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { ref: textMeasureRef, size: textSize } = useElementSize<HTMLHeadingElement>();

  // Slightly bigger orbs
  const orbSize = useMemo(() => {
    if (!viewport.width) return isMobile ? 72 : 105;
    const target = viewport.width * (isMobile ? 0.17 : 0.072);
    return clamp(Math.round(target), isMobile ? 65 : 95, isMobile ? 80 : 115);
  }, [viewport.width, isMobile]);

  const baseLogoSize = Math.round(orbSize * 0.52);

  const fallbackTextW = isMobile ? 200 : 520;
  const fallbackTextH = isMobile ? 40 : 80;
  const baseTextW = textSize.width || fallbackTextW;
  const baseTextH = textSize.height || fallbackTextH;

  // Pill padding - longer width like reference
  const padX = isMobile ? 24 : 44;
  const padY = isMobile ? 16 : 22;

  const maxPillWidth = useMemo(() => {
    if (!viewport.width) return isMobile ? 380 : 580;
    return isMobile ? viewport.width - 40 : Math.min(640, viewport.width - 200);
  }, [viewport.width, isMobile]);

  const pillWidth = clamp(
    Math.round(baseTextW + padX * 2),
    isMobile ? 220 : 400,
    maxPillWidth
  );

  // Taller pill height
  const pillHeight = clamp(
    Math.round(baseTextH + padY * 2),
    isMobile ? 64 : 84,
    isMobile ? 80 : 105
  );

  // More equal spacing layout
  const layout = useMemo(() => {
    const gapFromPill = isMobile ? 22 : 32;
    const row1Y = pillHeight / 2 + gapFromPill + orbSize / 2;
    const row2Y = row1Y + orbSize * (isMobile ? 1.0 : 1.05);

    // Horizontal spacing
    const stepX = orbSize * (isMobile ? 1.95 : 2.2);
    const row2X = stepX * 0.55;

    const bySlot: Record<Slot, { x: number; y: number }> = {
      topLeft: { x: -stepX, y: row1Y },
      top: { x: 0, y: row1Y },
      topRight: { x: stepX, y: row1Y },
      bottomLeft: { x: -row2X, y: row2Y },
      bottomRight: { x: row2X, y: row2Y },
    };
    return bySlot;
  }, [isMobile, pillHeight, orbSize]);

  const pillY = useTransform(
    scrollYProgress,
    [0, 0.08, 0.4, 1],
    [0, isMobile ? -90 : -140, isMobile ? -115 : -175, isMobile ? -115 : -175]
  );

  const pillOpacity = useTransform(scrollYProgress, [0, 0.06, 0.16, 0.7, 1], [0, 0.4, 1, 1, 0.9]);
  const rawPillScale = useTransform(scrollYProgress, [0, 0.16, 0.5], [0.90, 1, 0.98]);
  const pillScale = useSpring(rawPillScale, SPRING_CONFIG.pill);

  const gooeyOpacity = useTransform(
    scrollYProgress,
    [0, 0.17, 0.45, 0.55],
    [1, 1, 1, 0]
  );

  const lightRaysOpacity = useTransform(scrollYProgress, [0, 0.15, 0.5, 0.8], [0.85, 0.7, 0.4, 0.2]);
  const starsOpacity = useTransform(scrollYProgress, [0, 0.3, 0.6], [0.3, 0.5, 0.3]);

  const perfSettings = useMemo(
    () => ({
      maxDpr: isMobile ? 1 : 1.5,
      targetFps: isMobile ? 24 : 30,
    }),
    [isMobile]
  );

  return (
    <section ref={sectionRef} className="relative bg-[#050508]" style={{ height: '180vh' }}>
      <GooeyFilter id="goo" />

      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* LIGHT RAYS */}
        <motion.div className="absolute inset-0 z-0" style={{ opacity: lightRaysOpacity }}>
          <LightRays
            raysOrigin={LIGHT_RAYS_CONFIG.origin}
            raysColor={LIGHT_RAYS_CONFIG.color}
            raysSpeed={LIGHT_RAYS_CONFIG.speed}
            lightSpread={LIGHT_RAYS_CONFIG.lightSpread}
            rayLength={LIGHT_RAYS_CONFIG.rayLength}
            fadeDistance={LIGHT_RAYS_CONFIG.fadeDistance}
            saturation={LIGHT_RAYS_CONFIG.saturation}
            distortion={LIGHT_RAYS_CONFIG.distortion}
            noiseAmount={LIGHT_RAYS_CONFIG.noiseAmount}
            followMouse={!isMobile}
            mouseInfluence={isMobile ? 0 : 0.08}
            maxDpr={perfSettings.maxDpr}
            targetFps={perfSettings.targetFps}
          />
        </motion.div>

        {/* STARS */}
        <motion.div className="absolute inset-0 z-0" style={{ opacity: starsOpacity }}>
          <FaintStars />
        </motion.div>

        {/* GOOEY BLOBS */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ filter: 'url(#goo)', opacity: gooeyOpacity }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: pillWidth,
              height: pillHeight,
              scale: pillScale,
              opacity: pillOpacity,
              y: pillY,
              background: 'rgba(20, 20, 25, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          />

          {ORBS.map((o, i) => (
            <GooeyBlob
              key={`blob-${o.id}`}
              index={i}
              scrollProgress={scrollYProgress}
              pillHeight={pillHeight}
              pillY={pillY}
              time={time}
              isMobile={isMobile}
              orbSize={orbSize}
              targetX={layout[o.slot].x}
              targetY={layout[o.slot].y}
              viewportWidth={viewport.width}
            />
          ))}
        </motion.div>

        {/* CONTENT LAYER */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {/* Glass Pill using GlassSurface with highlight effects */}
          <motion.div className="absolute" style={{ scale: pillScale, opacity: pillOpacity, y: pillY }}>
            <div className="relative" style={{ width: pillWidth, height: pillHeight }}>
            {/* Outer glow - subtle */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: -4,
                background: 'transparent',
                boxShadow: `
                  0 0 20px rgba(255, 255, 255, 0.05),
                  0 0 40px rgba(255, 255, 255, 0.02)
                `,
              }}
            />
            
            {/* Top highlight arc - very subtle for clearer text */}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                width: '85%',
                height: '45%',
                top: '-2%',
                left: '7.5%',
                background: `
                  radial-gradient(ellipse 100% 70% at 50% 0%,
                    rgba(255, 255, 255, 0.2) 0%,
                    rgba(255, 255, 255, 0.08) 20%,
                    rgba(255, 255, 255, 0.02) 45%,
                    transparent 70%
                  )
                `,
                borderRadius: '9999px',
                filter: 'blur(4px)',
              }}
            />

            {/* Sharp top edge highlight line - very subtle */}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                width: '70%',
                height: '2px',
                top: '6%',
                left: '15%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)',
                borderRadius: '9999px',
                filter: 'blur(0.5px)',
              }}
            />

            {/* Secondary softer highlight - minimal */}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                width: '50%',
                height: '20%',
                top: '8%',
                left: '25%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                borderRadius: '9999px',
                filter: 'blur(6px)',
              }}
            />

            {/* Glass rim - left edge - subtle */}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                width: '8%',
                height: '70%',
                top: '15%',
                left: '0%',
                background: `
                  linear-gradient(90deg,
                    rgba(255, 255, 255, 0.1) 0%,
                    rgba(255, 255, 255, 0.03) 50%,
                    transparent 100%
                  )
                `,
                borderRadius: '9999px 0 0 9999px',
                filter: 'blur(2px)',
              }}
            />

            {/* Glass rim - right edge - subtle */}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                width: '8%',
                height: '70%',
                top: '15%',
                right: '0%',
                background: `
                  linear-gradient(270deg,
                    rgba(255, 255, 255, 0.1) 0%,
                    rgba(255, 255, 255, 0.03) 50%,
                    transparent 100%
                  )
                `,
                borderRadius: '0 9999px 9999px 0',
                filter: 'blur(2px)',
              }}
            />

            {/* Bottom subtle rim reflection - minimal */}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                width: '60%',
                height: '25%',
                bottom: '2%',
                left: '20%',
                background: `
                  radial-gradient(ellipse 100% 80% at 50% 100%,
                    rgba(255, 255, 255, 0.06) 0%,
                    rgba(255, 255, 255, 0.02) 50%,
                    transparent 80%
                  )
                `,
                borderRadius: '9999px',
                filter: 'blur(3px)',
              }}
            />

            {/* Prismatic edge effect for pill - subtle */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none z-10"
              style={{
                background: `
                  linear-gradient(90deg,
                    rgba(255, 100, 100, 0.04) 0%,
                    rgba(255, 200, 100, 0.02) 15%,
                    transparent 25%,
                    transparent 75%,
                    rgba(100, 200, 255, 0.02) 85%,
                    rgba(100, 100, 255, 0.04) 100%
                  )
                `,
              }}
            />

            {/* Inner chamfer/crease edge - more visible */}
            <div
              className="absolute rounded-full pointer-events-none z-15"
              style={{
                inset: 4,
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: `
                  0 0 2px rgba(255, 255, 255, 0.1)
                `,
              }}
            />

            {/* Outer border ring */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none z-15"
              style={{
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
              }}
            />

            {/* The actual GlassSurface - minimal effect for clearer text */}
            <GlassSurface
              width={pillWidth}
              height={pillHeight}
              borderRadius={9999}
              distortionScale={isMobile ? -50 : -80}
              redOffset={isMobile ? 0 : -1}
              greenOffset={isMobile ? 2 : 4}
              blueOffset={isMobile ? 5 : 8}
              brightness={60}
              opacity={0.85}
              blur={isMobile ? 4 : 6}
              displace={0.3}
              backgroundOpacity={0}
              saturation={1.05}
              borderWidth={0.06}
              mixBlendMode="screen"
            />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div className="absolute flex items-center justify-center z-10" style={{ scale: pillScale, y: pillY }}>
            <DatafluentText textRef={textMeasureRef} isMobile={isMobile} scrollProgress={scrollYProgress} />
          </motion.div>

          {/* Glass orbs using GlassSurface */}
          {ORBS.map((o, i) => (
            <GlassSurfaceOrb
              key={`orb-${o.id}`}
              config={o}
              index={i}
              scrollProgress={scrollYProgress}
              pillHeight={pillHeight}
              pillY={pillY}
              time={time}
              isMobile={isMobile}
              orbSize={orbSize}
              baseLogoSize={baseLogoSize}
              targetX={layout[o.slot].x}
              targetY={layout[o.slot].y}
              viewportWidth={viewport.width}
            />
          ))}
        </div>

        <ScrollIndicator scrollProgress={scrollYProgress} />
      </div>
    </section>
  );
}

// ============================================================================
// GOOEY BLOB
// ============================================================================
function GooeyBlob({
  index,
  scrollProgress,
  pillHeight,
  pillY,
  time,
  isMobile,
  orbSize,
  targetX,
  targetY,
  viewportWidth,
}: {
  index: number;
  scrollProgress: MotionValue<number>;
  pillHeight: number;
  pillY: MotionValue<number>;
  time: MotionValue<number>;
  isMobile: boolean;
  orbSize: number;
  targetX: number;
  targetY: number;
  viewportWidth: number;
}) {
  const staggerDelay = index * 0.035;
  const startAt = 0.17 + staggerDelay;
  const stretchAt = startAt + 0.06;
  const settleAt = startAt + 0.16;

  const startY = pillHeight / 2 - orbSize * 0.35;

  const rawX = useTransform(
    scrollProgress,
    [0, startAt, startAt + 0.025, stretchAt, stretchAt + 0.03, settleAt],
    [0, 0, targetX * 0.15, targetX * 0.5, targetX * 1.04, targetX]
  );
  const rawY = useTransform(
    scrollProgress,
    [0, startAt, startAt + 0.025, stretchAt, stretchAt + 0.03, settleAt],
    [0, startY * 0.3, startY * 0.6, targetY * 0.5, targetY * 1.04, targetY]
  );

  const xSpring = useSpring(rawX, SPRING_CONFIG.pull);
  const ySpring = useSpring(rawY, SPRING_CONFIG.pull);

  const phase = index * 1.4;
  const floatAmp = isMobile ? FLOAT_CONFIG.amplitudeMobile : FLOAT_CONFIG.amplitudeDesktop;
  const floatX = useTransform(time, (t) => Math.sin(t / FLOAT_CONFIG.xPeriod + phase) * floatAmp);
  const floatY = useTransform(time, (t) => Math.cos(t / FLOAT_CONFIG.yPeriod + phase * 1.3) * floatAmp * 0.7);

  const xWithFloat = useTransform2(xSpring, floatX, (bx, fx) => bx + fx);
  const yWithFloat = useTransform2(ySpring, floatY, (by, fy) => by + fy);

  const y = useTransform2(yWithFloat, pillY, (yy, py) => yy + py);

  const safePad = isMobile ? 12 : 18;
  const maxX = viewportWidth > 0 ? Math.max(0, viewportWidth / 2 - orbSize / 2 - safePad) : 9999;
  const x = useTransform(xWithFloat, (v) => clamp(v, -maxX, maxX));

  const opacity = useTransform(scrollProgress, [startAt, startAt + 0.04], [0, 1]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{
        width: orbSize,
        height: orbSize,
        x,
        y,
        opacity,
        translateX: '-50%',
        translateY: '-50%',
        background: 'rgba(20, 20, 25, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    />
  );
}

// ============================================================================
// DATAFLUENT TEXT
// ============================================================================
function DatafluentText({
  textRef,
  isMobile,
  scrollProgress,
}: {
  textRef: RefObject<HTMLHeadingElement | null>;
  isMobile: boolean;
  scrollProgress: MotionValue<number>;
}) {
  const textOpacity = useTransform(
    scrollProgress,
    [0, 0.20, 0.28, 0.42, 0.52, 1],
    [1, 1, 0.15, 0.15, 1, 1]
  );

  const textClasses = `font-black tracking-tight ${
    isMobile ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-5xl xl:text-5xl'
  }`;

  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{ filter: 'blur(30px)', opacity: useTransform(textOpacity, (o) => o * 0.25) }}
      >
        <span className={textClasses} style={{ color: '#ffffff' }}>
          Datafluent
        </span>
      </motion.div>

      <motion.div className="relative" style={{ opacity: textOpacity }}>
        <h1
          ref={textRef}
          className={`${textClasses} relative inline-flex items-start`}
          style={{ textShadow: '0 0 40px rgba(255,255,255,0.25), 0 0 80px rgba(255,255,255,0.12)' }}
        >
          <TextShiny
            text="Datafluent"
            color="#d0d0d0"
            shineColor="#ffffff"
            speed={4}
            delay={2}
            spread={115}
            direction="left"
          />
          <span
            className="rounded-full shrink-0"
            style={{
              width: isMobile ? 5 : 9,
              height: isMobile ? 5 : 9,
              marginLeft: isMobile ? 2 : 4,
              marginTop: isMobile ? 2 : 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #d0d0d0 100%)',
              boxShadow: '0 0 8px rgba(255,255,255,0.5)',
            }}
          />
        </h1>
      </motion.div>
    </div>
  );
}

// ============================================================================
// GLASS SURFACE ORB - Using actual GlassSurface for chromatic refraction
// ============================================================================
function GlassSurfaceOrb({
  config,
  index,
  scrollProgress,
  pillHeight,
  pillY,
  time,
  isMobile,
  orbSize,
  baseLogoSize,
  targetX,
  targetY,
  viewportWidth,
}: {
  config: OrbConfig;
  index: number;
  scrollProgress: MotionValue<number>;
  pillHeight: number;
  pillY: MotionValue<number>;
  time: MotionValue<number>;
  isMobile: boolean;
  orbSize: number;
  baseLogoSize: number;
  targetX: number;
  targetY: number;
  viewportWidth: number;
}) {
  const Logo = LOGO_COMPONENTS[config.id];
  const [isHovered, setIsHovered] = useState(false);

  const staggerDelay = index * 0.035;
  const startAt = 0.17 + staggerDelay;
  const stretchAt = startAt + 0.06;
  const settleAt = startAt + 0.16;

  const startY = pillHeight / 2 - orbSize * 0.35;

  const rawX = useTransform(
    scrollProgress,
    [0, startAt, startAt + 0.025, stretchAt, stretchAt + 0.03, settleAt],
    [0, 0, targetX * 0.15, targetX * 0.5, targetX * 1.04, targetX]
  );
  const rawY = useTransform(
    scrollProgress,
    [0, startAt, startAt + 0.025, stretchAt, stretchAt + 0.03, settleAt],
    [0, startY * 0.3, startY * 0.6, targetY * 0.5, targetY * 1.04, targetY]
  );

  const xSpring = useSpring(rawX, SPRING_CONFIG.pull);
  const ySpring = useSpring(rawY, SPRING_CONFIG.pull);

  const phase = index * 1.4;
  const floatAmp = isMobile ? FLOAT_CONFIG.amplitudeMobile : FLOAT_CONFIG.amplitudeDesktop;

  const floatX = useTransform(time, (t) => Math.sin(t / FLOAT_CONFIG.xPeriod + phase) * floatAmp);
  const floatY = useTransform(time, (t) => Math.cos(t / FLOAT_CONFIG.yPeriod + phase * 1.3) * floatAmp * 0.7);

  const xWithFloat = useTransform2(xSpring, floatX, (bx, fx) => bx + fx);
  const yWithFloat = useTransform2(ySpring, floatY, (by, fy) => by + fy);
  const y = useTransform2(yWithFloat, pillY, (yy, py) => yy + py);

  const safePad = isMobile ? 12 : 18;
  const maxX = viewportWidth > 0 ? Math.max(0, viewportWidth / 2 - orbSize / 2 - safePad) : 9999;
  const x = useTransform(xWithFloat, (v) => clamp(v, -maxX, maxX));

  const opacity = useTransform(scrollProgress, [settleAt - 0.01, settleAt + 0.04], [0, 1]);
  const popScale = useTransform(scrollProgress, [settleAt - 0.03, settleAt, settleAt + 0.04], [0.85, 1.03, 1]);
  const scale = useSpring(popScale, SPRING_CONFIG.scale);

  const brandColor = config.color;

  const tune = LOGO_TUNING[config.id] ?? { mult: 1.0 };
  const logoSize = Math.round(baseLogoSize * tune.mult);
  const logoTransform = `translate(${tune.translateX ?? 0}px, ${tune.translateY ?? 0}px)`;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 pointer-events-auto"
      style={{
        x,
        y,
        opacity,
        scale,
        translateX: '-50%',
        translateY: '-50%',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: orbSize + 14,
          height: orbSize + 14,
          border: `1px solid ${brandColor}`,
          boxShadow: `0 0 16px ${brandColor}28`,
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: isHovered ? 0.6 : 0, scale: isHovered ? 1 : 0.92 }}
        transition={{ duration: 0.25 }}
      />

      {/* Glass bubble orb with chromatic refractive edges */}
      <div className="relative cursor-pointer" style={{ width: orbSize, height: orbSize }}>
        
        {/* ========== THE GLASS SURFACE COMPONENT (base layer) ========== */}
        <GlassSurface
          width={orbSize}
          height={orbSize}
          borderRadius={9999}
          distortionScale={isMobile ? -120 : -160}
          redOffset={isMobile ? -1 : -2}
          greenOffset={isMobile ? 5 : 8}
          blueOffset={isMobile ? 12 : 18}
          brightness={55}
          opacity={0.9}
          blur={isMobile ? 8 : 10}
          displace={0.5}
          backgroundOpacity={0}
          saturation={1.15}
          borderWidth={0.07}
          mixBlendMode="screen"
        />

        {/* ========== PRISMATIC EDGE RING - subtle refractive effect ========== */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{
            background: `
              conic-gradient(
                from 120deg at 50% 50%,
                rgba(255, 80, 80, 0.06) 0deg,
                rgba(255, 160, 80, 0.05) 30deg,
                rgba(255, 255, 100, 0.04) 60deg,
                rgba(100, 255, 100, 0.04) 90deg,
                rgba(80, 200, 255, 0.05) 120deg,
                rgba(100, 100, 255, 0.06) 150deg,
                rgba(180, 80, 255, 0.05) 180deg,
                rgba(255, 80, 180, 0.04) 210deg,
                rgba(255, 80, 80, 0.03) 240deg,
                transparent 270deg,
                transparent 360deg
              )
            `,
            mask: 'radial-gradient(circle, transparent 70%, black 80%, black 100%)',
            WebkitMask: 'radial-gradient(circle, transparent 70%, black 80%, black 100%)',
          }}
        />

        {/* ========== SECONDARY PRISMATIC RING (inner edge) ========== */}
        <div
          className="absolute inset-1 rounded-full pointer-events-none z-10"
          style={{
            background: `
              conic-gradient(
                from 240deg at 50% 50%,
                rgba(100, 200, 255, 0.04) 0deg,
                rgba(150, 100, 255, 0.03) 45deg,
                rgba(255, 100, 150, 0.03) 90deg,
                rgba(255, 200, 100, 0.025) 135deg,
                transparent 180deg,
                transparent 360deg
              )
            `,
            mask: 'radial-gradient(circle, transparent 75%, black 85%, transparent 95%)',
            WebkitMask: 'radial-gradient(circle, transparent 75%, black 85%, transparent 95%)',
          }}
        />

        {/* ========== TOP EDGE SHIMMER - curved rim shine ========== */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '80%',
            height: '50%',
            top: '0%',
            left: '10%',
            background: `
              radial-gradient(ellipse 100% 40% at 50% 0%,
                rgba(255, 255, 255, 0.35) 0%,
                rgba(255, 255, 255, 0.15) 40%,
                transparent 70%
              )
            `,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* ========== BOTTOM EDGE SHIMMER - curved rim shine ========== */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '75%',
            height: '45%',
            bottom: '0%',
            left: '12.5%',
            background: `
              radial-gradient(ellipse 100% 40% at 50% 100%,
                rgba(255, 255, 255, 0.25) 0%,
                rgba(255, 255, 255, 0.1) 40%,
                transparent 70%
              )
            `,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* ========== LEFT EDGE SHIMMER ========== */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '40%',
            height: '70%',
            top: '15%',
            left: '0%',
            background: `
              radial-gradient(ellipse 40% 100% at 0% 50%,
                rgba(255, 255, 255, 0.12) 0%,
                rgba(255, 255, 255, 0.04) 50%,
                transparent 80%
              )
            `,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* ========== RIGHT EDGE SHIMMER ========== */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '40%',
            height: '70%',
            top: '15%',
            right: '0%',
            background: `
              radial-gradient(ellipse 40% 100% at 100% 50%,
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.03) 50%,
                transparent 80%
              )
            `,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* ========== THIN GLASS RIM ========== */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* ========== INNER CHAMFER/CREASE EDGE - more visible ========== */}
        <div
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            inset: 4,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: `
              0 0 2px rgba(255, 255, 255, 0.1)
            `,
          }}
        />

        {/* ========== LOGO ========== */}
        <div
          className="absolute inset-0 flex items-center justify-center z-30"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))',
            transform: logoTransform,
          }}
        >
          <Logo size={logoSize} />
        </div>

        {/* ========== HOVER GLOW ========== */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none z-20"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${brandColor}22 0%, transparent 60%)`,
            boxShadow: `0 0 24px ${brandColor}15`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// SCROLL INDICATOR
// ============================================================================
function ScrollIndicator({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollProgress, [0, 0.08], [1, 0]);

  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-40"
      style={{ opacity }}
    >
      <span className="text-white/35 text-sm font-medium tracking-wide">Scroll to explore</span>
      <motion.div className="w-6 h-10 rounded-full border-2 border-white/15 flex items-start justify-center p-2">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-white/45"
          animate={{ y: [0, 14, 0], opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}

export default LiquidGlassHero;