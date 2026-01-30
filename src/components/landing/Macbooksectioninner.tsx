'use client';

import React, { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { VolumeX } from 'lucide-react';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════
// MACBOOK SECTION WITH ALCOVE-STYLE TEXT + SCROLL LOCKING
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Video preloading singleton
// ─────────────────────────────────────────────────────────────────────────────
let preloadedVideo: HTMLVideoElement | null = null;

function preloadVideo(src: string): HTMLVideoElement {
  if (preloadedVideo) return preloadedVideo;

  const video = document.createElement('video');
  video.src = src;
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.load();
  preloadedVideo = video;

  return video;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────
type Phase = 'locked' | 'opening' | 'open' | 'closing' | 'done';

const MAX_LID_ANGLE = 0.92;
const VIDEO_PLAY_THRESHOLD = 0.32;
const OPEN_SCROLL_DISTANCE = 450;
const CLOSE_SCROLL_DISTANCE = 220;
const DEAD_ZONE = 110;
const OPEN_HOLD_MS = 340;
const BREATHING_ROOM = 520;
const ENTER_TRIGGER_TOP = 0.3;
const IN_VIEW_TOP = 0.55;
const RELEASE_CHUNK_PX = 140;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

// ─────────────────────────────────────────────────────────────────────────────
// Alcove-Style Hero Text
// ─────────────────────────────────────────────────────────────────────────────
interface HeroTextProps {
  line1: string;
  line2: string;
  phase: Phase;
  openProgress: number;
  lidAngle: number;
}

function HeroText({ line1, lidAngle }: HeroTextProps) {
  const opacity = Math.max(0, 1 - lidAngle * 2.5);
  const translateY = -lidAngle * 50;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center pointer-events-none"
      style={{
        justifyContent: 'center',
        paddingTop: '4vh',
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.08s ease-out, transform 0.08s ease-out',
      }}
    >
      <h2
        className="text-[6.5vw] font-black tracking-[-0.03em] whitespace-nowrap select-none leading-[1.1]"
        style={{
          background: `linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.14) 30%,
            rgba(255, 255, 255, 0.08) 60%,
            rgba(255, 255, 255, 0.02) 85%,
            rgba(255, 255, 255, 0.00) 100%
          )`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {line1}
      </h2>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambient Background Glow
// ─────────────────────────────────────────────────────────────────────────────
interface AmbientBackgroundProps {
  intensity: number;
}

function AmbientBackground({ intensity }: AmbientBackgroundProps) {
  const baseOpacity = 0.03;
  const dynamicOpacity = baseOpacity + intensity * 0.08;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '80vw',
          height: '70vh',
          background: `radial-gradient(ellipse 60% 50% at center,
            rgba(255, 255, 255, ${dynamicOpacity * 1.5}) 0%,
            rgba(255, 255, 255, ${dynamicOpacity}) 25%,
            rgba(255, 255, 255, ${dynamicOpacity * 0.5}) 45%,
            rgba(255, 255, 255, ${dynamicOpacity * 0.2}) 65%,
            transparent 85%
          )`,
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute left-1/2 top-[65%] -translate-x-1/2"
        style={{
          width: '100vw',
          height: '20vh',
          background: `radial-gradient(ellipse 80% 100% at center top,
            rgba(255, 255, 255, ${dynamicOpacity * 0.8}) 0%,
            rgba(255, 255, 255, ${dynamicOpacity * 0.3}) 40%,
            transparent 70%
          )`,
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Under-Mac White Circular Light
// ─────────────────────────────────────────────────────────────────────────────
interface UnderMacLightProps {
  intensity: number;
}

function UnderMacLight({ intensity }: UnderMacLightProps) {
  const opacity = Math.max(0, Math.min(1, intensity)) * 0.55;
  const scale = 0.85 + intensity * 0.25;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${58 * scale}vw`,
          height: `${18 * scale}vh`,
          opacity,
          background: `radial-gradient(ellipse 60% 80% at center,
            rgba(255,255,255,0.22) 0%,
            rgba(255,255,255,0.12) 28%,
            rgba(255,255,255,0.06) 48%,
            rgba(255,255,255,0.03) 62%,
            transparent 76%
          )`,
          filter: `blur(${55 + intensity * 35}px)`,
        }}
      />
      <div
        className="absolute left-1/2 top-[79%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${26 * scale}vw`,
          height: `${7 * scale}vh`,
          opacity: opacity * 0.9,
          background: `radial-gradient(ellipse at center,
            rgba(255,255,255,0.28) 0%,
            rgba(255,255,255,0.10) 40%,
            transparent 72%
          )`,
          filter: `blur(${28 + intensity * 18}px)`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Light Beam on Ground
// ─────────────────────────────────────────────────────────────────────────────
interface LightBeamProps {
  intensity: number;
  color?: string;
}

function LightBeam({ intensity, color = '#6366f1' }: LightBeamProps) {
  const opacity = Math.max(0, intensity * 0.6);
  const scale = 0.7 + intensity * 0.5;

  return (
    <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ opacity }}>
      <div
        style={{
          width: `${50 * scale}vw`,
          height: `${15 * scale}vh`,
          background: `radial-gradient(ellipse 70% 100% at center,
            ${color}20 0%,
            ${color}10 30%,
            ${color}05 50%,
            transparent 70%
          )`,
          filter: `blur(${30 + intensity * 20}px)`,
          transform: `translateX(-50%) scaleY(${0.5 + intensity * 0.3})`,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${25 * scale}vw`,
          height: `${8 * scale}vh`,
          background: `radial-gradient(ellipse at center,
            ${color}25 0%,
            ${color}10 40%,
            transparent 70%
          )`,
          filter: `blur(${20 + intensity * 15}px)`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen Glow
// ─────────────────────────────────────────────────────────────────────────────
interface ScreenGlowProps {
  intensity: number;
  color?: string;
}

function ScreenGlow({ intensity, color = '#4a9eff' }: ScreenGlowProps) {
  const opacity = Math.max(0, (intensity - 0.2) * 1.25);
  const scale = 0.8 + intensity * 0.3;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity }}>
      <div
        className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${40 * scale}vw`,
          height: `${30 * scale}vh`,
          background: `radial-gradient(ellipse at center,
            ${color}12 0%,
            ${color}06 40%,
            transparent 70%
          )`,
          filter: `blur(${45 + intensity * 35}px)`,
        }}
      />
      <div
        className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${65 * scale}vw`,
          height: `${50 * scale}vh`,
          background: `radial-gradient(ellipse at center,
            ${color}06 0%,
            ${color}02 50%,
            transparent 75%
          )`,
          filter: `blur(${70 + intensity * 40}px)`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Three.js MacBook Model
// ─────────────────────────────────────────────────────────────────────────────
interface MacModelProps {
  videoSrc?: string;
  imageSrc?: string;
  scale?: number;
  lidAngle: number;
  shouldPlay: boolean;
  onVideoRef?: (video: HTMLVideoElement | null) => void;
}

function MacModel({ videoSrc, imageSrc, scale = 1, lidAngle, shouldPlay, onVideoRef }: MacModelProps) {
  const gltf = useGLTF('/mac.glb');
  const screenRef = useRef<THREE.Object3D | null>(null);
  const matteRef = useRef<THREE.Mesh | null>(null);
  const targetRotation = useRef(Math.PI);
  const groupRef = useRef<THREE.Group>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    if (!gltf.scene) return;

    gltf.scene.traverse((child) => {
      const name = child.name.toLowerCase();

      if (name === 'screen' || name.includes('screen') || name.includes('lid')) {
        screenRef.current = child;
      }

      if ((child as THREE.Mesh).isMesh) {
        if (name === 'matte' || name.includes('matte')) {
          matteRef.current = child as THREE.Mesh;
        }
      }
    });

    if (screenRef.current) {
      screenRef.current.rotation.x = THREE.MathUtils.degToRad(180);
    }
  }, [gltf.scene]);

  useEffect(() => {
    if (!videoSrc || !matteRef.current) return;

    const video = preloadedVideo ?? preloadVideo(videoSrc);
    videoRef.current = video;
    onVideoRef?.(video);

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    videoTextureRef.current = texture;

    const mat = matteRef.current.material as THREE.MeshStandardMaterial;
    mat.map = texture;
    mat.metalness = 0;
    mat.roughness = 1;
    mat.emissive = new THREE.Color(0x000000);
    mat.emissiveIntensity = 0;
    mat.envMapIntensity = 0;
    mat.needsUpdate = true;

    return () => {
      texture.dispose();
    };
  }, [videoSrc, gltf.scene, onVideoRef]);

  useEffect(() => {
    if (videoSrc || !imageSrc || !matteRef.current) return;

    const mat = matteRef.current.material as THREE.MeshStandardMaterial;
    mat.metalness = 0;
    mat.roughness = 1;
    mat.envMapIntensity = 0;

    new THREE.TextureLoader().load(imageSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex;
      mat.needsUpdate = true;
    });
  }, [imageSrc, videoSrc, gltf.scene]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPlay) {
      video.play().catch(() => { /* Autoplay blocked */ });
    } else {
      video.pause();
    }
  }, [shouldPlay]);

  useEffect(() => {
    targetRotation.current = THREE.MathUtils.degToRad(180 - lidAngle * 100);
  }, [lidAngle]);

  useFrame(() => {
    if (screenRef.current) {
      screenRef.current.rotation.x += (targetRotation.current - screenRef.current.rotation.x) * 0.1;
    }
    if (videoTextureRef.current) {
      videoTextureRef.current.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, -5.5, 20]} scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading indicator
// ─────────────────────────────────────────────────────────────────────────────
function LoadingIndicator() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#222" wireframe />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  videoSrc?: string;
  imageSrc?: string;
  scale?: number;
  className?: string;
  children?: React.ReactNode;
  glowColor?: string;
  heroLine1?: string;
  heroLine2?: string;
}

export default function MacBookSectionInner({
  videoSrc,
  imageSrc,
  scale = 1.5,
  className = '',
  children,
  glowColor = '#6366f1',
  heroLine1 = 'Talent Beyond Comparison.',
  heroLine2 = '',
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>('locked');
  const phaseRef = useRef<Phase>('locked');
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const [openProgress, setOpenProgress] = useState(0);
  const [lidAngle, setLidAngle] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const acc = useRef(0);
  const openHoldUntilRef = useRef<number>(0);

  const [holdActive, setHoldActive] = useState(false);
  const holdTimerRef = useRef<number | null>(null);

  const overflowDownRef = useRef(0);
  const doneLatchRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // FIX: Ref pattern for recursive function (avoids ESLint immutability error)
  // ─────────────────────────────────────────────────────────────────────────
  const releaseOverflowFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (videoSrc) preloadVideo(videoSrc);
  }, [videoSrc]);

  // Audio: click/tap to unmute
  useEffect(() => {
    const handleClick = () => {
      if (!audioEnabled && videoElementRef.current) {
        videoElementRef.current.muted = false;
        setAudioEnabled(true);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleClick);
    };
  }, [audioEnabled]);

  // Hold helpers
  const clearHold = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldActive(false);
  }, []);

  const beginHold = useCallback((ms: number) => {
    setHoldActive(true);
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      setHoldActive(false);
      holdTimerRef.current = null;
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    };
  }, []);

  // Control zone check
  const isInControlZone = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return false;
    if (phaseRef.current === 'done') return false;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return rect.top <= vh * IN_VIEW_TOP && rect.top > -rect.height + vh;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Overflow release: update ref in useEffect to avoid recursive access error
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    releaseOverflowFnRef.current = () => {
      const amount = overflowDownRef.current;
      if (amount <= 0) return;

      const step = Math.min(amount, RELEASE_CHUNK_PX);
      overflowDownRef.current = amount - step;

      window.requestAnimationFrame(() => {
        window.scrollBy({ top: step, left: 0, behavior: 'auto' });
        if (overflowDownRef.current > 0) {
          releaseOverflowFnRef.current();
        }
      });
    };
  }, []);

  const releaseOverflowDown = useCallback(() => {
    releaseOverflowFnRef.current();
  }, []);

  // Main scroll/touch handlers
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const now = () => performance.now();

    const handleWheel = (e: WheelEvent) => {
      if (!isInControlZone()) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      // LOCKED
      if (phaseRef.current === 'locked') {
        if (!doneLatchRef.current && rect.top <= vh * ENTER_TRIGGER_TOP && e.deltaY > 0) {
          e.preventDefault();
          acc.current = 0;
          overflowDownRef.current = 0;
          clearHold();
          setPhase('opening');
        }
        return;
      }

      // OPENING
      if (phaseRef.current === 'opening') {
        e.preventDefault();

        const next = acc.current + e.deltaY;
        const cap = OPEN_SCROLL_DISTANCE + DEAD_ZONE;

        if (next > cap) {
          overflowDownRef.current += next - cap;
          acc.current = cap;
        } else {
          acc.current = Math.max(0, next);
        }

        const effective = Math.max(0, acc.current - DEAD_ZONE);
        const p = clamp01(effective / OPEN_SCROLL_DISTANCE);

        setOpenProgress(p);
        setLidAngle(p * MAX_LID_ANGLE);

        if (p >= 1) {
          setPhase('open');
          setOpenProgress(1);
          setLidAngle(MAX_LID_ANGLE);
          acc.current = 0;
          openHoldUntilRef.current = now() + OPEN_HOLD_MS;
          beginHold(OPEN_HOLD_MS);
        }

        if (acc.current <= 0 && e.deltaY < 0) {
          setPhase('locked');
          setOpenProgress(0);
          setLidAngle(0);
          acc.current = 0;
          overflowDownRef.current = 0;
          clearHold();
        }
        return;
      }

      // OPEN
      if (phaseRef.current === 'open') {
        e.preventDefault();

        const stillHolding = now() < openHoldUntilRef.current;

        if (e.deltaY > 0) {
          if (stillHolding) {
            overflowDownRef.current += e.deltaY;
            return;
          }

          const add = e.deltaY + overflowDownRef.current;
          overflowDownRef.current = 0;
          acc.current += add;

          if (acc.current > BREATHING_ROOM) {
            setPhase('closing');
            acc.current = 0;
            clearHold();
          }
        } else {
          acc.current += e.deltaY;
          if (acc.current < -60) {
            setPhase('opening');
            acc.current = OPEN_SCROLL_DISTANCE + DEAD_ZONE;
          }
        }
        return;
      }

      // CLOSING
      if (phaseRef.current === 'closing') {
        e.preventDefault();

        if (e.deltaY > 0) {
          const next = acc.current + e.deltaY;
          const cap = CLOSE_SCROLL_DISTANCE;

          if (next > cap) {
            overflowDownRef.current += next - cap;
            acc.current = cap;
          } else {
            acc.current = Math.max(0, next);
          }

          const p = clamp01(acc.current / CLOSE_SCROLL_DISTANCE);
          setLidAngle(MAX_LID_ANGLE * (1 - p));

          if (p >= 1) {
            setPhase('done');
            setOpenProgress(0);
            setLidAngle(0);
            acc.current = 0;
            clearHold();
            doneLatchRef.current = true;
            releaseOverflowDown();
          }
        } else {
          acc.current += e.deltaY;
          if (acc.current < -40) {
            setPhase('open');
            setOpenProgress(1);
            setLidAngle(MAX_LID_ANGLE);
            acc.current = 0;
            openHoldUntilRef.current = now() + Math.round(OPEN_HOLD_MS * 0.6);
            beginHold(Math.round(OPEN_HOLD_MS * 0.6));
          }
        }
        return;
      }
    };

    // Touch support
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isInControlZone()) return;
      if (phaseRef.current === 'done') return;

      const currentY = e.touches[0].clientY;
      const deltaY = (touchStartY - currentY) * 1.25;
      touchStartY = currentY;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const nowT = () => performance.now();

      if (phaseRef.current === 'locked') {
        if (!doneLatchRef.current && rect.top <= vh * ENTER_TRIGGER_TOP && deltaY > 0) {
          e.preventDefault();
          acc.current = 0;
          overflowDownRef.current = 0;
          clearHold();
          setPhase('opening');
        }
        return;
      }

      if (phaseRef.current === 'opening') {
        e.preventDefault();

        const next = acc.current + deltaY;
        const cap = OPEN_SCROLL_DISTANCE + DEAD_ZONE;

        if (next > cap) {
          overflowDownRef.current += next - cap;
          acc.current = cap;
        } else {
          acc.current = Math.max(0, next);
        }

        const effective = Math.max(0, acc.current - DEAD_ZONE);
        const p = clamp01(effective / OPEN_SCROLL_DISTANCE);

        setOpenProgress(p);
        setLidAngle(p * MAX_LID_ANGLE);

        if (p >= 1) {
          setPhase('open');
          setOpenProgress(1);
          setLidAngle(MAX_LID_ANGLE);
          acc.current = 0;
          openHoldUntilRef.current = nowT() + OPEN_HOLD_MS;
          beginHold(OPEN_HOLD_MS);
        }

        if (acc.current <= 0 && deltaY < 0) {
          setPhase('locked');
          setOpenProgress(0);
          setLidAngle(0);
          acc.current = 0;
          overflowDownRef.current = 0;
          clearHold();
        }
        return;
      }

      if (phaseRef.current === 'open') {
        e.preventDefault();
        const stillHolding = nowT() < openHoldUntilRef.current;

        if (deltaY > 0) {
          if (stillHolding) {
            overflowDownRef.current += deltaY;
            return;
          }

          const add = deltaY + overflowDownRef.current;
          overflowDownRef.current = 0;
          acc.current += add;

          if (acc.current > BREATHING_ROOM * 0.8) {
            setPhase('closing');
            acc.current = 0;
            clearHold();
          }
        } else {
          acc.current += deltaY;
          if (acc.current < -55) {
            setPhase('opening');
            acc.current = OPEN_SCROLL_DISTANCE + DEAD_ZONE;
          }
        }
        return;
      }

      if (phaseRef.current === 'closing') {
        e.preventDefault();

        const next = acc.current + deltaY;
        const cap = CLOSE_SCROLL_DISTANCE;

        if (next > cap) {
          overflowDownRef.current += next - cap;
          acc.current = cap;
        } else {
          acc.current = Math.max(0, next);
        }

        const p = clamp01(acc.current / CLOSE_SCROLL_DISTANCE);
        setLidAngle(MAX_LID_ANGLE * (1 - p));

        if (p >= 1) {
          setPhase('done');
          setOpenProgress(0);
          setLidAngle(0);
          acc.current = 0;
          clearHold();
          doneLatchRef.current = true;
          releaseOverflowDown();
        }
        return;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [beginHold, clearHold, isInControlZone, releaseOverflowDown]);

  // Reset when scrolled far above section
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const farAbove = rect.top > vh * 0.95;

      if (farAbove) {
        if (phaseRef.current !== 'locked') {
          setPhase('locked');
          setOpenProgress(0);
          setLidAngle(0);
          acc.current = 0;
          overflowDownRef.current = 0;
          openHoldUntilRef.current = 0;
          clearHold();
        }
        doneLatchRef.current = false;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [clearHold]);

  const shouldPlay = lidAngle >= VIDEO_PLAY_THRESHOLD;

  const handleVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoElementRef.current = video;
  }, []);

  const glowIntensity = lidAngle / MAX_LID_ANGLE;

  return (
    <section ref={sectionRef} className={`relative min-h-[200vh] bg-[#050508] overflow-hidden ${className}`}>
      <div className="sticky top-0 h-screen w-full">
        {/* Layer 0: Ambient Background */}
        <div className="absolute inset-0 z-0">
          <AmbientBackground intensity={glowIntensity} />
        </div>

        {/* Layer 1: Under-Mac Light */}
        <div className="absolute inset-0 z-3 pointer-events-none">
          <UnderMacLight intensity={glowIntensity} />
        </div>

        {/* Layer 2: Hero Text */}
        <div className="absolute inset-0 z-5 pointer-events-none">
          <HeroText line1={heroLine1} line2={heroLine2} phase={phase} openProgress={openProgress} lidAngle={lidAngle} />
        </div>

        {/* Layer 3: Screen Glow */}
        <div className="absolute inset-0 z-10">
          <ScreenGlow intensity={glowIntensity} color={glowColor} />
        </div>

        {/* Layer 4: Light Beam */}
        <div className="absolute inset-0 z-15 pointer-events-none">
          <LightBeam intensity={glowIntensity} color={glowColor} />
        </div>

        {/* Layer 5: 3D Canvas */}
        <div className="absolute inset-0 z-20">
          <Canvas
            camera={{ fov: 15, position: [0, -5, 220] }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.NoToneMapping,
            }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
              gl.outputColorSpace = THREE.SRGBColorSpace;
            }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1.0} />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />

            <Suspense fallback={<LoadingIndicator />}>
              <Environment preset="studio" />
              <MacModel
                videoSrc={videoSrc}
                imageSrc={imageSrc}
                scale={scale}
                lidAngle={lidAngle}
                shouldPlay={shouldPlay}
                onVideoRef={handleVideoRef}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Optional children */}
        {children && (
          <div className="absolute inset-0 z-40 flex items-start justify-center pt-20 pointer-events-none">
            {children}
          </div>
        )}

        {/* Audio indicator */}
        {!audioEnabled && (
          <div className="absolute bottom-6 right-6 z-50 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 backdrop-blur-sm rounded-full text-white/40 text-xs">
              <VolumeX size={14} strokeWidth={1.5} />
              <span>tap for sound</span>
            </div>
          </div>
        )}
      </div>

      {/* Debug Panel */}
      <div className="fixed bottom-4 left-4 bg-black/90 text-green-400 text-xs px-4 py-2 rounded-lg font-mono z-50 space-y-1">
        <div>
          phase: <span className="text-yellow-400">{phase}</span>
        </div>
        <div>lid: {Math.round((lidAngle / MAX_LID_ANGLE) * 100)}% (max 92%)</div>
        <div>{shouldPlay ? '▶️ playing (32%+)' : '⏸️ paused'}</div>
        <div>audio: {audioEnabled ? '🔊 on' : '🔇 muted'}</div>
        {phase === 'open' && holdActive && <div className="text-cyan-400">hold (breathing)</div>}
        {phase === 'open' && !holdActive && <div className="text-cyan-400">breathing room active</div>}
      </div>
    </section>
  );
}