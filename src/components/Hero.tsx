import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { HERO_CONTENT } from '../data/siteContent';
import { HeroContent } from '../types';
import { MobileHero } from './mobile/MobileHero';
import { ParticleTypographyCanvas } from './hero/ParticleTypographyCanvas';
import { ExploreWorkButton } from './hero/ExploreWorkButton';

interface HeroProps {
  content?: HeroContent;
  onExploreWork?: () => void;
  onExploreAbout?: () => void;
  onWatch?: () => void;
  onConnect?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  content = HERO_CONTENT,
  onExploreAbout,
}) => {
  const desktopContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setIsDesktop(desktopQuery.matches);
    setReducedMotion(motionQuery.matches);

    const onDesktopChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    desktopQuery.addEventListener('change', onDesktopChange);
    motionQuery.addEventListener('change', onMotionChange);

    return () => {
      desktopQuery.removeEventListener('change', onDesktopChange);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);

  const handleExploreAbout = useCallback(() => {
    if (onExploreAbout) {
      onExploreAbout();
      return;
    }
    const aboutEl = document.getElementById('about');
    if (!aboutEl) return;
    const headerEl = document.querySelector('header');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 72;
    const targetTop = Math.max(
      0,
      aboutEl.getBoundingClientRect().top + window.scrollY - headerHeight - 8
    );
    window.scrollTo({
      top: targetTop,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [onExploreAbout, reducedMotion]);

  const displayName = (content.name || 'AFRID AHMED').trim();

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] w-full overflow-hidden z-10 select-none scroll-mt-20 sm:scroll-mt-24"
    >
      {isDesktop ? (
        /* ===================================================================== */
        /* DESKTOP HERO (lg+): PARTICLE TYPOGRAPHY + LIQUID LIGHT + ORBITALS      */
        /* ===================================================================== */
        <div
          ref={desktopContainerRef}
          className="relative w-full min-h-[100svh] flex flex-col items-center justify-between overflow-hidden"
        >
          {/* Semantic Accessible Headline */}
          <h1 className="sr-only">{displayName}</h1>

          {/* Soft Center Atmospheric Scrim — Feathers Smoothly Into Shared Background */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background:
                'radial-gradient(ellipse 72% 58% at 50% 45%, rgba(8, 8, 8, 0.72) 0%, rgba(12, 16, 24, 0.35) 54%, transparent 92%)',
            }}
          />

          {/* Subtle Pale-Blue Horizon Luminance */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background:
                'radial-gradient(ellipse 64% 44% at 50% 45%, rgba(168, 206, 255, 0.055) 0%, rgba(168, 206, 255, 0.015) 52%, transparent 80%)',
            }}
          />

          {/* Full-Canvas Interactive Particle Constellation */}
          <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            <ParticleTypographyCanvas
              text={displayName}
              variant="desktop"
              reducedMotion={reducedMotion}
              interactiveContainerRef={desktopContainerRef}
            />
          </div>

          {/* Top Nav Clearance */}
          <div className="h-24 shrink-0 pointer-events-none" aria-hidden="true" />

          {/* Bottom Centered EXPLORE Interaction & Scroll Cue -> About */}
          <div className="relative z-20 w-full max-w-6xl mx-auto px-8 pb-8 flex flex-col items-center justify-end gap-3">
            <ExploreWorkButton
              id="hero-link-explore"
              label="EXPLORE"
              onClick={handleExploreAbout}
              reducedMotion={reducedMotion}
            />

            {/* Subtle minimal scroll indicator */}
            <motion.button
              type="button"
              onClick={handleExploreAbout}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 0.55 }}
              whileHover={{ opacity: 0.9 }}
              transition={{ duration: 0.9, delay: reducedMotion ? 0 : 1.25 }}
              aria-label="Scroll to About section"
              className="mt-1 flex flex-col items-center gap-1.5 cursor-pointer py-1 px-3 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
            >
              <span className="font-mono text-[9.5px] tracking-[0.28em] uppercase text-[var(--text-muted)]">
                SCROLL
              </span>
              <span
                aria-hidden="true"
                className="w-[1px] h-4 bg-gradient-to-b from-[#A8C8EE]/70 to-transparent"
              />
            </motion.button>
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* MOBILE & TABLET HERO (< lg): PRESERVED TWO-LINE CONSTELLATION          */
        /* ===================================================================== */
        <MobileHero
          content={content}
          reducedMotion={reducedMotion}
          onExplore={handleExploreAbout}
        />
      )}
    </section>
  );
};
