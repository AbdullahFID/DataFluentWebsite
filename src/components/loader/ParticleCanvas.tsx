// ParticleCanvas.tsx
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
    const animateFnRef = useRef<() => void>(() => {});

    useImperativeHandle(
      ref,
      () => ({
        // ====================================================================
        // ORIGINAL explodeLogo - UNCHANGED
        // ====================================================================
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

        // ====================================================================
        // FAST DUST SWOOSH - Race car style, UP-RIGHT, no flipping
        // ====================================================================
        explodeText: (letterRects, colors) => {
          if (!isMountedRef.current) return;

          const isMobile = window.innerWidth < 768;
          // Fewer particles but FAST
          const particlesPerLetter = isMobile ? 40 : 80;

          const validRects = letterRects.filter(r => r && r.width > 0);
          if (validRects.length === 0) return;

          const leftMost = Math.min(...validRects.map(r => r.left));
          const rightMost = Math.max(...validRects.map(r => r.right));
          const totalWidth = rightMost - leftMost || 1;

          letterRects.forEach((rect, i) => {
            if (!rect || rect.width === 0) return;
            
            const color = colors[i % colors.length] || '#FFFFFF';
            
            const letterCenter = rect.left + rect.width / 2;
            const positionRatio = (letterCenter - leftMost) / totalWidth;
            
            // LEFT = faster & wider spread, RIGHT = tighter
            const spreadMultiplier = 1 - positionRatio * 0.6;
            
            // Fast but readable swoosh
            const speedMultiplier = 3 + (1 - positionRatio) * 3; // 3x to 6x speed
            
            // Base angle: UP-RIGHT (-π/4 = 45° diagonal)
            const baseAngle = -Math.PI / 4;
            
            // Cone spread
            const maxSpread = 0.7;
            const minSpread = 0.2;
            const spreadAngle = maxSpread - positionRatio * (maxSpread - minSpread);

            for (let j = 0; j < particlesPerLetter; j++) {
              const spawnX = rect.left + Math.random() * rect.width;
              const spawnY = rect.top + Math.random() * rect.height;
              
              const angleOffset = (Math.random() - 0.5) * spreadAngle * 2;
              const finalAngle = baseAngle + angleOffset;
              
              // HIGH speed base (slightly reduced)
              const baseSpeed = 2.5 + Math.random() * 3;
              const speed = baseSpeed * speedMultiplier * spreadMultiplier;
              
              const sizeMultiplier = 0.6 + spreadMultiplier * 0.5;
              
              particlesRef.current.push({
                id: Date.now() + Math.random(),
                x: spawnX,
                y: spawnY,
                startX: spawnX,
                startY: spawnY,
                targetX: spawnX + Math.cos(finalAngle) * 800,
                targetY: spawnY + Math.sin(finalAngle) * 800,
                controlX: spawnX + 100,
                controlY: spawnY - 100,
                color,
                size: (0.5 + Math.random() * 1.5) * sizeMultiplier,
                alpha: 0.9,
                progress: 0,
                // Minimal stagger - all at once for swoosh effect
                delay: i * 0.008 + Math.random() * 0.005,
                speed: 0.02 + Math.random() * 0.01,
                phase: 'burst',
                burstVx: Math.cos(finalAngle) * speed,
                burstVy: Math.sin(finalAngle) * speed,
                burstProgress: 0,
                rotation: 0, // NO rotation - prevents flipping look
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

    const handleResize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !isMountedRef.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    const animate = useCallback(() => {
      if (!isMountedRef.current) return;

      const ctx = ctxRef.current;
      const { width, height } = dimensionsRef.current;

      if (!ctx || !width || !height) {
        animationRef.current = requestAnimationFrame(() => animateFnRef.current());
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const dead: number[] = [];

      particlesRef.current.forEach((p, idx) => {
        if (p.delay > 0) {
          p.delay -= 0.016;
          return;
        }

        const isTextExplosion = p.letterIndex === -1;

        if (p.phase === 'burst') {
          if (isTextExplosion) {
            // ================================================================
            // FAST SWOOSH PHYSICS - No rotation, pure velocity
            // ================================================================
            p.x += p.burstVx;
            p.y += p.burstVy;
            
            // Light drag - maintains speed longer
            p.burstVx *= 0.96;
            p.burstVy *= 0.96;
            
            // Subtle upward + rightward drift
            p.burstVy -= 0.05;
            p.burstVx += 0.03;
            
            p.burstProgress += 0.03; // Slightly slower progress
            
            // Quick fade - swoosh disappears fast
            if (p.burstProgress > 0.15) {
              p.alpha *= 0.94;
            }
            
            // Shrink quickly
            if (p.burstProgress > 0.2) {
              p.size *= 0.95;
            }
            
            // Remove when faded or off-screen
            if (p.alpha < 0.03 || p.x > window.innerWidth + 50 || p.y < -50) {
              dead.push(idx);
              return;
            }
          } else {
            // ORIGINAL BURST for logo explosion
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

          if (p.progress >= 0.84 && !p.hasPainted && p.letterIndex >= 0) {
            if (!paintedLettersRef.current.has(p.letterIndex)) {
              paintedLettersRef.current.add(p.letterIndex);
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

        // ====================================================================
        // RENDER
        // ====================================================================
        ctx.save();
        
        if (isTextExplosion) {
          // Simple circular dust particle - no rotation transform
          const gradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size * 2.5
          );
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(0.4, `${p.color}88`);
          gradient.addColorStop(1, 'transparent');
          
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Original rendering for logo particles
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.globalAlpha = p.alpha * 0.5;
          const glowSize = p.size * 3.5;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
          grad.addColorStop(0, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }

        ctx.restore();
      });

      for (let i = dead.length - 1; i >= 0; i--) {
        particlesRef.current.splice(dead[i], 1);
      }

      animationRef.current = requestAnimationFrame(() => animateFnRef.current());
    }, [onLetterPainted]);

    useEffect(() => {
      animateFnRef.current = animate;
    }, [animate]);

    useEffect(() => {
      isMountedRef.current = true;
      const currentPaintedLetters = paintedLettersRef.current;

      handleResize();
      window.addEventListener('resize', handleResize);
      animationRef.current = requestAnimationFrame(() => animateFnRef.current());

      return () => {
        isMountedRef.current = false;
        window.removeEventListener('resize', handleResize);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }

        particlesRef.current = [];
        currentPaintedLetters.clear();
      };
    }, [handleResize]);

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