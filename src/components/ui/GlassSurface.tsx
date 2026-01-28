// GlassSurface.tsx — Optimized for performance with mobile fallbacks

import React, { useEffect, useRef, useState, useId, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity'
    | 'plus-darker'
    | 'plus-lighter';
  className?: string;
  style?: React.CSSProperties;
  /** Force simple CSS fallback (useful for mobile) */
  forceSimple?: boolean;
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

interface DeviceCapabilities {
  isLowPower: boolean;
  prefersReducedMotion: boolean;
  supportsSVGFilters: boolean;
  supportsBackdropFilter: boolean;
  isMobile: boolean;
}

const detectCapabilities = (filterId: string): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
      isLowPower: true,
      prefersReducedMotion: false,
      supportsSVGFilters: false,
      supportsBackdropFilter: false,
      isMobile: false,
    };
  }

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isWebkit = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Low power detection
  const isLowPower = 
    isMobile ||
    (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4) ||
    window.innerWidth < 768 ||
    // Battery API check (if available)
    ('getBattery' in navigator);

  // SVG filter support (problematic on Safari/Firefox)
  let supportsSVGFilters = false;
  if (!isWebkit && !isFirefox && !isMobile) {
    const div = document.createElement('div');
    div.style.backdropFilter = `url(#${filterId})`;
    supportsSVGFilters = div.style.backdropFilter !== '';
  }

  // Basic backdrop-filter support
  const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');

  return {
    isLowPower,
    prefersReducedMotion,
    supportsSVGFilters,
    supportsBackdropFilter,
    isMobile,
  };
};

// ============================================================================
// HOOKS
// ============================================================================

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isDark;
};

