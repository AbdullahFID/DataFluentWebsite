'use client';
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';

// ─────────────────────────────────────────────────────────────
// Utility: Throttle high-frequency events
// ─────────────────────────────────────────────────────────────
const throttle = <T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  _inertiaApplied: boolean;
}

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

// ─────────────────────────────────────────────────────────────
// Hex → RGB conversion
// ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 4,
  gap = 20,
  baseColor = '#3a3a3c',
  activeColor = '#0a84ff',
  proximity = 100,
  speedTrigger = 100,
  shockRadius = 200,
  shockStrength = 4,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.2,
  className = '',
  style,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  // ─────────────────────────────────────────────────────────
  // Build grid on mount / resize
  // ─────────────────────────────────────────────────────────
  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          _inertiaApplied: false,
        });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  // ─────────────────────────────────────────────────────────
  // Render loop
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!circlePath) return;

    let rafId: number;
    const proxSq = proximity * proximity;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let fillStyle = baseColor;
        if (dsq <= proxSq) {
          const t = 1 - Math.sqrt(dsq) / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          fillStyle = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = fillStyle;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [proximity, baseColor, activeRgb, baseRgb, circlePath]);

  // ─────────────────────────────────────────────────────────
// Resize observer
// ─────────────────────────────────────────────────────────
useEffect(() => {
  buildGrid();

  const wrapper = wrapperRef.current;
  if (!wrapper) return;

  // Avoid 'in' operator—TS narrows window to 'never' in else branch
  const hasResizeObserver = typeof ResizeObserver !== 'undefined';

  if (hasResizeObserver) {
    const ro = new ResizeObserver(buildGrid);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }

  // Fallback for older browsers
  window.addEventListener('resize', buildGrid);
  return () => window.removeEventListener('resize', buildGrid);
}, [buildGrid]);

  // ─────────────────────────────────────────────────────────
  // Simulate inertia with standard gsap (no InertiaPlugin)
  // ─────────────────────────────────────────────────────────
  const applyPush = useCallback(
    (dot: Dot, pushX: number, pushY: number) => {
      dot._inertiaApplied = true;
      gsap.killTweensOf(dot);

      // Decay factor from resistance (higher = faster stop)
      const decay = 1 / (1 + resistance / 1000);
      const targetX = pushX * decay;
      const targetY = pushY * decay;

      // Phase 1: push out
      gsap.to(dot, {
        xOffset: targetX,
        yOffset: targetY,
        duration: 0.15,
        ease: 'power2.out',
        onComplete: () => {
          // Phase 2: return with elastic
          gsap.to(dot, {
            xOffset: 0,
            yOffset: 0,
            duration: returnDuration,
            ease: 'elastic.out(1, 0.75)',
            onComplete: () => {
              dot._inertiaApplied = false;
            },
          });
        },
      });
    },
    [resistance, returnDuration]
  );

  // ─────────────────────────────────────────────────────────
  // Mouse interaction: hover push + click shockwave
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const pr = pointerRef.current;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;

      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);

      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }

      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
          const pushX = (dot.cx - pr.x) + vx * 0.02;
          const pushY = (dot.cy - pr.y) + vy * 0.02;
          applyPush(dot, pushX, pushY);
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius && !dot._inertiaApplied) {
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - cx) * shockStrength * falloff;
          const pushY = (dot.cy - cy) * shockStrength * falloff;
          applyPush(dot, pushX, pushY);
        }
      }
    };

    const throttledMove = throttle(onMove, 50);
    window.addEventListener('mousemove', throttledMove, { passive: true });
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('mousemove', throttledMove);
      window.removeEventListener('click', onClick);
    };
  }, [maxSpeed, speedTrigger, proximity, shockRadius, shockStrength, applyPush]);

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default DotGrid;