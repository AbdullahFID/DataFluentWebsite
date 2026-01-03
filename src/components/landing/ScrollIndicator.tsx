'use client';

import { motion } from 'framer-motion';

interface ScrollIndicatorProps {
  className?: string;
}

export function ScrollIndicator({ className = '' }: ScrollIndicatorProps) {
  return (
    <motion.div
      className={`flex flex-col items-center gap-2 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      {/* Mouse outline */}
      <div className="relative w-6 h-10 rounded-full border-2 border-white/30 flex justify-center">
        {/* Scroll wheel dot */}
        <motion.div
          className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2"
          animate={{
            y: [0, 12, 0],
            opacity: [1, 0.3, 1],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Text */}
      <motion.span
        className="text-xs text-white/40 tracking-widest uppercase"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Scroll
      </motion.span>
    </motion.div>
  );
}

export default ScrollIndicator;