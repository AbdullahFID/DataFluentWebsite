'use client';

import { useState } from 'react';
import { LoadingAnimation } from '@/components/loader';
import { LandingPage } from '@/components/LandingPage';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {/* Landing page underneath */}
      <LandingPage visible={!isLoading} />
      
      {/* Loader on top */}
      {isLoading && (
        <LoadingAnimation onComplete={() => setIsLoading(false)} />
      )}
    </>
  );
}