'use client';

import { motion } from 'framer-motion';
import { ScrollHero } from './landing';

interface LandingPageProps {
  visible: boolean;
}

export function LandingPage({ visible }: LandingPageProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <ScrollHero />
      
      {/* Next section after scroll animation completes */}
      <section className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Elite AI Talent
          </h2>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto">
            World-class engineers from the companies that shaped the future, now working for you.
          </p>
        </div>
      </section>
    </motion.div>
  );
}

export default LandingPage;