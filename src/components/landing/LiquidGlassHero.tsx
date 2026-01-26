// LiquidGlassHero.tsx — FINAL POSITIONS + MAXIMUM LIQUID GLASS
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
import GlassSurface from '@/components/ui/GlassSurface';
import TextShiny from '@/components/ui/TextShiny';

// ============================================================================
// CONSTANTS
// ============================================================================
const LIGHT_RAYS_CONFIG = {
  color: '#ffffff',
  origin: 'top-center' as const,
  speed: 0.6,
  lightSpread: 0.5,
  rayLength: 2.8,
  fadeDistance: 1.4,
  saturation: 0.9,
  distortion: 0.12,
  noiseAmount: 0.015,
};

const GALAXY_CONFIG = {
  hueShift: 280,
  density: 1.0,
  glowIntensity: 0.35,
  saturation: 0.25,
  twinkleIntensity: 0.35,
  rotationSpeed: 0.04,
  starSpeed: 0.25,
  speed: 0.7,
  autoCenterRepulsion: 0,
  repulsionStrength: 2.5,
};

const SPRING_CONFIG = {
  pull: {
    stiffness: 50,
    damping: 28,
    mass: 1.0,
  },
  scale: {
    stiffness: 65,
    damping: 24,
    mass: 0.6,
  },
  pill: {
    stiffness: 55,
    damping: 26,
    mass: 0.8,
  },
};

const FLOAT_CONFIG = {
  xPeriod: 2600,
  yPeriod: 3200,
  amplitudeDesktop: 12,
  amplitudeMobile: 4,  // Less float movement
}

interface BlobConfig {
  id: Company;
  angle: number;
  color: string;
}

// FINAL POSITIONS - visually balanced, nothing cut off
const COMPANIES: BlobConfig[] = [
  { id: 'google', angle: -Math.PI * 0.78, color: BRAND_COLORS.google[0] },
  { id: 'apple', angle: -Math.PI * 0.45, color: '#E8E8E8' },
  { id: 'tiktok', angle: -Math.PI * 0.12, color: '#25F4EE' },
  { id: 'meta', angle: Math.PI * 0.10, color: BRAND_COLORS.meta[0] },
  { id: 'amazon', angle: Math.PI * 0.26, color: BRAND_COLORS.amazon[0] },
{ id: 'tesla', angle: Math.PI * 0.68, color: '#E82127' },           // 0.58 → 0.68 (diagonal up-left)
{ id: 'microsoft', angle: Math.PI * 0.92, color: BRAND_COLORS.microsoft[2] }, // 0.82 → 0.92 (closer to Google/D)
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
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = Math.min(currentTime - lastTime, 50);
      lastTime = currentTime;
      time.set(time.get() + delta);
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

const maxDistance = isMobile ? 70 : 240;

  const pillOpacity = useTransform(
    scrollYProgress,
    [0, 0.04, 0.12, 0.65, 0.85],
    [0, 0.2, 0.95, 0.6, 0]
  );

  const rawPillScale = useTransform(scrollYProgress, [0, 0.15, 0.75], [0.94, 1, 0.9]);
  const pillScale = useSpring(rawPillScale, SPRING_CONFIG.pill);

  // Gooey layer fades out after separation
  const gooeyOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.35, 0.45],
    [0.9, 0.9, 0.9, 0]
  );

  const lightRaysOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.4, 0.6],
    [0.75, 0.55, 0.2, 0]
  );

  const galaxyOpacity = useTransform(
    scrollYProgress,
    [0.3, 0.5, 0.7, 1.0],
    [0, 0.45, 0.75, 1.0]
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
              mouseInfluence={isMobile ? 0 : 0.06}
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

        {/* === GOOEY BLOB LAYER === */}
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
    background: `
      radial-gradient(ellipse 120% 100% at 50% 30%, 
        rgba(255, 255, 255, 0.72) 0%, 
        rgba(240, 240, 245, 0.62) 40%,
        rgba(210, 210, 220, 0.52) 100%
      )
    `,
  }}
