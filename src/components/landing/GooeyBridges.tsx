'use client';

import { motion } from 'framer-motion';
import type { Company } from '@/lib/brandColors';

type Pt = { x: number; y: number };

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function GooeyBridges({
  companies,
  centerRadius,
  blobRadius,
  hovered,
}: {
  companies: readonly { id: Company; color: string; pos: Pt }[];
  centerRadius: number;
  blobRadius: number;
  hovered: Company | null;
}) {
  return (
    <>
      {companies.map((c) => {
        const { x, y } = c.pos;
        const dist = Math.hypot(x, y);
        const angle = toDeg(Math.atan2(y, x));

        const pad = centerRadius + blobRadius * 0.75;
        const len = Math.max(0, dist - pad);

        const active = hovered === c.id;

        return (
          <motion.div
            key={c.id}
            className="metaball-bridge"
            style={{
              left: '50%',
              top: '50%',
              width: len,
              height: 14,
              background: `linear-gradient(90deg, ${c.color}66 0%, ${c.color}22 70%, transparent 100%)`,
              transformOrigin: '0% 50%',
              transform: `translate(0,-50%) rotate(${angle}deg) translateX(${centerRadius}px)`,
              filter: 'blur(2px)',
            }}
            animate={{
              opacity: active ? 0.9 : 0.25,
              scaleY: active ? 1.25 : 0.9,
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          />
        );
      })}
    </>
  );
}
