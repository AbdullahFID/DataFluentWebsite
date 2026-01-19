'use client';

export function seededUnit(name: string) {
  // deterministic 0..1 from a string (no SSR mismatch since this file is only used in client components)
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function floatKeyframes(seed: number, amp = 10) {
  const a = (seed * 2 - 1) * amp;
  const b = ((seed * 997) % 1 * 2 - 1) * (amp * 0.8);
  const c = ((seed * 571) % 1 * 2 - 1) * (amp * 0.6);

  return {
    x: [0, a, b, c, 0],
    y: [0, -b, a * 0.6, -c, 0],
  };
}
