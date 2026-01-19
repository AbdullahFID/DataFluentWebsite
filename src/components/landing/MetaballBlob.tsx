'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Company } from '@/lib/brandColors';

export function MetaballBlob({
  id,
  name,
  color,
  pos,
  size,
  hovered,
  onHover,
  onLeave,
  children,
}: {
  id: Company;
  name: string;
  color: string;
  pos: { x: number; y: number };
  size: number;
  hovered: Company | null;
  onHover: (c: Company) => void;
  onLeave: () => void;
  children: React.ReactNode;
}) {
  const active = hovered === id;

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        x: pos.x,
        y: pos.y,
      }}
      initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
      animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, mass: 0.9 }}
    >
      <motion.button
        type="button"
        onPointerEnter={() => onHover(id)}
        onPointerLeave={onLeave}
        onFocus={() => onHover(id)}
        onBlur={onLeave}
        className="glass-blob group"
        style={{
          width: size,
          height: size,
          borderColor: active ? `${color}66` : 'rgba(255,255,255,0.14)',
        }}
        animate={{
          scale: active ? 1.14 : 1,
          boxShadow: active
            ? `0 22px 70px rgba(0,0,0,0.55), 0 0 44px ${color}55`
            : '0 18px 55px rgba(0,0,0,0.45)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        {/* halo */}
        <motion.div
          className="pointer-events-none absolute inset-[-40%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}33 0%, ${color}14 40%, transparent 70%)`,
            filter: 'blur(26px)',
          }}
          animate={{ opacity: active ? 1 : 0.45, scale: active ? 1.08 : 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />

        {/* logo */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          {children}
        </div>
      </motion.button>

      {/* label (crisp) */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2 whitespace-nowrap"
          >
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${color}44`,
                boxShadow: `0 0 18px ${color}33`,
                color: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(14px) saturate(180%)',
                WebkitBackdropFilter: 'blur(14px) saturate(180%)',
              }}
            >
              {name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
