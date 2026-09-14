import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { HERO_CONTENT } from '../data/siteContent';
import { HeroContent } from '../types';

interface HeroProps {
  content?: HeroContent;
  onExploreWork: () => void;
  onWatch: () => void;
  onConnect: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  content = HERO_CONTENT,
  onExploreWork,
  onConnect
}) => {
  const [stage, setStage] = useState<number>(0);
  const [statementIndex, setStatementIndex] = useState<number>(0);

  const rotatingStatements = content.rotatingStatements || ['I BUILD.', 'I CREATE.', 'I EXPLORE.'];

  // Smooth deterministic entrance sequence
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 350);
    const t3 = setTimeout(() => setStage(3), 700);
    const t4 = setTimeout(() => setStage(4), 1100);
    const t5 = setTimeout(() => setStage(5), 1500);

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
      className="relative min-h-[100svh] w-full flex flex-col justify-between items-center px-4 sm:px-8 md:px-12 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-10 overflow-hidden z-10 select-none"
    >
      {/* Soft atmospheric cosmic light field (stationary, zero cursor drift) */}
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] sm:w-[550px] md:w-[750px] h-[300px] sm:h-[550px] md:h-[750px] rounded-full pointer-events-none transition-opacity duration-1000 ease-out z-0"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(30, 58, 138, 0.07) 40%, rgba(7, 16, 31, 0.02) 68%, transparent 75%)',
          opacity: stage >= 1 ? 1 : 0,
          filter: 'blur(50px)'
        }}
      />

      {/* Top Meta Bar — Breathing room under navbar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : -6 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-6xl flex justify-between items-center text-[10px] sm:text-xs tracking-wider text-[#94A3B8] font-mono border-b border-white/5 pb-2 sm:pb-3 mb-2 sm:mb-4 relative z-20"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
          <span className="text-[#CBD5E1] font-medium tracking-[0.18em]">
            {content.badge}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#38BDF8] font-medium tracking-wider text-[10px] sm:text-xs">
            {content.degreeTrack}
          </span>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 1. MOBILE HERO COMPOSITION (< lg): DEDICATED COMPACT REDESIGN             */}
      {/* Order per User Instructions:                                              */}
      {/* 1. PROFILE PHOTO (appears ABOVE name)                                     */}
      {/* 2. AFRID AHMED (ONE line strictly across 320px-430px)                     */}
      {/* 3. Computer Science · AI/ML · Creator                                     */}
      {/* 4. I BUILD. / I CREATE. / I EXPLORE. (rotating)                           */}
      {/* 5. Short description                                                      */}
      {/* 6. Compact actions (text-link style)                                      */}
      {/* ========================================================================= */}
      <div className="w-full my-auto py-2 flex flex-col items-center text-center lg:hidden relative z-10 max-w-sm mx-auto">
        
        {/* 1. PROFILE PHOTO (Placed ABOVE name, carefully sized, cosmic integrated) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: stage >= 1 ? 1 : 0, scale: stage >= 1 ? 1 : 0.9 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mb-3"
        >
          {/* Subtle cosmic aura behind photo */}
          <div 
            className="absolute inset-0 rounded-full bg-[#38BDF8]/20 blur-md pointer-events-none"
            style={{ transform: 'scale(1.15)' }}
          />

          <div className="relative w-20 h-20 min-[360px]:w-24 min-[360px]:h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-[#38BDF8]/30 shadow-[0_0_24px_rgba(56,189,248,0.25)] flex items-center justify-center">
            <img
              src={content.photo}
              alt={content.name}
              className="w-full h-full object-cover object-center filter contrast-105 brightness-95"
              referrerPolicy="no-referrer"
            />
            {/* Dark optical vignette for cosmic integration */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(3, 5, 11, 0.5) 85%, #03050B 100%)'
              }}
            />
          </div>
        </motion.div>

        {/* 2. PRIMARY IDENTITY: AFRID AHMED (CRITICAL: MUST APPEAR ON ONE LINE) */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 10 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[1.65rem] min-[360px]:text-[1.85rem] min-[400px]:text-[2.15rem] sm:text-4xl font-display font-black tracking-tight text-white leading-none whitespace-nowrap px-1"
        >
          {content.name}
        </motion.h1>

        {/* 3. Identity Line: Computer Science · AI/ML · Creator */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 6 }}
          transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
          className="text-[11px] min-[360px]:text-xs sm:text-sm font-mono text-[#38BDF8] tracking-wide font-medium mt-1.5"
        >
          {content.category}
        </motion.p>

        {/* 4. DYNAMIC STATEMENT: I BUILD. / I CREATE. / I EXPLORE. */}
        <div className="h-7 sm:h-8 flex items-center justify-center overflow-hidden w-full px-2 mt-1">
          <AnimatePresence mode="wait">
            {stage >= 3 && (
              <motion.div
                key={rotatingStatements[statementIndex]}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-extrabold text-base min-[360px]:text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E2E8F0] to-[#38BDF8]"
              >
                {rotatingStatements[statementIndex]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. Short Description (Concise, no vertical bloat) */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 4 ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-[11px] min-[360px]:text-xs sm:text-sm text-[#CBD5E1] max-w-xs sm:max-w-sm px-2 leading-relaxed font-light mt-1.5"
        >
          {content.description}
        </motion.p>

        {/* 6. Compact Actions (Text-link style per User Instructions, min-44px touch) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: stage >= 4 ? 1 : 0, y: stage >= 4 ? 0 : 6 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-center gap-4 sm:gap-6 pt-3 font-mono text-xs tracking-wider"
        >
          <button
            id="mobile-hero-link-work"
            onClick={onExploreWork}
            className="min-h-[44px] px-2 text-[#38BDF8] hover:text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{content.primaryLinkText}</span>
            <span className="text-sm">→</span>
          </button>

          <span className="text-white/20 text-xs">·</span>

          <button
            id="mobile-hero-link-connect"
            onClick={onConnect}
            className="min-h-[44px] px-2 text-[#CBD5E1] hover:text-[#38BDF8] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{content.secondaryLinkText}</span>
            <span className="text-sm">→</span>
          </button>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP HERO COMPOSITION (lg+): Anchored Cinematic Balance               */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid w-full max-w-6xl my-auto py-6 sm:py-10 grid-cols-12 gap-10 xl:gap-14 items-center relative z-10">
        
        {/* LEFT ZONE: Primary Identity & Typography (7 cols) */}
        <div className="col-span-7 flex flex-col items-start text-left space-y-5 xl:space-y-6">
          
          {/* Subtle Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 6 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-2 text-xs font-mono tracking-[0.22em] text-[#38BDF8] uppercase font-semibold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            <span>{content.tagline}</span>
          </motion.div>

          {/* PRIMARY VISUAL IDENTITY: AFRID AHMED */}
          <div className="space-y-2.5 w-full">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 20 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6rem] font-display font-black tracking-tight text-white leading-[0.95]"
            >
              {content.name}
            </motion.h1>

            {/* Secondary Identity Line */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : 10 }}
              transition={{ duration: 0.7, delay: 0.08, ease: 'easeOut' }}
              className="text-base md:text-lg font-mono tracking-wider text-[#38BDF8] font-medium"
            >
              {content.category}
            </motion.p>
          </div>

          {/* DYNAMIC IDENTITY STATEMENT: I BUILD. / I CREATE. / I EXPLORE. */}
          <div className="h-12 xl:h-14 flex items-center overflow-hidden w-full">
            <AnimatePresence mode="wait">
              {stage >= 3 && (
                <motion.div
                  key={rotatingStatements[statementIndex]}
                  initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display font-black text-3xl md:text-4xl xl:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#CBD5E1] to-[#38BDF8]"
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
            className="text-base xl:text-lg text-[#CBD5E1] max-w-xl font-light leading-relaxed"
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
              className="px-6 py-2.5 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all cursor-pointer active:scale-95"
            >
              <span>{content.primaryLinkText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-link-connect"
              onClick={onConnect}
              className="px-6 py-2.5 rounded-full bg-[#07101F] hover:bg-[#0B1120] border border-[#38BDF8]/40 hover:border-[#38BDF8] text-[#38BDF8] font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
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
            {/* Soft atmospheric aura behind portrait */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 48%, rgba(56, 189, 248, 0.22) 0%, rgba(30, 58, 138, 0.16) 42%, transparent 72%)',
                filter: 'blur(30px)',
                transform: 'scale(1.08)'
              }}
            />

            {/* Photographic Portrait with optical mask and cosmic dark edge blending */}
            <div 
              className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center border border-[#38BDF8]/20 shadow-[0_0_40px_rgba(56,189,248,0.15)]"
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
                  background: 'radial-gradient(circle at 50% 45%, transparent 58%, rgba(3, 5, 11, 0.6) 82%, #03050B 100%)'
                }}
              />
            </div>
          </motion.div>

        </div>

      </div>

      {/* Bottom Scroll Prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 4 ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl flex justify-between items-center text-[10px] sm:text-xs font-mono text-[#94A3B8] border-t border-white/5 pt-2 sm:pt-3 relative z-20"
      >
        <button
          onClick={onExploreWork}
          className="flex items-center gap-1.5 hover:text-[#38BDF8] transition-colors cursor-pointer"
        >
          <span>{content.scrollPromptText}</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </button>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[#CBD5E1]">ACTIVE ORBIT: 2026</span>
        </div>
      </motion.div>
    </section>
  );
};
