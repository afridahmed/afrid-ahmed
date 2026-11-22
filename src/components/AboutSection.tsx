import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { User, GraduationCap } from 'lucide-react';
import { ABOUT_CONTENT } from '../data/siteContent';
import { AboutContent } from '../types';
import { AboutDynamicIcon } from '../data/aboutIcons';
import {
  DEFAULT_ABOUT_HIGHLIGHTS,
  DEFAULT_ABOUT_INTERESTS,
  DEFAULT_ABOUT_VISUAL_SETTINGS,
  sanitizeAboutUrl,
} from '../services/aboutCmsService';
import { MobileAbout } from './mobile/MobileAbout';

interface AboutSectionProps {
  content?: AboutContent;
  isPreviewMode?: boolean;
  previewDevice?: 'auto' | 'desktop' | 'mobile';
}

function formatSplitName(rawName?: string): { first: string; rest: string } {
  const cleaned = (rawName || 'Afrid Ahmed').trim();
  if (!cleaned) return { first: 'Afrid', rest: 'Ahmed' };

  const normalizedWords = cleaned.split(/\s+/).map((word) => {
    if (word === word.toUpperCase() && word.length > 1) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  });

  if (normalizedWords.length === 1) {
    return { first: normalizedWords[0], rest: '' };
  }

  return {
    first: normalizedWords.slice(0, -1).join(' '),
    rest: normalizedWords[normalizedWords.length - 1],
  };
}

