import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { AboutDynamicIcon } from '../../data/aboutIcons';
import { AboutHighlightItem, AboutInterestItem, AboutVisualSettings } from '../../types';
import { AboutOrbitalPortrait } from '../about/AboutOrbitalPortrait';

interface MobileAboutProps {
  sectionLabel?: string;
  displayHeading?: string;
  displayHeadingAccent?: string;
  displaySubtitle?: string;
  firstName: string;
  lastName: string;
  fullNameAlt: string;
  academicLine: string;
  introParagraph: string;
  portraitUrl: string;
  signatureUrl: string;
  badge: {
    institution: string;
    program: string;
    graduationYear: string;
    iconName: string;
    supportingText: string;
  };
  interests: AboutInterestItem[];
  highlights: AboutHighlightItem[];
  visual: AboutVisualSettings;
  forceMobileLayout?: boolean;
  isPreviewMode?: boolean;
  reducedMotion?: boolean;
}

export const MobileAbout: React.FC<MobileAboutProps> = ({
  sectionLabel,
  displayHeading = 'ABOUT',
  displayHeadingAccent = 'ME',
  displaySubtitle,
  firstName,
  lastName,
  fullNameAlt,
  academicLine,
  introParagraph,
  portraitUrl,
  signatureUrl,
  badge,
  interests,
  highlights,
  visual,
  forceMobileLayout = false,
  isPreviewMode = false,
  reducedMotion = false,
}) => {
  const [signatureError, setSignatureError] = useState(false);

  useEffect(() => {
    setSignatureError(false);
  }, [signatureUrl]);

  const cardOuterRadiusClass =
    visual.cardRadius === 'lg'
      ? 'rounded-2xl'
      : visual.cardRadius === '2xl'
      ? 'rounded-[28px]'
      : 'rounded-[22px]';

  const cardInnerRadiusClass =
    visual.cardRadius === 'lg'
      ? 'rounded-[15px]'
      : visual.cardRadius === '2xl'
      ? 'rounded-[27px]'
      : 'rounded-[21px]';

  const cardPaddingClass =
    visual.cardSpacing === 'compact'
      ? 'p-4'
      : visual.cardSpacing === 'relaxed'
      ? 'p-5 min-[390px]:p-6'
      : 'p-4 min-[390px]:p-5';

  const cardGapClass =
    visual.cardSpacing === 'compact'
      ? 'gap-3'
      : visual.cardSpacing === 'relaxed'
      ? 'gap-4.5'
      : 'gap-3.5';

  const glowOpacityClass =
    visual.glowIntensity === 'subtle'
      ? 'opacity-35'
      : visual.glowIntensity === 'vivid'
      ? 'opacity-100'
      : 'opacity-75';

  const hasPortraitColumn = visual.showPortrait;
  const hasCardColumn = visual.showProfileCard;

  const biographyParagraphs = introParagraph
    ? introParagraph
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const showInlineGraduationYear =
    Boolean(badge.graduationYear) && (!hasPortraitColumn || !visual.showEducationBadge);

  const highlightGridColsClass =
    highlights.length === 1
      ? 'grid-cols-1'
      : highlights.length === 3
      ? 'grid-cols-1 min-[390px]:grid-cols-3'
      : 'grid-cols-2';

  const layoutWrapperClass = forceMobileLayout
    ? 'flex flex-col items-center gap-6 w-full max-w-md mx-auto'
    : hasPortraitColumn && hasCardColumn
    ? 'flex flex-col items-center gap-6 md:grid md:grid-cols-12 md:gap-6 min-[820px]:gap-8 md:items-center w-full max-w-md md:max-w-4xl mx-auto'
    : 'flex justify-center items-center w-full max-w-md md:max-w-2xl mx-auto';

  const portraitColClass = forceMobileLayout
    ? 'w-full flex justify-center'
    : hasCardColumn
    ? 'w-full flex justify-center md:col-span-5'
    : 'w-full flex justify-center';

  const cardColClass = forceMobileLayout
    ? 'w-full relative'
    : hasPortraitColumn
    ? 'w-full relative md:col-span-7'
    : 'w-full relative';

  return (
    <div className="w-full flex flex-col gap-5 md:gap-7">
      {/* 1. CENTERED SECTION HEADING (Matches Desktop Identity) */}
      <motion.header
        initial={reducedMotion || isPreviewMode ? false : { opacity: 0, y: 12 }}
        whileInView={isPreviewMode ? undefined : { opacity: 1, y: 0 }}
        viewport={isPreviewMode ? undefined : { once: true, amount: 0.25 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-xl mx-auto px-1"
      >
        {sectionLabel && (
          <div className="inline-flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11px] font-mono tracking-[0.2em] text-[var(--text-secondary)] uppercase mb-1.5">
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
            <span>{sectionLabel}</span>
          </div>
        )}

        <h2
          className={`font-display font-extrabold text-[var(--text-primary)] tracking-tight leading-[1.06] ${
            forceMobileLayout
              ? 'text-[28px] min-[390px]:text-[32px]'
              : 'text-[28px] min-[390px]:text-[32px] md:text-[34px]'
          }`}
        >
          {displayHeading}
          {displayHeadingAccent && (
            <>
              {' '}
              <span className="text-[var(--text-secondary)]">{displayHeadingAccent}</span>
            </>
          )}
        </h2>

        {displaySubtitle && (
          <p className="mt-1.5 text-xs sm:text-[13px] text-[var(--text-secondary)] font-light tracking-wide">
            {displaySubtitle}
          </p>
        )}

        {visual.showSectionDivider && (
          <div
            className="w-20 h-[1px] mx-auto mt-3 bg-gradient-to-r from-transparent via-[var(--text-primary)]/40 to-transparent"
            aria-hidden="true"
          />
        )}
      </motion.header>

      {/* 2. RESPONSIVE COMPOSITION (Vertical on Mobile, Two-Column on Tablet) */}
      <div className={layoutWrapperClass}>
        {/* ORBITAL PORTRAIT */}
        {hasPortraitColumn && (
          <div className={portraitColClass}>
            <AboutOrbitalPortrait
              portraitUrl={portraitUrl}
              fullNameAlt={fullNameAlt}
              badge={badge}
              visual={visual}
              variant={forceMobileLayout ? 'mobile' : 'responsive'}
              isPreviewMode={isPreviewMode}
              reducedMotion={reducedMotion}
            />
          </div>
        )}

        {/* COMPACT TRANSLUCENT PROFILE CARD */}
        {hasCardColumn && (
          <motion.div
            initial={reducedMotion || isPreviewMode ? false : { opacity: 0, y: 16 }}
            whileInView={isPreviewMode ? undefined : { opacity: 1, y: 0 }}
            viewport={isPreviewMode ? undefined : { once: true, amount: 0.15 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className={cardColClass}
          >
            {/* Subtle Ambient Lighting Around Card Edges */}
            <div
              className={`absolute -inset-2.5 rounded-[26px] pointer-events-none ${glowOpacityClass}`}
              style={{
                background:
                  'radial-gradient(ellipse at 30% 20%, rgba(220, 236, 255, 0.07), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(160, 160, 160, 0.05), transparent 55%)',
                filter: 'blur(20px)',
              }}
              aria-hidden="true"
            />

            {/* Hairline Gradient Border Frame */}
            <div
              className={`relative ${cardOuterRadiusClass} p-[1px] bg-gradient-to-br from-[#F5F5F5]/25 via-[#292929] to-[#DCEBFF]/15 shadow-[var(--shadow-card)]`}
            >
              <article
                className={`${cardPaddingClass} relative overflow-hidden ${cardInnerRadiusClass} bg-[var(--bg-surface-blur)] backdrop-blur-xl`}
              >
                {/* Top Specular Light Rim */}
                <div
                  className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[var(--text-primary)]/30 to-transparent pointer-events-none"
                  aria-hidden="true"
                />

                {/* Subtle Corner Atmospheric Highlight */}
                {visual.showCosmicDecor && (
                  <div
                    className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#DCEBFF]/[0.05] blur-3xl pointer-events-none"
                    aria-hidden="true"
                  />
                )}

                <div className={`relative z-10 flex flex-col ${cardGapClass}`}>
                  {/* A. Name + Academic Credentials + Signature */}
                  <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-extrabold text-[23px] min-[390px]:text-[25px] leading-tight tracking-tight text-[var(--text-primary)]">
                        {firstName}
                        {lastName && (
                          <>
                            {' '}
                            <span className="text-[var(--text-secondary)]">{lastName}</span>
                          </>
                        )}
                      </h3>
                      {(academicLine || showInlineGraduationYear) && (
                        <p className="mt-1 text-[11.5px] sm:text-xs font-mono text-[var(--text-secondary)] leading-relaxed tracking-wide">
                          {academicLine}
                          {showInlineGraduationYear && (
                            <>
                              {academicLine ? ' · ' : ''}
                              <span className="text-[var(--text-primary)]/90">
                                {badge.graduationYear}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    {visual.showSignature && signatureUrl && !signatureError && (
                      <div className="shrink-0 flex items-center justify-end pl-1">
                        <img
                          src={signatureUrl}
                          alt={`${fullNameAlt} signature`}
                          className="h-7 sm:h-8 w-auto max-w-[100px] object-contain opacity-90 select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                          onError={() => setSignatureError(true)}
                        />
                      </div>
                    )}
                  </div>

                  {/* B. Complete Biography (Never Truncated) */}
                  {biographyParagraphs.length > 0 && (
                    <div className="space-y-2.5">
                      {biographyParagraphs.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className="text-[13px] min-[390px]:text-[13.5px] leading-[1.65] text-[var(--text-secondary)] font-light"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* C. All Interest Tags in Neatly Wrapping Rows */}
                  {visual.showInterestTags && interests.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 min-[390px]:gap-2">
                      {interests.map((interest) => (
                        <span
                          key={interest.id}
                          title={interest.description || undefined}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 px-3 py-1.5 text-[11.5px] font-medium text-[var(--text-primary)] whitespace-nowrap"
                        >
                          <AboutDynamicIcon
                            name={interest.iconName}
                            className="w-3.5 h-3.5 text-[var(--text-primary)] shrink-0"
                          />
                          <span>{interest.title}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* D. Compact Highlights Panel */}
                  {visual.showHighlights && highlights.length > 0 && (
                    <div
                      className={`mt-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--border-subtle)] grid ${highlightGridColsClass} gap-px overflow-hidden`}
                    >
                      {highlights.map((highlight) => (
                        <div
                          key={highlight.id}
                          title={highlight.description || undefined}
                          className="bg-[#0B0B0D]/90 px-2.5 py-2.5 flex flex-col items-center justify-center text-center gap-1.5"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                            <AboutDynamicIcon
                              name={highlight.iconName}
                              className="w-3.5 h-3.5"
                            />
                          </div>
                          <span className="text-[11px] font-display font-semibold text-[var(--text-primary)] leading-snug text-balance">
                            {highlight.title}
                          </span>
                          {highlight.supportingText && (
                            <span className="text-[9.5px] font-mono text-[var(--text-secondary)] leading-tight">
                              {highlight.supportingText}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
