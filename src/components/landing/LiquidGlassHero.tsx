// LiquidGlassHero.tsx - Fixed: Subtle effect, logos are hero, smooth teardrop
'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, MotionValue } from 'framer-motion';
import { LOGO_COMPONENTS } from '@/components/loader/FaangLogos';
import { BRAND_COLORS, Company } from '@/lib/brandColors';

// ============================================================================
// TYPES
// ============================================================================
interface BlobConfig {
  id: Company;
  angle: number;
  color: string;
  name: string;
}

// Spread evenly, avoid bottom corners getting cut off
const COMPANIES: BlobConfig[] = [
  { id: 'google', angle: -Math.PI * 0.8, color: BRAND_COLORS.google[0], name: 'Google' },
  { id: 'apple', angle: -Math.PI * 0.5, color: '#E8E8E8', name: 'Apple' },
  { id: 'meta', angle: -Math.PI * 0.2, color: BRAND_COLORS.meta[0], name: 'Meta' },
  { id: 'microsoft', angle: Math.PI * 0.15, color: BRAND_COLORS.microsoft[2], name: 'Microsoft' },
  { id: 'amazon', angle: Math.PI * 0.45, color: BRAND_COLORS.amazon[0], name: 'Amazon' },
];

// ============================================================================
// GOOEY SVG FILTER - MORE SUBTLE
// ============================================================================
function GooeyFilter({ id, blur = 8 }: { id: string; blur?: number }) {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 18 -7
            "
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
  const scrollProgress = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      const scrolled = -rect.top;
      const scrollableDistance = sectionHeight - viewportHeight;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
      
      scrollProgress.set(progress);
    };

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    
    checkMobile();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobile);
    setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, [scrollProgress]);

  // Distance - not too far so everything stays in viewport
  const maxDistance = isMobile ? 140 : 260;

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050508]"
      style={{ height: '400vh' }}
    >
      <GooeyFilter id="gooey-blobs" blur={isMobile ? 6 : 8} />

      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        
        {/* Gooey blob layer - BEHIND everything */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ filter: 'url(#gooey-blobs)' }}
        >
          {/* Subtle center anchor point - nearly invisible */}
          <CenterAnchor scrollProgress={scrollProgress} isMobile={isMobile} />
          
          {/* Satellite blobs with thin necks */}
          {COMPANIES.map((company, i) => (
            <BlobWithNeck
              key={company.id}
              config={company}
              index={i}
              maxDistance={maxDistance}
              scrollProgress={scrollProgress}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Content layer (crisp) - ON TOP */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Datafluent text */}
          <DatafluentText scrollProgress={scrollProgress} isMobile={isMobile} />
          
          {/* Logo content - THE HERO */}
          {COMPANIES.map((company, i) => (
            <SatelliteContent
              key={`content-${company.id}`}
              config={company}
              index={i}
              maxDistance={maxDistance}
              scrollProgress={scrollProgress}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <ScrollIndicator scrollProgress={scrollProgress} />
      </div>
    </section>
  );
}

// ============================================================================
// CENTER ANCHOR - Wide pill covering full Datafluent text
// ============================================================================
function CenterAnchor({
  scrollProgress,
  isMobile,
}: {
  scrollProgress: MotionValue<number>;
  isMobile: boolean;
}) {
  // Wide pill to cover the entire Datafluent text
  const width = isMobile ? 340 : 1000;
  const height = isMobile ? 80 : 180;
  
  // Visible during stretch phase, fades as blobs settle
  const opacity = useTransform(
    scrollProgress, 
    [0, 0.02, 0.1, 0.35, 0.5], 
    [0, 0.5, 0.55, 0.4, 0]
  );
  
  // Slight shrink as blobs "pull mass" away
  const scale = useTransform(scrollProgress, [0, 0.1, 0.4], [1, 1.02, 0.92]);

  return (
    <motion.div
      className="absolute"
      style={{
        width,
        height,
        left: '50%',
        top: '50%',
        marginLeft: -width / 2,
        marginTop: -height / 2,
        opacity,
        scale,
        borderRadius: height / 2, // Pill shape
        background: `radial-gradient(ellipse 100% 100% at 50% 45%,
          rgba(85, 95, 125, 0.5) 0%,
          rgba(65, 75, 105, 0.45) 30%,
          rgba(50, 58, 80, 0.4) 60%,
          rgba(40, 45, 65, 0.3) 100%
        )`,
        boxShadow: `
          inset 0 6px 35px rgba(255,255,255,0.08),
          inset 0 -6px 35px rgba(0,0,0,0.3)
        `,
      }}
    >
      {/* Subtle top highlight across the pill */}
      <div
        className="absolute"
        style={{
          width: '70%',
          height: '35%',
          top: '12%',
          left: '15%',
          borderRadius: '999px',
          background: `linear-gradient(180deg, 
            rgba(255,255,255,0.12) 0%, 
            transparent 100%
          )`,
          filter: 'blur(4px)',
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// BLOB WITH THIN NECK - Smooth teardrop effect
// ============================================================================
function BlobWithNeck({
  config,
  index,
  maxDistance,
  scrollProgress,
  isMobile,
}: {
  config: BlobConfig;
  index: number;
  maxDistance: number;
  scrollProgress: MotionValue<number>;
  isMobile: boolean;
}) {
  // SMALLER blobs - logos are the focus
  const blobSize = isMobile ? 70 : 110;
  
  // Timing - smooth stagger
  const staggerStart = 0.05 + index * 0.04;
  const stretchPeak = staggerStart + 0.12;
  const settleTime = staggerStart + 0.25;
  const neckSnapTime = settleTime + 0.05;
  
  // SMOOTH teardrop motion - no harsh bounce
  // Accelerates out, slight overshoot, gentle settle
  const rawDistance = useTransform(
    scrollProgress,
    [staggerStart, stretchPeak, settleTime],
    [0, maxDistance * 1.05, maxDistance]
  );
  
  // HIGH DAMPING = smooth honey-like motion, not boingy
  const distance = useSpring(rawDistance, { 
    stiffness: 80,  // Lower = slower
    damping: 25,    // Higher = less bounce
    mass: 1.2       // Heavier = more momentum
  });
  
  const x = useTransform(distance, (d) => Math.cos(config.angle) * d);
  const y = useTransform(distance, (d) => Math.sin(config.angle) * d);
  
  // Scale - subtle pop, not aggressive
  const scale = useTransform(
    scrollProgress,
    [staggerStart, staggerStart + 0.06, stretchPeak, settleTime],
    [0.2, 0.6, 1.05, 1]
  );
  
  // THIN neck that stretches then snaps
  const neckOpacity = useTransform(
    scrollProgress,
    [staggerStart, staggerStart + 0.03, stretchPeak, neckSnapTime],
    [0, 0.7, 0.5, 0]
  );
  
  // Neck gets THINNER as it stretches (like pulling honey)
  const neckWidth = useTransform(
    scrollProgress,
    [staggerStart, stretchPeak, settleTime],
    [blobSize * 0.5, blobSize * 0.25, blobSize * 0.08]
  );

  const angleDeg = (config.angle * 180) / Math.PI;

  return (
    <>
      {/* THIN STRETCHY NECK */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          originX: 0,
          originY: 0.5,
          rotate: angleDeg,
          opacity: neckOpacity,
        }}
      >
        <motion.div
          style={{
            width: distance,
            height: neckWidth,
            marginTop: useTransform(neckWidth, (w) => -w / 2),
            background: `linear-gradient(90deg, 
              rgba(80, 90, 110, 0.6) 0%, 
              ${config.color}30 50%,
              ${config.color}50 100%
            )`,
            borderRadius: useTransform(neckWidth, (w) => w / 2),
          }}
        />
      </motion.div>

      {/* SATELLITE BLOB - smaller, more transparent */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: blobSize,
          height: blobSize,
          left: '50%',
          top: '50%',
          marginLeft: -blobSize / 2,
          marginTop: -blobSize / 2,
          x,
          y,
          scale,
          background: `radial-gradient(circle at 35% 35%,
            ${config.color}50 0%,
            ${config.color}35 45%,
            rgba(30, 35, 50, 0.85) 100%
          )`,
          boxShadow: `
            inset 0 3px 20px ${config.color}30,
            inset 0 -4px 20px rgba(0,0,0,0.4),
            0 8px 30px ${config.color}20
          `,
        }}
      >
        {/* Subtle glass highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: '45%',
            height: '20%',
            top: '10%',
            left: '18%',
            background: `linear-gradient(135deg, 
              rgba(255,255,255,0.35) 0%, 
              rgba(255,255,255,0.1) 60%,
              transparent 100%
            )`,
            filter: 'blur(1px)',
          }}
        />
      </motion.div>
    </>
  );
}

// ============================================================================
// DATAFLUENT TEXT - Clean, crisp
// ============================================================================
function DatafluentText({ 
  scrollProgress,
  isMobile 
}: { 
  scrollProgress: MotionValue<number>;
  isMobile: boolean;
}) {
  const scale = useTransform(scrollProgress, [0, 0.3, 0.6], [1, 0.7, 0.55]);
  const opacity = useTransform(scrollProgress, [0, 0.5, 0.7], [1, 1, 0.9]);

  const letters = 'Datafluent'.split('');
  
  const letterColors = [
    BRAND_COLORS.google[0],    // D
    BRAND_COLORS.google[1],    // a
    BRAND_COLORS.google[2],    // t
    BRAND_COLORS.google[3],    // a
    '#A2AAAD',                 // f
    BRAND_COLORS.meta[0],      // l
    BRAND_COLORS.meta[1],      // u
    BRAND_COLORS.microsoft[2], // e
    BRAND_COLORS.microsoft[1], // n
    BRAND_COLORS.amazon[0],    // t
  ];

  return (
    <motion.div
      className="absolute flex items-center justify-center z-10"
      style={{ scale, opacity }}
    >
      <h1 
        className={`font-black tracking-tight flex ${
          isMobile 
            ? 'text-5xl' 
            : 'text-7xl md:text-8xl lg:text-9xl xl:text-[11rem]'
        }`}
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            style={{
              color: letterColors[i],
              textShadow: `
                0 0 30px ${letterColors[i]}50,
                0 0 60px ${letterColors[i]}25
              `,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>
    </motion.div>
  );
}

// ============================================================================
// SATELLITE CONTENT - LOGOS ARE THE HERO
// ============================================================================
function SatelliteContent({
  config,
  index,
  maxDistance,
  scrollProgress,
  isMobile,
}: {
  config: BlobConfig;
  index: number;
  maxDistance: number;
  scrollProgress: MotionValue<number>;
  isMobile: boolean;
}) {
  const LogoComponent = LOGO_COMPONENTS[config.id];
  // Good logo size - prominent but not overwhelming
  const logoSize = isMobile ? 48 : 72;
  
  const staggerStart = 0.05 + index * 0.04;
  const stretchPeak = staggerStart + 0.12;
  const settleTime = staggerStart + 0.25;
  
  const rawDistance = useTransform(
    scrollProgress,
    [staggerStart, stretchPeak, settleTime],
    [0, maxDistance * 1.05, maxDistance]
  );
  
  // Match blob spring settings exactly
  const distance = useSpring(rawDistance, { 
    stiffness: 80, 
    damping: 25,
    mass: 1.2
  });
  
  const x = useTransform(distance, (d) => Math.cos(config.angle) * d);
  const y = useTransform(distance, (d) => Math.sin(config.angle) * d);
  
  // Fade in slightly after blob appears
  const opacity = useTransform(
    scrollProgress,
    [staggerStart + 0.06, staggerStart + 0.14],
    [0, 1]
  );
  
  const scale = useTransform(
    scrollProgress,
    [staggerStart + 0.06, staggerStart + 0.18],
    [0.5, 1]
  );

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-2 pointer-events-auto"
      style={{
        left: '50%',
        top: '50%',
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        opacity,
        scale,
      }}
    >
      <LogoComponent size={logoSize} />
      <span 
        className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}
        style={{ 
          color: config.color,
          textShadow: `0 0 15px ${config.color}40`,
        }}
      >
        {config.name}
      </span>
    </motion.div>
  );
}

// ============================================================================
// SCROLL INDICATOR
// ============================================================================
function ScrollIndicator({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollProgress, [0, 0.05], [1, 0]);

  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      style={{ opacity }}
    >
      <span className="text-white/40 text-sm">Scroll to explore</span>
      <motion.div
        className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
      >
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