import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, User } from 'lucide-react';
import { AboutDynamicIcon } from '../../data/aboutIcons';
import { AboutVisualSettings } from '../../types';

interface AboutOrbitalPortraitProps {
  portraitUrl: string;
  fullNameAlt: string;
  badge: {
    institution: string;
    program: string;
    graduationYear: string;
    iconName: string;
    supportingText: string;
  };
  visual: AboutVisualSettings;
  variant?: 'mobile' | 'tablet' | 'responsive';
  isPreviewMode?: boolean;
  reducedMotion?: boolean;
}

export const AboutOrbitalPortrait: React.FC<AboutOrbitalPortraitProps> = ({
  portraitUrl,
  fullNameAlt,
  badge,
  visual,
  variant = 'responsive',
  isPreviewMode = false,
  reducedMotion = false,
}) => {
  const [portraitError, setPortraitError] = useState(false);

  useEffect(() => {
    setPortraitError(false);
  }, [portraitUrl]);

  const glowOpacityClass =
    visual.glowIntensity === 'subtle'
      ? 'opacity-35'
      : visual.glowIntensity === 'vivid'
      ? 'opacity-100'
      : 'opacity-75';

  const sizeClass =
    variant === 'tablet'
      ? 'w-[196px] h-[196px] min-[820px]:w-[222px] min-[820px]:h-[222px]'
      : variant === 'mobile'
      ? 'w-[164px] h-[164px] min-[390px]:w-[178px] min-[390px]:h-[178px] min-[430px]:w-[192px] min-[430px]:h-[192px]'
      : 'w-[164px] h-[164px] min-[390px]:w-[178px] min-[390px]:h-[178px] min-[430px]:w-[192px] min-[430px]:h-[192px] md:w-[196px] md:h-[196px] min-[820px]:w-[222px] min-[820px]:h-[222px]';

  const outerOrbitInset =
    variant === 'tablet'
      ? '-inset-[18px]'
      : variant === 'mobile'
      ? '-inset-[16px]'
      : '-inset-[16px] md:-inset-[18px]';

  const middleOrbitInset =
    variant === 'tablet'
      ? '-inset-[9px]'
      : variant === 'mobile'
      ? '-inset-[8px]'
      : '-inset-[8px] md:-inset-[9px]';

  const auraInset =
    variant === 'tablet'
      ? '-inset-8'
      : variant === 'mobile'
      ? '-inset-7'
      : '-inset-7 md:-inset-8';

  return (
    <motion.div
      initial={reducedMotion || isPreviewMode ? false : { opacity: 0, scale: 0.94 }}
      whileInView={isPreviewMode ? undefined : { opacity: 1, scale: 1 }}
      viewport={isPreviewMode ? undefined : { once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center relative py-3"
    >
      <div className={`${sizeClass} relative flex items-center justify-center`}>
        {/* Subtle Silver & Pale-Blue Atmospheric Aura Behind Portrait */}
        {visual.showCosmicDecor && (
          <div
            className={`absolute ${auraInset} rounded-full pointer-events-none ${glowOpacityClass}`}
            style={{
              background:
                'radial-gradient(circle at 50% 46%, rgba(220, 236, 255, 0.14) 0%, rgba(245, 245, 245, 0.08) 42%, transparent 72%)',
              filter: 'blur(26px)',
            }}
            aria-hidden="true"
          />
        )}

        {/* Concentric Orbital Rings & Gliding Particles */}
        {visual.showCosmicDecor && (
          <>
            <div
              className={`${
                reducedMotion ? '' : 'about-orbit-spin'
              } absolute ${outerOrbitInset} rounded-full border border-dashed border-[var(--border-strong)] pointer-events-none`}
              aria-hidden="true"
            >
              <span className="absolute top-[11%] right-[15%] w-2 h-2 rounded-full bg-[#F5F5F5] shadow-[0_0_10px_rgba(210,232,255,0.65)]" />
              <span className="absolute bottom-[13%] left-[14%] w-1.5 h-1.5 rounded-full bg-[#C8DEFF]/80 shadow-[0_0_8px_rgba(180,210,255,0.45)]" />
            </div>

            <div
              className={`${
                reducedMotion ? '' : 'about-orbit-spin-reverse'
              } absolute ${middleOrbitInset} rounded-full border border-[var(--border-subtle)] pointer-events-none`}
              aria-hidden="true"
            >
              <span className="absolute top-[22%] left-[8%] w-1 h-1 rounded-full bg-[#DCEBFF]/75" />
            </div>
          </>
        )}

        {/* Static Inner Precision Halo Ring */}
        <div
          className="absolute -inset-1 rounded-full border border-[var(--border-strong)] pointer-events-none"
          aria-hidden="true"
        />

        {/* Circular Portrait Container */}
        <div className="relative w-full h-full rounded-full overflow-hidden border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
          {portraitUrl && !portraitError ? (
            <img
              src={portraitUrl}
              alt={fullNameAlt}
              className={`w-full h-full ${
                visual.portraitFit === 'contain' ? 'object-contain' : 'object-cover'
              } filter contrast-[1.04] brightness-[0.96] transition-transform duration-300`}
              style={{
                objectPosition: visual.portraitPosition || '50% 15%',
                transform: `scale(${visual.portraitScale || 1})`,
              }}
              referrerPolicy="no-referrer"
              onError={() => setPortraitError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
              <User className="w-12 h-12 mb-1.5 stroke-[1.25]" aria-hidden="true" />
              <span className="font-display text-[10px] tracking-widest uppercase text-[var(--text-secondary)]">
                {fullNameAlt}
              </span>
            </div>
          )}

          {/* Soft Radial Vignette Blending Portrait Seamlessly Into Dark Backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, transparent 56%, rgba(8, 8, 8, 0.52) 82%, rgba(8, 8, 8, 0.92) 100%)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Floating Education Badge Anchored Below Portrait */}
        {visual.showEducationBadge &&
          (badge.institution || badge.program || badge.graduationYear) && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-blur)] backdrop-blur-md px-3.5 py-1 shadow-[var(--shadow-card)] whitespace-nowrap">
                <AboutDynamicIcon
                  name={badge.iconName}
                  fallback={GraduationCap}
                  className="w-3.5 h-3.5 text-[var(--text-primary)] shrink-0"
                />
                <span className="font-display font-bold text-[11.5px] text-[var(--text-primary)] tracking-wide">
                  {[badge.institution, badge.program].filter(Boolean).join(' ')}
                </span>
                {badge.graduationYear && (
                  <>
                    <span className="text-[var(--text-muted)] text-[11px]" aria-hidden="true">
                      /
                    </span>
                    <span className="font-mono text-[10.5px] font-medium text-[var(--text-secondary)]">
                      {badge.graduationYear}
                    </span>
                  </>
                )}
              </div>
              {badge.supportingText && (
                <span className="mt-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[9.5px] font-mono text-[var(--text-secondary)] whitespace-nowrap border border-[var(--border-subtle)]">
                  {badge.supportingText}
                </span>
              )}
            </div>
          )}
      </div>
    </motion.div>
  );
};
