'use client';

import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { Particle, easeOutQuart, quadraticBezier } from '@/lib/particlePhysics';
import { BRAND_COLORS, LOGO_LETTER_TARGETS, Company } from '@/lib/brandColors';

export interface ParticleCanvasHandle {
  explodeLogo: (
    company: string,
    sourceRect: DOMRect,
    letterRects: DOMRect[]
  ) => void;
  explodeText: (letterRects: DOMRect[], colors: string[]) => void;
  clearParticles: () => void;
}

interface Props {
  onLetterPainted: (index: number, color: string) => void;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export const ParticleCanvas = forwardRef<ParticleCanvasHandle, Props>(
  function ParticleCanvas({ onLetterPainted }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number | null>(null);
    const paintedLettersRef = useRef<Set<number>>(new Set());
    const isMountedRef = useRef(true);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const dimensionsRef = useRef({ width: 0, height: 0 });

    // ========================================================================
    // IMPERATIVE HANDLE
    // ========================================================================
    useImperativeHandle(
      ref,
      () => ({
        explodeLogo: (company, sourceRect, letterRects) => {
          if (!isMountedRef.current) return;

          const palette = [
            ...(BRAND_COLORS[company as Company] || ['#FFFFFF']),
          ];
          const targets =
            LOGO_LETTER_TARGETS[company as Company] || [];
          if (!targets.length) return;

          const isMobile = window.innerWidth < 768;
          const particlesPerLetter = isMobile ? 22 : 38;

          const spreadW = clamp(sourceRect.width, 50, 280);
          const spreadH = clamp(sourceRect.height, 35, 200);

          targets.forEach((letterIdx, targetIndex) => {
            const rect = letterRects[letterIdx];
            if (!rect) return;

            const targetX = rect.left + rect.width / 2;
            const targetY = rect.top + rect.height / 2;
            const primaryColor = palette[targetIndex % palette.length];

            for (let j = 0; j < particlesPerLetter; j++) {
              const isPainter = j === 0;

              const originX = sourceRect.left + Math.random() * spreadW;
              const originY = sourceRect.top + Math.random() * spreadH;

              const angle = Math.random() * Math.PI * 2;
              const burstForce = 5 + Math.random() * 8;
              const burstVx = Math.cos(angle) * burstForce;
              const burstVy = Math.sin(angle) * burstForce - 3;

              const ctrlX =
                (originX + targetX) / 2 + (Math.random() - 0.5) * 180;
              const ctrlY =
                Math.min(originY, targetY) - 70 - Math.random() * 80;

              const color = isPainter
                ? primaryColor
                : palette[Math.floor(Math.random() * palette.length)];

              particlesRef.current.push({
                id: Date.now() + Math.random(),
                x: originX,
                y: originY,
                startX: originX,
                startY: originY,
                targetX: targetX + (Math.random() - 0.5) * 20,
                targetY: targetY + (Math.random() - 0.5) * 20,
                controlX: ctrlX,
                controlY: ctrlY,
                color,
                size: 2 + Math.random() * 3,
                alpha: 1,
                progress: 0,
                delay: isPainter ? 0 : Math.random() * 0.04,
                speed: isPainter ? 0.026 : 0.018 + Math.random() * 0.012,
                phase: 'burst',
                burstVx,
                burstVy,
                burstProgress: 0,
                rotation: Math.random() * Math.PI * 2,
                letterIndex: letterIdx,
                hasPainted: !isPainter,
              });
            }
          });
        },

        explodeText: (letterRects, colors) => {
          if (!isMountedRef.current) return;

          const isMobile = window.innerWidth < 768;
          const particlesPerLetter = isMobile ? 28 : 50;

          letterRects.forEach((rect, i) => {
            if (!rect || rect.width === 0) return;
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const color = colors[i % colors.length] || '#FFFFFF';

            for (let j = 0; j < particlesPerLetter; j++) {
              const angle = Math.random() * Math.PI * 2;
              const burstForce = 8 + Math.random() * 12;

              particlesRef.current.push({
                id: Date.now() + Math.random(),
                x: centerX + (Math.random() - 0.5) * rect.width,
                y: centerY + (Math.random() - 0.5) * rect.height,
                startX: centerX,
                startY: centerY,
                targetX: centerX + Math.cos(angle) * (isMobile ? 300 : 450),
                targetY: centerY + Math.sin(angle) * (isMobile ? 300 : 450),
                controlX: centerX,
                controlY: centerY,
                color,
                size: 2 + Math.random() * 3.5,
                alpha: 1,
                progress: 0,
                delay: i * 0.015 + Math.random() * 0.04,
                speed: 0.016 + Math.random() * 0.008,
                phase: 'burst',
                burstVx: Math.cos(angle) * burstForce,
                burstVy: Math.sin(angle) * burstForce,
                burstProgress: 0,
                rotation: Math.random() * Math.PI * 2,
                letterIndex: -1,
                hasPainted: true,
              });
            }
          });
        },

        clearParticles: () => {
          particlesRef.current = [];
          paintedLettersRef.current.clear();

          const ctx = ctxRef.current;
          const { width, height } = dimensionsRef.current;
          if (ctx && width && height) {
            ctx.clearRect(0, 0, width, height);
          }
        },
      }),
      []
    );

    // ========================================================================
    // RESIZE HANDLER
    // ========================================================================
    const handleResize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !isMountedRef.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR for performance
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctxRef.current = ctx;
      dimensionsRef.current = { width, height };
    }, []);

    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================
    const animate = useCallback(() => {
      if (!isMountedRef.current) return;

      const ctx = ctxRef.current;
      const { width, height } = dimensionsRef.current;

      if (!ctx || !width || !height) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const dead: number[] = [];

      particlesRef.current.forEach((p, idx) => {
        if (p.delay > 0) {
          p.delay -= 0.016;
          return;
        }

        if (p.phase === 'burst') {
          p.x += p.burstVx;
          p.y += p.burstVy;
          p.burstVx *= 0.91;
          p.burstVy *= 0.91;
          p.burstVy += 0.18;
          p.burstProgress += 0.03;
          p.rotation += 0.08;

          if (p.burstProgress >= 0.25) {
            p.phase = 'hover';
            p.progress = 0;
          }
        } else if (p.phase === 'hover') {
          p.progress += 0.06;
          p.rotation += 0.02;
          if (p.progress >= 0.12) {
            p.phase = 'travel';
            p.startX = p.x;
            p.startY = p.y;
            p.progress = 0;
          }
        } else if (p.phase === 'travel') {
          p.progress += p.speed;
          p.rotation += 0.025;

          const t = easeOutQuart(Math.min(p.progress, 1));
          const pos = quadraticBezier(
            t,
            { x: p.startX, y: p.startY },
            { x: p.controlX, y: p.controlY },
            { x: p.targetX, y: p.targetY }
          );
          p.x = pos.x;
          p.y = pos.y;

          // Paint letter when close to target
          if (p.progress >= 0.84 && !p.hasPainted && p.letterIndex >= 0) {
            if (!paintedLettersRef.current.has(p.letterIndex)) {
              paintedLettersRef.current.add(p.letterIndex);
              // Use setTimeout to avoid React setState during render
              setTimeout(() => {
                if (isMountedRef.current) {
                  onLetterPainted(p.letterIndex, p.color);
                }
              }, 0);
            }
            p.hasPainted = true;
          }

          if (p.progress >= 1) {
            p.phase = 'absorb';
          }
        } else if (p.phase === 'absorb') {
          p.alpha -= 0.08;
          p.size *= 0.93;
          if (p.alpha <= 0) {
            dead.push(idx);
            return;
          }
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Glow
        ctx.globalAlpha = p.alpha * 0.5;
        const glowSize = p.size * 3.5;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

        ctx.restore();
      });

      // Remove dead particles (iterate backwards to avoid index issues)
      for (let i = dead.length - 1; i >= 0; i--) {
        particlesRef.current.splice(dead[i], 1);
      }

      animationRef.current = requestAnimationFrame(animate);
    }, [onLetterPainted]);

    // ========================================================================
    // SETUP AND CLEANUP
    // ========================================================================
    useEffect(() => {
      isMountedRef.current = true;

      handleResize();
      window.addEventListener('resize', handleResize);

      // Start animation loop
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        isMountedRef.current = false;
        window.removeEventListener('resize', handleResize);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }

        // Clear particles on unmount
        particlesRef.current = [];
        paintedLettersRef.current.clear();
      };
    }, [handleResize, animate]);

    // ========================================================================
    // RENDER
    // ========================================================================
    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 40 }}
        aria-hidden="true"
      />
    );
  }
);