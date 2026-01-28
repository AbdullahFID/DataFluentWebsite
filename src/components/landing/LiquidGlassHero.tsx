// LiquidGlassHero.tsx — Optimized for performance across all devices
'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
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
// DEVICE DETECTION
// ============================================================================

interface DeviceCapabilities {
  isMobile: boolean;
  isLowPower: boolean;
  prefersReducedMotion: boolean;
  screenWidth: number;
}

const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isLowPower: false,
    prefersReducedMotion: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    const detectCapabilities = () => {
      const ua = navigator.userAgent;
      const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
                       window.innerWidth < 768;
      const isLowPower = isMobile ||
                         (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setCapabilities({
        isMobile,
        isLowPower,
        prefersReducedMotion,
        screenWidth: window.innerWidth,
      });
    };

    detectCapabilities();

    // Throttled resize handler
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(detectCapabilities, 150);
    };

    // Listen for reduced motion changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => detectCapabilities();
    motionQuery.addEventListener('change', handleMotionChange);

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return capabilities;
};

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

// Lighter spring configs for better performance
const SPRING_CONFIG = {
  pull: { stiffness: 45, damping: 26, mass: 1.2 },
  scale: { stiffness: 65, damping: 24, mass: 0.6 },
  pill: { stiffness: 45, damping: 28, mass: 0.9 },
  // Lighter config for mobile
  mobile: { stiffness: 80, damping: 30, mass: 0.5 },
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

const LOGO_TUNING: Record<Company, { mult: number; translateX?: number; translateY?: number }> = {
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

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const useViewportSize = () => {
  const [vp, setVp] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    
    const update = () => setVp({ width: window.innerWidth, height: window.innerHeight });
    update();
    
    const handleResize = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(update, 100);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return vp;
};

const useElementSize = <T extends HTMLElement>() => {
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
};

const useTransform2 = (
  a: MotionValue<number>,
  b: MotionValue<number>,
  fn: (a: number, b: number) => number
) => useTransform([a, b], (v) => fn(v[0] as number, v[1] as number));

// ============================================================================
// GOOEY FILTER (Simplified)
// ============================================================================

const GooeyFilter = ({ id }: { id: string }) => (
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

// ============================================================================
// FAINT STARS (Memoized, reduced count on mobile)
// ============================================================================

const FaintStars = ({ reduced = false }: { reduced?: boolean }) => {
  const stars = useMemo(() => {
    const count = reduced ? 30 : 80;
    return Array.from({ length: count }, (_, i) => {
      const seed = (i * 9301 + 49297) % 233280;
      const rand1 = seed / 233280;
      const seed2 = (seed * 9301 + 49297) % 233280;
      const rand2 = seed2 / 233280;
      const seed3 = (seed2 * 9301 + 49297) % 233280;
      const rand3 = seed3 / 233280;
      const seed4 = (seed3 * 9301 + 49297) % 233280;
      const rand4 = seed4 / 233280;

      return {
        id: i,
        x: rand1 * 100,
        y: rand2 * 100,
        size: rand3 * 1.5 + 0.5,
        opacity: rand4 * 0.3 + 0.1,
      };
    });
  }, [reduced]);

  // For reduced motion, render static stars
  if (reduced) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
    );
  }

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
            duration: 3 + (star.id % 3),
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LiquidGlassHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const capabilities = useDeviceCapabilities();
  const viewport = useViewportSize();
  const [isInView, setIsInView] = useState(false);

  const { isMobile, prefersReducedMotion } = capabilities;

  // Intersection Observer for performance
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress: rawScrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Use lighter spring on mobile
  const springConfig = isMobile ? SPRING_CONFIG.mobile : { stiffness: 100, damping: 30, mass: 0.5 };
  const scrollYProgress = useSpring(rawScrollYProgress, springConfig);

  // Throttled time for floating animation
  const time = useMotionValue(0);
  useEffect(() => {
    if (prefersReducedMotion || !isInView) return;

    let raf = 0;
    let last = performance.now();
    const frameInterval = isMobile ? 1000 / 20 : 1000 / 30; // 20fps mobile, 30fps desktop
    
    const loop = (now: number) => {
      const elapsed = now - last;
      if (elapsed >= frameInterval) {
        time.set(time.get() + elapsed);
        last = now - (elapsed % frameInterval);
      }
      raf = requestAnimationFrame(loop);
    };
    
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [time, isMobile, prefersReducedMotion, isInView]);

  const { ref: textMeasureRef, size: textSize } = useElementSize<HTMLHeadingElement>();

  // Memoized layout calculations
  const { orbSize, baseLogoSize, pillWidth, pillHeight, layout } = useMemo(() => {
    const orbSizeCalc = (() => {
      if (!viewport.width) return isMobile ? 72 : 105;
      const target = viewport.width * (isMobile ? 0.17 : 0.072);
      return clamp(Math.round(target), isMobile ? 65 : 95, isMobile ? 80 : 115);
    })();

    const baseLogoSizeCalc = Math.round(orbSizeCalc * 0.52);

    const fallbackTextW = isMobile ? 200 : 520;
    const fallbackTextH = isMobile ? 40 : 80;
    const baseTextW = textSize.width || fallbackTextW;
    const baseTextH = textSize.height || fallbackTextH;

    const padX = isMobile ? 24 : 44;
    const padY = isMobile ? 16 : 22;

    const maxPillWidth = viewport.width 
      ? (isMobile ? viewport.width - 40 : Math.min(640, viewport.width - 200))
      : (isMobile ? 380 : 580);

    const pillWidthCalc = clamp(Math.round(baseTextW + padX * 2), isMobile ? 220 : 400, maxPillWidth);
    const pillHeightCalc = clamp(Math.round(baseTextH + padY * 2), isMobile ? 64 : 84, isMobile ? 80 : 105);

    // Layout calculation
    const gapFromPill = isMobile ? 22 : 32;
    const row1Y = pillHeightCalc / 2 + gapFromPill + orbSizeCalc / 2;
    const row2Y = row1Y + orbSizeCalc * (isMobile ? 1.0 : 1.05);
    const stepX = orbSizeCalc * (isMobile ? 1.95 : 2.2);
    const row2X = stepX * 0.55;

    const layoutCalc: Record<Slot, { x: number; y: number }> = {
      topLeft: { x: -stepX, y: row1Y },
      top: { x: 0, y: row1Y },
      topRight: { x: stepX, y: row1Y },
      bottomLeft: { x: -row2X, y: row2Y },
      bottomRight: { x: row2X, y: row2Y },
    };

    return {
      orbSize: orbSizeCalc,
      baseLogoSize: baseLogoSizeCalc,
      pillWidth: pillWidthCalc,
      pillHeight: pillHeightCalc,
      layout: layoutCalc,
    };
  }, [isMobile, viewport.width, textSize]);

  // Motion transforms
  const pillY = useTransform(
    scrollYProgress,
    [0, 0.08, 0.4, 1],
    [0, isMobile ? -90 : -140, isMobile ? -115 : -175, isMobile ? -115 : -175]
  );

  const pillOpacity = useTransform(scrollYProgress, [0, 0.06, 0.16, 0.7, 1], [0, 0.4, 1, 1, 0.9]);
  const rawPillScale = useTransform(scrollYProgress, [0, 0.16, 0.5], [0.90, 1, 0.98]);
  const pillScale = useSpring(rawPillScale, isMobile ? SPRING_CONFIG.mobile : SPRING_CONFIG.pill);

  const gooeyOpacity = useTransform(scrollYProgress, [0, 0.17, 0.45, 0.55], [1, 1, 1, 0]);
  const lightRaysOpacity = useTransform(scrollYProgress, [0, 0.15, 0.5, 0.8], [0.85, 0.7, 0.4, 0.2]);
  const starsOpacity = useTransform(scrollYProgress, [0, 0.3, 0.6], [0.3, 0.5, 0.3]);

  // Performance settings
  const perfSettings = useMemo(() => ({
    maxDpr: isMobile ? 1 : 1.5,
    targetFps: isMobile ? 20 : 30,
  }), [isMobile]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050508]"
      style={{ height: '180vh', contain: 'layout style' }}
    >
      <GooeyFilter id="goo" />

      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Light Rays - only render if in view */}
        {isInView && (
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
        )}

        {/* Stars */}
        <motion.div className="absolute inset-0 z-0" style={{ opacity: starsOpacity }}>
          <FaintStars reduced={prefersReducedMotion} />
        </motion.div>

        {/* Gooey Blobs - skip on reduced motion */}
        {!prefersReducedMotion && (
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
        )}

        {/* Content Layer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {/* Glass Pill */}
          <motion.div className="absolute" style={{ scale: pillScale, opacity: pillOpacity, y: pillY }}>
            <GlassPill
              pillWidth={pillWidth}
              pillHeight={pillHeight}
              isMobile={isMobile}
            />
          </motion.div>

          {/* Text */}
          <motion.div
            className="absolute flex items-center justify-center z-10"
            style={{ scale: pillScale, y: pillY }}
          >
            <DatafluentText
              textRef={textMeasureRef}
              isMobile={isMobile}
              scrollProgress={scrollYProgress}
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>

          {/* Glass Orbs */}
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

        <ScrollIndicator scrollProgress={scrollYProgress} isMobile={isMobile} />
      </div>
    </section>
  );
}

