// LandingPage.tsx — With MacBook Section + Alcove-Style Hero Text
'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// Main page composition with lazy-loaded sections
// ═══════════════════════════════════════════════════════════════════════════

// Lazy load components - use default imports for default exports
const LiquidGlassHero = lazy(() => 
  import('@/components/landing/LiquidGlassHero').then(mod => ({ default: mod.LiquidGlassHero }))
);

// Fixed: MacBookSection uses default export, so no need for .then() transformation
const MacBookSection = lazy(() => import('@/components/landing/MacBookSection'));

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeletons
// ─────────────────────────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="h-[180vh] bg-[#050508] flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-64 h-16 bg-white/5 rounded-full" />
      </div>
    </div>
  );
}

function MacBookSkeleton() {
  return (
    <div className="min-h-[200vh] bg-[#050508]">
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-125 h-80 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
interface LandingPageProps {
  visible: boolean;
}

export function LandingPage({ visible }: LandingPageProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [shouldRenderMac, setShouldRenderMac] = useState(false);

  useEffect(() => {
    if (visible) {
      // Stagger component loading for smoother initial render
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
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: Liquid Glass Metaball Hero
          ═══════════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<HeroSkeleton />}>
        {shouldRender && <LiquidGlassHero />}
      </Suspense>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: MacBook with Alcove-Style Text
          Scroll locks DOWN only during animation, UP always free
          ═══════════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<MacBookSkeleton />}>
        {shouldRenderMac && (
          <MacBookSection
            videoSrc="/demo-video.mp4"
            scale={1.5}
            glowColor="#6366f1"
            heroLine1="Talent Beyond Comparison."
            showDebug={process.env.NODE_ENV === 'development'}
          />
        )}
      </Suspense>
    </motion.div>
  );
}

export default LandingPage;