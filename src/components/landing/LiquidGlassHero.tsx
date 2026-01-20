// LiquidGlassHero.tsx — Gooey EDGES Only Architecture
// - Pill: Just gooey outline, no fill (black inside)
// - Orbs: Gray border creates gooey effect, dark frosted glass fill
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
  { id: 'apple', angle: -Math.PI * 0.42, color: '#E8E8E8' },  // Moved down slightly
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
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
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

  const pillOpacity = useTransform(scrollYProgress, [0, 0.05, 0.15, 0.6], [0, 0, 0.95, 0.8]);
  const pillScale = useTransform(scrollYProgress, [0, 0.15, 0.5], [0.96, 1, 0.92]);

  // Edge/border color for gooey effect - more visible
  const edgeColor = 'rgba(140, 150, 175, 0.7)';
  const edgeThickness = isMobile ? 4 : 6;

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050508]"
      style={{ height: '500vh' }}
    >
      <GooeyFilter id="goo" />

      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        
        {/* === GOOEY LAYER - Solid shapes for metaball effect === */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ filter: 'url(#goo)' }}
        >
          {/* Solid pill for gooey effect */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: pillWidth,
              height: pillHeight,
              scale: pillScale,
              opacity: pillOpacity,
              // Brighter for visible gooey effect
              background: 'rgba(120, 135, 165, 0.75)',
            }}
          />

          {/* Orb edge rings with membrane */}
          {COMPANIES.map((company, i) => (
            <GooeyOrbEdge
              key={`edge-${company.id}`}
              config={company}
              index={i}
              maxDistance={maxDistance}
              scrollProgress={scrollYProgress}
              pillWidth={pillWidth}
              pillHeight={pillHeight}
              pillScale={pillScale}
              time={time}
              isMobile={isMobile}
              edgeColor={edgeColor}
              edgeThickness={edgeThickness}
            />
          ))}
        </div>

        {/* === BLACK MASK - Covers pill center, exposes gooey edges === */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: pillWidth - (isMobile ? 14 : 20),  // Larger = thinner border
            height: pillHeight - (isMobile ? 14 : 20),
            scale: pillScale,
            opacity: pillOpacity,
            background: '#050508',  // Same as page background
          }}
        />

        {/* === CRISP LAYER - Dark glass fills, logos, text === */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          
          {/* Pill glass highlight (subtle, no fill) */}
          <motion.div
            className="absolute rounded-full overflow-hidden"
            style={{
              width: pillWidth,
              height: pillHeight,
              scale: pillScale,
              opacity: pillOpacity,
              background: 'transparent',
            }}
          >
            {/* Subtle top highlight only */}
            <div
              className="absolute"
              style={{
                width: '70%',
                height: '20%',
                top: '10%',
                left: '15%',
                borderRadius: '999px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
                filter: 'blur(8px)',
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

          {/* Dark frosted glass orbs with logos */}
          {COMPANIES.map((company, i) => (
            <FrostedGlassOrb
              key={`orb-${company.id}`}
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
// GOOEY ORB EDGE - Just the border/ring that creates the stretchy effect
// ============================================================================
function GooeyOrbEdge({
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
  edgeColor: string;
  edgeThickness: number;
}) {
  const orbSize = isMobile ? 85 : 130;

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  // Slower timing
  const staggerDelay = index * 0.045;
  const startAt = 0.12 + staggerDelay;
  const peakAt = startAt + 0.12;
  const bounceAt = peakAt + 0.04;
  const settleAt = startAt + 0.28;

  const rawPull = useTransform(
    scrollProgress,
    [0, startAt, peakAt, bounceAt, settleAt],
    [0, 0, maxDistance * 1.35, maxDistance * 0.85, maxDistance]
  );

  const pull = useSpring(rawPull, {
    stiffness: 220,
    damping: 14,
    mass: 0.65,
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

  const opacity = useTransform(scrollProgress, [startAt - 0.02, startAt + 0.05], [0, 0.95]);

  // Membrane fades out after settle
  const membraneOpacity = useTransform(
    scrollProgress,
    [startAt, startAt + 0.05, settleAt - 0.02, settleAt + 0.08],
    [0, 1, 1, 0]
  );

  // Membrane bead positions
  const beadFractions = [0.0, 0.15, 0.32, 0.5, 0.68, 0.85];
  
  const d0 = useTransform2(edge, pull, (e, p) => e * 0.8 + p * beadFractions[0]);
  const d1 = useTransform2(edge, pull, (e, p) => e * 0.88 + p * beadFractions[1]);
  const d2 = useTransform2(edge, pull, (e, p) => e * 0.95 + p * beadFractions[2]);
  const d3 = useTransform2(edge, pull, (e, p) => e + p * beadFractions[3]);
  const d4 = useTransform2(edge, pull, (e, p) => e + p * beadFractions[4]);
  const d5 = useTransform2(edge, pull, (e, p) => e + p * beadFractions[5]);

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

  const b0X = useTransform2(b0x, floatX, (aa, bb) => aa + bb * 0.08);
  const b0Y = useTransform2(b0y, floatY, (aa, bb) => aa + bb * 0.08);
  const b1X = useTransform2(b1x, floatX, (aa, bb) => aa + bb * 0.2);
  const b1Y = useTransform2(b1y, floatY, (aa, bb) => aa + bb * 0.2);
  const b2X = useTransform2(b2x, floatX, (aa, bb) => aa + bb * 0.4);
  const b2Y = useTransform2(b2y, floatY, (aa, bb) => aa + bb * 0.4);
  const b3X = useTransform2(b3x, floatX, (aa, bb) => aa + bb * 0.6);
  const b3Y = useTransform2(b3y, floatY, (aa, bb) => aa + bb * 0.6);
  const b4X = useTransform2(b4x, floatX, (aa, bb) => aa + bb * 0.8);
  const b4Y = useTransform2(b4y, floatY, (aa, bb) => aa + bb * 0.8);
  const b5X = useTransform2(b5x, floatX, (aa, bb) => aa + bb * 0.95);
  const b5Y = useTransform2(b5y, floatY, (aa, bb) => aa + bb * 0.95);

  // Bead sizes shrink when stretched
  const neckThin = useTransform(pull, [0, maxDistance * 0.3, maxDistance * 0.7, maxDistance], [1, 0.7, 0.4, 0.15]);
  
  const baseSizes = [orbSize * 0.7, orbSize * 0.55, orbSize * 0.42, orbSize * 0.32, orbSize * 0.24, orbSize * 0.18];
  
  const bead0Size = useTransform(neckThin, (s) => baseSizes[0] * Math.max(0.5, s));
  const bead1Size = useTransform(neckThin, (s) => baseSizes[1] * Math.max(0.45, s));
  const bead2Size = useTransform(neckThin, (s) => baseSizes[2] * Math.max(0.4, s));
  const bead3Size = useTransform(neckThin, (s) => baseSizes[3] * Math.max(0.35, s));
  const bead4Size = useTransform(neckThin, (s) => baseSizes[4] * Math.max(0.3, s));
  const bead5Size = useTransform(neckThin, (s) => baseSizes[5] * Math.max(0.25, s));

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ opacity }}
    >
      {/* Membrane beads - solid for proper gooey merging */}
      <motion.div style={{ opacity: membraneOpacity }}>
        <motion.div className="absolute rounded-full" style={{ width: bead0Size, height: bead0Size, x: b0X, y: b0Y, translateX: '-50%', translateY: '-50%', background: 'rgba(120, 135, 165, 0.75)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead1Size, height: bead1Size, x: b1X, y: b1Y, translateX: '-50%', translateY: '-50%', background: 'rgba(120, 135, 165, 0.75)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead2Size, height: bead2Size, x: b2X, y: b2Y, translateX: '-50%', translateY: '-50%', background: 'rgba(120, 135, 165, 0.75)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead3Size, height: bead3Size, x: b3X, y: b3Y, translateX: '-50%', translateY: '-50%', background: 'rgba(120, 135, 165, 0.75)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead4Size, height: bead4Size, x: b4X, y: b4Y, translateX: '-50%', translateY: '-50%', background: 'rgba(120, 135, 165, 0.75)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead5Size, height: bead5Size, x: b5X, y: b5Y, translateX: '-50%', translateY: '-50%', background: 'rgba(120, 135, 165, 0.75)' }} />
      </motion.div>

      {/* Main orb - solid for gooey */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: orbSize,
          height: orbSize,
          x,
          y,
          translateX: '-50%',
          translateY: '-50%',
          background: 'rgba(120, 135, 165, 0.75)',
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// FROSTED GLASS ORB - Dark glass fill with subtle effects
// ============================================================================
function FrostedGlassOrb({
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
  const orbSize = isMobile ? 85 : 130;
  const innerOrbSize = orbSize - (isMobile ? 6 : 8);  // Larger = thinner border
  const logoSize = isMobile ? 40 : 60;

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  // Same timing as edge
  const staggerDelay = index * 0.045;
  const startAt = 0.12 + staggerDelay;
  const peakAt = startAt + 0.12;
  const bounceAt = peakAt + 0.04;
  const settleAt = startAt + 0.28;

  const rawPull = useTransform(
    scrollProgress,
    [0, startAt, peakAt, bounceAt, settleAt],
    [0, 0, maxDistance * 1.35, maxDistance * 0.85, maxDistance]
  );

  const pull = useSpring(rawPull, {
    stiffness: 220,
    damping: 14,
    mass: 0.65,
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

  const opacity = useTransform(scrollProgress, [startAt + 0.02, startAt + 0.1], [0, 1]);
  
  const popScale = useTransform(
    scrollProgress,
    [startAt, startAt + 0.06, startAt + 0.12, settleAt],
    [0.2, 0.2, 1.08, 1]
  );
  const scale = useSpring(popScale, { stiffness: 250, damping: 16 });

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        x,
        y,
        opacity,
        scale,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: innerOrbSize,
          height: innerOrbSize,
          borderRadius: '50%',
          // Dark frosted glass - almost black
          background: `radial-gradient(circle at 30% 25%,
            rgba(28, 32, 42, 0.92) 0%,
            rgba(18, 22, 32, 0.95) 50%,
            rgba(10, 14, 22, 0.98) 100%
          )`,
          boxShadow: `
            inset 0 6px 20px rgba(255,255,255,0.08),
            inset 0 -8px 22px rgba(0,0,0,0.4),
            0 8px 30px rgba(0,0,0,0.5)
          `,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle chromatic top edge */}
        <div
          className="absolute"
          style={{
            width: '80%',
            height: '4px',
            top: '8%',
            left: '10%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, rgba(255,120,120,0.12) 0%, rgba(255,255,255,0.15) 50%, rgba(120,160,255,0.12) 100%)',
            filter: 'blur(2px)',
          }}
        />
        {/* Main highlight */}
        <div
          className="absolute"
          style={{
            width: '50%',
            height: '25%',
            top: '12%',
            left: '20%',
            borderRadius: '999px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
            filter: 'blur(6px)',
          }}
        />
        {/* Bright spec */}
        <div
          className="absolute rounded-full"
          style={{
            width: '10%',
            height: '10%',
            top: '18%',
            left: '26%',
            background: 'rgba(255,255,255,0.25)',
            filter: 'blur(2px)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }}>
          <Logo size={logoSize} />
        </div>
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