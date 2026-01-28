// LightRays.tsx — Optimized WebGL light rays with graceful fallback
'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

// ============================================================================
// TYPES
// ============================================================================

export type RaysOrigin =
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'right'
  | 'left'
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left';

interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
  maxDpr?: number;
  targetFps?: number;
}

type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface Uniforms {
  iTime: { value: number };
  iResolution: { value: Vec2 };
  rayPos: { value: Vec2 };
  rayDir: { value: Vec2 };
  raysColor: { value: Vec3 };
  raysSpeed: { value: number };
  lightSpread: { value: number };
  rayLength: { value: number };
  pulsating: { value: number };
  fadeDistance: { value: number };
  saturation: { value: number };
  mousePos: { value: Vec2 };
  mouseInfluence: { value: number };
  noiseAmount: { value: number };
  distortion: { value: number };
}

// ============================================================================
// DEVICE DETECTION (runs once at module load for SSR safety)
// ============================================================================

const getInitialCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      prefersReducedMotion: false,
      supportsWebGL: true, // Assume true, will verify on mount
    };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // WebGL support check
  let supportsWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    supportsWebGL = !!gl;
    if (gl) {
      const loseContext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
      loseContext?.loseContext();
    }
  } catch {
    supportsWebGL = false;
  }

  return { prefersReducedMotion, supportsWebGL };
};

// ============================================================================
// HELPERS
// ============================================================================

const DEFAULT_COLOR = '#ffffff';

const hexToRgb = (hex: string): Vec3 => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [1, 1, 1];
};

const getAnchorAndDir = (
  origin: RaysOrigin,
  w: number,
  h: number
): { anchor: Vec2; dir: Vec2 } => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left':
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case 'top-right':
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case 'left':
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right':
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left':
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-center':
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right':
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default:
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

// ============================================================================
// SHADERS (Simplified for performance)
// ============================================================================

