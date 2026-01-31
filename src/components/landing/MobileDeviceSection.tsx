'use client';

import React, { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { Maximize2, RotateCcw, Play, Volume2, VolumeX } from 'lucide-react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE DEVICE SECTION — iPhone 3D Model with Orientation Detection
// Shows iPhone GLB on mobile, prompts landscape rotation, plays demo video
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Orientation = 'portrait' | 'landscape';

interface OrientationState {
  orientation: Orientation;
  angle: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Orientation Hook — Cross-browser detection
// ─────────────────────────────────────────────────────────────────────────────
function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>({
    orientation: 'portrait',
    angle: 0,
  });

  useEffect(() => {
    const updateOrientation = () => {
      // Multiple detection methods for reliability
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Primary: compare dimensions (most reliable)
      const isLandscapeBySize = width > height;
      
      // Secondary: matchMedia
      const isLandscapeByMedia = window.matchMedia('(orientation: landscape)').matches;
      
      // Use size comparison as primary (more reliable on mobile)
      const isLandscape = isLandscapeBySize;
      
      // Get angle if available
      let angle = 0;
      if (screen.orientation) {
        angle = screen.orientation.angle;
      } else if (typeof window.orientation === 'number') {
        angle = window.orientation;
      }

      console.log('[Orientation]', { width, height, isLandscapeBySize, isLandscapeByMedia, angle });

      setState({
        orientation: isLandscape ? 'landscape' : 'portrait',
        angle,
      });
    };

    // Initial check
    updateOrientation();

    // Multiple listeners for reliability
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    const handleMediaChange = () => updateOrientation();
    mediaQuery.addEventListener('change', handleMediaChange);

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// Video Preloading
// ─────────────────────────────────────────────────────────────────────────────
let preloadedMobileVideo: HTMLVideoElement | null = null;

function preloadMobileVideo(src: string): HTMLVideoElement {
  if (preloadedMobileVideo && preloadedMobileVideo.src.includes(src)) {
    return preloadedMobileVideo;
  }

  const video = document.createElement('video');
  video.src = src;
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('webkit-playsinline', 'true');
  video.load();
  preloadedMobileVideo = video;

  return video;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rotate Phone Prompt
// ─────────────────────────────────────────────────────────────────────────────
interface RotatePromptProps {
  onSkip?: () => void;
}

function RotatePrompt({ onSkip }: RotatePromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-32 pointer-events-none"
    >
      {/* Semi-transparent gradient overlay - iPhone visible through top */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to top,
            rgba(5, 5, 8, 0.95) 0%,
            rgba(5, 5, 8, 0.8) 30%,
            rgba(5, 5, 8, 0.4) 60%,
            rgba(5, 5, 8, 0.1) 80%,
            transparent 100%
          )`,
        }}
      />
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center pointer-events-auto">
        {/* Animated phone icon */}
        <motion.div
          className="relative mb-6"
          animate={{ rotate: [0, 90, 90, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 0.5,
            times: [0, 0.4, 0.6, 1],
            ease: 'easeInOut',
          }}
        >
          {/* Phone outline */}
          <div className="w-12 h-20 rounded-xl border-2 border-white/40 relative bg-white/5 backdrop-blur-sm">
            {/* Screen */}
            <div className="absolute inset-1.5 rounded-lg bg-white/10" />
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-white/30" />
            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-white/30" />
          </div>
          
          {/* Rotation arrow */}
          <motion.div
            className="absolute -right-6 top-1/2 -translate-y-1/2"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <RotateCcw className="w-5 h-5 text-white/60" />
          </motion.div>
        </motion.div>

        <h3 className="text-lg font-semibold text-white/90 mb-1">
          Rotate for Best View
        </h3>
        <p className="text-sm text-white/50 text-center px-8 mb-4 max-w-xs">
          Turn your phone sideways to watch the demo
        </p>

        {/* Skip button */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-white/50 hover:text-white/80 
                       bg-white/5 hover:bg-white/10 rounded-full 
                       border border-white/10 transition-all"
          >
            Watch in portrait
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Video Controls Overlay
// ─────────────────────────────────────────────────────────────────────────────
interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  onPlay: () => void;
  onFullscreen: () => void;
  onToggleMute: () => void;
  autoplayFailed: boolean;
}

function VideoControls({
  isPlaying,
  isMuted,
  onPlay,
  onFullscreen,
  onToggleMute,
  autoplayFailed,
}: VideoControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.3 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3"
    >
      {/* Play button (shown if autoplay failed) */}
      {autoplayFailed && !isPlaying && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 
                     backdrop-blur-md rounded-full border border-white/10 transition-colors"
        >
          <Play className="w-4 h-4 text-white" fill="white" />
          <span className="text-sm font-medium text-white">Play Demo</span>
        </motion.button>
      )}

      {/* Mute toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleMute}
        className="p-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full 
                   border border-white/10 transition-colors"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-white/70" />
        ) : (
          <Volume2 className="w-4 h-4 text-white" />
        )}
      </motion.button>

      {/* Fullscreen button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onFullscreen}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 
                   backdrop-blur-md rounded-full border border-white/10 transition-colors"
      >
        <Maximize2 className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">Fullscreen</span>
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// iPhone 3D Model Component
// ─────────────────────────────────────────────────────────────────────────────
interface IPhoneModelProps {
  videoSrc: string;
  isLandscape: boolean;
  onVideoRef: (video: HTMLVideoElement | null) => void;
}

function IPhoneModel({ videoSrc, isLandscape, onVideoRef }: IPhoneModelProps) {
  const gltf = useGLTF('/iphone.glb');
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const { viewport } = useThree();

  // Find screen mesh and set up materials
  useEffect(() => {
    if (!gltf.scene) return;

    console.log('[iPhone] Loading model, traversing meshes...');

    // Make all materials visible and well-lit
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshName = mesh.name.toLowerCase();
        
        console.log('[iPhone] Found mesh:', mesh.name);

        // Ensure materials are visible
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          // Make materials brighter and more visible
          if (mat.color) {
            mat.color.multiplyScalar(1.5);
          }
          mat.metalness = Math.min(mat.metalness, 0.5);
          mat.roughness = Math.max(mat.roughness, 0.3);
          mat.needsUpdate = true;
        }
        
        // Look for screen-related mesh names
        if (
          meshName.includes('screen') ||
          meshName.includes('display') ||
          meshName.includes('matte') ||
          meshName.includes('glass') ||
          meshName.includes('lcd') ||
          meshName.includes('panel')
        ) {
          console.log('[iPhone] Found screen mesh:', mesh.name);
          screenRef.current = mesh;
        }
      }
    });

    // If no screen found by name, use the first large flat mesh
    if (!screenRef.current) {
      console.log('[iPhone] No screen found by name, searching by geometry...');
      let bestCandidate: THREE.Mesh | null = null;
      let bestScore = 0;

      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const geometry = mesh.geometry;
          
          if (geometry.boundingBox === null) {
            geometry.computeBoundingBox();
          }
          
          const box = geometry.boundingBox;
          if (box) {
            const size = new THREE.Vector3();
            box.getSize(size);
            // Look for flat rectangles (screen-like)
            const flatness = Math.min(size.x, size.y, size.z);
            const area = size.x * size.y * size.z / (flatness || 0.001);
            
            if (area > bestScore && flatness < 0.1) {
              bestScore = area;
              bestCandidate = mesh;
            }
          }
        }
      });

      if (bestCandidate) {
        console.log('[iPhone] Using candidate mesh:', (bestCandidate as THREE.Mesh).name);
        screenRef.current = bestCandidate;
      }
    }
  }, [gltf.scene]);

  // Setup video texture
  useEffect(() => {
    if (!videoSrc || !screenRef.current) {
      console.log('[iPhone] Cannot setup video:', { videoSrc: !!videoSrc, screen: !!screenRef.current });
      return;
    }

    console.log('[iPhone] Setting up video texture');

    const video = preloadedMobileVideo ?? preloadMobileVideo(videoSrc);
    videoRef.current = video;
    onVideoRef(video);

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    videoTextureRef.current = texture;

    // Apply to screen material
    const mesh = screenRef.current;
    if (mesh.material) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.map = texture;
      mat.emissive = new THREE.Color(0x222222);
      mat.emissiveIntensity = 1;
      mat.emissiveMap = texture;
      mat.metalness = 0;
      mat.roughness = 0.1;
      mat.needsUpdate = true;
    }

    return () => {
      texture.dispose();
    };
  }, [videoSrc, gltf.scene, onVideoRef]);

  // Update texture every frame
  useFrame(() => {
    if (videoTextureRef.current && videoRef.current && !videoRef.current.paused) {
      videoTextureRef.current.needsUpdate = true;
    }

    // Smooth rotation based on orientation
    if (groupRef.current) {
      const targetRotationZ = isLandscape ? Math.PI / 2 : 0;
      groupRef.current.rotation.z += (targetRotationZ - groupRef.current.rotation.z) * 0.08;
    }
  });

  // Make the iPhone BIG and visible - scale based on viewport height for portrait
  const portraitScale = viewport.height * 0.35;
  const landscapeScale = viewport.width * 0.25;
  const scale = isLandscape ? landscapeScale : portraitScale;

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={Math.max(scale, 2)}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambient Glow Effects
// ─────────────────────────────────────────────────────────────────────────────
interface AmbientGlowProps {
  intensity: number;
  color?: string;
}

function AmbientGlow({ intensity, color = '#6366f1' }: AmbientGlowProps) {
  const opacity = intensity * 0.4;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Central glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '120vw',
          height: '120vh',
          background: `radial-gradient(ellipse 50% 50% at center,
            ${color}15 0%,
            ${color}08 30%,
            ${color}03 50%,
            transparent 70%
          )`,
          filter: 'blur(60px)',
          opacity,
        }}
      />
      
      {/* Bottom reflection */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: '80vw',
          height: '30vh',
          background: `radial-gradient(ellipse 60% 100% at center bottom,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.03) 40%,
            transparent 70%
          )`,
          filter: 'blur(40px)',
          opacity: intensity * 0.6,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading Indicator
// ─────────────────────────────────────────────────────────────────────────────
function LoadingIndicator() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.5, 1, 0.1]} />
      <meshStandardMaterial color="#333" wireframe />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component Props
// ─────────────────────────────────────────────────────────────────────────────
interface MobileDeviceSectionProps {
  videoSrc?: string;
  className?: string;
  glowColor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────
export function MobileDeviceSection({
  videoSrc = '/demo-video.mp4',
  className = '',
  glowColor = '#6366f1',
}: MobileDeviceSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);

  const { orientation } = useOrientation();
  const isLandscape = orientation === 'landscape';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [skippedRotation, setSkippedRotation] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Check if we're on client (safe for SSR)
  const isClient = typeof window !== 'undefined';

  // Preload video
  useEffect(() => {
    if (videoSrc) {
      preloadMobileVideo(videoSrc);
    }
  }, [videoSrc]);

  // Intersection observer for in-view detection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Sync isPlaying state with video events (proper React pattern)
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-play when landscape OR when user chose to watch in portrait
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;

    // Play video if: in landscape, OR user skipped rotation prompt, AND section is in view
    const shouldAutoplay = isInView && (isLandscape || skippedRotation);

    if (shouldAutoplay) {
      video.muted = true; // Must be muted for autoplay
      video.play()
        .then(() => {
          setAutoplayFailed(false);
        })
        .catch(() => {
          setAutoplayFailed(true);
        });
    } else if (!isInView) {
      video.pause();
      // isPlaying state will be updated by the 'pause' event listener
    }
  }, [isLandscape, isInView, skippedRotation]);

  // Handle video ref from 3D model
  const handleVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoElementRef.current = video;
  }, []);

  // Play button handler
  const handlePlay = useCallback(() => {
    const video = videoElementRef.current;
    if (video) {
      video.muted = isMuted;
      video.play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayFailed(false);
        })
        .catch(console.error);
    }
  }, [isMuted]);

  // Fullscreen handler
  const handleFullscreen = useCallback(() => {
    const video = videoElementRef.current;
    if (!video) return;

    // Create or reuse fullscreen video element
    let fsVideo = fullscreenVideoRef.current;
    if (!fsVideo) {
      fsVideo = document.createElement('video');
      fsVideo.src = videoSrc;
      fsVideo.loop = true;
      fsVideo.playsInline = true;
      fsVideo.controls = true;
      fsVideo.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9999;background:#000;object-fit:contain;';
      fullscreenVideoRef.current = fsVideo;
    }

    fsVideo.currentTime = video.currentTime;
    fsVideo.muted = isMuted;
    document.body.appendChild(fsVideo);

    // Try native fullscreen first
    const requestFS = fsVideo.requestFullscreen || 
                      (fsVideo as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen ||
                      (fsVideo as unknown as { webkitEnterFullscreen?: () => Promise<void> }).webkitEnterFullscreen;

    if (requestFS) {
      requestFS.call(fsVideo)
        .then(() => fsVideo?.play())
        .catch(() => {
          // Fallback: just play in the overlay
          fsVideo?.play();
        });
    } else {
      fsVideo.play();
    }

    // Handle fullscreen exit
    const handleFsExit = () => {
      if (!document.fullscreenElement && fullscreenVideoRef.current) {
        fullscreenVideoRef.current.pause();
        fullscreenVideoRef.current.remove();
        
        // Sync time back
        if (videoElementRef.current && fullscreenVideoRef.current) {
          videoElementRef.current.currentTime = fullscreenVideoRef.current.currentTime;
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFsExit);
    document.addEventListener('webkitfullscreenchange', handleFsExit);

    // Click to close overlay fallback
    fsVideo.addEventListener('click', (e) => {
      if (e.target === fsVideo && !document.fullscreenElement) {
        fsVideo?.pause();
        fsVideo?.remove();
        if (videoElementRef.current && fullscreenVideoRef.current) {
          videoElementRef.current.currentTime = fullscreenVideoRef.current.currentTime;
        }
      }
    }, { once: true });
  }, [videoSrc, isMuted]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    const video = videoElementRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  // Skip rotation prompt - start video playback
  const handleSkipRotation = useCallback(() => {
    setSkippedRotation(true);
    
    // Try to play video immediately when user engages
    const video = videoElementRef.current;
    if (video) {
      video.muted = true;
      video.play()
        .then(() => setAutoplayFailed(false))
        .catch(() => setAutoplayFailed(true));
    }
  }, []);

  const showRotatePrompt = isClient && !isLandscape && !skippedRotation;
  const showControls = isClient && (isLandscape || skippedRotation);

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-screen bg-[#050508] overflow-hidden ${className}`}
    >
      {/* Ambient glow background - always visible */}
      <AmbientGlow intensity={isLandscape ? 0.8 : 0.5} color={glowColor} />

      {/* 3D Canvas with iPhone - ALWAYS VISIBLE */}
      <div className="absolute inset-0 z-10">
        <Canvas
          camera={{ fov: 45, position: [0, 0, 4], near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.5,
          }}
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          {/* Strong ambient for base visibility */}
          <ambientLight intensity={1.5} />
          
          {/* Key light - main illumination */}
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={2} 
            castShadow 
          />
          
          {/* Fill light - soften shadows */}
          <directionalLight 
            position={[-5, 3, 3]} 
            intensity={1} 
          />
          
          {/* Rim light - edge definition */}
          <directionalLight 
            position={[0, -3, -5]} 
            intensity={0.5} 
          />
          
          {/* Top light */}
          <pointLight position={[0, 5, 0]} intensity={1} />

          <Suspense fallback={<LoadingIndicator />}>
            <Environment preset="studio" />
            <IPhoneModel
              videoSrc={videoSrc}
              isLandscape={isLandscape}
              onVideoRef={handleVideoRef}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Rotate prompt overlay - shows on top of iPhone */}
      <AnimatePresence>
        {showRotatePrompt && (
          <RotatePrompt onSkip={handleSkipRotation} />
        )}
      </AnimatePresence>

      {/* Video controls - only show when rotated or skipped */}
      <AnimatePresence>
        {showControls && (
          <VideoControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            onPlay={handlePlay}
            onFullscreen={handleFullscreen}
            onToggleMute={handleToggleMute}
            autoplayFailed={autoplayFailed}
          />
        )}
      </AnimatePresence>

    </section>
  );
}

// Preload the GLB
useGLTF.preload('/iphone.glb');

export default MobileDeviceSection;