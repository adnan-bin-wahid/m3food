'use client';

import { useEffect } from 'react';

export function SmoothScroll() {
  useEffect(() => {
    // Respect user reduced-motion preference
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Allow native browser inertia scrolling on touch devices and mobile viewports
    const isTouchOrMobile =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 768px)').matches ||
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    if (isTouchOrMobile) return;

    let destroyed = false;
    let cleanup: (() => void) | undefined;

    Promise.all([
      import('lenis'),
      import('gsap'),
      import('gsap/ScrollTrigger')
    ]).then(([{ default: Lenis }, { default: gsap }, { ScrollTrigger }]) => {
      if (destroyed) return;

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.2,
      });

      (window as unknown as { __lenis?: unknown }).__lenis = lenis;

      lenis.on('scroll', ScrollTrigger.update);

      const updateTicker = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(updateTicker);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(updateTicker);
        lenis.destroy();
        delete (window as unknown as { __lenis?: unknown }).__lenis;
      };
    }).catch(() => {
      // Ignore dynamic import failure in non-critical smooth scrolling
    });

    return () => {
      destroyed = true;
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}
