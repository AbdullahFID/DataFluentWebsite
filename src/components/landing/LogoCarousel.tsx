'use client';

import { useEffect, useState } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { LOGO_COMPONENTS } from '@/components/loader/FaangLogos';
import { BRAND_COLORS, Company } from '@/lib/brandColors';

interface LogoCarouselProps {
  scrollProgress: MotionValue<number>;
}

const FILL_TIMING: Record<Company, { start: number; end: number }> = {
  google: { start: 0.08, end: 0.22 },
  apple: { start: 0.18, end: 0.32 },
  meta: { start: 0.28, end: 0.42 },
  microsoft: { start: 0.38, end: 0.52 },
  amazon: { start: 0.48, end: 0.62 },
};

const COMPANIES: Company[] = ['google', 'apple', 'meta', 'microsoft', 'amazon'];

export function LogoCarousel({ scrollProgress }: LogoCarouselProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile carousel: slides left as you scroll down
  // 5 logos × 180px = 900px total, show ~1 at a time, slide through all
  const carouselX = useTransform(
    scrollProgress,
    [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65],
    [0, 0, -180, -360, -540, -720, -720]
  );

  return (
    <div className="w-full">
      {/* Mobile: Horizontal carousel controlled by scroll + draggable */}
      {isMobile ? (
        <div className="overflow-hidden">
          <motion.div
            className="flex items-center gap-6 cursor-grab active:cursor-grabbing"
            style={{ 
              x: carouselX,
              paddingLeft: 'calc(50vw - 90px)',
              paddingRight: 'calc(50vw - 90px)',
            }}
            drag="x"
            dragConstraints={{ left: -720, right: 0 }}
            dragElastic={0.2}
          >
            {COMPANIES.map((company) => (
              <LogoItem
                key={company}
                company={company}
                scrollProgress={scrollProgress}
                size="mobile"
              />
            ))}
          </motion.div>
        </div>
      ) : (
        /* Desktop: All logos in a row */
        <div className="flex items-center justify-center gap-12 lg:gap-16 px-4">
          {COMPANIES.map((company) => (
            <LogoItem
              key={company}
              company={company}
              scrollProgress={scrollProgress}
              size="desktop"
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LogoItemProps {
  company: Company;
  scrollProgress: MotionValue<number>;
  size: 'mobile' | 'desktop';
}

function LogoItem({ company, scrollProgress, size }: LogoItemProps) {
  const LogoComponent = LOGO_COMPONENTS[company];
  const colors = BRAND_COLORS[company];
  const timing = FILL_TIMING[company];

  // Fade in
  const opacity = useTransform(
    scrollProgress,
    [timing.start - 0.05, timing.start, timing.end],
    [0, 0.5, 1]
  );

  // Scale
  const scale = useTransform(
    scrollProgress,
    [timing.start, timing.end],
    [0.9, 1]
  );

  // Grayscale to color
  const grayscale = useTransform(
    scrollProgress,
    [timing.start, timing.end],
    [100, 0]
  );

  // Soft glow
  const glowOpacity = useTransform(
    scrollProgress,
    [timing.start, timing.end, timing.end + 0.08],
    [0, 0.3, 0.15]
  );

  // Text color
  const textColor = useTransform(
    grayscale,
    [100, 50, 0],
    ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', colors[0]]
  );

  const logoSize = size === 'mobile' ? 'w-28 h-28' : 'w-20 h-20 lg:w-28 lg:h-28 xl:w-32 xl:h-32';

  return (
    <motion.div
      className={`relative flex flex-col items-center gap-3 shrink-0 ${size === 'mobile' ? 'w-45' : ''}`}
      style={{ opacity, scale }}
    >
      {/* Soft glow */}
      <motion.div
        className="absolute rounded-full -z-10"
        style={{
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
          background: `radial-gradient(circle, ${colors[0]}30 0%, ${colors[0]}10 40%, transparent 70%)`,
          filter: 'blur(30px)',
          opacity: glowOpacity,
        }}
      />

      {/* Logo */}
      <motion.div
        className={`flex items-center justify-center ${logoSize}`}
        style={{
          filter: useTransform(grayscale, (g) => `grayscale(${g}%)`),
        }}
      >
        <LogoComponent size={128} className="w-full h-full object-contain" />
      </motion.div>

      {/* Company name */}
      <motion.span
        className="text-sm font-semibold tracking-wide capitalize"
        style={{ color: textColor }}
      >
        {company}
      </motion.span>
    </motion.div>
  );
}

export default LogoCarousel;