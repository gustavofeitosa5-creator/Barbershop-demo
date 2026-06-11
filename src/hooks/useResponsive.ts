/**
 * Custom React Hook para detectar breakpoints responsivos
 * Uso: const { isMobile, isTablet, isDesktop } = useResponsive();
 */

import { useState, useEffect } from 'react';

export interface ResponsiveBreakpoints {
  isMobile: boolean;        // < 480px
  isSmall: boolean;         // 480px - 768px
  isTablet: boolean;        // 480px - 1024px (small + medium)
  isMedium: boolean;        // 769px - 1024px
  isDesktop: boolean;       // >= 1025px
  isLargeDesktop: boolean;  // >= 1440px
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useResponsive(): ResponsiveBreakpoints {
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>({
    isMobile: window.innerWidth < 480,
    isSmall: window.innerWidth >= 480 && window.innerWidth <= 768,
    isTablet: window.innerWidth >= 480 && window.innerWidth <= 1024,
    isMedium: window.innerWidth >= 769 && window.innerWidth <= 1024,
    isDesktop: window.innerWidth >= 1025,
    isLargeDesktop: window.innerWidth >= 1440,
    isLandscape: window.innerHeight < window.innerWidth,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setBreakpoints({
        isMobile: width < 480,
        isSmall: width >= 480 && width <= 768,
        isTablet: width >= 480 && width <= 1024,
        isMedium: width >= 769 && width <= 1024,
        isDesktop: width >= 1025,
        isLargeDesktop: width >= 1440,
        isLandscape: height < width,
        screenWidth: width,
        screenHeight: height,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoints;
}

/**
 * Hook para usar media queries como condições
 * Uso: const isSmall = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook para detectar se está em modo escuro
 */
export function useDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook para detectar se o usuário prefere menos movimento
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook para detectar se está em modo alto contraste
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: more)');
}

/**
 * Hook para obter orientação do dispositivo
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const isLandscape = useMediaQuery('(orientation: landscape)');
  return isLandscape ? 'landscape' : 'portrait';
}

/**
 * Hook para detectar touch device
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const hasTouch = 
      () => !!(
        typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          (window.navigator && 'maxTouchPoints' in window.navigator && window.navigator.maxTouchPoints > 0))
      );

    setIsTouch(hasTouch());
  }, []);

  return isTouch;
}

export default useResponsive;
