// LandingPage.tsx — Optimized with lazy loading
'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Lazy load the heavy hero component
const LiquidGlassHero = lazy(() => 
  import('@/components/landing/LiquidGlassHero').then(mod => ({ default: mod.LiquidGlassHero }))
);

// Simple loading fallback
const HeroSkeleton = () => (
  <div className="h-[180vh] bg-[#050508] flex items-center justify-center">
    <div className="animate-pulse">
      <div className="w-64 h-16 bg-white/5 rounded-full" />
    </div>
  </div>
);

interface LandingPageProps {
  visible: boolean;
}

export function LandingPage({ visible }: LandingPageProps) {
  const [shouldRender, setShouldRender] = useState(false);

  // Delay hero rendering slightly to allow critical path first
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShouldRender(true), 100);
      return () => clearTimeout(timer);
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
      {/* Liquid Glass Metaball Hero - lazy loaded */}
      <Suspense fallback={<HeroSkeleton />}>
        {shouldRender && <LiquidGlassHero />}
      </Suspense>
      
      {/* Next section */}
      <section className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Elite AI Talent
          </h2>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto">
            World-class engineers from the companies that shaped the future, now working for you.
          </p>
        </div>
      </section>
    </motion.div>
  );
}

export default LandingPage;