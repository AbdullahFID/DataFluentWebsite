export const BRAND_COLORS = {
  google: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'],
  apple: ['#A2AAAD', '#86868B', '#F5F5F7'],
  meta: ['#0668E1', '#0081FB', '#0064E0'],
  microsoft: ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'],
  amazon: ['#FF9900', '#232F3E'],
} as const;

export type Company = keyof typeof BRAND_COLORS;

/**
 * Datafluent letters indices:
 * 0 D
 * 1 a
 * 2 t
 * 3 a
 * 4 f
 * 5 l
 * 6 u
 * 7 e
 * 8 n
 * 9 t
 * 10 •
 */
export const LOGO_LETTER_TARGETS: Record<Company, readonly number[]> = {
  google: [0, 1, 2, 3],     // D a t a  (4 colors)
  apple: [4],               // f (silver sheen)
  meta: [5, 6],             // l u (meta blue)
  microsoft: [7, 8],        // e n (multi-color splash)
  amazon: [9, 10],          // t • (amazon orange)
} as const;

/**
 * Premium final gradient (closer to your spec: teal → blue → meta blue → purple → pink).
 */
export const FINAL_GRADIENT =
  'linear-gradient(90deg, #4ECDC4 0%, #4285F4 26%, #0668E1 46%, #8B5CF6 72%, #EC4899 100%)';

// Logo entrance directions
export type LogoDirection = 'bottom-left' | 'top' | 'right' | 'left' | 'bottom-right';

export interface LogoConfig {
  name: Company;
  entranceDirection: LogoDirection;
  colors: readonly string[];
  targets: readonly number[];
}

export const LOGO_CONFIGS: LogoConfig[] = [
  { name: 'google', entranceDirection: 'bottom-left', colors: BRAND_COLORS.google, targets: LOGO_LETTER_TARGETS.google },
  { name: 'apple', entranceDirection: 'top', colors: BRAND_COLORS.apple, targets: LOGO_LETTER_TARGETS.apple },
  { name: 'meta', entranceDirection: 'right', colors: BRAND_COLORS.meta, targets: LOGO_LETTER_TARGETS.meta },
  { name: 'microsoft', entranceDirection: 'left', colors: BRAND_COLORS.microsoft, targets: LOGO_LETTER_TARGETS.microsoft },
  { name: 'amazon', entranceDirection: 'bottom-right', colors: BRAND_COLORS.amazon, targets: LOGO_LETTER_TARGETS.amazon },
];

/**
 * Kept for compatibility (if you still use it elsewhere).
 * Generates an offset zone — not used by the new deterministic parade.
 */
export function generateRandomPosition(): { x: number; y: number } {
  const zones = [
    { xMin: -55, xMax: -35, yMin: -20, yMax: 20 },
    { xMin: 35, xMax: 55, yMin: -20, yMax: 20 },
    { xMin: -25, xMax: 25, yMin: -65, yMax: -45 },
    { xMin: -25, xMax: 25, yMin: 50, yMax: 70 },
    { xMin: -55, xMax: -35, yMin: -55, yMax: -35 },
    { xMin: 35, xMax: 55, yMin: -55, yMax: -35 },
    { xMin: -55, xMax: -35, yMin: 40, yMax: 60 },
    { xMin: 35, xMax: 55, yMin: 40, yMax: 60 },
  ];

  const zone = zones[Math.floor(Math.random() * zones.length)];
  return {
    x: zone.xMin + Math.random() * (zone.xMax - zone.xMin),
    y: zone.yMin + Math.random() * (zone.yMax - zone.yMin),
  };
}
