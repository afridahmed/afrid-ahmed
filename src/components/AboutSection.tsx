import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  GraduationCap,
  ShieldCheck,
  BrainCircuit,
  Cloud,
  Workflow,
  Terminal,
  Youtube,
  Briefcase,
  Lightbulb,
} from 'lucide-react';
import { ABOUT_CONTENT } from '../data/siteContent';
import { AboutContent } from '../types';

interface AboutSectionProps {
  content?: AboutContent;
}

const INTEREST_TAGS = [
  { label: 'AI/ML', icon: BrainCircuit },
  { label: 'Cloud', icon: Cloud },
  { label: 'Cybersecurity', icon: ShieldCheck },
  { label: 'Automation', icon: Workflow },
] as const;

const HIGHLIGHT_PILLARS = [
  { label: 'Python / Programming', icon: Terminal },
  { label: 'Content Creation & YouTube', icon: Youtube },
  { label: 'Freelancing & Business', icon: Briefcase },
  { label: 'Innovation', icon: Lightbulb },
] as const;

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
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const bioList =
    Array.isArray(content.biography) && content.biography.length > 0
      ? content.biography
      : ABOUT_CONTENT.biography;

  const introParagraph = bioList[0] || ABOUT_CONTENT.biography[0];
  const { first: firstName, rest: lastName } = formatSplitName(
    content.photoCaption?.name || 'Afrid Ahmed'
  );
  const fullNameAlt = lastName ? `${firstName} ${lastName}` : firstName;

  const rawTitle = (content.title || '').trim();
  const useDefaultAboutMeHeading =
    !rawTitle || rawTitle.toUpperCase() === 'ABOUT AFRID' || rawTitle.toUpperCase() === 'ABOUT ME';

  return (
    <section
      id="about"
      className="about-desktop-section relative w-full py-12 sm:py-16 lg:py-0 px-4 sm:px-8 md:px-12 lg:px-8 z-10 scroll-mt-20"
    >
      <div className="max-w-6xl xl:max-w-[1220px] mx-auto w-full">
        {/* ========================================================================= */}
        {/* 1. MOBILE & TABLET ABOUT COMPOSITION (< lg) — PRESERVED                   */}
        {/* ========================================================================= */}
        <div className="relative flex flex-col space-y-5 lg:hidden overflow-hidden pb-6 max-w-2xl mx-auto">
          {/* Eyebrow Label: 01 / ABOUT */}
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
            <span>01 / ABOUT</span>
          </div>

          {/* Heading: Curious by nature. Building by practice. */}
          <div>
            <h3 className="text-2xl min-[360px]:text-3xl font-display font-black text-white leading-tight">
              Curious by nature.<br />
              Building by <span className="text-[#38BDF8]">practice.</span>
            </h3>
          </div>

          {/* Authentic Biography Narrative (Readable line measure, high contrast) */}
          <div className="space-y-3 text-sm sm:text-[15px] text-[#CBD5E1] leading-relaxed font-light">
            {bioList.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Interest Pills */}
          <div className="pt-2">
            <div className="flex flex-wrap gap-2.5">
              {['AI / ML', 'Software Engineering', 'Automation', 'Robotics'].map((interest) => (
                <span
                  key={interest}
                  className="px-4 py-2 rounded-full text-xs font-sans text-white/90 bg-white/5 border border-white/15"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Accent: INTERESTS & FOCUS with cyan line and curved cosmic glow */}
          <div className="pt-6 relative">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono tracking-widest text-[#94A3B8] uppercase">
                INTERESTS & FOCUS
              </span>
              <div className="w-8 h-[2px] bg-[#38BDF8] mt-1.5 rounded-full" />
            </div>

            {/* Glowing cosmic arc in bottom corner */}
            <div
              className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full pointer-events-none opacity-40"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(56,189,248,0.3) 0%, rgba(30,58,138,0.15) 50%, transparent 75%)',
                filter: 'blur(20px)',
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP ABOUT COMPOSITION (lg+): PORTRAIT + ORBITAL RINGS + GLASS CARD */}
        {/* ========================================================================= */}
        <div className="hidden lg:block">
          {/* Centered Compact Section Heading */}
          <motion.header
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="about-desktop-header text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center justify-center gap-2 text-[11px] font-mono tracking-[0.2em] text-[#38BDF8] uppercase mb-1.5">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{content.badge || ABOUT_CONTENT.badge}</span>
            </div>

            <h2 className="about-desktop-title font-display font-extrabold text-white tracking-tight">
              {useDefaultAboutMeHeading ? (
                <>
                  ABOUT{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#93C5FD]">
                    ME
                  </span>
                </>
              ) : (
                rawTitle
              )}
            </h2>

            <p className="mt-1.5 text-xs xl:text-sm text-[#94A3B8] font-light tracking-wide">
              {formatSubtitleSentence(content.statement)}
            </p>
          </motion.header>

          {/* Balanced Two-Column Composition */}
          <div className="grid grid-cols-12 gap-8 xl:gap-12 items-center">
            {/* LEFT COLUMN — Prominent Cosmic Portrait + Blue Orbital Rings + SLIIT Badge */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="col-span-5 flex flex-col items-center justify-center relative py-2"
            >
              <div className="about-desktop-portrait-wrap relative flex items-center justify-center">
                {/* Atmospheric Deep-Space Blue Aura Behind Portrait */}
                <div
                  className="absolute -inset-10 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 48%, rgba(56, 189, 248, 0.24) 0%, rgba(37, 99, 235, 0.14) 44%, transparent 72%)',
                    filter: 'blur(34px)',
                  }}
                  aria-hidden="true"
                />

                {/* Outer Rotating Orbital Track + Glowing Accent Node */}
                <div
                  className="about-orbit-spin absolute -inset-6 rounded-full border border-dashed border-[#38BDF8]/25 pointer-events-none"
                  aria-hidden="true"
                >
                  <span className="absolute top-[11%] right-[16%] w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_12px_#38BDF8]" />
                  <span className="absolute bottom-[14%] left-[14%] w-1.5 h-1.5 rounded-full bg-[#60A5FA] shadow-[0_0_10px_#60A5FA]" />
                </div>

                {/* Inner Counter-Rotating Elliptical Glow Ring */}
                <div
                  className="about-orbit-spin-reverse absolute -inset-3 rounded-full border border-[#60A5FA]/20 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 24px rgba(56, 189, 248, 0.08)',
                  }}
                  aria-hidden="true"
                />

                {/* Subtle Static Precision Halo Ring */}
                <div
                  className="absolute -inset-1 rounded-full border border-[#38BDF8]/30 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Profile Portrait Container Blended Seamlessly Into Cosmic Backdrop */}
                <div className="relative w-full h-full rounded-full overflow-hidden border border-[#38BDF8]/40 bg-[#040918] shadow-[0_0_50px_rgba(56,189,248,0.16),inset_0_0_24px_rgba(3,5,11,0.85)]">
                  <img
                    src={content.photo || '/images/afrid-about.jpg'}
                    alt={fullNameAlt}
                    className="w-full h-full object-cover object-top filter contrast-[1.04] brightness-[0.96]"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/afrid-about.jpg';
                    }}
                  />

                  {/* Soft Edge & Bottom Atmospheric Vignette Blending Photo Into Space */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 42%, transparent 56%, rgba(5, 10, 24, 0.52) 82%, rgba(3, 5, 11, 0.92) 100%)',
                    }}
                    aria-hidden="true"
                  />
                </div>

                {/* Compact Floating SLIIT CS / Class of 2030 Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-[#38BDF8]/45 bg-[#061226]/92 backdrop-blur-md px-4 py-1.5 shadow-[0_10px_28px_rgba(3,5,11,0.85),0_0_22px_rgba(56,189,248,0.2)] whitespace-nowrap">
                  <GraduationCap className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <span className="font-display font-bold text-xs text-white tracking-wide">
                    SLIIT CS
                  </span>
                  <span className="text-white/25 text-xs" aria-hidden="true">
                    /
                  </span>
                  <span className="font-mono text-[11px] font-medium text-[#7DD3FC]">
                    Class of 2030
                  </span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN — Main Glassmorphism Profile Card */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="col-span-7 relative"
            >
              {/* Soft Ambient Cosmic Glow Around Card Edges */}
              <div
                className="absolute -inset-3 rounded-[28px] pointer-events-none opacity-75"
                style={{
                  background:
                    'radial-gradient(ellipse at 30% 20%, rgba(56, 189, 248, 0.14), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(37, 99, 235, 0.14), transparent 55%)',
                  filter: 'blur(22px)',
                }}
                aria-hidden="true"
              />

              {/* Gradient Cyan/Blue Border Frame Wrapping Glass Surface */}
              <div className="relative rounded-[22px] p-[1px] bg-gradient-to-br from-[#38BDF8]/45 via-[#60A5FA]/18 to-[#38BDF8]/30 shadow-[0_20px_50px_rgba(3,5,11,0.72),0_0_40px_rgba(56,189,248,0.09)]">
                <div className="about-desktop-card relative overflow-hidden rounded-[21px] bg-[#060E20]/82 backdrop-blur-xl">
                  {/* Subtle Top Specular Light Rim */}
                  <div
                    className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#7DD3FC]/55 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Subtle Corner Atmospheric Highlight */}
                  <div
                    className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[#38BDF8]/8 blur-3xl pointer-events-none"
                    aria-hidden="true"
                  />

                  <div className="relative z-10 flex flex-col gap-4 xl:gap-5">
                    {/* 1. TOP AREA: Name + SLIIT CS Undergraduate Info */}
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3.5 xl:pb-4">
                      <div>
                        <h3 className="font-display font-extrabold text-2xl xl:text-[32px] leading-tight tracking-tight text-white">
                          {firstName}
                          {lastName && (
                            <>
                              {' '}
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#93C5FD]">
                                {lastName}
                              </span>
                            </>
                          )}
                        </h3>
                        <p className="mt-1 text-xs xl:text-sm font-mono text-[#7DD3FC]/90 tracking-wide">
                          SLIIT Undergraduate · BSc (Hons) in Computer Science
                        </p>
                      </div>
                    </div>

                    {/* 2. INTRODUCTION: Concise Authentic Narrative */}
                    <p className="text-sm xl:text-[15px] text-[#CBD5E1] leading-relaxed font-light max-w-[65ch]">
                      {introParagraph}
                    </p>

                    {/* 3. INTEREST TAGS: Compact Pill Elements with Cyan Icons */}
                    <div className="flex flex-wrap items-center gap-2 xl:gap-2.5">
                      {INTEREST_TAGS.map(({ label, icon: Icon }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#08152B]/75 px-3.5 py-1.5 text-xs font-medium text-[#E2E8F0] transition-colors duration-200 hover:border-[#38BDF8]/55 hover:text-white whitespace-nowrap"
                        >
                          <Icon className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                          <span>{label}</span>
                        </span>
                      ))}
                    </div>

                    {/* 4. BOTTOM HIGHLIGHTS PANEL: Separate 4-Column Inner Grid */}
                    <div className="mt-0.5 rounded-xl border border-[#38BDF8]/18 bg-[#040917]/82 grid grid-cols-4 divide-x divide-white/10 overflow-hidden">
                      {HIGHLIGHT_PILLARS.map(({ label, icon: Icon }) => (
                        <div
                          key={label}
                          className="px-2.5 xl:px-3.5 py-3 xl:py-3.5 flex flex-col items-center justify-center text-center gap-2 transition-colors duration-200 hover:bg-[#38BDF8]/[0.05]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center text-[#38BDF8]">
                            <Icon className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <span className="text-[11px] xl:text-xs font-display font-semibold text-[#E2E8F0] leading-snug text-balance">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
