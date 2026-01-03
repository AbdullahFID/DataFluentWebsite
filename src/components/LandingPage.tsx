'use client';

import { motion } from 'framer-motion';

interface LandingPageProps {
  visible: boolean;
}

export function LandingPage({ visible }: LandingPageProps) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-[#0a0a0f] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      {/* Neural mesh background - subtle */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(78, 205, 196, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(66, 133, 244, 0.05) 0%, transparent 60%)
          `,
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 30 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo mark */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6"
          style={{
            background: 'linear-gradient(90deg, #4ECDC4 0%, #4285F4 25%, #0668E1 50%, #8B5CF6 75%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Datafluent<span className="text-3xl md:text-4xl align-top">•</span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-white/60 font-light mb-12 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Elite talent from the world&apos;s leading tech companies,
          <br className="hidden md:block" />
          now working for you.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all hover:scale-105">
            Get Started
          </button>
          <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all hover:scale-105">
            Learn More
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,15,1) 0%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}

export default LandingPage;