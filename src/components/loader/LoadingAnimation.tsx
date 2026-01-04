'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
// TIMINGS - SPED UP (~40% faster)
// ============================================================================
const TIMINGS = {
  headerAppear: 200,
  logoAppear: 500,

  firstCompany: 1200,
  companyInterval: 1000,

  zoomInDuration: 300,
  visibleDuration: 280,
  explodeDuration: 340,

  settleDelay: 500,
  settleDuration: 900,

  // Text explosion phase
  textExplodeDelay: 900,    // Give gradient time to settle
  textExplodeDuration: 400, // Explosion animation
  
  // "Now working for you" reveal
  revealDelay: 500,         // Dramatic pause after explosion (darkness)
  revealDuration: 1400,     // Full reveal animation with scan

  exitDelay: 2200,          // Time to admire the reveal
  exitDuration: 600,
} as const;

// ============================================================================
// LOGO POSITIONS - Around the text, not on it
// ============================================================================
type LogoPosition = { x: string; y: string; origin: string };

const LOGO_POSITIONS: Record<LogoDirection, LogoPosition> = {
  'bottom-left': { x: '-45%', y: '35%', origin: 'bottom left' },
  'top': { x: '0%', y: '-55%', origin: 'top center' },
  'right': { x: '50%', y: '0%', origin: 'center right' },
  'left': { x: '-50%', y: '0%', origin: 'center left' },
  'bottom-right': { x: '45%', y: '35%', origin: 'bottom right' },
};

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================
function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail on unsupported devices
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================
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

