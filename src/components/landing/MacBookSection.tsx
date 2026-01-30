'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled - prevents Next.js hydration errors
const MacBookSectionInner = dynamic(
  () => import('./Macbooksectioninner'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[300vh] bg-[#050508]">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-100 h-65 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }
);

interface MacBookSectionProps {
  videoSrc?: string;
  imageSrc?: string;
  scale?: number;
  className?: string;
  children?: React.ReactNode;
}

export function MacBookSection(props: MacBookSectionProps) {
  return <MacBookSectionInner {...props} />;
}

export default MacBookSection;