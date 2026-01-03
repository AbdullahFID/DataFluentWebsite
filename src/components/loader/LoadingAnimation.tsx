'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuralBackground } from './NeuralBackground';
import { DatafluentLogo } from './DatafluentLogo';
import { ParticleCanvas, ParticleCanvasHandle } from './ParticleCanvas';
import { LOGO_COMPONENTS } from './FaangLogos';
import { RotatingText } from './RotatingText';
import { DecryptedText } from './DecryptedText';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BRAND_COLORS, LOGO_CONFIGS, Company } from '@/lib/brandColors';

const TIMINGS = {
  headerAppear: 300,
  logoAppear: 800,

  firstCompany: 2000,
  companyInterval: 1600,

  zoomInDuration: 480,
  visibleDuration: 450,
  explodeDuration: 520,

  settleDelay: 780,
  settleDuration: 1400,

  // When header rotates from "TALENT FROM" to "Now working for you"
  headerRotateDelay: 600, // ms after gradient complete

  cycle: 16000,
} as const;

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

type CompanyPhase = 'hidden' | 'zooming' | 'visible' | 'exploding';

export function LoadingAnimation() {
  const prefersReducedMotion = useReducedMotion();

  const [headerVisible, setHeaderVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);

  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companyPhase, setCompanyPhase] = useState<CompanyPhase>('hidden');

  const [letterColors, setLetterColors] = useState<string[]>(Array(11).fill(''));
  const [showFinalGradient, setShowFinalGradient] = useState(false);
  const [settled, setSettled] = useState(false);

  const [gradientProgress, setGradientProgress] = useState(0);

  // 0 = "TALENT FROM", 1 = "Now working for you"
  const [headerPhase, setHeaderPhase] = useState(0);
  // Trigger decrypt animation on the second header
  const [triggerDecrypt, setTriggerDecrypt] = useState(false);

  const logoRef = useRef<HTMLDivElement>(null);
  const particleRef = useRef<ParticleCanvasHandle>(null);
  const companyWrapperRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);

  const firedExplosionsRef = useRef<Set<Company>>(new Set());
  const loopFnRef = useRef<((ts: number) => void) | null>(null);

  const mirrorRef = useRef({
    headerVisible: false,
    logoVisible: false,
    currentCompany: null as Company | null,
    companyPhase: 'hidden' as CompanyPhase,
    showFinalGradient: false,
    settled: false,
    gradientProgress: 0,
    headerPhase: 0,
  });

  const companies = useMemo(() => LOGO_CONFIGS.map((c) => c.name), []);

  const companyByIndex = useCallback(
    (i: number): Company | null => LOGO_CONFIGS[i]?.name ?? null,
    []
  );

  const handleLetterPainted = useCallback((index: number, color: string) => {
    setLetterColors((prev) => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = color;
        vibrate(10);
      }
      return next;
    });
  }, []);

  const resetCycleState = useCallback(() => {
    firedExplosionsRef.current.clear();

    setLetterColors(Array(11).fill(''));
    setShowFinalGradient(false);
    setSettled(false);
    setGradientProgress(0);
    setHeaderPhase(0);
    setTriggerDecrypt(false);

    setCurrentCompany(null);
    setCompanyPhase('hidden');

    if (particleRef.current?.clearParticles) {
      particleRef.current.clearParticles();
    }

    mirrorRef.current.showFinalGradient = false;
    mirrorRef.current.settled = false;
    mirrorRef.current.currentCompany = null;
    mirrorRef.current.companyPhase = 'hidden';
    mirrorRef.current.gradientProgress = 0;
    mirrorRef.current.headerPhase = 0;
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

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
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
    if (loopFnRef.current) {
      rafRef.current = requestAnimationFrame(loopFnRef.current);
    }
  }, []);

  // Build loop logic
  useEffect(() => {
    const loopFn = (ts: number) => {
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
          resetCycleState();
        }
      }

      const elapsed = ts - startRef.current;
      const t = elapsed % TIMINGS.cycle;

      if (t < lastTRef.current) {
        resetCycleState();
      }

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
      const gradientEndTime = gradientStartTime + 800;
      const settledTime = gradientStartTime + 200;
      const headerRotateTime = gradientEndTime + TIMINGS.headerRotateDelay;

      // Smooth gradient progress
      let nextGradientProgress = 0;
      if (t >= gradientStartTime) {
        nextGradientProgress = Math.min(1, (t - gradientStartTime) / 800);
      }

      if (Math.abs(mirrorRef.current.gradientProgress - nextGradientProgress) > 0.02) {
        mirrorRef.current.gradientProgress = nextGradientProgress;
        setGradientProgress(nextGradientProgress);
      }

      const nextGradient = t >= gradientEndTime;
      const nextSettled = t >= settledTime;
      const nextHeaderPhase = t >= headerRotateTime ? 1 : 0;

      if (mirrorRef.current.showFinalGradient !== nextGradient) {
        mirrorRef.current.showFinalGradient = nextGradient;
        setShowFinalGradient(nextGradient);
      }
      if (mirrorRef.current.settled !== nextSettled) {
        mirrorRef.current.settled = nextSettled;
        setSettled(nextSettled);
        if (nextSettled) vibrate([20, 50, 20]);
      }
      if (mirrorRef.current.headerPhase !== nextHeaderPhase) {
        mirrorRef.current.headerPhase = nextHeaderPhase;
        setHeaderPhase(nextHeaderPhase);
        // Trigger decrypt when switching to phase 1
        if (nextHeaderPhase === 1) {
          setTriggerDecrypt(true);
        }
      }

      lastTRef.current = t;
      scheduleFrame();
    };

    loopFnRef.current = loopFn;
  }, [companies, companyByIndex, pause, resetCycleState, scheduleFrame, triggerCompanyPoof]);

  // Visibility/focus handling
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
        if (!rafRef.current) scheduleFrame();
      }
    };

    const onBlur = () => pause();
    const onFocus = () => {
      if (!document.hidden) {
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
  }, [pause, resume, scheduleFrame]);

  // Start/stop animation - use setTimeout to avoid sync setState in effect
  useEffect(() => {
    if (prefersReducedMotion) {
      stop();
      // Wrap in setTimeout to avoid sync setState warning
      const timer = setTimeout(() => {
        setHeaderVisible(true);
        setLogoVisible(true);
        setShowFinalGradient(true);
        setSettled(true);
        setGradientProgress(1);
        setHeaderPhase(1);
        setTriggerDecrypt(true);
        setCurrentCompany(null);
        setCompanyPhase('hidden');
        particleRef.current?.clearParticles?.();
      }, 0);
      return () => clearTimeout(timer);
    }

    if (document.hidden) return;

    scheduleFrame();
    return () => stop();
  }, [prefersReducedMotion, stop, scheduleFrame]);

  const LogoComponent = currentCompany ? LOGO_COMPONENTS[currentCompany] : null;
  const logoColors = currentCompany ? BRAND_COLORS[currentCompany] : [];

  const getLogoStyle = (): React.CSSProperties => {
    if (!currentCompany) {
      return {
        transform: 'translate3d(0, 0, 0) scale(2.5)',
        opacity: 0,
        filter: 'blur(20px)',
        transition: 'none',
      };
    }

    switch (companyPhase) {
      case 'zooming':
        return {
          transform: 'translate3d(0, 0, 0) scale(2.2)',
          opacity: 0,
          filter: 'blur(18px)',
          transition: 'none',
        };
      case 'visible':
        return {
          transform: 'translate3d(0, 0, 0) scale(1)',
          opacity: 1,
          filter: 'blur(0px)',
          transition: `all ${TIMINGS.zoomInDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        };
      case 'exploding':
        return {
          transform: 'translate3d(0, 0, 0) scale(1.15)',
          opacity: 0,
          filter: 'blur(14px) brightness(2)',
          transition: `all ${TIMINGS.explodeDuration}ms ease-out`,
        };
      default:
        return {
          transform: 'translate3d(0, 0, 0) scale(2.5)',
          opacity: 0,
          filter: 'blur(20px)',
          transition: 'none',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <NeuralBackground />
      <ParticleCanvas ref={particleRef} onLetterPainted={handleLetterPainted} />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-20">        {/* Rotating header: TALENT FROM → Now working for you */}
        <AnimatePresence>
          {headerVisible && (
            <motion.div
              className="mb-6 md:mb-8 h-8 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {headerPhase === 0 ? (
                <RotatingText
                  texts={['TALENT FROM']}
                  activeIndex={0}
                  splitMode="characters"
                  staggerDelay={25}
                  transitionDuration={400}
                  className="text-sm md:text-base tracking-[0.35em] font-medium text-white/60 uppercase"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DecryptedText
                    text="Now working for you"
                    trigger={triggerDecrypt}
                    speed={35}
                    maxIterations={10}
                    revealDirection="start"
                    className="text-base md:text-lg tracking-wide text-white/70 font-light"
                    encryptedClassName="text-cyan-400/50"
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Datafluent logo */}
        <DatafluentLogo
          ref={logoRef}
          letterColors={letterColors}
          showFinalGradient={showFinalGradient}
          gradientProgress={gradientProgress}
          visible={logoVisible}
          settled={settled}
        />
      </div>

      {/* FAANG logo display */}
      {currentCompany && LogoComponent && (
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 35, perspective: '1200px' }}
        >
          <div
            ref={companyWrapperRef}
            style={{ ...getLogoStyle(), transformStyle: 'preserve-3d' }}
          >
            <div
              className="absolute inset-0 blur-3xl transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle, ${logoColors[0]}55, transparent 62%)`,
                transform: 'scale(4)',
                opacity: companyPhase === 'visible' ? 0.85 : 0.2,
              }}
            />
            <LogoComponent size={220} className="relative z-10" />
          </div>
        </div>
      )}

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(5,5,8,0.35) 100%)',
          zIndex: 5,
        }}
      />
    </div>
  );
}