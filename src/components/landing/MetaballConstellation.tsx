'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LOGO_COMPONENTS } from '@/components/loader/FaangLogos';
import { BRAND_COLORS, type Company } from '@/lib/brandColors';
import { DatafluentText } from './DatafluentText';
import { GooeyFilter, useGooeyFilterId } from './GooeyFilter';
import { GooeyBridges } from './GooeyBridges';
import { MetaballBlob } from './MetaballBlob';
import { floatKeyframes, seededUnit } from './useMetaballPhysics';

type Size = { w: number; h: number };

function useSize(ref: React.RefObject<HTMLElement>): Size {
  const [s, setS] = useState<Size>({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setS({ w: r.width, h: r.height });
    });

    ro.observe(el);
    const r0 = el.getBoundingClientRect();
    setS({ w: r0.width, h: r0.height });

    return () => ro.disconnect();
  }, [ref]);

  return s;
}

const ORDER: readonly Company[] = ['google', 'apple', 'meta', 'microsoft', 'amazon'] as const;

const NAMES: Record<Company, string> = {
  google: 'Google',
  apple: 'Apple',
  meta: 'Meta',
  microsoft: 'Microsoft',
  amazon: 'Amazon',
};

export function MetaballConstellation({ className = '' }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(wrapRef);

  const hoveredRef = useRef<Company | null>(null);
  const [hovered, setHovered] = useState<Company | null>(null);

  const [easterEgg, setEasterEgg] = useState(false);
  const visitedRef = useRef<Record<Company, number>>({
    google: 0,
    apple: 0,
    meta: 0,
    microsoft: 0,
    amazon: 0,
  });

  const gooeyId = useGooeyFilterId('gooey');

  const minDim = Math.max(320, Math.min(w || 800, h || 520));
  const radius = Math.round(minDim * 0.24);
  const blobSize = Math.round(minDim * 0.19);
  const centerRadius = Math.round(minDim * 0.13);

  const positions = useMemo(() => {
    // orbital positions (responsive scaling)
    return {
      google: { x: -radius, y: 0 },
      apple: { x: 0, y: -Math.round(radius * 0.72) },
      meta: { x: radius, y: 0 },
      microsoft: { x: -Math.round(radius * 0.62), y: Math.round(radius * 0.70) },
      amazon: { x: Math.round(radius * 0.62), y: Math.round(radius * 0.70) },
    } as Record<Company, { x: number; y: number }>;
  }, [radius]);

  const companies = useMemo(() => {
    return ORDER.map((id) => {
      const seed = seededUnit(id);
      const float = floatKeyframes(seed, Math.max(8, Math.round(minDim * 0.015)));
      const color = BRAND_COLORS[id][0];

      return {
        id,
        name: NAMES[id],
        color,
        pos: positions[id],
        float,
        floatDelay: seed * 0.6,
        Logo: LOGO_COMPONENTS[id],
      };
    });
  }, [positions, minDim]);

  function onHover(c: Company) {
    hoveredRef.current = c;
    setHovered(c);

    const now = performance.now();
    visitedRef.current[c] = now;

    const ok = ORDER.every((k) => now - visitedRef.current[k] < 3000);
    if (ok) {
      setEasterEgg(true);
      window.setTimeout(() => setEasterEgg(false), 1600);
    }
  }

  function onLeave() {
    hoveredRef.current = null;
    setHovered(null);
  }

  const activeColor = hovered ? BRAND_COLORS[hovered][0] : null;

  return (
    <div
      ref={wrapRef}
      className={`relative mx-auto w-full max-w-5xl ${className}`}
      style={{ height: Math.max(340, Math.round(minDim * 0.55)) }}
    >
      <GooeyFilter id={gooeyId} />

      {/* gooey layer (halo + bridges) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ filter: `url(#${gooeyId})` }}
      >
        {/* center mass */}
        <motion.div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: centerRadius * 2,
            height: centerRadius * 2,
            background: activeColor
              ? `radial-gradient(circle, ${activeColor}33 0%, rgba(255,255,255,0.06) 55%, transparent 72%)`
              : 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 55%, transparent 72%)',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(2px)',
          }}
          animate={{
            scale: hovered ? 1.08 : [1, 1.04, 1],
            opacity: hovered ? 1 : 0.8,
          }}
          transition={{
            duration: hovered ? 0.22 : 3.2,
            ease: 'easeInOut',
            repeat: hovered ? 0 : Infinity,
          }}
        />

        <GooeyBridges
          companies={companies.map((c) => ({ id: c.id, color: c.color, pos: c.pos }))}
          centerRadius={centerRadius}
          blobRadius={blobSize / 2}
          hovered={hovered}
        />

        {/* satellite masses */}
        {companies.map((c) => {
          const active = hovered === c.id;
          return (
            <motion.div
              key={`mass-${c.id}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: blobSize,
                height: blobSize,
                background: `radial-gradient(circle, ${c.color}3a 0%, ${c.color}14 55%, transparent 75%)`,
              }}
              initial={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
              animate={{
                x: c.pos.x,
                y: c.pos.y,
                opacity: 1,
                scale: active ? 1.15 : 1,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            />
          );
        })}
      </div>

      {/* content layer (crisp glass + text + logos) */}
      <div className="absolute inset-0">
        {/* center nucleus text */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <DatafluentText hovered={hovered} companyColor={activeColor} rainbow={easterEgg} />
          <AnimatePresence>
            {easterEgg && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="mt-3 text-center text-sm text-white/60"
              >
                Now working for you
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* satellites */}
        {companies.map((c) => {
          const active = hovered === c.id;
          const Logo = c.Logo;

          return (
            <motion.div
              key={`sat-${c.id}`}
              className="absolute left-1/2 top-1/2"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, x: c.pos.x, y: c.pos.y }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            >
              <MetaballBlob
                id={c.id}
                name={c.name}
                color={c.color}
                pos={{ x: 0, y: 0 }}
                size={blobSize}
                hovered={hovered}
                onHover={onHover}
                onLeave={onLeave}
              >
                <motion.div
                  animate={{
                    x: c.float.x,
                    y: c.float.y,
                  }}
                  transition={{
                    duration: 6.2 + c.floatDelay * 2,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    delay: c.floatDelay,
                  }}
                  className="flex h-full w-full items-center justify-center"
                >
                  <Logo
                    size={Math.round(blobSize * 0.62)}
                    className="h-auto w-[70%] opacity-90"
                  />
                </motion.div>

                {/* thin shimmer line toward center (crisp, optional) */}
                <motion.div
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10"
                  style={{
                    width: Math.max(0, Math.hypot(c.pos.x, c.pos.y) - (centerRadius + blobSize * 0.6)),
                    height: 2,
                    transformOrigin: '0% 50%',
                    transform: `translate(0,-50%) rotate(${(Math.atan2(-c.pos.y, -c.pos.x) * 180) / Math.PI}deg) translateX(${blobSize * 0.35}px)`,
                    background: `linear-gradient(90deg, transparent 0%, ${c.color}66 45%, transparent 100%)`,
                    filter: 'blur(0.2px)',
                  }}
                  animate={{
                    opacity: active ? 0.85 : 0.18,
                    backgroundPositionX: active ? ['0%', '100%'] : '0%',
                  }}
                  transition={{
                    opacity: { duration: 0.2, ease: 'easeOut' },
                    backgroundPositionX: { duration: 0.8, ease: 'linear', repeat: active ? Infinity : 0 },
                  }}
                />
              </MetaballBlob>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
