export interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  color: string;
  size: number;
  alpha: number;
  progress: number;
  delay: number;
  speed: number;
  phase: 'burst' | 'hover' | 'travel' | 'absorb';
  burstVx: number;
  burstVy: number;
  burstProgress: number;
  rotation: number;
  letterIndex: number;
  hasPainted: boolean;
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function quadraticBezier(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}