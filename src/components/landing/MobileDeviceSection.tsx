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
      // Primary: matchMedia (most reliable cross-browser)
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      
      // Secondary: screen.orientation API for angle
      let angle = 0;
      if (screen.orientation) {
        angle = screen.orientation.angle;
      } else if (typeof window.orientation === 'number') {
        // Legacy fallback
        angle = window.orientation;
      }

      setState({
        orientation: isLandscape ? 'landscape' : 'portrait',
        angle,
      });
    };

    // Initial check
    updateOrientation();

    // matchMedia listener (preferred)
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleMediaChange = () => updateOrientation();
    mediaQuery.addEventListener('change', handleMediaChange);

    // Fallback listeners
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
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050508]/95 backdrop-blur-sm"
    >
      {/* Animated phone icon */}
      <motion.div
        className="relative mb-8"
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
        <div className="w-16 h-28 rounded-2xl border-2 border-white/30 relative">
          {/* Screen */}
          <div className="absolute inset-2 rounded-xl bg-white/5" />
          {/* Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full bg-white/20" />
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/20" />
        </div>
        
        {/* Rotation arrow */}
        <motion.div
          className="absolute -right-8 top-1/2 -translate-y-1/2"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <RotateCcw className="w-6 h-6 text-white/50" />
        </motion.div>
      </motion.div>

      <h3 className="text-xl font-semibold text-white/90 mb-2">
        Rotate Your Phone
      </h3>
      <p className="text-sm text-white/50 text-center px-8 mb-6 max-w-xs">
        For the best experience, please rotate your device to landscape mode
      </p>

      {/* Skip button */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          Skip for now
        </button>
      )}
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

  // Find screen mesh and apply video texture
  useEffect(() => {
    if (!gltf.scene) return;

    // Traverse to find the screen mesh
    // Common names: "Screen", "Display", "screen", "display", "Matte"
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        
        // Look for screen-related mesh names
        if (
          name.includes('screen') ||
          name.includes('display') ||
          name.includes('matte') ||
          name.includes('glass') ||
          name.includes('lcd')
        ) {
          screenRef.current = mesh;
        }
      }
    });

    // If no screen found, try to find the largest flat surface
    if (!screenRef.current) {
      let largestMesh: THREE.Mesh | null = null;
      let largestArea = 0;

      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const geometry = mesh.geometry;
          geometry.computeBoundingBox();
          const box = geometry.boundingBox;
          if (box) {
            const area = (box.max.x - box.min.x) * (box.max.y - box.min.y);
            if (area > largestArea) {
              largestArea = area;
              largestMesh = mesh;
            }
          }
        }
      });

      if (largestMesh) {
        screenRef.current = largestMesh;
      }
    }
  }, [gltf.scene]);

  // Setup video texture
  useEffect(() => {
    if (!videoSrc || !screenRef.current) return;

    const video = preloadedMobileVideo ?? preloadMobileVideo(videoSrc);
    videoRef.current = video;
    onVideoRef(video);

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    videoTextureRef.current = texture;

    // Apply to screen material
    const mesh = screenRef.current;
    if (mesh.material) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.map = texture;
      mat.emissive = new THREE.Color(0x111111);
      mat.emissiveIntensity = 0.5;
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

  // Calculate scale based on viewport
  const scale = Math.min(viewport.width, viewport.height) * 0.12;

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={scale}>
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
  heroText?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────
export function MobileDeviceSection({
  videoSrc = '/demo-video.mp4',
  className = '',
  glowColor = '#6366f1',
  heroText = 'Experience the Future',
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

  // Auto-play when landscape and in view
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;

    const shouldAutoplay = isLandscape && isInView && (skippedRotation || isLandscape);

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

  // Skip rotation prompt
  const handleSkipRotation = useCallback(() => {
    setSkippedRotation(true);
  }, []);

  const showRotatePrompt = !isLandscape && !skippedRotation;
  const showContent = isLandscape || skippedRotation;

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-screen bg-[#050508] overflow-hidden ${className}`}
    >
      {/* Ambient glow background */}
      <AmbientGlow intensity={showContent ? 0.8 : 0.3} color={glowColor} />

      {/* Hero text - fades when content shown */}
      <AnimatePresence>
        {!showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 z-10 text-center px-6"
          >
            <h2
              className="text-4xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {heroText}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rotate prompt overlay */}
      <AnimatePresence>
        {showRotatePrompt && (
          <RotatePrompt onSkip={handleSkipRotation} />
        )}
      </AnimatePresence>

      {/* 3D Canvas with iPhone */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20"
          >
            <Canvas
              camera={{ fov: 35, position: [0, 0, 5] }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
              }}
              dpr={[1, 2]}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
                gl.outputColorSpace = THREE.SRGBColorSpace;
              }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={1.2} />
              <directionalLight position={[-3, 3, -3]} intensity={0.4} />
              <spotLight
                position={[0, 5, 2]}
                angle={0.5}
                penumbra={0.5}
                intensity={0.8}
                castShadow
              />

              <Suspense fallback={<LoadingIndicator />}>
                <Environment preset="city" />
                <IPhoneModel
                  videoSrc={videoSrc}
                  isLandscape={isLandscape}
                  onVideoRef={handleVideoRef}
                />
              </Suspense>
            </Canvas>

            {/* Video controls */}
            <VideoControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              onPlay={handlePlay}
              onFullscreen={handleFullscreen}
              onToggleMute={handleToggleMute}
              autoplayFailed={autoplayFailed}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 0.5 : 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-white/40">Scroll to continue</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5"
          >
            <div className="w-1 h-1.5 rounded-full bg-white/50" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// Preload the GLB
useGLTF.preload('/iphone.glb');

export default MobileDeviceSection;