// ============================================================================
// COMPONENT
// ============================================================================

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 9999,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0.5,
  backgroundOpacity = 0.04,
  saturation = 1.3,
  distortionScale = -120,
  redOffset = 2,
  greenOffset = 8,
  blueOffset = 16,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'screen',
  className = '',
  style = {},
  forceSimple = false,
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isLowPower: true,
    prefersReducedMotion: false,
    supportsSVGFilters: false,
    supportsBackdropFilter: false,
    isMobile: false,
  });
  const [isVisible, setIsVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const isDarkMode = useDarkMode();

  // Detect capabilities on mount
  useEffect(() => {
    setCapabilities(detectCapabilities(filterId));
  }, [filterId]);

  // Intersection Observer for lazy rendering
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Should use simple CSS fallback?
  const useSimpleFallback = useMemo(() => {
    return forceSimple || 
           capabilities.isLowPower || 
           capabilities.isMobile || 
           capabilities.prefersReducedMotion ||
           !capabilities.supportsSVGFilters;
  }, [forceSimple, capabilities]);

  // Generate displacement map (only if using advanced rendering)
  const generateDisplacementMap = useCallback(() => {
    if (useSimpleFallback || !containerRef.current) return '';

    const rect = containerRef.current.getBoundingClientRect();
    const actualWidth = rect.width || 400;
    const actualHeight = rect.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"/>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  }, [useSimpleFallback, borderWidth, redGradId, blueGradId, borderRadius, mixBlendMode, brightness, opacity, blur]);

  const updateDisplacementMap = useCallback(() => {
    if (useSimpleFallback || !feImageRef.current) return;
    feImageRef.current.setAttribute('href', generateDisplacementMap());
  }, [useSimpleFallback, generateDisplacementMap]);

  // Update displacement map when visible and props change
  useEffect(() => {
    if (useSimpleFallback || !isVisible) return;

    updateDisplacementMap();

    // Update channel offsets
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset },
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
  }, [
    isVisible,
    useSimpleFallback,
    updateDisplacementMap,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
  ]);

  // ResizeObserver for updates
  useEffect(() => {
    if (useSimpleFallback || !containerRef.current || !isVisible) return;

    let timeoutId: NodeJS.Timeout | null = null;
    
    const resizeObserver = new ResizeObserver(() => {
      // Throttle updates
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDisplacementMap, 100);
    });
    
    resizeObserver.observe(containerRef.current);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [useSimpleFallback, isVisible, updateDisplacementMap]);

  // Memoize container styles
  const containerStyles = useMemo((): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    contain: 'layout style paint',
    outline: 'none',
  };

  // ⬇️ ADD THIS BLOCK - Early exit for truly transparent surfaces
  if (backgroundOpacity === 0) {
    return {
      ...baseStyles,
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      border: 'none',
      boxShadow: 'none',
    };
  }

    // Simple CSS fallback for mobile/low-power devices
    if (useSimpleFallback) {
      // If backgroundOpacity is 0, make it truly transparent
      const shouldBeTransparent = backgroundOpacity === 0;
      
      if (isDarkMode) {
        if (!capabilities.supportsBackdropFilter) {
          // No backdrop-filter support - solid fallback
          return {
            ...baseStyles,
            background: shouldBeTransparent ? 'transparent' : 'rgba(20, 20, 25, 0.85)',
            border: shouldBeTransparent ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: shouldBeTransparent ? 'none' : `
              inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 0 rgba(255, 255, 255, 0.08),
              0 4px 16px rgba(0, 0, 0, 0.3)
            `,
          };
        } else {
          // Has backdrop-filter - nice glass effect
          return {
            ...baseStyles,
            background: shouldBeTransparent ? 'transparent' : 'rgba(255, 255, 255, 0.06)',
            backdropFilter: shouldBeTransparent ? 'none' : `blur(${Math.min(blur, 12)}px) saturate(${Math.min(saturation, 1.5)})`,
            WebkitBackdropFilter: shouldBeTransparent ? 'none' : `blur(${Math.min(blur, 12)}px) saturate(${Math.min(saturation, 1.5)})`,
            border: shouldBeTransparent ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: shouldBeTransparent ? 'none' : `
              inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 0 rgba(255, 255, 255, 0.08),
              0 8px 32px rgba(0, 0, 0, 0.25)
            `,
          };
        }
      } else {
        // Light mode fallback
        if (!capabilities.supportsBackdropFilter) {
          return {
            ...baseStyles,
            background: shouldBeTransparent ? 'transparent' : 'rgba(255, 255, 255, 0.6)',
            border: shouldBeTransparent ? 'none' : '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: shouldBeTransparent ? 'none' : `
              inset 0 1px 0 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 0 rgba(255, 255, 255, 0.3),
              0 4px 16px rgba(0, 0, 0, 0.1)
            `,
          };
        } else {
          return {
            ...baseStyles,
            background: shouldBeTransparent ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
            backdropFilter: shouldBeTransparent ? 'none' : `blur(${Math.min(blur, 12)}px) saturate(${Math.min(saturation, 1.5)})`,
            WebkitBackdropFilter: shouldBeTransparent ? 'none' : `blur(${Math.min(blur, 12)}px) saturate(${Math.min(saturation, 1.5)})`,
            border: shouldBeTransparent ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: shouldBeTransparent ? 'none' : `
              0 8px 32px 0 rgba(31, 38, 135, 0.15),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 0 0 rgba(255, 255, 255, 0.2)
            `,
          };
        }
      }
    }

    // Full SVG filter effect (desktop only)
    return {
      ...baseStyles,
      background: isDarkMode
        ? `hsl(0 0% 0% / ${backgroundOpacity})`
        : `hsl(0 0% 100% / ${backgroundOpacity})`,
      backdropFilter: `url(#${filterId}) saturate(${saturation})`,
      boxShadow: isDarkMode
        ? `0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset,
           0 0 10px 4px color-mix(in oklch, white, transparent 85%) inset,
           0px 4px 16px rgba(17, 17, 26, 0.05),
           0px 8px 24px rgba(17, 17, 26, 0.05),
           0px 16px 56px rgba(17, 17, 26, 0.05)`
        : `0 0 2px 1px color-mix(in oklch, black, transparent 85%) inset,
           0 0 10px 4px color-mix(in oklch, black, transparent 90%) inset,
           0px 4px 16px rgba(17, 17, 26, 0.05),
           0px 8px 24px rgba(17, 17, 26, 0.05),
           0px 16px 56px rgba(17, 17, 26, 0.05)`,
    };
  }, [
    style,
    width,
    height,
    borderRadius,
    useSimpleFallback,
    isDarkMode,
    capabilities.supportsBackdropFilter,
    blur,
    saturation,
    backgroundOpacity,
    filterId,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={containerStyles}
    >
      {/* Only render SVG filter if using advanced mode and visible */}
      {!useSimpleFallback && isVisible && (
        <svg
          className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            >
              <feImage
                ref={feImageRef}
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="map"
              />

              <feDisplacementMap
                ref={redChannelRef}
                in="SourceGraphic"
                in2="map"
                result="dispRed"
              />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="red"
              />

              <feDisplacementMap
                ref={greenChannelRef}
                in="SourceGraphic"
                in2="map"
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="green"
              />

              <feDisplacementMap
                ref={blueChannelRef}
                in="SourceGraphic"
                in2="map"
                result="dispBlue"
              />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="blue"
              />

              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
            </filter>
          </defs>
        </svg>
      )}

      <div className="w-full h-full flex items-center justify-center rounded-[inherit] relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;