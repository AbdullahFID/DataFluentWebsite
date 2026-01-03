'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { LOGO_CONFIGS } from '@/lib/brandColors';

type Point = { x: number; y: number };
type ParticlePhase = 'explode' | 'travel' | 'absorb';

interface ParticleSystemParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  phase: ParticlePhase;
  start?: Point;
  control?: Point;
  target?: Point;
}

interface ParticleSystemProps {
  onColorAbsorbed: (letter: string, color: string) => void;
  className?: string;
  autoSpawn?: boolean;
}

const LETTER_KEYS = ['D', 'a', 't', 'a2', 'f', 'l', 'u', 'e', 'n', 't2', '·'];

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function quadraticBezier(t: number, p0: Point, p1: Point, p2: Point): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function ParticleSystem({
  onColorAbsorbed,
  className,
  autoSpawn = false,
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<ParticleSystemParticle[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const absorbedGateRef = useRef<Set<string>>(new Set());

  const palette = useMemo(() => {
    const colors: string[] = [];
    for (const cfg of LOGO_CONFIGS) colors.push(...cfg.colors);
    return colors.length ? colors : ['#FFFFFF'];
  }, []);

  const spawn = useCallback((now: number, w: number, h: number) => {
    const cx = w * 0.5 + rand(-60, 60);
    const cy = h * 0.5 + rand(-40, 40);

    const letterKey = LETTER_KEYS[Math.floor(Math.random() * LETTER_KEYS.length)];
    const color = palette[Math.floor(Math.random() * palette.length)];

    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const force = rand(2.5, 6.5);

      const start: Point = { x: cx, y: cy };
      const target: Point = {
        x: clamp(cx + Math.cos(angle) * rand(120, 260), 0, w),
        y: clamp(cy + Math.sin(angle) * rand(120, 260), 0, h),
      };
      const control: Point = {
        x: (start.x + target.x) / 2 + rand(-120, 120),
        y: Math.min(start.y, target.y) - rand(40, 140),
      };

      particlesRef.current.push({
        id: now + Math.random(),
        x: start.x,
        y: start.y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - rand(0.5, 2.0),
        color,
        size: rand(1.8, 3.2),
        alpha: 1,
        life: 0,
        phase: 'explode',
        start,
        control,
        target,
      });
    }

    const gateKey = `${letterKey}::${color}`;
    if (!absorbedGateRef.current.has(gateKey)) {
      absorbedGateRef.current.add(gateKey);
      window.setTimeout(() => onColorAbsorbed(letterKey, color), 180);
    }
  }, [onColorAbsorbed, palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      if (autoSpawn && now - lastSpawnRef.current > 1500) {
        lastSpawnRef.current = now;
        spawn(now, w, h);
      }

      const dead: number[] = [];

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        if (p.phase === 'explode') {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.92;
          p.vy = p.vy * 0.92 + 0.18;
          p.life += 0.035;

          if (p.life >= 0.22) {
            p.phase = 'travel';
            p.life = 0;
            p.start = { x: p.x, y: p.y };
          }
        } else if (p.phase === 'travel') {
          p.life += 0.016 + Math.random() * 0.006;
          const t = easeInOutCubic(Math.min(p.life, 1));

          const start = p.start ?? { x: p.x, y: p.y };
          const control = p.control ?? start;
          const target = p.target ?? start;

          const pos = quadraticBezier(t, start, control, target);
          p.x = pos.x;
          p.y = pos.y;

          if (p.life >= 1) {
            p.phase = 'absorb';
            p.life = 0;
          }
        } else {
          p.life += 0.07;
          p.alpha -= 0.08;
          p.size *= 0.94;
          if (p.alpha <= 0 || p.size <= 0.25) {
            dead.push(i);
            continue;
          }
        }

        ctx.save();
        ctx.globalAlpha = clamp(p.alpha, 0, 1);

        const glow = p.size * 4.2;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);

        ctx.restore();
      }

      for (let j = dead.length - 1; j >= 0; j--) {
        particlesRef.current.splice(dead[j], 1);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(tick);

    // Capture ref values for cleanup (ESLint fix)
    const currentAbsorbedGate = absorbedGateRef.current;

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      particlesRef.current = [];
      currentAbsorbedGate.clear();
    };
  }, [autoSpawn, spawn]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'fixed inset-0 pointer-events-none'}
      style={{ zIndex: 40 }}
    />
  );
}

export default ParticleSystem;