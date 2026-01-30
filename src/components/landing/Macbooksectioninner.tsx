'use client';

import { useRef, useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Preload video globally
let preloadedVideo: HTMLVideoElement | null = null;

function preloadVideo(src: string) {
  if (preloadedVideo) return preloadedVideo;
  
  const video = document.createElement('video');
  video.src = src;
  video.crossOrigin = 'anonymous';
  video.loop = false;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.load();
  preloadedVideo = video;
  
  console.log('📹 Video preloaded:', src);
  return video;
}

interface MacModelProps {
  videoSrc?: string;
  imageSrc?: string;
  scale?: number;
  scrollProgress: number;
  shouldPlay: boolean;
  onVideoRef?: (video: HTMLVideoElement | null) => void;
}

function MacModel({ videoSrc, imageSrc, scale = 1, scrollProgress, shouldPlay, onVideoRef }: MacModelProps) {
  const gltf = useGLTF('/mac.glb');
  const screenRef = useRef<THREE.Object3D | null>(null);
  const matteRef = useRef<THREE.Mesh | null>(null);
  const targetRotation = useRef(Math.PI);
  const groupRef = useRef<THREE.Group>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  // Find meshes
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

  // Setup video texture
  useEffect(() => {
    if (!videoSrc || !matteRef.current) return;

    const video = preloadedVideo || preloadVideo(videoSrc);
    videoRef.current = video;
    onVideoRef?.(video);

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    videoTextureRef.current = texture;

    const mat = matteRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.map = texture;
      mat.metalness = 0;
      mat.roughness = 1;
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0;
      mat.envMapIntensity = 0;
      mat.needsUpdate = true;
    }

    return () => {
      texture.dispose();
    };
  }, [videoSrc, gltf.scene, onVideoRef]);

  // Apply image texture (fallback)
  useEffect(() => {
    if (videoSrc || !imageSrc || !matteRef.current) return;

    const mat = matteRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.metalness = 0;
      mat.roughness = 1;
      mat.envMapIntensity = 0;
      
      new THREE.TextureLoader().load(imageSrc, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.needsUpdate = true;
      });
    }
  }, [imageSrc, videoSrc, gltf.scene]);

  // Handle video playback - simple: play when shouldPlay, pause when not
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPlay) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [shouldPlay]);

  // Update target rotation
  useEffect(() => {
    // 180° = closed, 80° = fully open
    targetRotation.current = THREE.MathUtils.degToRad(180 - scrollProgress * 100);
  }, [scrollProgress]);

  // Animate - NO zoom, just rotation
  useFrame(() => {
    if (screenRef.current) {
      screenRef.current.rotation.x += (targetRotation.current - screenRef.current.rotation.x) * 0.12;
    }

    if (videoTextureRef.current) {
      videoTextureRef.current.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, -10, 20]} scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
}

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

interface Props {
  videoSrc?: string;
  imageSrc?: string;
  scale?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function MacBookSectionInner({ 
  videoSrc,
  imageSrc,
  scale = 1.4,
  className = '',
  children
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Play at 70% scroll
  const shouldPlay = useMemo(() => scrollProgress >= 0.70, [scrollProgress]);

  // Preload video on mount
  useEffect(() => {
    if (videoSrc) {
      preloadVideo(videoSrc);
    }
  }, [videoSrc]);

  // Enable audio on any click anywhere
  useEffect(() => {
    const enableAudio = () => {
      if (videoElementRef.current && !audioEnabled) {
        videoElementRef.current.muted = false;
        setAudioEnabled(true);
        console.log('🔊 Audio enabled');
      }
    };

    // Listen for click on entire document
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, [audioEnabled]);

  // Scroll tracking
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const scrolled = -rect.top;
      const scrollRange = viewportHeight * 1.0;
      
      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoElementRef.current = video;
  }, []);

  return (
    <section 
      ref={sectionRef}
      className={`relative min-h-[200vh] bg-[#050508] ${className}`}
    >
      {children && (
        <div className="sticky top-0 h-screen flex items-start justify-center pt-20 pointer-events-none z-10">
          {children}
        </div>
      )}

      <div 
        className="sticky top-0 h-screen w-full flex items-center justify-center"
        style={{ marginTop: children ? '-100vh' : 0 }}
      >
        <Canvas
          camera={{ fov: 12, position: [0, -10, 220] }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.NoToneMapping
          }}
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.setClearColor(0x050508, 1);
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
              scrollProgress={scrollProgress}
              shouldPlay={shouldPlay}
              onVideoRef={handleVideoRef}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Debug overlay - remove in production */}
      <div className="fixed bottom-4 left-4 bg-black/80 text-green-400 text-xs px-3 py-1 rounded font-mono z-50">
        scroll: {Math.round(scrollProgress * 100)}% | {shouldPlay ? '▶️' : '⏸️'} | 🔊 {audioEnabled ? 'on' : 'off'}
      </div>
    </section>
  );
}