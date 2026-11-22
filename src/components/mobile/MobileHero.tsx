import React, { useRef } from 'react';
import { HeroContent } from '../../types';
import { HERO_CONTENT } from '../../data/siteContent';
import { ParticleTypographyCanvas } from '../hero/ParticleTypographyCanvas';
import { ExploreWorkButton } from '../hero/ExploreWorkButton';

interface MobileHeroProps {
  content?: HeroContent;
  reducedMotion?: boolean;
  onExplore: () => void;
}

export const MobileHero: React.FC<MobileHeroProps> = ({
  content = HERO_CONTENT,
  reducedMotion = false,
  onExplore,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const displayName = (content.name || 'AFRID AHMED').trim();

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[100svh] flex flex-col items-center justify-between overflow-hidden select-none touch-pan-y"
    >
      {/* Semantic accessible heading */}
      <h1 className="sr-only">{displayName}</h1>

      {/* Soft Feathered Scrim Blending Seamlessly Into Global Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 88% 60% at 50% 45%, rgba(8, 8, 8, 0.72) 0%, rgba(12, 16, 24, 0.32) 54%, transparent 92%)',
        }}
      />

      {/* Restrained Cool Pale-Blue Horizon Depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 50% at 50% 45%, rgba(168, 206, 255, 0.05) 0%, rgba(168, 206, 255, 0.015) 48%, transparent 80%)',
        }}
      />

      {/* Interactive Two-Line Particle Constellation Canvas */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        <ParticleTypographyCanvas
          text={displayName}
          variant="mobile"
          reducedMotion={reducedMotion}
          interactiveContainerRef={containerRef}
        />
      </div>

      {/* Top spacer to keep constellation balanced below minimal nav */}
      <div className="h-16 shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Bottom EXPLORE Interaction -> About */}
      <div className="relative z-20 w-full flex flex-col items-center justify-end pb-9 pt-4 px-4">
        <ExploreWorkButton
          id="mobile-hero-explore"
          label="EXPLORE"
          onClick={onExplore}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
};