/>

          {COMPANIES.map((company, i) => (
            <GooeyBlob
              key={`blob-${company.id}`}
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
        </motion.div>

        {/* === BLACK MASK === */}
        <motion.div
          className="absolute rounded-full z-20"
          style={{
            width: pillWidth - (isMobile ? 10 : 14),
            height: pillHeight - (isMobile ? 10 : 14),
            scale: pillScale,
            opacity: pillOpacity,
            background: '#050508',
          }}
        />

       {/* === CONTENT LAYER === */}
<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
  <motion.div
    className="absolute"
    style={{
      scale: pillScale,
      opacity: pillOpacity,
    }}
  >
    <GlassSurface
  width={pillWidth}
  height={pillHeight}
  borderRadius={9999}
  // CRANKED settings for desktop
  distortionScale={isMobile ? -45 : -120}
  redOffset={isMobile ? 1 : 3}
  greenOffset={isMobile ? 3 : 12}
  blueOffset={isMobile ? 6 : 24}
  brightness={isMobile ? 55 : 52}
  opacity={0.94}
  blur={isMobile ? 10 : 14}
  displace={isMobile ? 0.3 : 0.6}
  backgroundOpacity={isMobile ? 0.03 : 0.06}
  saturation={isMobile ? 1.15 : 1.4}
  borderWidth={isMobile ? 0.05 : 0.09}
  mixBlendMode="screen"
>
      {/* Inner shine overlays */}
      <div
        className="absolute"
        style={{
          width: '65%',
          height: '18%',
          top: '8%',
          left: '17.5%',
          borderRadius: '999px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%)',
          filter: 'blur(10px)',
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(ellipse 100% 100% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 50%),
            radial-gradient(ellipse 100% 100% at 50% 100%, rgba(255,255,255,0.02) 0%, transparent 40%)
          `,
        }}
      />
    </GlassSurface>
  </motion.div>

           <motion.div
    className="absolute flex items-center justify-center z-10"
    style={{ scale: pillScale }}
  >
    <DatafluentText 
  textRef={textMeasureRef} 
  isMobile={isMobile} 
  scrollProgress={scrollYProgress}
/>
  </motion.div>

          {COMPANIES.map((company, i) => (
            <LiquidGlassOrb
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
// GOOEY BLOB
// ============================================================================
function GooeyBlob({
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
  const orbSize = isMobile ? 70 : 155;

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  const staggerDelay = index * 0.04;
  const startAt = 0.12 + staggerDelay;
  const settleAt = startAt + 0.32;

  const rawPull = useTransform(
    scrollProgress,
    [0, startAt, startAt + 0.18, settleAt],
    [0, 0, maxDistance * 1.06, maxDistance]
  );

  const pull = useSpring(rawPull, SPRING_CONFIG.pull);

  const phase = index * 1.4 + config.angle;
  const floatAmp = isMobile ? FLOAT_CONFIG.amplitudeMobile : FLOAT_CONFIG.amplitudeDesktop;

  const floatX = useTransform(time, (t) =>
    Math.sin(t / FLOAT_CONFIG.xPeriod + phase) * floatAmp
  );
  const floatY = useTransform(time, (t) =>
    Math.cos(t / FLOAT_CONFIG.yPeriod + phase * 1.3) * floatAmp * 0.7
  );

  const dist = useTransform2(edge, pull, (e, p) => e + p);
  const baseX = useTransform(dist, (d) => Math.cos(config.angle) * d);
  const baseY = useTransform(dist, (d) => Math.sin(config.angle) * d);
  const x = useTransform2(baseX, floatX, (bx, fx) => bx + fx);
  const y = useTransform2(baseY, floatY, (by, fy) => by + fy);

  // Blob absorbs white as it emerges
  const opacity = useTransform(scrollProgress, [startAt - 0.02, startAt + 0.1], [0, 1]);
  
  // Brightness ramps up as blob "absorbs" color from text
  const colorIntensity = useTransform(
    scrollProgress,
    [startAt, startAt + 0.15, 0.5],
    [0.5, 0.85, 1]
  );

  // Dynamic white values based on absorption
  const bgWhite = useTransform(colorIntensity, (i) => {
    const base = Math.round(180 + i * 75); // 180 → 255
    const mid = Math.round(160 + i * 65);  // 160 → 225
    const dark = Math.round(140 + i * 50); // 140 → 190
    return `
      radial-gradient(ellipse 100% 100% at 35% 30%,
        rgba(${base}, ${base}, ${base}, 0.75) 0%,
        rgba(${mid}, ${mid}, ${mid + 5}, 0.65) 50%,
        rgba(${dark}, ${dark}, ${dark + 10}, 0.55) 100%
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
        background: bgWhite,
      }}
    />
  );
}

function DatafluentText({
  textRef,
  isMobile,
  scrollProgress,
}: {
  textRef: RefObject<HTMLHeadingElement | null>;
  isMobile: boolean;
  scrollProgress: MotionValue<number>;
}) {
  const whiteOpacity = useTransform(scrollProgress, [0, 0.12, 0.35, 0.55], [1, 1, 0.4, 0]);
  const whiteScale = useTransform(scrollProgress, [0.35, 0.55], [1, 0.98]);
  const glassOpacity = useTransform(scrollProgress, [0.4, 0.55, 0.7], [0, 0.7, 1]);

  const textClasses = `font-black tracking-tight ${
    isMobile ? 'text-4xl' : 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl'
  }`;

  const clipId = 'datafluent-glass-clip';
  const fontSize = isMobile ? 36 : 96;

  return (
    <div className="relative">
      {/* Glow behind */}
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{
          filter: 'blur(30px)',
          opacity: useTransform(whiteOpacity, (o) => o * 0.3),
        }}
      >
        <span className={textClasses} style={{ color: '#ffffff' }}>
          Datafluent
        </span>
      </motion.div>

      {/* Shiny white text — drains into blobs */}
      <motion.div
        className="relative"
        style={{
          opacity: whiteOpacity,
          scale: whiteScale,
        }}
      >
        <h1
          ref={textRef}
          className={textClasses}
          style={{
            textShadow: '0 0 40px rgba(255,255,255,0.25), 0 0 80px rgba(255,255,255,0.12)',
          }}
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
        </h1>
      </motion.div>

      {/* TRUE GLASS TEXT — SVG clip + backdrop-filter */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: glassOpacity }}
      >
        <svg
          width={isMobile ? 280 : 700}
          height={isMobile ? 60 : 140}
          viewBox={`0 0 ${isMobile ? 280 : 700} ${isMobile ? 60 : 140}`}
          className="overflow-visible"
        >
          <defs>
            <clipPath id={clipId}>
              <text
                x="50%"
                y="55%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="-0.02em"
              >
                Datafluent
              </text>
            </clipPath>
          </defs>

          {/* Glass fill — this is what creates the actual glass effect */}
          <foreignObject
            x="0"
            y="0"
            width="100%"
            height="100%"
            clipPath={`url(#${clipId})`}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backdropFilter: 'blur(12px) saturate(1.4) brightness(1.1)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.4) brightness(1.1)',
                background: 'rgba(255, 255, 255, 0.08)',
              }}
            />
          </foreignObject>

          {/* Subtle edge highlight */}
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.02em"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="0.5"
          />

          {/* Top specular highlight */}
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.02em"
            fill="url(#glass-highlight)"
          />

          <defs>
            <linearGradient id="glass-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
