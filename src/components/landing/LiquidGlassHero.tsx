// LiquidGlassHero.tsx — Performance Optimized
'use client';

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import type { RefObject } from 'react';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import { LOGO_COMPONENTS } from '@/components/loader/FaangLogos';
import { BRAND_COLORS, Company } from '@/lib/brandColors';
import FloatingLines from '@/components/backgrounds/FloatingLines';
import DarkVeil from '@/components/backgrounds/DarkVeil';

const DATAFLUENT_LINE_GRADIENT = [
  '#4FD1C5',
  '#63B3ED',
  '#7C3AED',
  '#A855F7',
  '#EC4899',
];

const DARK_VEIL_HUE_SHIFT = 280;

interface BlobConfig {
  id: Company;
  angle: number;
  color: string;
}

const COMPANIES: BlobConfig[] = [
  { id: 'google', angle: -Math.PI * 0.85, color: BRAND_COLORS.google[0] },
  { id: 'apple', angle: -Math.PI * 0.42, color: '#E8E8E8' },
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
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
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
  
  // === LAZY MOUNTING STATE ===
  const [showFloatingLines, setShowFloatingLines] = useState(true);
  const [showDarkVeil, setShowDarkVeil] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // === LAZY MOUNT/UNMOUNT BASED ON SCROLL ===
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // Mount DarkVeil when approaching crossfade
    if (latest > 0.25 && !showDarkVeil) {
      setShowDarkVeil(true);
    }
    
    // Unmount FloatingLines when fully faded
    if (latest > 0.7 && showFloatingLines) {
      setShowFloatingLines(false);
    }
    
    // Re-mount FloatingLines if scrolling back up
    if (latest < 0.6 && !showFloatingLines) {
      setShowFloatingLines(true);
    }
    
    // Unmount DarkVeil if scrolling back to top
    if (latest < 0.2 && showDarkVeil) {
      setShowDarkVeil(false);
    }
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

  const pillOpacity = useTransform(scrollYProgress, [0, 0.06, 0.2, 0.7, 0.9], [0, 0, 0.95, 0.5, 0]);
  const pillScale = useTransform(scrollYProgress, [0, 0.2, 0.8], [0.96, 1, 0.92]);
  
  // === BACKGROUND CROSSFADE ===
  const floatingLinesOpacity = useTransform(
    scrollYProgress, 
    [0, 0.15, 0.45, 0.65], 
    [0.7, 0.5, 0.2, 0]
  );
  
  const darkVeilOpacity = useTransform(
    scrollYProgress, 
    [0.35, 0.55, 0.75, 1.0], 
    [0, 0.4, 0.7, 0.85]
  );

  // === MEMOIZED PERFORMANCE SETTINGS ===
  const perfSettings = useMemo(() => ({
    maxDpr: isMobile ? 1 : 1.5,
    targetFps: isMobile ? 24 : 30,
  }), [isMobile]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050508]"
      style={{ height: '180vh' }}
    >
      <GooeyFilter id="goo" />

      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        
        {/* === FLOATING LINES BACKGROUND (lazy mounted, fades out) === */}
        {showFloatingLines && (
          <motion.div 
            className="absolute inset-0 z-0"
            style={{ opacity: floatingLinesOpacity }}
          >
            <FloatingLines
              linesGradient={DATAFLUENT_LINE_GRADIENT}
              enabledWaves={['top', 'middle', 'bottom']}
              lineCount={[3, 4, 3]}
              lineDistance={[6, 5, 7]}
              animationSpeed={0.6}
              interactive={!isMobile}
              bendRadius={5}
              bendStrength={-0.5}
              parallax={!isMobile}
              parallaxStrength={0.15}
              mixBlendMode="screen"
              topWavePosition={{ x: 8.0, y: 0.6, rotate: -0.3 }}
              middleWavePosition={{ x: 4.0, y: 0.0, rotate: 0.15 }}
              bottomWavePosition={{ x: 2.0, y: -0.6, rotate: 0.3 }}
              maxDpr={perfSettings.maxDpr}
              targetFps={perfSettings.targetFps}
            />
          </motion.div>
        )}

        {/* === DARK VEIL BACKGROUND (lazy mounted, fades in) === */}
        {showDarkVeil && (
          <motion.div 
            className="absolute inset-0 z-0"
            style={{ opacity: darkVeilOpacity }}
          >
            <DarkVeil
              hueShift={DARK_VEIL_HUE_SHIFT}
              speed={0.3}
              noiseIntensity={0.015}
              scanlineIntensity={0}
              scanlineFrequency={0}
              warpAmount={0.2}
              resolutionScale={isMobile ? 0.5 : 0.75}
              maxDpr={perfSettings.maxDpr}
              targetFps={perfSettings.targetFps}
            />
          </motion.div>
        )}
        
        {/* === GOOEY LAYER === */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ filter: 'url(#goo)' }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: pillWidth,
              height: pillHeight,
              scale: pillScale,
              opacity: pillOpacity,
              background: 'rgba(110, 125, 155, 0.65)',
            }}
          />

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
            />
          ))}
        </div>

        {/* === BLACK MASK === */}
        <motion.div
          className="absolute rounded-full z-20"
          style={{
            width: pillWidth - (isMobile ? 8 : 12),
            height: pillHeight - (isMobile ? 8 : 12),
            scale: pillScale,
            opacity: pillOpacity,
            background: '#050508',
          }}
        />

        {/* === CRISP LAYER === */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          
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

          <motion.div
            className="absolute flex items-center justify-center z-10"
            style={{ scale: pillScale }}
          >
            <DatafluentText textRef={textMeasureRef} isMobile={isMobile} />
          </motion.div>

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
    <div className="relative">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: 'blur(20px)',
          opacity: 0.4,
        }}
      >
        <div
          className={`font-black tracking-tight flex ${
            isMobile ? 'text-4xl' : 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
          }`}
        >
          {letters.map((letter, i) => (
            <span key={i} style={{ color: letterColors[i] }}>
              {letter}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ mixBlendMode: 'overlay' }}
      >
        <motion.div
          className="absolute h-full"
          style={{
            width: '25%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
            filter: 'blur(12px)',
          }}
          animate={{
            x: ['-100%', '500%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 4,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      <h1
        ref={textRef}
        className={`relative font-black tracking-tight flex ${
          isMobile ? 'text-4xl' : 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
        }`}
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            style={{
              color: letterColors[i],
              textShadow: `0 0 25px ${letterColors[i]}50, 0 0 50px ${letterColors[i]}20`,
            }}
            animate={{
              textShadow: [
                `0 0 25px ${letterColors[i]}50, 0 0 50px ${letterColors[i]}20`,
                `0 0 30px ${letterColors[i]}60, 0 0 60px ${letterColors[i]}28`,
                `0 0 25px ${letterColors[i]}50, 0 0 50px ${letterColors[i]}20`,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>
    </div>
  );
}

// ============================================================================
// GOOEY ORB EDGE
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
}) {
  const orbSize = isMobile ? 85 : 130;

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  const staggerDelay = index * 0.06;
  const startAt = 0.15 + staggerDelay;
  const peakAt = startAt + 0.12;
  const bounceAt = peakAt + 0.05;
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
  const floatAmp = isMobile ? 6 : 10;
  const floatX = useTransform(time, (t) => Math.sin(t / 1200 + phase) * floatAmp);
  const floatY = useTransform(time, (t) => Math.cos(t / 1400 + phase * 1.2) * floatAmp * 0.8);

  const dist = useTransform2(edge, pull, (e, p) => e + p);
  const baseX = useTransform(dist, (d) => Math.cos(config.angle) * d);
  const baseY = useTransform(dist, (d) => Math.sin(config.angle) * d);
  const x = useTransform2(baseX, floatX, (bx, fx) => bx + fx);
  const y = useTransform2(baseY, floatY, (by, fy) => by + fy);

  const opacity = useTransform(scrollProgress, [startAt - 0.02, startAt + 0.06], [0, 0.95]);

  const membraneOpacity = useTransform(
    scrollProgress,
    [startAt, startAt + 0.06, settleAt - 0.02, settleAt + 0.06],
    [0, 1, 1, 0]
  );

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
      <motion.div style={{ opacity: membraneOpacity }}>
        <motion.div className="absolute rounded-full" style={{ width: bead0Size, height: bead0Size, x: b0X, y: b0Y, translateX: '-50%', translateY: '-50%', background: 'rgba(110, 125, 155, 0.65)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead1Size, height: bead1Size, x: b1X, y: b1Y, translateX: '-50%', translateY: '-50%', background: 'rgba(110, 125, 155, 0.65)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead2Size, height: bead2Size, x: b2X, y: b2Y, translateX: '-50%', translateY: '-50%', background: 'rgba(110, 125, 155, 0.65)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead3Size, height: bead3Size, x: b3X, y: b3Y, translateX: '-50%', translateY: '-50%', background: 'rgba(110, 125, 155, 0.65)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead4Size, height: bead4Size, x: b4X, y: b4Y, translateX: '-50%', translateY: '-50%', background: 'rgba(110, 125, 155, 0.65)' }} />
        <motion.div className="absolute rounded-full" style={{ width: bead5Size, height: bead5Size, x: b5X, y: b5Y, translateX: '-50%', translateY: '-50%', background: 'rgba(110, 125, 155, 0.65)' }} />
      </motion.div>

      <motion.div
        className="absolute rounded-full"
        style={{
          width: orbSize,
          height: orbSize,
          x,
          y,
          translateX: '-50%',
          translateY: '-50%',
          background: 'rgba(110, 125, 155, 0.65)',
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// FROSTED GLASS ORB
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
  const innerOrbSize = orbSize - (isMobile ? 4 : 5);
  const logoSize = isMobile ? 40 : 60;

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  const staggerDelay = index * 0.06;
  const startAt = 0.15 + staggerDelay;
  const peakAt = startAt + 0.12;
  const bounceAt = peakAt + 0.05;
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
  const floatAmp = isMobile ? 6 : 10;
  const floatX = useTransform(time, (t) => Math.sin(t / 1200 + phase) * floatAmp);
  const floatY = useTransform(time, (t) => Math.cos(t / 1400 + phase * 1.2) * floatAmp * 0.8);

  const dist = useTransform2(edge, pull, (e, p) => e + p);
  const baseX = useTransform(dist, (d) => Math.cos(config.angle) * d);
  const baseY = useTransform(dist, (d) => Math.sin(config.angle) * d);
  const x = useTransform2(baseX, floatX, (bx, fx) => bx + fx);
  const y = useTransform2(baseY, floatY, (by, fy) => by + fy);

  const opacity = useTransform(scrollProgress, [startAt + 0.03, startAt + 0.12], [0, 1]);
  
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
  const opacity = useTransform(scrollProgress, [0, 0.1], [1, 0]);

  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-40"
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