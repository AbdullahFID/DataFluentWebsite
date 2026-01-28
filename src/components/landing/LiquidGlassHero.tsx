// LiquidGlassHero.tsx — MERGED: ChatGPT visual design + restored animations
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

// RESTORED: Our tuned spring config for sticky resistance
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
    // Smoother entrance
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

// Slot-based layout from ChatGPT
type Slot = 'topLeft' | 'top' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface OrbConfig {
  id: Company;
  slot: Slot;
  color: string;
}

// Layout matching reference images
const ORBS: OrbConfig[] = [
  { id: 'tesla', slot: 'topLeft', color: '#E82127' },
  { id: 'microsoft', slot: 'top', color: BRAND_COLORS.microsoft?.[2] ?? '#00A4EF' },
  { id: 'meta', slot: 'topRight', color: BRAND_COLORS.meta?.[0] ?? '#0866FF' },
  { id: 'apple', slot: 'bottomLeft', color: '#E8E8E8' },
  { id: 'google', slot: 'bottomRight', color: BRAND_COLORS.google?.[0] ?? '#4285F4' },
];

// Per-logo sizing/centering - adjusted for better centering
const LOGO_TUNING: Record<
  Company,
  { mult: number; translateX?: number; translateY?: number }
> = {
  tesla: { mult: 1.15, translateX: 0, translateY: 10 },
  microsoft: { mult: 1.05, translateX: 0, translateY: 0 },
  meta: { mult: 1.10, translateX: 0, translateY: 0 },
  apple: { mult: 1.12, translateX: 0, translateY: -1 },
  google: { mult: 1.10, translateX: 0, translateY: 0 },
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
// GOOEY FILTER - RESTORED: Our tuned values for sticky gooey effect
// ============================================================================
function GooeyFilter({ id }: { id: string }) {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
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

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
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

  // Viewport-based orb sizing - smaller on mobile
  const orbSize = useMemo(() => {
    if (!viewport.width) return isMobile ? 78 : 132;
    const target = viewport.width * (isMobile ? 0.19 : 0.092);
    return clamp(Math.round(target), isMobile ? 70 : 118, isMobile ? 88 : 144);
  }, [viewport.width, isMobile]);

  const baseLogoSize = Math.round(orbSize * 0.56);

  // Pill sizing
  const fallbackTextW = isMobile ? 220 : 580;
  const fallbackTextH = isMobile ? 45 : 95;
  const baseTextW = textSize.width || fallbackTextW;
  const baseTextH = textSize.height || fallbackTextH;

  const padX = isMobile ? 22 : 40;
  const padY = isMobile ? 14 : 20;

  const maxPillWidth = useMemo(() => {
    if (!viewport.width) return isMobile ? 520 : 960;
    return isMobile ? viewport.width - 24 : Math.min(980, viewport.width - 140);
  }, [viewport.width, isMobile]);

  const pillWidth = clamp(
    Math.round(baseTextW + padX * 2),
    isMobile ? 280 : 560,
    maxPillWidth
  );

  const pillHeight = clamp(
    Math.round(baseTextH + padY * 2),
    isMobile ? 64 : 88,
    isMobile ? 86 : 112
  );

  // Slot-based layout
  const layout = useMemo(() => {
    const gapFromPill = isMobile ? 14 : 18;
    const row1Y = pillHeight / 2 + gapFromPill + orbSize / 2;
    const row2Y = row1Y + orbSize * (isMobile ? 0.84 : 0.88);

    const stepX = orbSize * (isMobile ? 1.78 : 2.05);
    const row2X = stepX * 0.56;

    const bySlot: Record<Slot, { x: number; y: number }> = {
      topLeft: { x: -stepX, y: row1Y },
      top: { x: 0, y: row1Y },
      topRight: { x: stepX, y: row1Y },
      bottomLeft: { x: -row2X, y: row2Y },
      bottomRight: { x: row2X, y: row2Y },
    };
    return bySlot;
  }, [isMobile, pillHeight, orbSize]);

  // RESTORED: Our tuned pill motion
  const pillY = useTransform(
    scrollYProgress,
    [0, 0.08, 0.4, 1],
    [0, isMobile ? -70 : -105, isMobile ? -92 : -135, isMobile ? -92 : -135]
  );

  const pillOpacity = useTransform(scrollYProgress, [0, 0.06, 0.16, 0.7, 1], [0, 0.4, 1, 1, 0.9]);
  const rawPillScale = useTransform(scrollYProgress, [0, 0.16, 0.5], [0.90, 1, 0.98]);
  const pillScale = useSpring(rawPillScale, SPRING_CONFIG.pill);

  // Gooey opacity - adjusted for new timing
  const gooeyOpacity = useTransform(
    scrollYProgress,
    [0, 0.17, 0.40, 0.50],
    [0.9, 0.9, 0.9, 0]
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
          {/* Gooey pill */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: pillWidth,
              height: pillHeight,
              scale: pillScale,
              opacity: pillOpacity,
              y: pillY,
              background: `
                radial-gradient(ellipse 120% 100% at 50% 30%,
                  rgba(255, 255, 255, 0.72) 0%,
                  rgba(240, 240, 245, 0.62) 40%,
                  rgba(210, 210, 220, 0.52) 100%
                )
              `,
            }}
          />

          {/* Gooey blobs with RESTORED animation */}
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

        {/* BLACK MASK */}
        <motion.div
          className="absolute rounded-full z-20"
          style={{
            width: pillWidth - (isMobile ? 10 : 14),
            height: pillHeight - (isMobile ? 10 : 14),
            scale: pillScale,
            opacity: pillOpacity,
            y: pillY,
            background: '#050508',
          }}
        />

        {/* CONTENT */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {/* Glass Surface Pill */}
          <motion.div className="absolute" style={{ scale: pillScale, opacity: pillOpacity, y: pillY }}>
            <GlassSurface
              width={pillWidth}
              height={pillHeight}
              borderRadius={9999}
              distortionScale={isMobile ? -42 : -96}
              redOffset={isMobile ? 1 : 2}
              greenOffset={isMobile ? 2 : 8}
              blueOffset={isMobile ? 4 : 16}
              brightness={isMobile ? 52 : 48}
              opacity={0.92}
              blur={isMobile ? 8 : 12}
              displace={isMobile ? 0.25 : 0.5}
              backgroundOpacity={isMobile ? 0.02 : 0.04}
              saturation={isMobile ? 1.1 : 1.3}
              borderWidth={isMobile ? 0.04 : 0.07}
              mixBlendMode="screen"
            >
              <div
                className="absolute"
                style={{
                  width: '60%',
                  height: '16%',
                  top: '10%',
                  left: '20%',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              />
            </GlassSurface>
          </motion.div>

          {/* Text */}
          <motion.div className="absolute flex items-center justify-center z-10" style={{ scale: pillScale, y: pillY }}>
            <DatafluentText textRef={textMeasureRef} isMobile={isMobile} scrollProgress={scrollYProgress} />
          </motion.div>

          {/* Glass orbs with RESTORED animation */}
          {ORBS.map((o, i) => (
            <TransparentGlassOrb
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
// GOOEY BLOB - RESTORED: Our sticky resistance animation
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
  // Animation timing - starts after pill settles
  const staggerDelay = index * 0.035;
  const startAt = 0.17 + staggerDelay;
  const stretchAt = startAt + 0.06;
  const settleAt = startAt + 0.16;

  // Start from inside pill
  const startY = pillHeight / 2 - orbSize * 0.35;

  // RESTORED: Sticky pull with resistance → stretch → slight overshoot → settle
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

  // Float
  const phase = index * 1.4;
  const floatAmp = isMobile ? FLOAT_CONFIG.amplitudeMobile : FLOAT_CONFIG.amplitudeDesktop;
  const floatX = useTransform(time, (t) => Math.sin(t / FLOAT_CONFIG.xPeriod + phase) * floatAmp);
  const floatY = useTransform(time, (t) => Math.cos(t / FLOAT_CONFIG.yPeriod + phase * 1.3) * floatAmp * 0.7);

  const xWithFloat = useTransform2(xSpring, floatX, (bx, fx) => bx + fx);
  const yWithFloat = useTransform2(ySpring, floatY, (by, fy) => by + fy);

  // Move with pill
  const y = useTransform2(yWithFloat, pillY, (yy, py) => yy + py);

  // Clamp X for mobile
  const safePad = isMobile ? 12 : 18;
  const maxX = viewportWidth > 0 ? Math.max(0, viewportWidth / 2 - orbSize / 2 - safePad) : 9999;
  const x = useTransform(xWithFloat, (v) => clamp(v, -maxX, maxX));

  const opacity = useTransform(scrollProgress, [startAt, startAt + 0.04], [0, 1]);

  // Glassy gradient - more translucent
  const bg = useTransform(scrollProgress, [startAt, settleAt], [0, 1], { clamp: true });
  const background = useTransform(bg, (i) => {
    const base = Math.round(200 + i * 55);
    const mid = Math.round(180 + i * 45);
    const dark = Math.round(160 + i * 35);
    return `
      radial-gradient(ellipse 100% 100% at 35% 30%,
        rgba(${base}, ${base}, ${base}, 0.55) 0%,
        rgba(${mid}, ${mid}, ${mid + 5}, 0.45) 50%,
        rgba(${dark}, ${dark}, ${dark + 10}, 0.35) 100%
      )
    `;
  });

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
        background,
      }}
    />
  );
}

// ============================================================================
// DATAFLUENT TEXT - RESTORED: Our timing
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
    isMobile ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-6xl xl:text-6xl'
  }`;

  return (
    <div className="relative">
      {/* Glow behind */}
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{ filter: 'blur(30px)', opacity: useTransform(textOpacity, (o) => o * 0.25) }}
      >
        <span className={textClasses} style={{ color: '#ffffff' }}>
          Datafluent
        </span>
      </motion.div>

      {/* Main text */}
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
              width: isMobile ? 6 : 11,
              height: isMobile ? 6 : 11,
              marginLeft: isMobile ? 3 : 5,
              marginTop: isMobile ? 2 : 4,
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
// TRANSPARENT GLASS ORB - Enhanced glassy/chromatic look + RESTORED animation
// ============================================================================
function TransparentGlassOrb({
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

  // Animation timing - starts after pill settles (matches GooeyBlob)
  const staggerDelay = index * 0.035;
  const startAt = 0.17 + staggerDelay;
  const stretchAt = startAt + 0.06;
  const settleAt = startAt + 0.16;

  const startY = pillHeight / 2 - orbSize * 0.35;

  // RESTORED: Sticky pull animation
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

  // RESTORED: Show orb only AFTER blob exits
  const opacity = useTransform(scrollProgress, [settleAt - 0.01, settleAt + 0.04], [0, 1]);
  const popScale = useTransform(scrollProgress, [settleAt - 0.03, settleAt, settleAt + 0.04], [0.85, 1.03, 1]);
  const scale = useSpring(popScale, SPRING_CONFIG.scale);

  const brandColor = config.color;

  // Logo tuning
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
          width: orbSize + 18,
          height: orbSize + 18,
          border: `1px solid ${brandColor}`,
          boxShadow: `0 0 18px ${brandColor}28`,
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: isHovered ? 0.6 : 0, scale: isHovered ? 1 : 0.92 }}
        transition={{ duration: 0.25 }}
      />

      {/* Glass bubble - MORE TRANSLUCENT, less frosted */}
      <div className="relative rounded-full cursor-pointer" style={{ width: orbSize, height: orbSize }}>
        {/* Inner glass - much more transparent */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            backdropFilter: 'blur(2px) saturate(1.0) brightness(1.02)',
WebkitBackdropFilter: 'blur(2px) saturate(1.0) brightness(1.02)',
background:
  'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.010) 60%, transparent 100%)',

          }}
        />

        {/* Outer ring - glass edge */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: '1.25px solid rgba(255, 255, 255, 0.24)',
boxShadow: `
  inset 0 0 18px rgba(255,255,255,0.03),
  0 0 1px rgba(255,255,255,0.22)
`,

          }}
        />

        {/* Chromatic aberration - red (more subtle) */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 20% 20%, rgba(255, 140, 140, 0.04) 0%, transparent 45%)',
            transform: 'translate(-2px, -1px)',
          }}
        />
        
        {/* Chromatic aberration - blue */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 80%, rgba(140, 140, 255, 0.04) 0%, transparent 45%)',
            transform: 'translate(2px, 1px)',
          }}
        />

        {/* Top highlight arc - glass surface reflection */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '80%',
            height: '45%',
            top: '3%',
            left: '10%',
            background: `
              radial-gradient(ellipse 100% 60% at 50% 0%,
                rgba(255, 255, 255, 0.20) 0%,
                rgba(255, 255, 255, 0.08) 35%,
                transparent 100%
              )
            `,
            borderRadius: '50% 50% 50% 50% / 100% 100% 0% 0%',
          }}
        />

        {/* Secondary highlight - adds depth */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '25%',
            height: '25%',
            top: '8%',
            left: '15%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(3px)',
          }}
        />

        {/* Bottom rim reflection */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '70%',
            height: '25%',
            bottom: '4%',
            left: '15%',
            background: `
              radial-gradient(ellipse 100% 100% at 50% 100%,
                rgba(255, 255, 255, 0.06) 0%,
                transparent 60%
              )
            `,
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          }}
        />

        {/* Inner edge glow - subtle */}
        <div
          className="absolute inset-1 rounded-full pointer-events-none"
          style={{ boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.06)' }}
        />

        {/* Logo */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            transform: logoTransform,
          }}
        >
          <Logo size={logoSize} />
        </div>

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 40%, ${brandColor}18 0%, transparent 60%)` }}
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