// ============================================================================
// LIQUID GLASS ORB — MAXIMUM LIQUID EFFECT
// ============================================================================
function LiquidGlassOrb({
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
const orbSize = isMobile ? 70 : 155;
const logoSize = isMobile ? 38 : 85;

  const [isHovered, setIsHovered] = useState(false);

  const a = pillWidth / 2;
  const b = pillHeight / 2;
  const baseEdge = ellipseRadiusAtAngle(a, b, config.angle);
  const edge = useTransform(pillScale, (s) => baseEdge * (s as number));

  const staggerDelay = index * 0.04;
  const startAt = 0.12 + staggerDelay;
  const settleAt = startAt + 0.32;

  const rawPull = useTransform(
    scrollProgress,
    [0, startAt, startAt + 0.18, settleAt],
    [0, 0, maxDistance * 1.06, maxDistance]
  );

  const pull = useSpring(rawPull, SPRING_CONFIG.pull);

  const phase = index * 1.4 + config.angle;
  const floatAmp = isMobile ? FLOAT_CONFIG.amplitudeMobile : FLOAT_CONFIG.amplitudeDesktop;

  const floatX = useTransform(time, (t) =>
    Math.sin(t / FLOAT_CONFIG.xPeriod + phase) * floatAmp
  );
  const floatY = useTransform(time, (t) =>
    Math.cos(t / FLOAT_CONFIG.yPeriod + phase * 1.3) * floatAmp * 0.7
  );

  const dist = useTransform2(edge, pull, (e, p) => e + p);
  const baseX = useTransform(dist, (d) => Math.cos(config.angle) * d);
  const baseY = useTransform(dist, (d) => Math.sin(config.angle) * d);
  const x = useTransform2(baseX, floatX, (bx, fx) => bx + fx);
  const y = useTransform2(baseY, floatY, (by, fy) => by + fy);

  // Glass fades in as gooey fades out
  const opacity = useTransform(scrollProgress, [startAt + 0.15, startAt + 0.28], [0, 1]);

  const popScale = useTransform(
    scrollProgress,
    [startAt + 0.1, startAt + 0.2, settleAt],
    [0.85, 1.04, 1]
  );
  const scale = useSpring(popScale, SPRING_CONFIG.scale);

  const surfaceRotation = useTransform(time, (t) => (t / 120) % 360);

  const brandColor = config.color;

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
      {/* Pulsing ambient glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: orbSize + 70,
          height: orbSize + 70,
          background: `radial-gradient(circle, ${brandColor}25 0%, ${brandColor}10 35%, transparent 65%)`,
          filter: 'blur(25px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4 + index * 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Hover ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: orbSize + 28,
          height: orbSize + 28,
          border: `1.5px solid ${brandColor}`,
          boxShadow: `
            0 0 25px ${brandColor}50,
            0 0 50px ${brandColor}25,
            inset 0 0 20px ${brandColor}15
          `,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 0.85 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      />

      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: orbSize + 40 + i * 16,
            height: orbSize + 40 + i * 16,
            marginLeft: -(orbSize + 40 + i * 16) / 2,
            marginTop: -(orbSize + 40 + i * 16) / 2,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: isHovered ? 0.85 - i * 0.25 : 0,
            rotate: 360,
          }}
          transition={{
            opacity: { duration: 0.35 },
            rotate: {
              duration: 7 + i * 4,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: isMobile ? 4 : 6,
              height: isMobile ? 4 : 6,
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              background: brandColor,
              boxShadow: `0 0 10px ${brandColor}, 0 0 15px ${brandColor}80`,
            }}
          />
        </motion.div>
      ))}

      {/* === MAXIMUM LIQUID GLASS === */}
      <GlassSurface
        width={orbSize}
        height={orbSize}
        borderRadius={9999}
        // Settings from screenshot - CRANKED UP
        distortionScale={-180}
        redOffset={0}
        greenOffset={10}
        blueOffset={20}
        brightness={50}
        opacity={0.93}
        blur={11}
        displace={0.5}
        backgroundOpacity={0.1}
        saturation={1}
        borderWidth={0.07}
        mixBlendMode="screen"
        className="cursor-pointer"
      >
        <div
          className="relative w-full h-full flex items-center justify-center rounded-full overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 50% 45%,
                rgba(55, 65, 85, 0.35) 0%,
                rgba(35, 42, 58, 0.45) 55%,
                rgba(20, 26, 40, 0.55) 100%
              ),
              radial-gradient(circle at 50% 50%,
                ${brandColor}08 0%,
                transparent 50%
              )
            `,
            boxShadow: `
              inset 0 0 50px rgba(255,255,255,0.03),
              inset 0 0 80px ${brandColor}04,
              0 12px 40px rgba(0,0,0,0.35),
              0 0 0 1px rgba(255,255,255,0.05),
              0 0 35px ${brandColor}0A
            `,
          }}
        >
          {/* Rotating shimmer */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                ${brandColor}06 8%,
                transparent 18%,
                ${brandColor}03 45%,
                transparent 55%,
                ${brandColor}08 75%,
                transparent 100%
              )`,
              rotate: surfaceRotation,
            }}
          />

          {/* Top highlight */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '70%',
              height: '30%',
              top: '8%',
              left: '15%',
              background: `linear-gradient(180deg, 
                rgba(255,255,255,0.1) 0%, 
                rgba(255,255,255,0.03) 50%,
                transparent 100%
              )`,
              filter: 'blur(6px)',
              borderRadius: '50% 50% 50% 50% / 100% 100% 0% 0%',
            }}
          />

          {/* Edge rim */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, 
                transparent 55%, 
                ${brandColor}08 75%, 
                ${brandColor}14 88%,
                transparent 100%
              )`,
              opacity: 0.75,
            }}
          />

          {/* Specular */}
          <div
            className="absolute rounded-full"
            style={{
              width: '8%',
              height: '8%',
              top: '16%',
              left: '28%',
              background: 'rgba(255,255,255,0.3)',
              filter: 'blur(2px)',
            }}
          />

          {/* Hover glow */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 35%, ${brandColor}28 0%, transparent 50%)`,
            }}
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.35 }}
          />

          {/* Logo */}
          <div
            className="relative z-10"
            style={{
              filter: `drop-shadow(0 3px 10px rgba(0,0,0,0.35)) drop-shadow(0 0 15px ${brandColor}22)`,
            }}
          >
            <Logo size={logoSize} />
          </div>
        </div>
      </GlassSurface>
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