const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform float iTime;
uniform vec2  iResolution;
uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);

  gl_FragColor = rays1 * 0.5 + rays2 * 0.4;

  float brightness = 1.0 - (coord.y / iResolution.y);
  gl_FragColor.x *= 0.1 + brightness * 0.8;
  gl_FragColor.y *= 0.3 + brightness * 0.6;
  gl_FragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor.rgb = mix(vec3(gray), gl_FragColor.rgb, saturation);
  }

  gl_FragColor.rgb *= raysColor;
}`;

// ============================================================================
// CSS FALLBACK (only used when WebGL unavailable or reduced motion)
// ============================================================================

const CSSLightRays: React.FC<{ origin: RaysOrigin; color: string; className: string }> = ({
  origin,
  color,
  className,
}) => {
  const gradientDirection = useMemo(() => {
    switch (origin) {
      case 'top-center': return 'to bottom';
      case 'top-left': return 'to bottom right';
      case 'top-right': return 'to bottom left';
      case 'bottom-center': return 'to top';
      case 'bottom-left': return 'to top right';
      case 'bottom-right': return 'to top left';
      case 'left': return 'to right';
      case 'right': return 'to left';
      default: return 'to bottom';
    }
  }, [origin]);

  return (
    <div
      className={`w-full h-full pointer-events-none absolute inset-0 ${className}`.trim()}
      style={{
        background: `linear-gradient(${gradientDirection}, ${color}20 0%, ${color}10 30%, transparent 70%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${color}15 0%, transparent 60%)`,
        }}
      />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LightRays: React.FC<LightRaysProps> = ({
  raysOrigin = 'top-center',
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 0.5,
  rayLength = 3,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = false,
  mouseInfluence = 0.1,
  noiseAmount = 0.0,
  distortion = 0.0,
  className = '',
  maxDpr = 1.5,
  targetFps = 30,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<Uniforms | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastFrameTimeRef = useRef(0);

  const [isVisible, setIsVisible] = useState(false);
  
  // Use lazy initializer to avoid setState in effect
  const [capabilities] = useState(() => getInitialCapabilities());

  // Frame interval based on targetFps prop (use what's passed in, don't nerf it)
  const frameInterval = 1000 / targetFps;

  // Only use CSS fallback when WebGL truly unavailable or user prefers reduced motion
  const useCSSFallback = !capabilities.supportsWebGL || capabilities.prefersReducedMotion;

  // Intersection Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // WebGL setup (only if not using CSS fallback)
  useEffect(() => {
    if (useCSSFallback || !isVisible || !containerRef.current) return;

    // Clean up previous instance
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const initWebGL = async () => {
      if (!containerRef.current) return;

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 16));
      if (!containerRef.current) return;

      try {
        const renderer = new Renderer({
          dpr: Math.min(window.devicePixelRatio, maxDpr),
          alpha: true,
        });
        rendererRef.current = renderer;

        const gl = renderer.gl;
        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';

        // Clear container and append canvas
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(gl.canvas);

        const uniforms: Uniforms = {
          iTime: { value: 0 },
          iResolution: { value: [1, 1] },
          rayPos: { value: [0, 0] },
          rayDir: { value: [0, 1] },
          raysColor: { value: hexToRgb(raysColor) },
          raysSpeed: { value: raysSpeed },
          lightSpread: { value: lightSpread },
          rayLength: { value: rayLength },
          pulsating: { value: pulsating ? 1.0 : 0.0 },
          fadeDistance: { value: fadeDistance },
          saturation: { value: saturation },
          mousePos: { value: [0.5, 0.5] },
          mouseInfluence: { value: mouseInfluence },
          noiseAmount: { value: noiseAmount },
          distortion: { value: distortion },
        };
        uniformsRef.current = uniforms;

        const geometry = new Triangle(gl);
        const program = new Program(gl, {
          vertex: VERTEX_SHADER,
          fragment: FRAGMENT_SHADER,
          uniforms,
        });
        const mesh = new Mesh(gl, { geometry, program });
        meshRef.current = mesh;

        // Resize handler
        const updatePlacement = () => {
          if (!containerRef.current || !renderer) return;

          const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
          renderer.setSize(wCSS, hCSS);

          const dpr = renderer.dpr;
          const w = wCSS * dpr;
          const h = hCSS * dpr;

          uniforms.iResolution.value = [w, h];
          const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
          uniforms.rayPos.value = anchor;
          uniforms.rayDir.value = dir;
        };

        // Animation loop with FPS limiting
        const loop = (time: number) => {
          if (!rendererRef.current || !uniformsRef.current || !meshRef.current) return;

          // FPS limiting
          const elapsed = time - lastFrameTimeRef.current;
          if (elapsed < frameInterval) {
            animationIdRef.current = requestAnimationFrame(loop);
            return;
          }
          lastFrameTimeRef.current = time - (elapsed % frameInterval);

          uniforms.iTime.value = time * 0.001;

          // Smooth mouse tracking
          if (followMouse && mouseInfluence > 0.0) {
            const smoothing = 0.92;
            smoothMouseRef.current.x = smoothMouseRef.current.x * smoothing + mouseRef.current.x * (1 - smoothing);
            smoothMouseRef.current.y = smoothMouseRef.current.y * smoothing + mouseRef.current.y * (1 - smoothing);
            uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
          }

          try {
            renderer.render({ scene: mesh });
            animationIdRef.current = requestAnimationFrame(loop);
          } catch (error) {
            console.warn('LightRays render error:', error);
          }
        };

        window.addEventListener('resize', updatePlacement, { passive: true });
        updatePlacement();
        animationIdRef.current = requestAnimationFrame(loop);

        // Store cleanup function
        cleanupRef.current = () => {
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
          }
          window.removeEventListener('resize', updatePlacement);

          try {
            const canvas = renderer.gl.canvas;
            const loseContext = renderer.gl.getExtension('WEBGL_lose_context');
            loseContext?.loseContext();
            if (canvas?.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
          } catch (e) {
            console.warn('LightRays cleanup error:', e);
          }

          rendererRef.current = null;
          uniformsRef.current = null;
          meshRef.current = null;
        };
      } catch (error) {
        console.warn('LightRays WebGL init failed:', error);
      }
    };

    initWebGL();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [
    useCSSFallback,
    isVisible,
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
    maxDpr,
    frameInterval,
  ]);

  // Dynamic uniform updates
  useEffect(() => {
    if (useCSSFallback || !uniformsRef.current || !containerRef.current || !rendererRef.current) return;

    const u = uniformsRef.current;
    const renderer = rendererRef.current;

    u.raysColor.value = hexToRgb(raysColor);
    u.raysSpeed.value = raysSpeed;
    u.lightSpread.value = lightSpread;
    u.rayLength.value = rayLength;
    u.pulsating.value = pulsating ? 1.0 : 0.0;
    u.fadeDistance.value = fadeDistance;
    u.saturation.value = saturation;
    u.mouseInfluence.value = mouseInfluence;
    u.noiseAmount.value = noiseAmount;
    u.distortion.value = distortion;

    const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
    const dpr = renderer.dpr;
    const { anchor, dir } = getAnchorAndDir(raysOrigin, wCSS * dpr, hCSS * dpr);
    u.rayPos.value = anchor;
    u.rayDir.value = dir;
  }, [
    useCSSFallback,
    raysColor,
    raysSpeed,
    lightSpread,
    raysOrigin,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    mouseInfluence,
    noiseAmount,
    distortion,
  ]);

  // Mouse tracking
  useEffect(() => {
    if (useCSSFallback || !followMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [useCSSFallback, followMouse]);

  // Use CSS fallback for mobile/reduced motion/no WebGL
  if (useCSSFallback) {
    return <CSSLightRays origin={raysOrigin} color={raysColor} className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full pointer-events-none overflow-hidden relative ${className}`.trim()}
      style={{ contain: 'layout style paint' }}
    />
  );
};

export default LightRays;