function formatSubtitleSentence(statement?: string): string {
  const raw = (statement || 'Curious by default. Building by choice.').trim();
  if (raw === 'CURIOUS BY DEFAULT. BUILDING BY CHOICE.') {
    return 'Curious by default. Building by choice.';
  }
  return raw;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  content = ABOUT_CONTENT,
  isPreviewMode = false,
  previewDevice = 'auto',
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [portraitLoadError, setPortraitLoadError] = useState(false);
  const [signatureLoadError, setSignatureLoadError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const sanitizedPortraitUrl = sanitizeAboutUrl(content.photo);
  const sanitizedSignatureUrl = sanitizeAboutUrl(content.profileCard?.signatureImageUrl);

  useEffect(() => {
    setPortraitLoadError(false);
  }, [sanitizedPortraitUrl]);

  useEffect(() => {
    setSignatureLoadError(false);
  }, [sanitizedSignatureUrl]);

  const visual = useMemo(
    () => ({
      ...DEFAULT_ABOUT_VISUAL_SETTINGS,
      ...(content.visualSettings || {}),
    }),
    [content.visualSettings]
  );

  if (!isPreviewMode && content.isPublished === false) {
    return null;
  }

  const bioList =
    Array.isArray(content.biography) && content.biography.length > 0
      ? content.biography
      : ABOUT_CONTENT.biography;

  const introParagraph =
    content.profileCard?.introduction?.trim() ||
    bioList[0] ||
    ABOUT_CONTENT.biography[0];

  const fallbackSplit = formatSplitName(content.photoCaption?.name || 'Afrid Ahmed');
  const firstName = content.profileCard?.fullName?.trim() || fallbackSplit.first;
  const lastName =
    content.profileCard?.nameAccent !== undefined
      ? content.profileCard.nameAccent.trim()
      : fallbackSplit.rest;
  const fullNameAlt =
    content.portraitAlt?.trim() ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    'Afrid Ahmed';

  const academicRole = content.profileCard?.academicRole?.trim() || 'SLIIT Undergraduate';
  const degreeProgram =
    content.profileCard?.degreeProgram?.trim() || 'BSc (Hons) in Computer Science';
  const institution = content.profileCard?.institution?.trim() || 'SLIIT';
  const academicLineParts = [academicRole, degreeProgram];
  if (
    institution &&
    !academicRole.toLowerCase().includes(institution.toLowerCase()) &&
    !degreeProgram.toLowerCase().includes(institution.toLowerCase())
  ) {
    academicLineParts.push(institution);
  }
  const academicLine = academicLineParts.filter(Boolean).join(' · ');

  const sectionLabel = content.sectionLabel ?? content.badge ?? ABOUT_CONTENT.badge;
  const rawHeading = (content.heading ?? content.title ?? '').trim();
  const isLegacyDefaultTitle =
    !rawHeading || rawHeading.toUpperCase() === 'ABOUT AFRID' || rawHeading.toUpperCase() === 'ABOUT ME';
  const displayHeading =
    content.heading !== undefined
      ? content.heading
      : isLegacyDefaultTitle
      ? 'ABOUT'
      : rawHeading;
  const displayHeadingAccent =
    content.headingAccent !== undefined
      ? content.headingAccent
      : isLegacyDefaultTitle
      ? 'ME'
      : '';
  const displaySubtitle =
    content.subtitle !== undefined
      ? content.subtitle
      : formatSubtitleSentence(content.statement);

  const badge = {
    institution: content.educationBadge?.institution ?? 'SLIIT',
    program: content.educationBadge?.program ?? 'CS',
    graduationYear: content.educationBadge?.graduationYear ?? 'Class of 2030',
    iconName: content.educationBadge?.iconName ?? 'GraduationCap',
    supportingText: content.educationBadge?.supportingText ?? '',
  };

  const visibleInterests = useMemo(() => {
    const source =
      content.interests !== undefined ? content.interests : DEFAULT_ABOUT_INTERESTS;
    return [...source]
      .filter((item) => item.isVisible !== false && item.title.trim().length > 0)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [content.interests]);

  const visibleHighlights = useMemo(() => {
    const source =
      content.highlights !== undefined ? content.highlights : DEFAULT_ABOUT_HIGHLIGHTS;
    return [...source]
      .filter((item) => item.isVisible !== false && item.title.trim().length > 0)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [content.highlights]);

  const highlightGridColsClass =
    visibleHighlights.length === 1
      ? 'grid-cols-1'
      : visibleHighlights.length === 2
      ? 'grid-cols-2'
      : visibleHighlights.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-4';

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
      ? 'p-4 xl:p-5'
      : visual.cardSpacing === 'relaxed'
      ? 'p-6 xl:p-8'
      : 'about-desktop-card';

  const cardGapClass =
    visual.cardSpacing === 'compact'
      ? 'gap-3 xl:gap-3.5'
      : visual.cardSpacing === 'relaxed'
      ? 'gap-5 xl:gap-6'
      : 'gap-4 xl:gap-5';

  const glowOpacityClass =
    visual.glowIntensity === 'subtle'
      ? 'opacity-35'
      : visual.glowIntensity === 'vivid'
      ? 'opacity-100'
      : 'opacity-75';

  const showMobileOnly = previewDevice === 'mobile';
  const showDesktopOnly = previewDevice === 'desktop';

  const mobileContainerClass = showDesktopOnly
    ? 'hidden'
    : showMobileOnly
    ? 'relative flex flex-col overflow-visible pb-4 max-w-md mx-auto'
    : 'relative flex flex-col lg:hidden overflow-visible pb-4 max-w-md md:max-w-4xl mx-auto';

  const desktopContainerClass = showMobileOnly
    ? 'hidden'
    : showDesktopOnly
    ? 'block'
    : 'hidden lg:block';

  const hasPortraitColumn = visual.showPortrait;
  const hasCardColumn = visual.showProfileCard;

  return (
    <section
      id={isPreviewMode ? undefined : 'about'}
      className={`${
        isPreviewMode ? 'py-6 px-4 sm:px-6' : 'about-desktop-section py-12 sm:py-16 lg:py-0 px-4 sm:px-6 md:px-6 min-[820px]:px-10 lg:px-8 scroll-mt-20'
      } relative w-full z-10`}
    >
      <div className="max-w-6xl xl:max-w-[1220px] mx-auto w-full">
        {/* ========================================================================= */}
        {/* 1. MOBILE & TABLET ABOUT COMPOSITION (< lg) — ORBITAL + TRANSLUCENT CARD  */}
        {/* ========================================================================= */}
        <div className={mobileContainerClass}>
          <MobileAbout
            sectionLabel={sectionLabel}
            displayHeading={displayHeading}
            displayHeadingAccent={displayHeadingAccent}
            displaySubtitle={displaySubtitle}
            firstName={firstName}
            lastName={lastName}
            fullNameAlt={fullNameAlt}
            academicLine={academicLine}
            introParagraph={introParagraph}
            portraitUrl={sanitizedPortraitUrl}
            signatureUrl={sanitizedSignatureUrl}
            badge={badge}
            interests={visibleInterests}
            highlights={visibleHighlights}
            visual={visual}
            forceMobileLayout={showMobileOnly}
            isPreviewMode={isPreviewMode}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP ABOUT COMPOSITION (lg+): PORTRAIT + ORBITAL RINGS + GLASS CARD */}
        {/* ========================================================================= */}
        <div className={desktopContainerClass}>
          {/* Centered Compact Section Heading */}
          <motion.header
            initial={reducedMotion || isPreviewMode ? false : { opacity: 0, y: 12 }}
            whileInView={isPreviewMode ? undefined : { opacity: 1, y: 0 }}
            viewport={isPreviewMode ? undefined : { once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="about-desktop-header text-center max-w-2xl mx-auto mb-5"
          >
            {sectionLabel && (
              <div className="inline-flex items-center justify-center gap-2 text-[11px] font-mono tracking-[0.2em] text-[var(--text-secondary)] uppercase mb-1.5">
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{sectionLabel}</span>
              </div>
            )}

            <h2 className="about-desktop-title font-display font-extrabold text-[var(--text-primary)] tracking-tight">
              {displayHeading}
              {displayHeadingAccent && (
                <>
                  {' '}
                  <span className="text-[var(--text-secondary)]">
                    {displayHeadingAccent}
                  </span>
                </>
              )}
            </h2>

            {displaySubtitle && (
              <p className="mt-1.5 text-xs xl:text-sm text-[var(--text-secondary)] font-light tracking-wide">
                {displaySubtitle}
              </p>
            )}

            {visual.showSectionDivider && (
              <div
                className="w-24 h-[1px] mx-auto mt-3 bg-gradient-to-r from-transparent via-[var(--text-primary)]/40 to-transparent"
                aria-hidden="true"
              />
            )}
          </motion.header>

          {/* Balanced Two-Column Composition */}
          <div
            className={
              hasPortraitColumn && hasCardColumn
                ? 'grid grid-cols-12 gap-8 xl:gap-12 items-center'
                : 'flex justify-center items-center'
            }
          >
            {/* LEFT COLUMN — Prominent Portrait + Monochrome Orbital Rings + Floating Badge */}
            {hasPortraitColumn && (
              <motion.div
                initial={reducedMotion || isPreviewMode ? false : { opacity: 0, scale: 0.96 }}
                whileInView={isPreviewMode ? undefined : { opacity: 1, scale: 1 }}
                viewport={isPreviewMode ? undefined : { once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className={`${
                  hasCardColumn ? 'col-span-5' : 'w-full max-w-md'
                } flex flex-col items-center justify-center relative py-2`}
              >
                <div className="about-desktop-portrait-wrap relative flex items-center justify-center">
                  {/* Atmospheric Monochrome Aura Behind Portrait */}
                  {visual.showCosmicDecor && (
                    <div
                      className={`absolute -inset-10 rounded-full pointer-events-none ${glowOpacityClass}`}
                      style={{
                        background:
                          'radial-gradient(circle at 50% 48%, rgba(245, 245, 245, 0.14) 0%, rgba(160, 160, 160, 0.06) 44%, transparent 72%)',
                        filter: 'blur(34px)',
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Outer Rotating Orbital Track + Subtle Accent Nodes */}
                  {visual.showCosmicDecor && (
                    <>
                      <div
                        className="about-orbit-spin absolute -inset-6 rounded-full border border-dashed border-[var(--border-strong)] pointer-events-none"
                        aria-hidden="true"
                      >
                        <span className="absolute top-[11%] right-[16%] w-2 h-2 rounded-full bg-[var(--text-primary)] shadow-[0_0_10px_rgba(245,245,245,0.45)]" />
                        <span className="absolute bottom-[14%] left-[14%] w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]" />
                      </div>

                      <div
                        className="about-orbit-spin-reverse absolute -inset-3 rounded-full border border-[var(--border-subtle)] pointer-events-none"
                        aria-hidden="true"
                      />
                    </>
                  )}

                  {/* Subtle Static Precision Halo Ring */}
                  <div
                    className="absolute -inset-1 rounded-full border border-[var(--border-strong)] pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Profile Portrait Container */}
                  <div className="relative w-full h-full rounded-full overflow-hidden border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
                    {sanitizedPortraitUrl && !portraitLoadError ? (
                      <img
                        src={sanitizedPortraitUrl}
                        alt={fullNameAlt}
                        className={`w-full h-full ${
                          visual.portraitFit === 'contain' ? 'object-contain' : 'object-cover'
                        } filter contrast-[1.04] brightness-[0.96] transition-transform duration-300`}
                        style={{
                          objectPosition: visual.portraitPosition || '50% 15%',
                          transform: `scale(${visual.portraitScale || 1})`,
                        }}
                        referrerPolicy="no-referrer"
                        onError={() => setPortraitLoadError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                        <User className="w-16 h-16 mb-2 stroke-[1.25]" aria-hidden="true" />
                        <span className="font-display text-xs tracking-widest uppercase text-[var(--text-secondary)]">
                          {fullNameAlt}
                        </span>
                      </div>
                    )}

                    {/* Soft Edge & Bottom Atmospheric Vignette Blending Photo Into Backdrop */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 42%, transparent 56%, rgba(8, 8, 8, 0.52) 82%, rgba(8, 8, 8, 0.92) 100%)',
                      }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Compact Floating Education Badge */}
                  {visual.showEducationBadge &&
                    (badge.institution || badge.program || badge.graduationYear) && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                        <div className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-blur)] backdrop-blur-md px-4 py-1.5 shadow-[var(--shadow-card)] whitespace-nowrap">
                          <AboutDynamicIcon
                            name={badge.iconName}
                            fallback={GraduationCap}
                            className="w-3.5 h-3.5 text-[var(--text-primary)] shrink-0"
                          />
                          <span className="font-display font-bold text-xs text-[var(--text-primary)] tracking-wide">
                            {[badge.institution, badge.program].filter(Boolean).join(' ')}
                          </span>
                          {badge.graduationYear && (
                            <>
                              <span className="text-[var(--text-muted)] text-xs" aria-hidden="true">
                                /
                              </span>
                              <span className="font-mono text-[11px] font-medium text-[var(--text-secondary)]">
                                {badge.graduationYear}
                              </span>
                            </>
                          )}
                        </div>
                        {badge.supportingText && (
                          <span className="mt-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[10px] font-mono text-[var(--text-secondary)] whitespace-nowrap border border-[var(--border-subtle)]">
                            {badge.supportingText}
                          </span>
                        )}
                      </div>
                    )}
                </div>
              </motion.div>
            )}

            {/* RIGHT COLUMN — Main Glassmorphism Profile Card */}
            {hasCardColumn && (
              <motion.div
                initial={reducedMotion || isPreviewMode ? false : { opacity: 0, y: 14 }}
                whileInView={isPreviewMode ? undefined : { opacity: 1, y: 0 }}
                viewport={isPreviewMode ? undefined : { once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`${hasPortraitColumn ? 'col-span-7' : 'w-full max-w-3xl'} relative`}
              >
                {/* Soft Ambient Glow Around Card Edges */}
                <div
                  className={`absolute -inset-3 rounded-[28px] pointer-events-none ${glowOpacityClass}`}
                  style={{
                    background:
                      'radial-gradient(ellipse at 30% 20%, rgba(245, 245, 245, 0.06), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(160, 160, 160, 0.05), transparent 55%)',
                    filter: 'blur(22px)',
                  }}
                  aria-hidden="true"
                />

                {/* Monochrome Border Frame Wrapping Glass Surface */}
                <div
                  className={`relative ${cardOuterRadiusClass} p-[1px] bg-gradient-to-br from-[#F5F5F5]/25 via-[#292929] to-[#F5F5F5]/15 shadow-[var(--shadow-card)]`}
                >
                  <div
                    className={`${cardPaddingClass} relative overflow-hidden ${cardInnerRadiusClass} bg-[var(--bg-surface-blur)] backdrop-blur-xl`}
                  >
                    {/* Subtle Top Specular Light Rim */}
                    <div
                      className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[var(--text-primary)]/30 to-transparent pointer-events-none"
                      aria-hidden="true"
                    />

                    {/* Subtle Corner Atmospheric Highlight */}
                    {visual.showCosmicDecor && (
                      <div
                        className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[#F5F5F5]/[0.05] blur-3xl pointer-events-none"
                        aria-hidden="true"
                      />
                    )}

                    <div className={`relative z-10 flex flex-col ${cardGapClass}`}>
                      {/* 1. TOP AREA: Name + Academic Info + Optional Signature */}
                      <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-3.5 xl:pb-4">
                        <div className="min-w-0">
                          <h3 className="font-display font-extrabold text-2xl xl:text-[32px] leading-tight tracking-tight text-[var(--text-primary)]">
                            {firstName}
                            {lastName && (
                              <>
                                {' '}
                                <span className="text-[var(--text-secondary)]">
                                  {lastName}
                                </span>
                              </>
                            )}
                          </h3>
                          {academicLine && (
                            <p className="mt-1 text-xs xl:text-sm font-mono text-[var(--text-secondary)] tracking-wide">
                              {academicLine}
                            </p>
                          )}
                        </div>

                        {/* Upper-Right Signature Graphic */}
                        {visual.showSignature && sanitizedSignatureUrl && !signatureLoadError && (
                          <div className="shrink-0 flex items-center justify-end pl-2">
                            <img
                              src={sanitizedSignatureUrl}
                              alt={`${fullNameAlt} signature`}
                              className="h-9 xl:h-11 w-auto max-w-[140px] object-contain opacity-90 select-none pointer-events-none"
                              referrerPolicy="no-referrer"
                              onError={() => setSignatureLoadError(true)}
                            />
                          </div>
                        )}
                      </div>

                      {/* 2. INTRODUCTION */}
                      {introParagraph && (
                        <p className="text-sm xl:text-[15px] text-[var(--text-secondary)] leading-relaxed font-light max-w-[65ch]">
                          {introParagraph}
                        </p>
                      )}

                      {/* 3. INTEREST TAGS */}
                      {visual.showInterestTags && visibleInterests.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 xl:gap-2.5">
                          {visibleInterests.map((interest) => (
                            <span
                              key={interest.id}
                              title={interest.description || undefined}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors duration-200 hover:border-[var(--border-strong)] whitespace-nowrap"
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

                      {/* 4. BOTTOM HIGHLIGHTS PANEL */}
                      {visual.showHighlights && visibleHighlights.length > 0 && (
                        <div
                          className={`mt-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 grid ${highlightGridColsClass} divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)] overflow-hidden`}
                        >
                          {visibleHighlights.map((highlight) => (
                            <div
                              key={highlight.id}
                              title={highlight.description || undefined}
                              className="px-2.5 xl:px-3.5 py-3 xl:py-3.5 flex flex-col items-center justify-center text-center gap-1.5 transition-colors duration-200 hover:bg-[var(--bg-elevated)]"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                                <AboutDynamicIcon
                                  name={highlight.iconName}
                                  className="w-4 h-4"
                                />
                              </div>
                              <span className="text-[11px] xl:text-xs font-display font-semibold text-[var(--text-primary)] leading-snug text-balance">
                                {highlight.title}
                              </span>
                              {highlight.supportingText && (
                                <span className="text-[10px] font-mono text-[var(--text-secondary)] leading-tight">
                                  {highlight.supportingText}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
