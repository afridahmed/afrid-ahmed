import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { HERO_CONTENT } from '../data/siteContent';
import { HeroContent } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeroProps {
  content?: HeroContent;
  onExploreWork: () => void;
  onExploreAbout?: () => void;
  onWatch?: () => void;
  onConnect: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  content = HERO_CONTENT,
  onExploreWork,
  onExploreAbout,
  onConnect
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stage, setStage] = useState<number>(0);
  const [statementIndex, setStatementIndex] = useState<number>(0);

  const rotatingStatements = content.rotatingStatements || ['I BUILD.', 'I CREATE.', 'I EXPLORE.'];

  // Smooth deterministic entrance sequence — fast-tracked for instant mobile responsiveness
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 40);
    const t2 = setTimeout(() => setStage(2), 140);
    const t3 = setTimeout(() => setStage(3), 280);
    const t4 = setTimeout(() => setStage(4), 450);
    const t5 = setTimeout(() => setStage(5), 650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  // Smooth in-place cycle for the rotating identity statement
  useEffect(() => {
    if (stage < 4) return;
    const interval = setInterval(() => {
      setStatementIndex((prev) => (prev + 1) % rotatingStatements.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [stage, rotatingStatements.length]);

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] w-full flex flex-col justify-between items-center px-4 sm:px-8 md:px-12 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-10 overflow-hidden z-10 select-none scroll-mt-20 sm:scroll-mt-24"
    >
      {/* Soft atmospheric light field (stationary, zero cursor drift) */}
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] sm:w-[550px] md:w-[750px] h-[300px] sm:h-[550px] md:h-[750px] rounded-full pointer-events-none transition-opacity duration-1000 ease-out z-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(245, 245, 245, 0.08) 0%, rgba(27, 27, 27, 0.06) 40%, rgba(18, 18, 18, 0.02) 68%, transparent 75%)'
            : 'radial-gradient(circle, rgba(17, 17, 17, 0.05) 0%, rgba(115, 115, 115, 0.04) 40%, rgba(232, 232, 232, 0.02) 68%, transparent 75%)',
          opacity: stage >= 1 ? 1 : 0,
          filter: 'blur(50px)'
        }}
      />

      {/* Top Meta Bar — Desktop only */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -6 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden lg:flex w-full max-w-6xl justify-between items-center text-[10px] sm:text-xs tracking-wider text-[var(--text-secondary)] font-mono border-b border-[var(--border-subtle)] pb-2 sm:pb-3 mb-2 sm:mb-4 relative z-20"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] animate-pulse" />
          <span className="text-[var(--text-primary)] font-medium tracking-[0.18em]">
            {content.badge}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)] font-medium tracking-wider text-[10px] sm:text-xs">
            {content.degreeTrack}
          </span>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 1. MOBILE HERO COMPOSITION (< lg)                                         */}
      {/* ========================================================================= */}
      <div className="w-full py-2 flex flex-col items-center text-center lg:hidden relative z-10 max-w-md mx-auto px-3">
        
        {/* 1. REAL PROFILE PORTRAIT */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, scale: stage >= 1 ? 1 : 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full flex items-center justify-center mb-3 pt-2"
        >
          {/* Soft monochrome aura behind head and shoulders */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] min-[380px]:w-[280px] h-[240px] min-[380px]:h-[280px] rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 50% 45%, rgba(245,245,245,0.16) 0%, rgba(160,160,160,0.08) 50%, transparent 75%)'
                : 'radial-gradient(circle at 50% 45%, rgba(17,17,17,0.12) 0%, rgba(115,115,115,0.06) 50%, transparent 75%)',
              filter: 'blur(32px)'
            }}
          />

          {/* Large portrait container with seamless bottom fade */}
          <div 
            className="relative w-[240px] min-[380px]:w-[270px] min-[420px]:w-[290px] h-[260px] min-[380px]:h-[290px] min-[420px]:h-[310px] overflow-hidden flex items-center justify-center"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)'
            }}
          >
            <img
              src={content.photo || '/images/afrid-hero.jpg'}
              alt={content.name}
              className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-95"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/afrid-hero.jpg';
              }}
            />

            {/* Seamless edge and bottom blending overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isDark
                  ? 'linear-gradient(to bottom, transparent 65%, rgba(8,8,8,0.85) 92%, #080808 100%)'
                  : 'linear-gradient(to bottom, transparent 65%, rgba(240,241,244,0.75) 92%, rgba(240,241,244,0.95) 100%)'
              }}
            />
          </div>
        </motion.div>

        {/* 2. EYEBROW TAG */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 6 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-[11px] sm:text-xs font-mono text-[var(--text-secondary)] tracking-widest uppercase font-semibold mb-1.5"
        >
          CS UNDERGRADUATE · SLIIT
        </motion.div>

        {/* 3. PRIMARY IDENTITY */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 8 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl min-[360px]:text-4xl min-[400px]:text-[2.75rem] font-display font-black tracking-tight text-[var(--text-primary)] leading-none whitespace-nowrap px-1"
        >
          Afrid <span className="text-[var(--text-secondary)]">Ahmed</span>
        </motion.h1>

        {/* 4. CONCISE TAGLINE */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 6 }}
          transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
          className="text-sm min-[360px]:text-base text-[var(--text-secondary)] font-normal mt-2 max-w-[34ch]"
        >
          Building with AI & code.
        </motion.p>

        {/* 5. DUAL ACTION BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 8 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-row items-center justify-center gap-3 pt-4 w-full max-w-xs mx-auto"
        >
          <button
            id="mobile-hero-link-work"
            onClick={onExploreWork}
            className="flex-1 min-h-[44px] px-5 py-2.5 rounded-full bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] font-display font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.14)] dark:shadow-[0_0_22px_rgba(245,245,245,0.16)] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Explore work</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            id="mobile-hero-link-about"
            onClick={onExploreAbout || (() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }))}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-display font-medium text-xs tracking-wider flex items-center justify-center active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>About</span>
          </button>
        </motion.div>

        {/* 6. SUBTLE SCROLL CHEVRON */}
        <motion.button
          onClick={onExploreAbout || onExploreWork}
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 4 ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 flex flex-col items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-2"
          aria-label="Scroll to about"
        >
          <ChevronDown className="w-5 h-5 animate-bounce text-[var(--text-secondary)]" />
        </motion.button>

      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP HERO COMPOSITION (lg+)                                         */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid w-full max-w-6xl my-auto py-6 sm:py-10 grid-cols-12 gap-10 xl:gap-14 items-center relative z-10">
        
        {/* LEFT ZONE: Primary Identity & Typography (7 cols) */}
        <div className="col-span-7 flex flex-col items-start text-left space-y-5 xl:space-y-6">
          
          {/* Subtle Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 6 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-2 text-xs font-mono tracking-[0.22em] text-[var(--text-secondary)] uppercase font-semibold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
            <span>{content.tagline}</span>
          </motion.div>

          {/* PRIMARY VISUAL IDENTITY */}
          <div className="space-y-2.5 w-full">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 20 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6rem] font-display font-black tracking-tight text-[var(--text-primary)] leading-[0.95]"
            >
              {content.name}
            </motion.h1>

            {/* Secondary Identity Line */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 10 }}
              transition={{ duration: 0.7, delay: 0.08, ease: 'easeOut' }}
              className="text-base md:text-lg font-mono tracking-wider text-[var(--text-secondary)] font-medium"
            >
              {content.category}
            </motion.p>
          </div>

          {/* DYNAMIC IDENTITY STATEMENT */}
          <div className="h-12 xl:h-14 flex items-center overflow-hidden w-full">
            <AnimatePresence mode="wait">
              {stage >= 3 && (
                <motion.div
                  key={rotatingStatements[statementIndex]}
                  initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display font-black text-3xl md:text-4xl xl:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--text-secondary)]"
                >
                  {rotatingStatements[statementIndex]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Concise Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 10 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-base xl:text-lg text-[var(--text-secondary)] max-w-xl font-light leading-relaxed"
          >
            {content.description}
          </motion.p>

          {/* Compact Desktop CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 10 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex items-center gap-4 pt-1 font-mono text-xs sm:text-sm tracking-wider"
          >
            <button
              id="hero-link-work"
              onClick={onExploreWork}
              className="px-6 py-2.5 rounded-full bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] font-bold flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_0_20px_rgba(245,245,245,0.14)] transition-all cursor-pointer active:scale-95"
            >
              <span>{content.primaryLinkText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-link-connect"
              onClick={onConnect}
              className="px-6 py-2.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <span>{content.secondaryLinkText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

        </div>

        {/* RIGHT ZONE: Anchored Photographic Portrait (5 cols) */}
        <div className="col-span-5 flex justify-end relative">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{
              opacity: stage >= 2 ? 1 : 0,
              scale: stage >= 2 ? 1 : 0.96
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[360px] xl:max-w-[400px] aspect-square flex items-center justify-center"
          >
            {/* Soft monochrome aura behind portrait */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: isDark
                  ? 'radial-gradient(circle at 50% 48%, rgba(245, 245, 245, 0.14) 0%, rgba(160, 160, 160, 0.08) 42%, transparent 72%)'
                  : 'radial-gradient(circle at 50% 48%, rgba(17, 17, 17, 0.1) 0%, rgba(115, 115, 115, 0.06) 42%, transparent 72%)',
                filter: 'blur(30px)',
                transform: 'scale(1.08)'
              }}
            />

            {/* Photographic Portrait with optical mask and seamless edge blending */}
            <div 
              className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center border border-[var(--border-strong)] shadow-[var(--shadow-card)]"
              style={{
                maskImage: 'radial-gradient(circle at 50% 48%, black 62%, rgba(0, 0, 0, 0.88) 78%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 48%, black 62%, rgba(0, 0, 0, 0.88) 78%, transparent 100%)'
              }}
            >
              <img
                src={content.photo}
                alt={content.name}
                className="w-full h-full object-cover object-center filter contrast-105 brightness-95"
                referrerPolicy="no-referrer"
              />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle at 50% 45%, transparent 58%, rgba(8, 8, 8, 0.6) 82%, #080808 100%)'
                    : 'radial-gradient(circle at 50% 45%, transparent 58%, rgba(240, 241, 244, 0.55) 82%, rgba(240, 241, 244, 0.92) 100%)'
                }}
              />
            </div>
          </motion.div>

        </div>

      </div>

      {/* Bottom Scroll Prompt — Desktop Only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 4 ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-full max-w-6xl justify-between items-center text-[10px] sm:text-xs font-mono text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-2 sm:pt-3 relative z-20"
      >
        <button
          onClick={onExploreAbout || onExploreWork}
          className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <span>{content.scrollPromptText}</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </button>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">ACTIVE ORBIT: 2026</span>
        </div>
      </motion.div>
    </section>
  );
};
