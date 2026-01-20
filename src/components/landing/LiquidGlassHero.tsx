// LiquidGlassHero.tsx — Performance Optimized with LightRays, Galaxy & Planetary Effects
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
import LightRays from '@/components/backgrounds/LightRays';
import Galaxy from '@/components/backgrounds/Galaxy';

// ============================================================================
// CONSTANTS
// ============================================================================
const LIGHT_RAYS_CONFIG = {
  color: '#ffffff',
  origin: 'top-center' as const,
  speed: 0.8,
  lightSpread: 0.6,
  rayLength: 2.5,
  fadeDistance: 1.2,
  saturation: 1.0,
  distortion: 0.15,
  noiseAmount: 0.02,
};

const GALAXY_CONFIG = {
  hueShift: 280,
  density: 1.2,
  glowIntensity: 0.4,
  saturation: 0.3,
  twinkleIntensity: 0.4,
  rotationSpeed: 0.05,
  starSpeed: 0.3,
  speed: 0.8,
  autoCenterRepulsion: 0,
  repulsionStrength: 3,
};

interface BlobConfig {
  id: Company;
  angle: number;
  color: string;
}

const COMPANIES: BlobConfig[] = [
  { id: 'google', angle: -Math.PI * 0.82, color: BRAND_COLORS.google[0] },
  { id: 'apple', angle: -Math.PI * 0.54, color: '#E8E8E8' },
  { id: 'tiktok', angle: -Math.PI * 0.26, color: '#25F4EE' },
  { id: 'meta', angle: -Math.PI * 0.06, color: BRAND_COLORS.meta[0] },        // Changed from 0.02 to -0.06
  { id: 'amazon', angle: Math.PI * 0.30, color: BRAND_COLORS.amazon[0] },
  { id: 'tesla', angle: Math.PI * 0.58, color: '#E82127' },
  { id: 'microsoft', angle: Math.PI * 0.86, color: BRAND_COLORS.microsoft[2] },
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

  const [showLightRays, setShowLightRays] = useState(true);
  const [showGalaxy, setShowGalaxy] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest > 0.25 && !showGalaxy) setShowGalaxy(true);
    if (latest > 0.7 && showLightRays) setShowLightRays(false);
    if (latest < 0.6 && !showLightRays) setShowLightRays(true);
    if (latest < 0.2 && showGalaxy) setShowGalaxy(false);
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

  const lightRaysOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.45, 0.65],
    [0.8, 0.6, 0.25, 0]
  );

  const galaxyOpacity = useTransform(
    scrollYProgress,
    [0.35, 0.55, 0.75, 1.0],
    [0, 0.5, 0.8, 1.0]
  );

  const perfSettings = useMemo(
    () => ({
      maxDpr: isMobile ? 1 : 1.5,
      targetFps: isMobile ? 24 : 30,
    }),
    [isMobile]
  );

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050508]"
      style={{ height: '180vh' }}
    >
      <GooeyFilter id="goo" />

      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* === LIGHT RAYS BACKGROUND === */}
        {showLightRays && (
          <motion.div
            className="absolute inset-0 z-0"
            style={{ opacity: lightRaysOpacity }}
          >
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

        {/* === GALAXY BACKGROUND === */}
        {showGalaxy && (
          <motion.div
            className="absolute inset-0 z-0"
            style={{ opacity: galaxyOpacity }}
          >
            <Galaxy
              hueShift={GALAXY_CONFIG.hueShift}
              density={GALAXY_CONFIG.density}
              glowIntensity={GALAXY_CONFIG.glowIntensity}
              saturation={GALAXY_CONFIG.saturation}
              twinkleIntensity={GALAXY_CONFIG.twinkleIntensity}
              rotationSpeed={GALAXY_CONFIG.rotationSpeed}
              starSpeed={GALAXY_CONFIG.starSpeed}
              speed={GALAXY_CONFIG.speed}
              autoCenterRepulsion={GALAXY_CONFIG.autoCenterRepulsion}
              mouseInteraction={!isMobile}
              mouseRepulsion={!isMobile}
              repulsionStrength={isMobile ? 0 : GALAXY_CONFIG.repulsionStrength}
              transparent={true}
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
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
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
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
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
    [startAt, startAt + 0.04, startAt + 0.12, startAt + 0.18],
    [0, 1, 0.3, 0]
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

  const neckThin = useTransform(
    pull,
    [0, maxDistance * 0.3, maxDistance * 0.7, maxDistance],
    [1, 0.7, 0.4, 0.15]
  );

  const baseSizes = [
    orbSize * 0.7,
    orbSize * 0.55,
    orbSize * 0.42,
    orbSize * 0.32,
    orbSize * 0.24,
    orbSize * 0.18,
  ];

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
        <motion.div
          className="absolute rounded-full"
          style={{
            width: bead0Size,
            height: bead0Size,
            x: b0X,
            y: b0Y,
            translateX: '-50%',
            translateY: '-50%',
            background: 'rgba(110, 125, 155, 0.65)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: bead1Size,
            height: bead1Size,
            x: b1X,
            y: b1Y,
            translateX: '-50%',
            translateY: '-50%',
            background: 'rgba(110, 125, 155, 0.65)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: bead2Size,
            height: bead2Size,
            x: b2X,
            y: b2Y,
            translateX: '-50%',
            translateY: '-50%',
            background: 'rgba(110, 125, 155, 0.65)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: bead3Size,
            height: bead3Size,
            x: b3X,
            y: b3Y,
            translateX: '-50%',
            translateY: '-50%',
            background: 'rgba(110, 125, 155, 0.65)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: bead4Size,
            height: bead4Size,
            x: b4X,
            y: b4Y,
            translateX: '-50%',
            translateY: '-50%',
            background: 'rgba(110, 125, 155, 0.65)',
          }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: bead5Size,
            height: bead5Size,
            x: b5X,
            y: b5Y,
            translateX: '-50%',
            translateY: '-50%',
            background: 'rgba(110, 125, 155, 0.65)',
          }}
        />
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
// FROSTED GLASS ORB (with planetary effects + brand colors)
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
  const logoSize = isMobile ? 52 : 75;

  // === HOVER STATE ===
  const [isHovered, setIsHovered] = useState(false);

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

  // === PLANETARY ROTATION (always running, subtle) ===
  const surfaceRotation = useTransform(time, (t) => (t / 80) % 360);

  // === BRAND COLOR for tinting ===
  const brandColor = config.color;

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* === AMBIENT GLOW (always visible, pulses) === */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: innerOrbSize + 60,
          height: innerOrbSize + 60,
          background: `radial-gradient(circle, ${brandColor}20 0%, ${brandColor}08 40%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 3 + index * 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* === ATMOSPHERIC RING (visible on hover) === */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: innerOrbSize + 24,
          height: innerOrbSize + 24,
          border: `1.5px solid ${brandColor}`,
          boxShadow: `
            0 0 20px ${brandColor}50,
            0 0 40px ${brandColor}25,
            inset 0 0 15px ${brandColor}20
          `,
        }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{
          opacity: isHovered ? 0.8 : 0,
          scale: isHovered ? 1 : 0.85,
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      {/* === ORBITING PARTICLES === */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: innerOrbSize + 35 + i * 14,
            height: innerOrbSize + 35 + i * 14,
            marginLeft: -(innerOrbSize + 35 + i * 14) / 2,
            marginTop: -(innerOrbSize + 35 + i * 14) / 2,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: isHovered ? 0.9 - i * 0.25 : 0,
            rotate: 360,
          }}
          transition={{
            opacity: { duration: 0.3 },
            rotate: {
              duration: 6 + i * 3,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: isMobile ? 4 : 5,
              height: isMobile ? 4 : 5,
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              background: brandColor,
              boxShadow: `0 0 8px ${brandColor}, 0 0 12px ${brandColor}80`,
            }}
          />
        </motion.div>
      ))}

      {/* === MAIN ORB === */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: innerOrbSize,
          height: innerOrbSize,
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 25%,
              rgba(28, 32, 42, 0.55) 0%,
              rgba(18, 22, 32, 0.60) 50%,
              rgba(10, 14, 22, 0.65) 100%
            ),
            radial-gradient(circle at 50% 50%,
              ${brandColor}12 0%,
              ${brandColor}06 50%,
              transparent 70%
            )
          `,
          boxShadow: `
            inset 0 0 40px rgba(255,255,255,0.05),
            inset 0 0 60px ${brandColor}08,
            0 8px 32px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.08),
            0 0 30px ${brandColor}15
          `,
          backdropFilter: 'blur(16px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {/* === PLANETARY SURFACE SHIMMER (slow rotation) === */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(
              from 0deg,
              transparent 0%,
              ${brandColor}08 10%,
              transparent 20%,
              ${brandColor}04 50%,
              transparent 60%,
              ${brandColor}10 80%,
              transparent 100%
            )`,
            rotate: surfaceRotation,
          }}
        />

        {/* === TERMINATOR LINE (day/night boundary) === */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 0%,
              transparent 42%,
              rgba(0,0,0,0.12) 48%,
              rgba(0,0,0,0.22) 55%,
              rgba(0,0,0,0.32) 100%
            )`,
          }}
          animate={{
            opacity: isHovered ? 1 : 0.5,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* === BRAND COLOR EDGE GLOW === */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(
              from 0deg,
              ${brandColor}18,
              transparent 25%,
              ${brandColor}12,
              transparent 50%,
              ${brandColor}18,
              transparent 75%,
              ${brandColor}12,
              transparent 100%
            )`,
            mask: 'radial-gradient(circle, transparent 65%, black 80%, transparent 100%)',
            WebkitMask: 'radial-gradient(circle, transparent 65%, black 80%, transparent 100%)',
            opacity: 0.7,
          }}
        />

        {/* Soft inner glow with brand color */}
        <div
          className="absolute rounded-full"
          style={{
            width: '60%',
            height: '60%',
            top: '20%',
            left: '20%',
            background: `radial-gradient(circle at 40% 35%, 
              rgba(255,255,255,0.06) 0%, 
              ${brandColor}08 30%,
              transparent 60%
            )`,
            filter: 'blur(10px)',
          }}
        />

        {/* Small specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: '12%',
            height: '12%',
            top: '22%',
            left: '28%',
            background: 'rgba(255,255,255,0.35)',
            filter: 'blur(3px)',
          }}
        />

        {/* === HOVER GLOW INTENSIFY === */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${brandColor}30 0%, transparent 60%)`,
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Logo */}
        <div
          className="relative z-10"
          style={{
            filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.4)) drop-shadow(0 0 12px ${brandColor}30)`,
          }}
        >
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