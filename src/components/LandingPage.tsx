// LandingPage.tsx — With MacBook Section
'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Lazy load components
const LiquidGlassHero = lazy(() => 
  import('@/components/landing/LiquidGlassHero').then(mod => ({ default: mod.LiquidGlassHero }))
);

const MacBookSection = lazy(() => 
  import('@/components/landing/MacBookSection').then(mod => ({ default: mod.MacBookSection }))
);

// Loading fallbacks
const HeroSkeleton = () => (
  <div className="h-[180vh] bg-[#050508] flex items-center justify-center">
    <div className="animate-pulse">
      <div className="w-64 h-16 bg-white/5 rounded-full" />
    </div>
  </div>
);

const MacBookSkeleton = () => (
  <div className="min-h-[300vh] bg-[#050508]">
    <div className="sticky top-0 h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-125 h-80 bg-white/5 rounded-xl" />
      </div>
    </div>
  </div>
);

interface LandingPageProps {
  visible: boolean;
}

export function LandingPage({ visible }: LandingPageProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [shouldRenderMac, setShouldRenderMac] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShouldRender(true), 100);
      const macTimer = setTimeout(() => setShouldRenderMac(true), 300);
      return () => {
        clearTimeout(timer);
        clearTimeout(macTimer);
      };
    }
    return undefined;
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-[#050508]"
    >
      {/* Liquid Glass Metaball Hero */}
      <Suspense fallback={<HeroSkeleton />}>
        {shouldRender && <LiquidGlassHero />}
      </Suspense>
      
      {/* MacBook Section - replaces Elite AI Talent */}
      <Suspense fallback={<MacBookSkeleton />}>
        {shouldRenderMac && (
          <MacBookSection
            videoSrc="/demo-video.mp4"
            scale={1.5}
          />
        )}
      </Suspense>
    </motion.div>
  );
}

export default LandingPage;