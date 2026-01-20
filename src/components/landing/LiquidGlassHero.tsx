// LiquidGlassHero.tsx — Single Gooey Layer Architecture
// The glass orbs/pill ARE the gooey elements - they have the metaball effect
// Only logos and text are in a separate crisp layer on top
'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

// ============================================================================
// TYPES / CONFIG
// ============================================================================
interface BlobConfig {
  id: Company;
  angle: number;
  color: string;
}

const COMPANIES: BlobConfig[] = [
  { id: 'google', angle: -Math.PI * 0.85, color: BRAND_COLORS.google[0] },
  { id: 'apple', angle: -Math.PI * 0.5, color: '#E8E8E8' },
  { id: 'meta', angle: -Math.PI * 0.15, color: BRAND_COLORS.meta[0] },
  { id: 'microsoft', angle: Math.PI * 0.75, color: BRAND_COLORS.microsoft[2] },
  { id: 'amazon', angle: Math.PI * 0.25, color: BRAND_COLORS.amazon[0] },
];

// ============================================================================
// HELPERS
// ============================================================================
function ellipseRadiusAtAngle(a: number, b: number, theta: number) {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const denom = Math.sqrt((ct * ct) / (a * a) + (st * st) / (b * b));
  if (!isFinite(denom) || denom <= 0) return 0;
  return 1 / denom;
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
// GOOEY SVG FILTER
// ============================================================================
function GooeyFilter({ id }: { id: string }) {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
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
// MAIN COMPONENT
// ============================================================================
export function LiquidGlassHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const time = useMotionValue(0);
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      time.set(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [time]);

  const { ref: textMeasureRef, size: textSize } = useElementSize<HTMLHeadingElement>();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fallbackTextW = isMobile ? 260 : 700;
  const fallbackTextH = isMobile ? 50 : 105;
  const baseTextW = textSize.width || fallbackTextW;
  const baseTextH = textSize.height || fallbackTextH;
  const padX = isMobile ? 40 : 90;
  const padY = isMobile ? 20 : 42;
  const pillWidth = Math.max(isMobile ? 280 : 820, baseTextW + padX * 2);
  const pillHeight = Math.max(isMobile ? 75 : 160, baseTextH + padY * 2);

  const maxDistance = isMobile ? 130 : 220;

  const pillOpacity = useTransform(scrollYProgress, [0, 0.02, 0.06, 0.5], [0, 0, 0.85, 0.7]);
  const pillScale = useTransform(scrollYProgress, [0, 0.06, 0.4], [0.96, 1, 0.9]);
  const glassOverlayOpacity = useTransform(scrollYProgress, [0, 0.06, 0.5], [0, 0.8, 0.6]);

  // Neutral glass color - not blue
  const glassColor = 'rgba(35, 38, 45, 0.7)';

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050508]"
      style={{ height: '400vh' }}
    >
      <GooeyFilter id="goo" />

      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        
        {/* === SINGLE GOOEY LAYER - Contains pill AND orbs === */}
        {/* Everything here has the metaball stretchy effect */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ filter: 'url(#goo)' }}
        >
          {/* Glass Pill - IS a gooey element */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: pillWidth,
              height: pillHeight,
              scale: pillScale,
              opacity: pillOpacity,
              // Neutral dark glass with subtle gradient
              background: `radial-gradient(ellipse 130% 130% at 50% 35%,
                rgba(65, 70, 80, 0.72) 0%,
                rgba(45, 50, 60, 0.65) 40%,
                rgba(30, 35, 45, 0.58) 75%,
                rgba(22, 26, 35, 0.52) 100%
              )`,
              boxShadow: `
                inset 0 10px 35px rgba(255,255,255,0.12),
                inset 0 -12px 40px rgba(0,0,0,0.35)
              `,
            }}
          >
            {/* Chromatic refraction band - top edge */}
            <div
              className="absolute"
              style={{
                width: '80%',
                height: '8px',
                top: '8%',
                left: '10%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, rgba(255,100,100,0.15) 0%, rgba(255,255,255,0.2) 50%, rgba(100,150,255,0.15) 100%)',
                filter: 'blur(4px)',
              }}
            />
            {/* Main highlight */}
            <div
              className="absolute"
              style={{
                width: '60%',
                height: '25%',
                top: '12%',
                left: '20%',
                borderRadius: '999px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 100%)',
                filter: 'blur(8px)',
              }}
            />
          </motion.div>

          {/* Glass Orbs with Membrane - ARE gooey elements */}
          {COMPANIES.map((company, i) => (
            <GooeyGlassOrb
              key={`gooey-orb-${company.id}`}
              config={company}
              index={i}
              maxDistance={maxDistance}
              scrollProgress={scrollYProgress}
              pillWidth={pillWidth}
              pillHeight={pillHeight}
              pillScale={pillScale}
              time={time}
              isMobile={isMobile}
              glassColor={glassColor}
            />
          ))}
        </div>

        {/* === CRISP LAYER - Only logos and text === */}
        {/* No gooey filter - stays sharp */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          
          {/* Glass pill highlight overlay - adds refractive shine */}
          <motion.div
            className="absolute rounded-full overflow-hidden pointer-events-none"
            style={{
              width: pillWidth,
              height: pillHeight,
              scale: pillScale,
              opacity: glassOverlayOpacity,
            }}
          >
            {/* Top chromatic band */}
            <div
              className="absolute"
              style={{
                width: '75%',
                height: '6px',
                top: '10%',
                left: '12.5%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, rgba(255,100,100,0.12) 0%, rgba(255,255,255,0.18) 50%, rgba(100,150,255,0.12) 100%)',
                filter: 'blur(3px)',
              }}
            />
            {/* Glossy highlight */}
            <div
              className="absolute"
              style={{
                width: '55%',
                height: '22%',
                top: '14%',
                left: '22.5%',
                borderRadius: '999px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                filter: 'blur(6px)',
              }}
            />
            {/* Bottom reflection */}
            <div
              className="absolute"
              style={{
                width: '40%',
                height: '10%',
                bottom: '15%',
                left: '30%',
                borderRadius: '999px',
                background: 'linear-gradient(0deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
                filter: 'blur(4px)',
              }}
            />
          </motion.div>

          {/* Datafluent text */}
          <motion.div
            className="absolute flex items-center justify-center z-10"
            style={{ scale: pillScale }}
          >
            <DatafluentText textRef={textMeasureRef} isMobile={isMobile} />
          </motion.div>

          {/* Logo overlays - positioned exactly where orbs are */}
          {COMPANIES.map((company, i) => (
            <LogoOverlay
              key={`logo-${company.id}`}
              config={company}
              index={i}
              maxDistance={maxDistance}
              scrollProgress={scrollYProgress}
              pillWidth={pillWidth}
              pillHeight={pillHeight}
              pillScale={pillScale}
              time={time}
              isMobile={isMobile}
            />
          ))}
        </div>

        <ScrollIndicator scrollProgress={scrollYProgress} />
      </div>
    </section>
  );
}