// ============================================================================
// GLASS PILL
// ============================================================================

interface GlassPillProps {
  pillWidth: number;
  pillHeight: number;
  isMobile: boolean;
}

const GlassPill = ({ pillWidth, pillHeight, isMobile }: GlassPillProps) => (
  <div className="relative" style={{ width: pillWidth, height: pillHeight }}>
    {/* Outer glow */}
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        inset: -4,
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.05), 0 0 40px rgba(255, 255, 255, 0.02)',
      }}
    />

    {/* Top highlight */}
    <div
      className="absolute pointer-events-none z-20"
      style={{
        width: '85%',
        height: '45%',
        top: '-2%',
        left: '7.5%',
        background: `radial-gradient(ellipse 100% 70% at 50% 0%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 20%, rgba(255, 255, 255, 0.02) 45%, transparent 70%)`,
        borderRadius: '9999px',
        filter: 'blur(4px)',
      }}
    />
    <div
      className="absolute pointer-events-none z-20"
      style={{
        width: '70%',
        height: '2px',
        top: '6%',
        left: '15%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)',
        borderRadius: '9999px',
      }}
    />

    {/* Inner border */}
    <div
      className="absolute rounded-full pointer-events-none z-15"
      style={{
        inset: 4,
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}
    />

    {/* Outer border */}
    <div
      className="absolute inset-0 rounded-full pointer-events-none z-15"
      style={{ border: '1.5px solid rgba(255, 255, 255, 0.18)' }}
    />

    {/* Glass Surface */}
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
);

