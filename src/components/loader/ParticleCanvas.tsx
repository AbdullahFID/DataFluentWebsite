'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Particle, easeOutQuart, quadraticBezier } from '@/lib/particlePhysics';
import { BRAND_COLORS, LOGO_LETTER_TARGETS } from '@/lib/brandColors';

export interface ParticleCanvasHandle {
  explodeLogo: (company: string, sourceRect: DOMRect, letterRects: DOMRect[]) => void;
  explodeText: (letterRects: DOMRect[], colors: string[]) => void;
  clearParticles: () => void;
}

interface Props {
  onLetterPainted: (index: number, color: string) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const ParticleCanvas = forwardRef<ParticleCanvasHandle, Props>(function ParticleCanvas(
  { onLetterPainted },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const paintedLettersRef = useRef<Set<number>>(new Set());

  useImperativeHandle(ref, () => ({
    explodeLogo: (company, sourceRect, letterRects) => {
      const palette = [...(BRAND_COLORS[company as keyof typeof BRAND_COLORS] || ['#FFFFFF'])];
      const targets = LOGO_LETTER_TARGETS[company as keyof typeof LOGO_LETTER_TARGETS] || [];
      if (!targets.length) return;

      const isMobile = window.innerWidth < 768;
      const particlesPerLetter = isMobile ? 26 : 44;

      // Spawn spread inside the actual transformed logo bounds (Telegram-ish)
      const spreadW = clamp(sourceRect.width, 60, 320);
      const spreadH = clamp(sourceRect.height, 40, 220);

      targets.forEach((letterIdx, targetIndex) => {
        const rect = letterRects[letterIdx];
        if (!rect) return;

        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        // Primary “paint” color per target (stable)
        const primaryColor = palette[targetIndex % palette.length];

        for (let j = 0; j < particlesPerLetter; j++) {
          const isPainter = j === 0; // only 1 particle per letter can paint (deterministic color)

          const originX = sourceRect.left + (Math.random() * spreadW);
          const originY = sourceRect.top + (Math.random() * spreadH);

          const angle = Math.random() * Math.PI * 2;
          const burstForce = 6 + Math.random() * 10;
          const burstVx = Math.cos(angle) * burstForce;
          const burstVy = Math.sin(angle) * burstForce - 3.5;

          const ctrlX = (originX + targetX) / 2 + (Math.random() - 0.5) * 220;
          const ctrlY = Math.min(originY, targetY) - 90 - Math.random() * 95;

          const color = isPainter ? primaryColor : palette[Math.floor(Math.random() * palette.length)];

          particlesRef.current.push({
            id: Date.now() + Math.random(),
            x: originX,
            y: originY,
            startX: originX,
            startY: originY,
            targetX: targetX + (Math.random() - 0.5) * 22,
            targetY: targetY + (Math.random() - 0.5) * 22,
            controlX: ctrlX,
            controlY: ctrlY,
            color,
            size: 2 + Math.random() * 3.5,
            alpha: 1,
            progress: 0,
            delay: isPainter ? 0 : Math.random() * 0.05,
            speed: isPainter ? 0.024 : 0.016 + Math.random() * 0.014,
            phase: 'burst',
            burstVx,
            burstVy,
            burstProgress: 0,
            rotation: Math.random() * Math.PI * 2,
            letterIndex: letterIdx,
            hasPainted: !isPainter, // painters start false, accents start true (never paint)
          });
        }
      });
    },

    explodeText: (letterRects, colors) => {
      const isMobile = window.innerWidth < 768;
      const particlesPerLetter = isMobile ? 34 : 60;

      letterRects.forEach((rect, i) => {
        if (!rect || rect.width === 0) return;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const color = colors[i % colors.length] || '#FFFFFF';

        for (let j = 0; j < particlesPerLetter; j++) {
          const angle = Math.random() * Math.PI * 2;
          const burstForce = 9 + Math.random() * 15;

          particlesRef.current.push({
            id: Date.now() + Math.random(),
            x: centerX + (Math.random() - 0.5) * rect.width,
            y: centerY + (Math.random() - 0.5) * rect.height,
            startX: centerX,
            startY: centerY,
            targetX: centerX + Math.cos(angle) * (isMobile ? 360 : 520),
            targetY: centerY + Math.sin(angle) * (isMobile ? 360 : 520),
            controlX: centerX,
            controlY: centerY,
            color,
            size: 2 + Math.random() * 4,
            alpha: 1,
            progress: 0,
            delay: i * 0.02 + Math.random() * 0.05,
            speed: 0.015 + Math.random() * 0.01,
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

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const animate = () => {
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
          p.burstVx *= 0.92;
          p.burstVy *= 0.92;
          p.burstVy += 0.2;
          p.burstProgress += 0.028;
          p.rotation += 0.1;

          if (p.burstProgress >= 0.28) {
            p.phase = 'hover';
            p.progress = 0;
          }
        } else if (p.phase === 'hover') {
          p.progress += 0.05;
          p.rotation += 0.02;
          if (p.progress >= 0.14) {
            p.phase = 'travel';
            p.startX = p.x;
            p.startY = p.y;
            p.progress = 0;
          }
        } else if (p.phase === 'travel') {
          p.progress += p.speed;
          p.rotation += 0.03;

          const t = easeOutQuart(Math.min(p.progress, 1));
          const pos = quadraticBezier(
            t,
            { x: p.startX, y: p.startY },
            { x: p.controlX, y: p.controlY },
            { x: p.targetX, y: p.targetY }
          );
          p.x = pos.x;
          p.y = pos.y;

          if (p.progress >= 0.86 && !p.hasPainted && p.letterIndex >= 0) {
            if (!paintedLettersRef.current.has(p.letterIndex)) {
              paintedLettersRef.current.add(p.letterIndex);
              onLetterPainted(p.letterIndex, p.color);
            }
            p.hasPainted = true;
          }

          if (p.progress >= 1) {
            p.phase = 'absorb';
          }
        } else if (p.phase === 'absorb') {
          p.alpha -= 0.07;
          p.size *= 0.94;
          if (p.alpha <= 0) {
            dead.push(idx);
            return;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // glow
        ctx.globalAlpha = p.alpha * 0.55;
        const glowSize = p.size * 4;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // particle
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

        ctx.restore();
      });

      for (let i = dead.length - 1; i >= 0; i--) {
        particlesRef.current.splice(dead[i], 1);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [onLetterPainted]);

  // Cleanup on unmount (lint-safe)
  useEffect(() => {
    const paintedLetters = paintedLettersRef.current;
    return () => {
      particlesRef.current = [];
      paintedLetters.clear();
      const raf = animationRef.current;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 40 }} />;
});
