'use client';

import { useState } from 'react';
import { LoadingAnimation } from '@/components/loader';
import { LandingPage } from '@/components/LandingPage';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <main className="min-h-screen bg-[#050508]">
      {/* Landing page renders underneath */}
      <LandingPage visible={!isLoading} />
      
      {/* Loader on top - disappears when complete */}
      {isLoading && (
        <LoadingAnimation onComplete={() => setIsLoading(false)} />
      )}
    </main>
  );
}