// ============================================================================
// GOOEY BLOB
// ============================================================================

interface GooeyBlobProps {
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
}

const GooeyBlob = ({
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
}: GooeyBlobProps) => {
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

  const springConfig = isMobile ? SPRING_CONFIG.mobile : SPRING_CONFIG.pull;
  const xSpring = useSpring(rawX, springConfig);
  const ySpring = useSpring(rawY, springConfig);

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
        contain: 'layout style paint',
      }}
    />
  );
};

// ============================================================================
// DATAFLUENT TEXT
// ============================================================================

interface DatafluentTextProps {
  textRef: RefObject<HTMLHeadingElement | null>;
  isMobile: boolean;
  scrollProgress: MotionValue<number>;
  prefersReducedMotion: boolean;
}

const DatafluentText = ({ textRef, isMobile, scrollProgress, prefersReducedMotion }: DatafluentTextProps) => {
  const textOpacity = useTransform(scrollProgress, [0, 0.20, 0.28, 0.42, 0.52, 1], [1, 1, 0.15, 0.15, 1, 1]);
  
  // Move this hook outside JSX to avoid conditional call
  const glowOpacity = useTransform(textOpacity, (o) => o * 0.25);

  const textClasses = `font-black tracking-tight ${
    isMobile ? 'text-3xl' : 'text-4xl md:text-5xl lg:text-5xl xl:text-5xl'
  }`;

  return (
    <div className="relative">
      {/* Glow effect - skip on reduced motion */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ filter: 'blur(30px)', opacity: glowOpacity }}
        >
          <span className={textClasses} style={{ color: '#ffffff' }}>
            Datafluent
          </span>
        </motion.div>
      )}

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
            disabled={prefersReducedMotion}
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
};

// ============================================================================
// GLASS SURFACE ORB
// ============================================================================

interface GlassSurfaceOrbProps {
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
}

