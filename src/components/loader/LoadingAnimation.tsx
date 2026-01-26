// LoadingAnimation.tsx
'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralBackground } from './NeuralBackground';
import { DatafluentLogo } from './DatafluentLogo';
import { ParticleCanvas, ParticleCanvasHandle } from './ParticleCanvas';
import { LOGO_COMPONENTS } from './FaangLogos';
import { RotatingText } from './RotatingText';
import { RevealText } from './RevealText';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BRAND_COLORS, LOGO_CONFIGS, Company, LogoDirection } from '@/lib/brandColors';

// ============================================================================
// TIMINGS - FAST swoosh transition
// ============================================================================
const TIMINGS = {
  headerAppear: 200,
  logoAppear: 500,

  firstCompany: 1200,
  companyInterval: 1000,

  zoomInDuration: 220,
  visibleDuration: 450,
  explodeDuration: 280,

  settleDelay: 500,
  settleDuration: 900,

  // FAST swoosh - minimal delays
  textExplodeDelay: 500,
  textExplodeDuration: 200, // Quick swoosh

  // Reveal comes in fast after swoosh
  revealDelay: 150,
  revealDuration: 1200,

  exitDelay: 500,
  exitDuration: 600,
} as const;

type LogoOrbit = { vx: number; vy: number; origin: string };

const LOGO_ORBITS: Record<LogoDirection, LogoOrbit> = {
  'bottom-left': { vx: -0.85, vy: 0.85, origin: 'bottom left' },
  top: { vx: 0, vy: -1, origin: 'top center' },
  right: { vx: 1, vy: 0, origin: 'center right' },
  left: { vx: -1, vy: 0, origin: 'center left' },
  'bottom-right': { vx: 0.85, vy: 0.85, origin: 'bottom right' },
};

// Mobile-friendly orbit overrides - positions that work on narrow screens
const MOBILE_LOGO_ORBITS: Record<LogoDirection, LogoOrbit> = {
  'bottom-left': { vx: -0.5, vy: 1, origin: 'bottom left' },
  top: { vx: 0, vy: -1, origin: 'top center' },
  // Right → move to top-right on mobile (more clearance)
  right: { vx: 0.5, vy: -1, origin: 'top right' },
  left: { vx: -0.5, vy: -1, origin: 'top left' },
  // Bottom-right → move to bottom center on mobile
  'bottom-right': { vx: 0, vy: 1, origin: 'bottom center' },
};

const LOGO_BOX_SIZE = 200;
const MOBILE_LOGO_BOX_SIZE = 140; // Smaller on mobile
const MOBILE_BREAKPOINT = 640; // sm breakpoint

function clampNum(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail
    }
  }
}

type CompanyPhase = 'hidden' | 'zooming' | 'visible' | 'exploding';

interface LoadingAnimationProps {
  onComplete?: () => void;
}

interface MirrorState {
  headerVisible: boolean;
  logoVisible: boolean;
  currentCompany: Company | null;
  companyPhase: CompanyPhase;
  showFinalGradient: boolean;
  settled: boolean;
  gradientProgress: number;
  textExploding: boolean;
  textExploded: boolean;
  showReveal: boolean;
  isExiting: boolean;
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  const [headerVisible, setHeaderVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companyPhase, setCompanyPhase] = useState<CompanyPhase>('hidden');
  const [letterColors, setLetterColors] = useState<string[]>(Array(11).fill(''));
  const [showFinalGradient, setShowFinalGradient] = useState(false);
  const [settled, setSettled] = useState(false);
  const [gradientProgress, setGradientProgress] = useState(0);
  const [triggerDecrypt, setTriggerDecrypt] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [textExploding, setTextExploding] = useState(false);
  const [textExploded, setTextExploded] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const [textBounds, setTextBounds] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const logoRef = useRef<HTMLDivElement>(null);
  const particleRef = useRef<ParticleCanvasHandle>(null);
  const companyWrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const firedExplosionsRef = useRef<Set<Company>>(new Set());
  const loopFnRef = useRef<((ts: number) => void) | null>(null);
  const isMountedRef = useRef(true);

