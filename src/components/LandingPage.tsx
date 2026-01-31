// LandingPage.tsx — With MacBook (Desktop) / iPhone (Mobile) conditional rendering
'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// Conditionally renders MacBook section on desktop, iPhone section on mobile
// ═══════════════════════════════════════════════════════════════════════════

// Lazy load components
const LiquidGlassHero = lazy(() =>
  import('@/components/landing/LiquidGlassHero').then((mod) => ({
    default: mod.LiquidGlassHero,
  }))
);

const MacBookSection = lazy(() => import('@/components/landing/MacBookSection'));
const MobileDeviceSection = lazy(() => import('@/components/landing/MobileDeviceSection'));

// ─────────────────────────────────────────────────────────────────────────────
// Device Detection Hook
// ─────────────────────────────────────────────────────────────────────────────
function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      // Check user agent for mobile devices
      const ua = navigator.userAgent;
      const mobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

      // Also check screen width as fallback
      const mobileWidth = window.innerWidth < 768;

      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Consider mobile if UA matches OR (small screen AND touch capable)
      setIsMobile(mobileUA || (mobileWidth && hasTouch));
    };

    checkMobile();

    // Re-check on resize (for responsive testing)
    const handleResize = () => {
      // Debounce
      clearTimeout((handleResize as { timeout?: NodeJS.Timeout }).timeout);
      (handleResize as { timeout?: NodeJS.Timeout }).timeout = setTimeout(checkMobile, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

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
          <div className="w-[500px] h-80 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-24 h-48 bg-white/5 rounded-3xl" />
        <div className="w-32 h-4 bg-white/5 rounded" />
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
  const isMobile = useIsMobile();
  const [shouldRenderHero, setShouldRenderHero] = useState(false);
  const [shouldRenderDevice, setShouldRenderDevice] = useState(false);

  useEffect(() => {
    if (visible) {
      // Stagger component loading for smoother initial render
      const heroTimer = setTimeout(() => setShouldRenderHero(true), 100);
      const deviceTimer = setTimeout(() => setShouldRenderDevice(true), 300);

      return () => {
        clearTimeout(heroTimer);
        clearTimeout(deviceTimer);
      };
    }
    return undefined;
  }, [visible]);

  if (!visible) return null;

  // Wait for device detection before rendering device-specific content
  const deviceDetected = isMobile !== null;

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
        {shouldRenderHero && <LiquidGlassHero />}
      </Suspense>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: Device-Specific Demo Section
          - Desktop: MacBook with scroll-controlled lid animation
          - Mobile: iPhone with orientation detection & video playback
          ═══════════════════════════════════════════════════════════════════════ */}
      {deviceDetected && shouldRenderDevice && (
        <>
          {isMobile ? (
            // ─────────────────────────────────────────────────────────────────
            // MOBILE: iPhone Section
            // - Prompts landscape rotation
            // - Auto-plays video in landscape
            // - Fullscreen fallback option
            // - No scroll locking
            // ─────────────────────────────────────────────────────────────────
            <Suspense fallback={<MobileSkeleton />}>
              <MobileDeviceSection
                videoSrc="/demo-video.mp4"
                glowColor="#6366f1"
              />
            </Suspense>
          ) : (
            // ─────────────────────────────────────────────────────────────────
            // DESKTOP: MacBook Section
            // - Scroll-controlled lid opening animation
            // - Video plays when lid open
            // - Immersive scroll-lock experience
            // ─────────────────────────────────────────────────────────────────
            <Suspense fallback={<MacBookSkeleton />}>
              <MacBookSection
                videoSrc="/demo-video.mp4"
                scale={1.5}
                glowColor="#6366f1"
                heroLine1="Talent Beyond Comparison."
                showDebug={process.env.NODE_ENV === 'development'}
              />
            </Suspense>
          )}
        </>
      )}

      {/* Device detection loading state */}
      {!deviceDetected && shouldRenderDevice && (
        <div className="min-h-screen bg-[#050508] flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 rounded-full bg-white/5" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default LandingPage;