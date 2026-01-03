'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { HeroLogo } from './HeroLogo';
import { LogoCarousel } from './LogoCarousel';
import { ScrollIndicator } from './ScrollIndicator';

export function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgress = useMotionValue(0);
  const [debug, setDebug] = useState({ progress: 0 });

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      const scrolled = -rect.top;
      const scrollableDistance = sectionHeight - viewportHeight;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
      
      scrollProgress.set(progress);
      setDebug({ progress });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const timer = setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [scrollProgress]);

  const indicatorOpacity = useTransform(scrollProgress, [0, 0.08], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#050508]"
      style={{ height: '400vh' }}
    >
      {/* Debug */}
      <div className="fixed top-4 right-4 z-50 bg-black/90 text-green-400 px-2 py-1 rounded font-mono text-xs">
        {(debug.progress * 100).toFixed(0)}%
      </div>

      {/* Sticky content - NO overflow-hidden on parent */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center">
        {/* Datafluent logo */}
        <div className="mb-6 md:mb-8 px-4">
          <HeroLogo scrollProgress={scrollProgress} />
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="mb-8 md:mb-12"
          style={{ opacity: indicatorOpacity }}
        >
          <ScrollIndicator />
        </motion.div>

        {/* Logo carousel */}
        <LogoCarousel scrollProgress={scrollProgress} />
      </div>
    </section>
  );
}

export default ScrollHero;