  const mirrorRef = useRef<MirrorState>({
    headerVisible: false,
    logoVisible: false,
    currentCompany: null,
    companyPhase: 'hidden',
    showFinalGradient: false,
    settled: false,
    gradientProgress: 0,
    textExploding: false,
    textExploded: false,
    showReveal: false,
    isExiting: false,
  });

  const companies = useMemo(() => LOGO_CONFIGS.map((c) => c.name), []);

  const companyByIndex = useCallback(
    (i: number): Company | null => LOGO_CONFIGS[i]?.name ?? null,
    []
  );

  // Detect mobile
  const isMobile = viewport.w > 0 && viewport.w < MOBILE_BREAKPOINT;

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useLayoutEffect(() => {
    const el = logoRef.current;
    if (!el) return;
    if (typeof ResizeObserver === 'undefined') return;

    const update = () => setTextBounds(el.getBoundingClientRect());
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [logoVisible, textExploded]);

  const handleLetterPainted = useCallback((index: number, color: string) => {
    if (!isMountedRef.current) return;
    setLetterColors((prev) => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = color;
        vibrate(10);
      }
      return next;
    });
  }, []);

  const triggerCompanyPoof = useCallback((company: Company) => {
    const wrapper = companyWrapperRef.current;
    const logoRoot = logoRef.current;
    const particle = particleRef.current;

    if (!wrapper || !logoRoot || !particle) return;

    const sourceRect = wrapper.getBoundingClientRect();
    const letterEls = logoRoot.querySelectorAll('[data-letter-index]');
    const letterRects = Array.from(letterEls).map((el) => el.getBoundingClientRect());

    vibrate(30);
    particle.explodeLogo(company, sourceRect, letterRects);
  }, []);

  const triggerTextExplosion = useCallback(() => {
    const logoRoot = logoRef.current;
    const particle = particleRef.current;

    if (!logoRoot || !particle) return;

    const letterEls = logoRoot.querySelectorAll('[data-letter-index]');
    const letterRects = Array.from(letterEls).map((el) => el.getBoundingClientRect());

    const currentColors =
      letterColors.length > 0
        ? letterColors.filter(Boolean)
        : ['#4ECDC4', '#4285F4', '#0668E1', '#8B5CF6', '#EC4899'];

    vibrate([40, 60, 40]);
    particle.explodeText(letterRects, currentColors);
  }, [letterColors]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pausedAtRef.current = lastTRef.current;
  }, []);

  const resume = useCallback(() => {
    if (rafRef.current) return;
    if (pausedAtRef.current === null) {
      startRef.current = null;
      lastTRef.current = 0;
    }
  }, []);

  const scheduleFrame = useCallback(() => {
    if (loopFnRef.current && isMountedRef.current) {
      rafRef.current = requestAnimationFrame(loopFnRef.current);
    }
  }, []);

  const triggerExit = useCallback(() => {
    if (hasCompletedRef.current || !isMountedRef.current) return;
    hasCompletedRef.current = true;

    setIsExiting(true);
    vibrate([30, 50, 30]);

    setTimeout(() => {
      if (isMountedRef.current) {
        setIsComplete(true);
        onComplete?.();
      }
    }, TIMINGS.exitDuration);
  }, [onComplete]);

  useEffect(() => {
    const loopFn = (ts: number) => {
      if (!isMountedRef.current) return;

      if (document.hidden) {
        pause();
        return;
      }

      if (startRef.current === null) {
        if (pausedAtRef.current !== null) {
          startRef.current = ts - pausedAtRef.current;
          pausedAtRef.current = null;
        } else {
          startRef.current = ts;
          lastTRef.current = 0;
        }
      }

      const t = ts - startRef.current;

      const nextHeaderVisible = t >= TIMINGS.headerAppear;
      if (mirrorRef.current.headerVisible !== nextHeaderVisible) {
        mirrorRef.current.headerVisible = nextHeaderVisible;
        setHeaderVisible(nextHeaderVisible);
      }

      const nextLogoVisible = t >= TIMINGS.logoAppear;
      if (mirrorRef.current.logoVisible !== nextLogoVisible) {
        mirrorRef.current.logoVisible = nextLogoVisible;
        setLogoVisible(nextLogoVisible);
      }

      let nextCompany: Company | null = null;
      let nextPhase: CompanyPhase = 'hidden';

      for (let i = 0; i < companies.length; i++) {
        const start = TIMINGS.firstCompany + i * TIMINGS.companyInterval;
        const zoomEnd = start + TIMINGS.zoomInDuration;
        const visibleEnd = zoomEnd + TIMINGS.visibleDuration;
        const explodeEnd = visibleEnd + TIMINGS.explodeDuration;

        if (t >= start && t < zoomEnd) {
          nextCompany = companyByIndex(i);
          nextPhase = 'zooming';
          break;
        }
        if (t >= zoomEnd && t < visibleEnd) {
          nextCompany = companyByIndex(i);
          nextPhase = 'visible';
          break;
        }
        if (t >= visibleEnd && t < explodeEnd) {
          nextCompany = companyByIndex(i);
          nextPhase = 'exploding';
          break;
        }
      }

      if (mirrorRef.current.currentCompany !== nextCompany) {
        mirrorRef.current.currentCompany = nextCompany;
        setCurrentCompany(nextCompany);
      }
      if (mirrorRef.current.companyPhase !== nextPhase) {
        mirrorRef.current.companyPhase = nextPhase;
        setCompanyPhase(nextPhase);
      }

      for (let i = 0; i < companies.length; i++) {
        const company = companyByIndex(i);
        if (!company) continue;

        const start = TIMINGS.firstCompany + i * TIMINGS.companyInterval;
        const zoomEnd = start + TIMINGS.zoomInDuration;
        const visibleEnd = zoomEnd + TIMINGS.visibleDuration;

        const crossedExplode = lastTRef.current < visibleEnd && t >= visibleEnd;
        if (crossedExplode && !firedExplosionsRef.current.has(company)) {
          firedExplosionsRef.current.add(company);
          setCurrentCompany(company);
          setCompanyPhase('exploding');
          vibrate(15);
          triggerCompanyPoof(company);
        }
      }

      const lastCompanyEnd =
        TIMINGS.firstCompany +
        (companies.length - 1) * TIMINGS.companyInterval +
        TIMINGS.zoomInDuration +
        TIMINGS.visibleDuration +
        TIMINGS.explodeDuration;

      const gradientStartTime = lastCompanyEnd + TIMINGS.settleDelay;
      const gradientEndTime = gradientStartTime + 600;
      const settledTime = gradientStartTime + 150;

      const textExplodeTime = gradientEndTime + TIMINGS.textExplodeDelay;
      const textExplodedTime = textExplodeTime + TIMINGS.textExplodeDuration;

      const revealTime = textExplodedTime + TIMINGS.revealDelay;
      const exitTime = revealTime + TIMINGS.revealDuration + TIMINGS.exitDelay;

      let nextGradientProgress = 0;
      if (t >= gradientStartTime) {
        nextGradientProgress = Math.min(1, (t - gradientStartTime) / 600);
      }

      if (Math.abs(mirrorRef.current.gradientProgress - nextGradientProgress) > 0.02) {
        mirrorRef.current.gradientProgress = nextGradientProgress;
        setGradientProgress(nextGradientProgress);
      }

      const nextGradient = t >= gradientEndTime;
      const nextSettled = t >= settledTime;

      const nextTextExploding = t >= textExplodeTime && t < textExplodedTime;
      const nextTextExploded = t >= textExplodedTime;
      const nextShowReveal = t >= revealTime;

      if (mirrorRef.current.showFinalGradient !== nextGradient) {
        mirrorRef.current.showFinalGradient = nextGradient;
        setShowFinalGradient(nextGradient);
      }
      if (mirrorRef.current.settled !== nextSettled) {
        mirrorRef.current.settled = nextSettled;
        setSettled(nextSettled);
        if (nextSettled) vibrate([20, 50, 20]);
      }

      if (!mirrorRef.current.textExploding && nextTextExploding) {
        mirrorRef.current.textExploding = true;
        setTextExploding(true);
        triggerTextExplosion();
      }

      if (!mirrorRef.current.textExploded && nextTextExploded) {
        mirrorRef.current.textExploded = true;
        setTextExploded(true);
      }

      if (!mirrorRef.current.showReveal && nextShowReveal) {
        mirrorRef.current.showReveal = true;
        setShowReveal(true);
        setTriggerDecrypt(true);
      }

      if (t >= exitTime && !mirrorRef.current.isExiting) {
        mirrorRef.current.isExiting = true;
        triggerExit();
        return;
      }

      lastTRef.current = t;
      scheduleFrame();
    };

    loopFnRef.current = loopFn;
  }, [companies, companyByIndex, pause, scheduleFrame, triggerCompanyPoof, triggerTextExplosion, triggerExit]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else if (!isComplete && isMountedRef.current) {
        resume();
        if (!rafRef.current) scheduleFrame();
      }
    };

    const onBlur = () => pause();
    const onFocus = () => {
      if (!document.hidden && !isComplete && isMountedRef.current) {
        resume();
        if (!rafRef.current) scheduleFrame();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [pause, resume, scheduleFrame, isComplete]);

  useEffect(() => {
    isMountedRef.current = true;

    if (prefersReducedMotion) {
      stop();
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setIsComplete(true);
          onComplete?.();
        }
      }, 100);
      return () => {
        isMountedRef.current = false;
        clearTimeout(timer);
      };
    }

    if (document.hidden) return;

    scheduleFrame();

    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, [prefersReducedMotion, stop, scheduleFrame, onComplete]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const LogoComponent = currentCompany ? LOGO_COMPONENTS[currentCompany] : null;
  const logoColors = currentCompany ? BRAND_COLORS[currentCompany] : [];
  const currentConfig = currentCompany ? LOGO_CONFIGS.find((c) => c.name === currentCompany) : null;
  
  // Use mobile orbits on narrow screens
  const orbitMap = isMobile ? MOBILE_LOGO_ORBITS : LOGO_ORBITS;
  const orbit = currentConfig ? orbitMap[currentConfig.entranceDirection] : orbitMap.top;
  
  // Responsive logo box size
  const logoBoxSize = isMobile ? MOBILE_LOGO_BOX_SIZE : LOGO_BOX_SIZE;

  const logoPixelPos = useMemo(() => {
    const vw = viewport.w || 0;
    const vh = viewport.h || 0;

    if (!vw || !vh) {
      return { left: -9999, top: -9999 };
    }

    const cx = textBounds ? textBounds.left + textBounds.width / 2 : vw / 2;
    const cy = textBounds ? textBounds.top + textBounds.height / 2 : vh / 2;

    const halfTextW = textBounds ? textBounds.width / 2 : 140;
    const halfTextH = textBounds ? textBounds.height / 2 : 50;

    const entryScaleSafety = isMobile ? 1.5 : 2;
    const safeW = logoBoxSize * entryScaleSafety;
    const safeH = logoBoxSize * entryScaleSafety;

    // Smaller margin on mobile
    const margin = isMobile 
      ? clampNum(Math.round(Math.min(vw, vh) * 0.03), 8, 24)
      : clampNum(Math.round(Math.min(vw, vh) * 0.06), 18, 56);

    const dx = halfTextW + margin + safeW / 2;
    const dy = halfTextH + margin + safeH / 2;

    const ox = orbit.vx * dx;
    const oy = orbit.vy * dy;

    const left = cx + ox - logoBoxSize / 2;
    const top = cy + oy - logoBoxSize / 2;

    const pad = isMobile ? 5 : 10;
    return {
      left: clampNum(left, pad, vw - logoBoxSize - pad),
      top: clampNum(top, pad, vh - logoBoxSize - pad),
    };
  }, [viewport.w, viewport.h, textBounds, orbit.vx, orbit.vy, isMobile, logoBoxSize]);

  if (isComplete) return null;

  const getLogoStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      left: `${logoPixelPos.left}px`,
      top: `${logoPixelPos.top}px`,
      width: `${logoBoxSize}px`,
      height: `${logoBoxSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      willChange: 'transform, opacity, filter',
      transformStyle: 'preserve-3d',
      transformOrigin: orbit.origin,
    };

    if (!currentCompany) {
      return {
        ...base,
        transform: `translate3d(0,0,0) scale(2.2)`,
        opacity: 0,
        filter: 'blur(18px)',
        transition: 'none',
      };
    }

    switch (companyPhase) {
      case 'zooming':
        return {
          ...base,
          transform: `translate3d(0,0,0) scale(2)`,
          opacity: 0,
          filter: 'blur(16px)',
          transition: 'none',
        };
      case 'visible':
        return {
          ...base,
          transform: `translate3d(0,0,0) scale(1)`,
          opacity: 1,
          filter: 'blur(0px)',
          transition: `all ${TIMINGS.zoomInDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
          animation: 'logoPulse 450ms ease-in-out',
        };
      case 'exploding':
        return {
          ...base,
          transform: `translate3d(0,0,0) scale(1.12)`,
          opacity: 0,
          filter: 'blur(12px) brightness(2)',
          transition: `all ${TIMINGS.explodeDuration}ms ease-out`,
        };
      default:
        return {
          ...base,
          transform: `translate3d(0,0,0) scale(2.2)`,
          opacity: 0,
          filter: 'blur(18px)',
          transition: 'none',
        };
    }
  };

  // Responsive logo size for the actual SVG
  const logoSvgSize = isMobile ? 100 : 180;

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ scale: 1, opacity: 1 }}
      animate={
        isExiting ? { scale: 2.5, opacity: 0, filter: 'blur(30px)' } : { scale: 1, opacity: 1, filter: 'blur(0px)' }
      }
      transition={{
        duration: TIMINGS.exitDuration / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Pulse animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes logoPulse {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(0,0,0) scale(1.04); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes glowPulse {
          0% { opacity: 0.8; transform: scale(3.5); }
          50% { opacity: 1; transform: scale(4); }
          100% { opacity: 0.8; transform: scale(3.5); }
        }
      `}} />
      
      <NeuralBackground />
      <ParticleCanvas ref={particleRef} onLetterPainted={handleLetterPainted} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-20">
        <AnimatePresence mode="wait">
          {headerVisible && !textExploding && !showReveal && (
            <motion.div
              key="talent-from"
              className="mb-6 md:mb-8 h-8 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
              transition={{ duration: 0.3 }}
            >
              <RotatingText
                texts={['TALENT FROM']}
                activeIndex={0}
                splitMode="characters"
                staggerDelay={20}
                transitionDuration={300}
                className="text-sm md:text-base tracking-[0.35em] font-medium text-white/60 uppercase"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!textExploded && (
            <motion.div
              exit={{
                opacity: 0,
                scale: 1.3,
                filter: 'blur(12px) brightness(3)',
              }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <motion.div
                animate={{
                  opacity: textExploding ? 0 : 1,
                  scale: textExploding ? 1.1 : 1,
                  filter: textExploding ? 'blur(6px) brightness(2)' : 'blur(0px) brightness(1)',
                }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              >
                <DatafluentLogo
                  ref={logoRef}
                  letterColors={letterColors}
                  showFinalGradient={showFinalGradient}
                  gradientProgress={gradientProgress}
                  visible={logoVisible}
                  settled={settled && !textExploding}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReveal && (
            <motion.div
              key="reveal-text"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              style={{
                background: 'transparent',
                backgroundColor: 'transparent',
              }}
            >
              <RevealText
                text="Now working for you"
                trigger={triggerDecrypt}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentCompany && LogoComponent && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9, perspective: '1200px' }}
        >
          <div ref={companyWrapperRef} style={getLogoStyle()}>
            <div
              className="absolute inset-0 blur-3xl"
              style={{
                background: `radial-gradient(circle, ${logoColors[0]}55, transparent 62%)`,
                transform: 'scale(3.5)',
                opacity: companyPhase === 'visible' ? 0.8 : 0.15,
                transition: 'opacity 200ms',
                animation: companyPhase === 'visible' ? 'glowPulse 450ms ease-in-out' : 'none',
              }}
            />
            <LogoComponent size={logoSvgSize} className="relative z-10" />
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(5,5,8,0.35) 100%)',
          zIndex: 5,
        }}
      />
    </motion.div>
  );
}