const GlassSurfaceOrb = ({
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
}: GlassSurfaceOrbProps) => {
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

  const springConfig = isMobile ? SPRING_CONFIG.mobile : SPRING_CONFIG.pull;
  const xSpring = useSpring(rawX, springConfig);
  const ySpring = useSpring(rawY, springConfig);

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
  const scale = useSpring(popScale, isMobile ? SPRING_CONFIG.mobile : SPRING_CONFIG.scale);

  const tune = LOGO_TUNING[config.id] ?? { mult: 1.0 };
  const logoSize = Math.round(baseLogoSize * tune.mult);
  const logoTransform = `translate(${tune.translateX ?? 0}px, ${tune.translateY ?? 0}px)`;

  const handleHover = useCallback(() => setIsHovered(true), []);
  const handleLeave = useCallback(() => setIsHovered(false), []);

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
        contain: 'layout style paint',
      }}
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      {/* Hover ring - skip on mobile */}
      {!isMobile && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: orbSize + 14,
            height: orbSize + 14,
            border: `1px solid ${config.color}`,
            boxShadow: `0 0 16px ${config.color}28`,
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: isHovered ? 0.6 : 0, scale: isHovered ? 1 : 0.92 }}
          transition={{ duration: 0.25 }}
        />
      )}

      {/* Glass bubble orb */}
      <div className="relative cursor-pointer" style={{ width: orbSize, height: orbSize }}>
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

        {/* Prismatic edge ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{
            background: `conic-gradient(from 120deg at 50% 50%, rgba(255, 80, 80, 0.06) 0deg, rgba(255, 160, 80, 0.05) 30deg, rgba(255, 255, 100, 0.04) 60deg, rgba(100, 255, 100, 0.04) 90deg, rgba(80, 200, 255, 0.05) 120deg, rgba(100, 100, 255, 0.06) 150deg, rgba(180, 80, 255, 0.05) 180deg, rgba(255, 80, 180, 0.04) 210deg, rgba(255, 80, 80, 0.03) 240deg, transparent 270deg, transparent 360deg)`,
            mask: 'radial-gradient(circle, transparent 70%, black 80%, black 100%)',
            WebkitMask: 'radial-gradient(circle, transparent 70%, black 80%, black 100%)',
          }}
        />

        {/* Secondary prismatic ring */}
        <div
          className="absolute inset-1 rounded-full pointer-events-none z-10"
          style={{
            background: `conic-gradient(from 240deg at 50% 50%, rgba(100, 200, 255, 0.04) 0deg, rgba(150, 100, 255, 0.03) 45deg, rgba(255, 100, 150, 0.03) 90deg, rgba(255, 200, 100, 0.025) 135deg, transparent 180deg, transparent 360deg)`,
            mask: 'radial-gradient(circle, transparent 75%, black 85%, transparent 95%)',
            WebkitMask: 'radial-gradient(circle, transparent 75%, black 85%, transparent 95%)',
          }}
        />

        {/* Top edge shimmer */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '80%',
            height: '50%',
            top: '0%',
            left: '10%',
            background: `radial-gradient(ellipse 100% 40% at 50% 0%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 40%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* Bottom edge shimmer */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '75%',
            height: '45%',
            bottom: '0%',
            left: '12.5%',
            background: `radial-gradient(ellipse 100% 40% at 50% 100%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* Left edge shimmer */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '40%',
            height: '70%',
            top: '15%',
            left: '0%',
            background: `radial-gradient(ellipse 40% 100% at 0% 50%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 50%, transparent 80%)`,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* Right edge shimmer */}
        <div
          className="absolute pointer-events-none z-20"
          style={{
            width: '40%',
            height: '70%',
            top: '15%',
            right: '0%',
            background: `radial-gradient(ellipse 40% 100% at 100% 50%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 50%, transparent 80%)`,
            borderRadius: '50%',
            filter: 'blur(1px)',
          }}
        />

        {/* Thin glass rim - always show */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{ border: '1.5px solid rgba(255, 255, 255, 0.15)' }}
        />

        {/* Inner border */}
        <div
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            inset: 4,
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        />

        {/* Logo */}
        <div
          className="absolute inset-0 flex items-center justify-center z-30"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))',
            transform: logoTransform,
          }}
        >
          <Logo size={logoSize} />
        </div>

        {/* Hover glow - skip on mobile */}
        {!isMobile && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none z-20"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${config.color}22 0%, transparent 60%)`,
              boxShadow: `0 0 24px ${config.color}15`,
            }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// SCROLL INDICATOR
// ============================================================================

const ScrollIndicator = ({
  scrollProgress,
  isMobile,
}: {
  scrollProgress: MotionValue<number>;
  isMobile: boolean;
}) => {
  const opacity = useTransform(scrollProgress, [0, 0.08], [1, 0]);

  return (
    <motion.div
      className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:gap-2 z-40"
      style={{ opacity }}
    >
      <span className="text-white/35 text-xs md:text-sm font-medium tracking-wide">
        Scroll to explore
      </span>
      <motion.div className="w-5 h-8 md:w-6 md:h-10 rounded-full border-2 border-white/15 flex items-start justify-center p-1.5 md:p-2">
        <motion.div
          className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/45"
          animate={{ y: [0, isMobile ? 10 : 14, 0], opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default LiquidGlassHero;