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

    // ========================================================================
    // IMPERATIVE HANDLE
    // ========================================================================
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
        // REFINED explodeText - Apple-style vaporization/dissolution
        // ====================================================================
        explodeText: (letterRects, colors) => {
          if (!isMountedRef.current) return;

          const isMobile = window.innerWidth < 768;
          
          // More particles, smaller size = vapor/dust effect
          const particlesPerLetter = isMobile ? 80 : 150;

          // Calculate center for directional coherence
          const allCenterX = letterRects.reduce((sum, r) => sum + r.left + r.width / 2, 0) / letterRects.length;
          const allCenterY = letterRects.reduce((sum, r) => sum + r.top + r.height / 2, 0) / letterRects.length;

          letterRects.forEach((rect, i) => {
            if (!rect || rect.width === 0) return;
            
            const letterCenterX = rect.left + rect.width / 2;
            const letterCenterY = rect.top + rect.height / 2;
            const color = colors[i % colors.length] || '#FFFFFF';
            
            // Direction: outward from text center, biased upward
            const angleFromCenter = Math.atan2(
              letterCenterY - allCenterY,
              letterCenterX - allCenterX
            );

            for (let j = 0; j < particlesPerLetter; j++) {
              // Spawn across the letter area
              const spawnX = rect.left + Math.random() * rect.width;
              const spawnY = rect.top + Math.random() * rect.height;
              
              // Velocity: mostly upward drift with slight outward spread
              // Apple-style = float up and dissolve, not explode outward
              const spreadAngle = angleFromCenter * 0.3 + (Math.random() - 0.5) * 0.6;
              const upwardBias = -Math.PI / 2; // Point up
              const finalAngle = upwardBias + spreadAngle * 0.4;
              
              // Gentle speed, not explosive
              const speed = 0.8 + Math.random() * 1.2;
              
              particlesRef.current.push({
                id: Date.now() + Math.random(),
                x: spawnX,
                y: spawnY,
                startX: spawnX,
                startY: spawnY,
                // Target is just "far away" in the drift direction
                targetX: spawnX + Math.cos(finalAngle) * 400,
                targetY: spawnY + Math.sin(finalAngle) * 400 - 200, // Extra upward
                controlX: spawnX,
                controlY: spawnY - 100,
                color,
                // Smaller particles = dust/vapor aesthetic
                size: 0.5 + Math.random() * 1.5,
                alpha: 0.9,
                progress: 0,
                // Staggered: letters dissolve left-to-right
                delay: i * 0.02 + Math.random() * 0.03,
                speed: 0.008 + Math.random() * 0.006, // Slower = more elegant
                phase: 'burst',
                burstVx: Math.cos(finalAngle) * speed,
                burstVy: Math.sin(finalAngle) * speed,
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

    // ========================================================================
    // ANIMATION LOOP - Modified to handle vapor-style text explosion
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

        // Check if this is a "text explosion" particle (letterIndex === -1)
        const isTextExplosion = p.letterIndex === -1;

        if (p.phase === 'burst') {
          if (isTextExplosion) {
            // ================================================================
            // VAPOR-STYLE BURST for text explosion
            // ================================================================
            p.x += p.burstVx;
            p.y += p.burstVy;
            
            // Gentle deceleration
            p.burstVx *= 0.985;
            p.burstVy *= 0.985;
            
            // Slight upward float (negative gravity)
            p.burstVy -= 0.02;
            
            // Add subtle horizontal drift (wind)
            p.burstVx += (Math.random() - 0.5) * 0.03;
            
            p.burstProgress += 0.012;
            p.rotation += 0.01; // Slower rotation
            
            // Gradual fade out
            if (p.burstProgress > 0.3) {
              p.alpha *= 0.992;
            }
            
            // Shrink over time
            if (p.burstProgress > 0.5) {
              p.size *= 0.998;
            }
            
            // Remove when faded or too far
            if (p.alpha < 0.02 || p.burstProgress > 1.5) {
              dead.push(idx);
              return;
            }
          } else {
            // ================================================================
            // ORIGINAL BURST for logo explosion (unchanged)
            // ================================================================
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
        // RENDER - Different styles for text vs logo particles
        // ====================================================================
        ctx.save();
        
        if (isTextExplosion) {
          // Soft, blurred vapor particles for text explosion
          const gradient = ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size * 3
          );
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(0.3, `${p.color}aa`);
          gradient.addColorStop(0.6, `${p.color}44`);
          gradient.addColorStop(1, 'transparent');
          
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Original rendering for logo particles
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
        }

        ctx.restore();
      });

      // Remove dead particles
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
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        isMountedRef.current = false;
        window.removeEventListener('resize', handleResize);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }

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