// ============================================================================
// COMPONENT
// ============================================================================
export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  // UI State
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
  
  // Text explosion state
  const [textExploding, setTextExploding] = useState(false);
  const [textExploded, setTextExploded] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Refs
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

  // Mirror ref for avoiding stale closures
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

  // ============================================================================
  // HANDLERS
  // ============================================================================
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

  // Trigger text explosion - Datafluent explodes outward
  const triggerTextExplosion = useCallback(() => {
    const logoRoot = logoRef.current;
    const particle = particleRef.current;

    if (!logoRoot || !particle) return;

    const letterEls = logoRoot.querySelectorAll('[data-letter-index]');
    const letterRects = Array.from(letterEls).map((el) => el.getBoundingClientRect());
    
    // Get the current colors from letterColors state for the explosion
    const currentColors = letterColors.length > 0 
      ? letterColors.filter(Boolean) 
      : ['#4ECDC4', '#4285F4', '#0668E1', '#8B5CF6', '#EC4899'];

    vibrate([40, 60, 40]);
    particle.explodeText(letterRects, currentColors);
  }, [letterColors]);

  // ============================================================================
  // ANIMATION CONTROL
  // ============================================================================
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

  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================
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

      // Header visibility
      const nextHeaderVisible = t >= TIMINGS.headerAppear;
      if (mirrorRef.current.headerVisible !== nextHeaderVisible) {
        mirrorRef.current.headerVisible = nextHeaderVisible;
        setHeaderVisible(nextHeaderVisible);
      }

      // Logo visibility
      const nextLogoVisible = t >= TIMINGS.logoAppear;
      if (mirrorRef.current.logoVisible !== nextLogoVisible) {
        mirrorRef.current.logoVisible = nextLogoVisible;
        setLogoVisible(nextLogoVisible);
      }

      // Company phase logic
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

      // Explosion triggers
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

      // Final gradient timing
      const lastCompanyEnd =
        TIMINGS.firstCompany +
        (companies.length - 1) * TIMINGS.companyInterval +
        TIMINGS.zoomInDuration +
        TIMINGS.visibleDuration +
        TIMINGS.explodeDuration;

      const gradientStartTime = lastCompanyEnd + TIMINGS.settleDelay;
      const gradientEndTime = gradientStartTime + 600;
      const settledTime = gradientStartTime + 150;
      
      // Text explosion timing
      const textExplodeTime = gradientEndTime + TIMINGS.textExplodeDelay;
      const textExplodedTime = textExplodeTime + TIMINGS.textExplodeDuration;
      
      // Reveal timing
      const revealTime = textExplodedTime + TIMINGS.revealDelay;
      const exitTime = revealTime + TIMINGS.revealDuration + TIMINGS.exitDelay;

      // Smooth gradient progress
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
      
      // Text explosion states
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
      
      // Trigger text explosion
      if (!mirrorRef.current.textExploding && nextTextExploding) {
        mirrorRef.current.textExploding = true;
        setTextExploding(true);
        setShowFlash(true); // Flash on explosion
        setTimeout(() => setShowFlash(false), 150);
        triggerTextExplosion();
      }
      
      // Mark text as exploded
      if (!mirrorRef.current.textExploded && nextTextExploded) {
        mirrorRef.current.textExploded = true;
        setTextExploded(true);
      }
      
      // Show reveal text
      if (!mirrorRef.current.showReveal && nextShowReveal) {
        mirrorRef.current.showReveal = true;
        setShowReveal(true);
        setTriggerDecrypt(true);
        // Second subtle flash when text materializes
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 100);
      }

      // Trigger exit animation
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

  // ============================================================================
  // VISIBILITY HANDLING
  // ============================================================================
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

  // ============================================================================
  // START ANIMATION
  // ============================================================================
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

  // ============================================================================
  // CLEANUP ON UNMOUNT
  // ============================================================================
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  if (isComplete) return null;

  const LogoComponent = currentCompany ? LOGO_COMPONENTS[currentCompany] : null;
  const logoColors = currentCompany ? BRAND_COLORS[currentCompany] : [];
  const currentConfig = currentCompany
    ? LOGO_CONFIGS.find((c) => c.name === currentCompany)
    : null;
  const logoPosition = currentConfig
    ? LOGO_POSITIONS[currentConfig.entranceDirection]
    : LOGO_POSITIONS['top'];

  const getLogoStyle = (): React.CSSProperties => {
    const baseTransform = `translate(${logoPosition.x}, ${logoPosition.y})`;

    if (!currentCompany) {
      return {
        transform: `${baseTransform} scale(2.2)`,
        opacity: 0,
        filter: 'blur(18px)',
        transition: 'none',
      };
    }

    switch (companyPhase) {
      case 'zooming':
        return {
          transform: `${baseTransform} scale(2)`,
          opacity: 0,
          filter: 'blur(16px)',
          transition: 'none',
        };
      case 'visible':
        return {
          transform: `${baseTransform} scale(1)`,
          opacity: 1,
          filter: 'blur(0px)',
          transition: `all ${TIMINGS.zoomInDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        };
      case 'exploding':
        return {
          transform: `${baseTransform} scale(1.12)`,
          opacity: 0,
          filter: 'blur(12px) brightness(2)',
          transition: `all ${TIMINGS.explodeDuration}ms ease-out`,
        };
      default:
        return {
          transform: `${baseTransform} scale(2.2)`,
          opacity: 0,
          filter: 'blur(18px)',
          transition: 'none',
        };
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ scale: 1, opacity: 1 }}
      animate={
        isExiting
          ? { scale: 2.5, opacity: 0, filter: 'blur(30px)' }
          : { scale: 1, opacity: 1, filter: 'blur(0px)' }
      }
      transition={{
        duration: TIMINGS.exitDuration / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <NeuralBackground />
      <ParticleCanvas ref={particleRef} onLetterPainted={handleLetterPainted} />

      {/* Energy burst flash overlay for transitions */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, times: [0, 0.3, 1] }}
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(66,133,244,0.4) 30%, transparent 70%)',
              zIndex: 45,
            }}
          />
        )}
      </AnimatePresence>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-20">
        {/* Header - shows "TALENT FROM" until explosion */}
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

        {/* Datafluent logo - explodes dramatically */}
        <AnimatePresence>
          {!textExploded && (
            <motion.div
              exit={{ 
                opacity: 0, 
                scale: 1.3,
                filter: 'blur(12px) brightness(3)',
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <motion.div
                animate={{
                  opacity: textExploding ? 0 : 1,
                  scale: textExploding ? 1.15 : 1,
                  filter: textExploding 
                    ? 'blur(8px) brightness(2.5)' 
                    : 'blur(0px) brightness(1)',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
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

        {/* "Now working for you" reveal */}
        <AnimatePresence>
          {showReveal && (
            <motion.div
              key="reveal-text"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              style={{
                background: 'transparent',
                backgroundColor: 'transparent',
              }}
            >
              <RevealText
                text="Now working for you"
                trigger={triggerDecrypt}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAANG logo display - POSITIONED AROUND the text */}
      {currentCompany && LogoComponent && (
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 35, perspective: '1200px' }}
        >
          <div
            ref={companyWrapperRef}
            style={{
              ...getLogoStyle(),
              transformStyle: 'preserve-3d',
              transformOrigin: logoPosition.origin,
            }}
          >
            <div
              className="absolute inset-0 blur-3xl transition-opacity duration-200"
              style={{
                background: `radial-gradient(circle, ${logoColors[0]}55, transparent 62%)`,
                transform: 'scale(3.5)',
                opacity: companyPhase === 'visible' ? 0.8 : 0.15,
              }}
            />
            <LogoComponent size={180} className="relative z-10" />
          </div>
        </div>
      )}

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(5,5,8,0.35) 100%)',
          zIndex: 5,
        }}
      />
    </motion.div>
  );
}