// ============================================================================
// DATAFLUENT TEXT
// ============================================================================
function DatafluentText({
  textRef,
  isMobile,
}: {
  textRef: RefObject<HTMLHeadingElement | null>;
  isMobile: boolean;
}) {
  const letters = 'Datafluent'.split('');
  const letterColors = [
    BRAND_COLORS.google[0],
    BRAND_COLORS.google[1],
    BRAND_COLORS.google[2],
    BRAND_COLORS.google[3],
    '#A2AAAD',
    BRAND_COLORS.meta[0],
    BRAND_COLORS.meta[1],
    BRAND_COLORS.microsoft[2],
    BRAND_COLORS.microsoft[1],
    BRAND_COLORS.amazon[0],
  ];

  return (
    <h1
      ref={textRef}
      className={`font-black tracking-tight flex ${
        isMobile ? 'text-4xl' : 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
      }`}
    >
      {letters.map((letter, i) => (
        <span
          key={i}
          style={{
            color: letterColors[i],
            textShadow: `0 0 25px ${letterColors[i]}50, 0 0 50px ${letterColors[i]}20`,
          }}
        >
          {letter}
        </span>
      ))}
    </h1>
  );
}

// ============================================================================
// GOOEY GLASS ORB - This IS the visible orb AND has metaball effect
// ============================================================================
function GooeyGlassOrb({
  config,
  index,
  maxDistance,
  scrollProgress,
  pillWidth,
  pillHeight,
  pillScale,
  time,
  isMobile,
  glassColor,
}: {
  config: BlobConfig;
  index: number;
  maxDistance: number;
  scrollProgress: MotionValue<number>;
  pillWidth: number;
  pillHeight: number;
  pillScale: MotionValue<number>;
  time: MotionValue<number>;
  isMobile: boolean;
  glassColor: string;
}) {
  const orbSize = isMobile ? 85 : 130;

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  const staggerDelay = index * 0.035;
  const startAt = 0.05 + staggerDelay;
  const peakAt = startAt + 0.07;
  const bounceAt = peakAt + 0.025;
  const settleAt = startAt + 0.16;

  const rawPull = useTransform(
    scrollProgress,
    [0, startAt, peakAt, bounceAt, settleAt],
    [0, 0, maxDistance * 1.4, maxDistance * 0.82, maxDistance]
  );

  const pull = useSpring(rawPull, {
    stiffness: 300,
    damping: 11,
    mass: 0.55,
  });

  const phase = index * 1.2 + config.angle;
  const floatAmp = isMobile ? 2.5 : 4;
  const floatX = useTransform(time, (t) => Math.sin(t / 1500 + phase) * floatAmp);
  const floatY = useTransform(time, (t) => Math.cos(t / 1700 + phase * 1.2) * floatAmp * 0.75);

  const dist = useTransform2(edge, pull, (e, p) => e + p);
  const baseX = useTransform(dist, (d) => Math.cos(config.angle) * d);
  const baseY = useTransform(dist, (d) => Math.sin(config.angle) * d);
  const x = useTransform2(baseX, floatX, (bx, fx) => bx + fx);
  const y = useTransform2(baseY, floatY, (by, fy) => by + fy);

  const opacity = useTransform(scrollProgress, [startAt - 0.01, startAt + 0.03], [0, 0.9]);

  // Membrane fades out after orb settles - removes the spikes!
  const membraneOpacity = useTransform(
    scrollProgress,
    [startAt, startAt + 0.03, settleAt, settleAt + 0.08],
    [0, 1, 1, 0]
  );

  // === MEMBRANE BEADS - creates the stretchy neck ===
  const beadFractions = [0.0, 0.12, 0.26, 0.42, 0.58, 0.74, 0.88];
  
  const d0 = useTransform2(edge, pull, (e, p) => e * 0.75 + p * beadFractions[0]);
  const d1 = useTransform2(edge, pull, (e, p) => e * 0.85 + p * beadFractions[1]);
  const d2 = useTransform2(edge, pull, (e, p) => e * 0.92 + p * beadFractions[2]);
  const d3 = useTransform2(edge, pull, (e, p) => e + p * beadFractions[3]);
  const d4 = useTransform2(edge, pull, (e, p) => e + p * beadFractions[4]);
  const d5 = useTransform2(edge, pull, (e, p) => e + p * beadFractions[5]);
  const d6 = useTransform2(edge, pull, (e, p) => e + p * beadFractions[6]);

  const b0x = useTransform(d0, (d) => Math.cos(config.angle) * d);
  const b0y = useTransform(d0, (d) => Math.sin(config.angle) * d);
  const b1x = useTransform(d1, (d) => Math.cos(config.angle) * d);
  const b1y = useTransform(d1, (d) => Math.sin(config.angle) * d);
  const b2x = useTransform(d2, (d) => Math.cos(config.angle) * d);
  const b2y = useTransform(d2, (d) => Math.sin(config.angle) * d);
  const b3x = useTransform(d3, (d) => Math.cos(config.angle) * d);
  const b3y = useTransform(d3, (d) => Math.sin(config.angle) * d);
  const b4x = useTransform(d4, (d) => Math.cos(config.angle) * d);
  const b4y = useTransform(d4, (d) => Math.sin(config.angle) * d);
  const b5x = useTransform(d5, (d) => Math.cos(config.angle) * d);
  const b5y = useTransform(d5, (d) => Math.sin(config.angle) * d);
  const b6x = useTransform(d6, (d) => Math.cos(config.angle) * d);
  const b6y = useTransform(d6, (d) => Math.sin(config.angle) * d);

  const b0X = useTransform2(b0x, floatX, (aa, bb) => aa + bb * 0.05);
  const b0Y = useTransform2(b0y, floatY, (aa, bb) => aa + bb * 0.05);
  const b1X = useTransform2(b1x, floatX, (aa, bb) => aa + bb * 0.12);
  const b1Y = useTransform2(b1y, floatY, (aa, bb) => aa + bb * 0.12);
  const b2X = useTransform2(b2x, floatX, (aa, bb) => aa + bb * 0.25);
  const b2Y = useTransform2(b2y, floatY, (aa, bb) => aa + bb * 0.25);
  const b3X = useTransform2(b3x, floatX, (aa, bb) => aa + bb * 0.45);
  const b3Y = useTransform2(b3y, floatY, (aa, bb) => aa + bb * 0.45);
  const b4X = useTransform2(b4x, floatX, (aa, bb) => aa + bb * 0.65);
  const b4Y = useTransform2(b4y, floatY, (aa, bb) => aa + bb * 0.65);
  const b5X = useTransform2(b5x, floatX, (aa, bb) => aa + bb * 0.82);
  const b5Y = useTransform2(b5y, floatY, (aa, bb) => aa + bb * 0.82);
  const b6X = useTransform2(b6x, floatX, (aa, bb) => aa + bb * 0.95);
  const b6Y = useTransform2(b6y, floatY, (aa, bb) => aa + bb * 0.95);

  const neckThin = useTransform(pull, [0, maxDistance * 0.3, maxDistance * 0.7, maxDistance], [1, 0.75, 0.45, 0.18]);
  
  const baseSizes = [
    orbSize * 0.9,
    orbSize * 0.75,
    orbSize * 0.6,
    orbSize * 0.48,
    orbSize * 0.38,
    orbSize * 0.28,
    orbSize * 0.2,
  ];
  
  const bead0Size = useTransform(neckThin, (s) => baseSizes[0] * Math.max(0.55, s));
  const bead1Size = useTransform(neckThin, (s) => baseSizes[1] * Math.max(0.5, s));
  const bead2Size = useTransform(neckThin, (s) => baseSizes[2] * Math.max(0.45, s));
  const bead3Size = useTransform(neckThin, (s) => baseSizes[3] * Math.max(0.4, s));
  const bead4Size = useTransform(neckThin, (s) => baseSizes[4] * Math.max(0.35, s));
  const bead5Size = useTransform(neckThin, (s) => baseSizes[5] * Math.max(0.3, s));
  const bead6Size = useTransform(neckThin, (s) => baseSizes[6] * Math.max(0.25, s));

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ opacity }}
    >
      {/* Membrane beads - fade out after settle */}
      <motion.div style={{ opacity: membraneOpacity }}>
        <motion.div className="absolute rounded-full" style={{ width: bead0Size, height: bead0Size, x: b0X, y: b0Y, translateX: '-50%', translateY: '-50%', background: glassColor }} />
        <motion.div className="absolute rounded-full" style={{ width: bead1Size, height: bead1Size, x: b1X, y: b1Y, translateX: '-50%', translateY: '-50%', background: glassColor }} />
        <motion.div className="absolute rounded-full" style={{ width: bead2Size, height: bead2Size, x: b2X, y: b2Y, translateX: '-50%', translateY: '-50%', background: glassColor }} />
        <motion.div className="absolute rounded-full" style={{ width: bead3Size, height: bead3Size, x: b3X, y: b3Y, translateX: '-50%', translateY: '-50%', background: glassColor }} />
        <motion.div className="absolute rounded-full" style={{ width: bead4Size, height: bead4Size, x: b4X, y: b4Y, translateX: '-50%', translateY: '-50%', background: glassColor }} />
        <motion.div className="absolute rounded-full" style={{ width: bead5Size, height: bead5Size, x: b5X, y: b5Y, translateX: '-50%', translateY: '-50%', background: glassColor }} />
        <motion.div className="absolute rounded-full" style={{ width: bead6Size, height: bead6Size, x: b6X, y: b6Y, translateX: '-50%', translateY: '-50%', background: glassColor }} />
      </motion.div>

      {/* Main orb - glass style with refractive look */}
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: orbSize,
          height: orbSize,
          x,
          y,
          translateX: '-50%',
          translateY: '-50%',
          // Neutral dark glass
          background: `radial-gradient(circle at 30% 25%,
            rgba(75, 80, 95, 0.78) 0%,
            rgba(50, 55, 68, 0.7) 35%,
            rgba(35, 40, 52, 0.62) 70%,
            rgba(25, 30, 42, 0.55) 100%
          )`,
          boxShadow: `
            inset 0 8px 22px rgba(255,255,255,0.14),
            inset 0 -10px 25px rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Chromatic refraction - subtle rainbow edge */}
        <div
          className="absolute"
          style={{
            width: '85%',
            height: '6px',
            top: '10%',
            left: '7.5%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, rgba(255,120,120,0.2) 0%, rgba(255,255,255,0.25) 50%, rgba(120,160,255,0.2) 100%)',
            filter: 'blur(3px)',
          }}
        />
        {/* Main specular highlight */}
        <div
          className="absolute"
          style={{
            width: '50%',
            height: '30%',
            top: '12%',
            left: '20%',
            borderRadius: '999px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 100%)',
            filter: 'blur(5px)',
          }}
        />
        {/* Small bright spec */}
        <div
          className="absolute rounded-full"
          style={{
            width: '12%',
            height: '12%',
            top: '18%',
            left: '25%',
            background: 'rgba(255,255,255,0.35)',
            filter: 'blur(2px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// LOGO OVERLAY - Crisp logos positioned over the gooey orbs
// ============================================================================
function LogoOverlay({
  config,
  index,
  maxDistance,
  scrollProgress,
  pillWidth,
  pillHeight,
  pillScale,
  time,
  isMobile,
}: {
  config: BlobConfig;
  index: number;
  maxDistance: number;
  scrollProgress: MotionValue<number>;
  pillWidth: number;
  pillHeight: number;
  pillScale: MotionValue<number>;
  time: MotionValue<number>;
  isMobile: boolean;
}) {
  const Logo = LOGO_COMPONENTS[config.id];
  const logoSize = isMobile ? 40 : 60;

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  const staggerDelay = index * 0.035;
  const startAt = 0.05 + staggerDelay;
  const peakAt = startAt + 0.07;
  const bounceAt = peakAt + 0.025;
  const settleAt = startAt + 0.16;

  const rawPull = useTransform(
    scrollProgress,
    [0, startAt, peakAt, bounceAt, settleAt],
    [0, 0, maxDistance * 1.4, maxDistance * 0.82, maxDistance]
  );

  const pull = useSpring(rawPull, {
    stiffness: 300,
    damping: 11,
    mass: 0.55,
  });

  const phase = index * 1.2 + config.angle;
  const floatAmp = isMobile ? 2.5 : 4;
  const floatX = useTransform(time, (t) => Math.sin(t / 1500 + phase) * floatAmp);
  const floatY = useTransform(time, (t) => Math.cos(t / 1700 + phase * 1.2) * floatAmp * 0.75);

  const dist = useTransform2(edge, pull, (e, p) => e + p);
  const baseX = useTransform(dist, (d) => Math.cos(config.angle) * d);
  const baseY = useTransform(dist, (d) => Math.sin(config.angle) * d);
  const x = useTransform2(baseX, floatX, (bx, fx) => bx + fx);
  const y = useTransform2(baseY, floatY, (by, fy) => by + fy);

  const opacity = useTransform(scrollProgress, [startAt + 0.01, startAt + 0.06], [0, 1]);
  
  const popScale = useTransform(
    scrollProgress,
    [startAt, startAt + 0.04, startAt + 0.07, settleAt],
    [0.25, 0.25, 1.12, 1]
  );
  const scale = useSpring(popScale, { stiffness: 320, damping: 14 });

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 flex items-center justify-center"
      style={{
        x,
        y,
        opacity,
        scale,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <div style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
        <Logo size={logoSize} />
      </div>
    </motion.div>
  );
}

// ============================================================================
// SCROLL INDICATOR
// ============================================================================
function ScrollIndicator({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollProgress, [0, 0.04], [1, 0]);

  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      style={{ opacity }}
    >
      <span className="text-white/40 text-sm font-medium">Scroll to explore</span>
      <motion.div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-white/50"
          animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}

export default LiquidGlassHero;