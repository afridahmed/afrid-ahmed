import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Clock, Target, Milestone } from 'lucide-react';
import { JourneyMilestone, JourneyContent } from '../types';
import { JOURNEY } from '../data/siteContent';

interface JourneyTimelineProps {
  content?: JourneyContent;
  milestones?: JourneyMilestone[];
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ 
  content = JOURNEY,
  milestones
}) => {
  const milestoneList: JourneyMilestone[] = Array.isArray(milestones)
    ? milestones
    : Array.isArray((milestones as any)?.milestones)
    ? (milestones as any).milestones
    : content?.milestones || [];

  const initialYear = () => {
    const current = milestoneList.find(m => m.status === 'current');
    if (current && current.year !== undefined && current.year !== null) return String(current.year);
    return milestoneList[0]?.year !== undefined && milestoneList[0]?.year !== null ? String(milestoneList[0].year) : '2026';
  };

  const [selectedYear, setSelectedYear] = useState<string>(initialYear);

  // Sync selectedYear if milestoneList changes and selectedYear is not in list
  React.useEffect(() => {
    if (milestoneList.length > 0 && !milestoneList.some(m => String(m.year) === String(selectedYear))) {
      const current = milestoneList.find(m => m.status === 'current');
      setSelectedYear(current && current.year !== undefined && current.year !== null ? String(current.year) : String(milestoneList[0].year));
    }
  }, [milestoneList, selectedYear]);

  const activeMilestone = milestoneList.find(m => String(m.year) === String(selectedYear)) || milestoneList[0];

  if (milestoneList.length === 0 || !activeMilestone) {
    return (
      <section id="journey" className="relative w-full py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-12 z-10">
        <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
          <div className="border-b border-white/10 pb-4 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1">
                <Milestone className="w-3.5 h-3.5" />
                <span>{content.badge}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight">
                {content.title}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-[#94A3B8] mt-1">
                {content.subtitle}
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-16 px-4 text-center border border-white/10 rounded-2xl bg-[#050816]/70 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse mb-3" />
          <p className="text-white font-display font-semibold text-lg mb-1">
            Trajectory Roadmaps Updating
          </p>
          <p className="text-sm font-mono text-[#94A3B8] max-w-md">
            Milestones from 2026 to 2030 are currently being refreshed. Check back shortly.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="journey" className="relative w-full py-14 sm:py-20 md:py-28 px-4 sm:px-8 md:px-12 z-10 scroll-mt-20 sm:scroll-mt-24">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 sm:mb-10">
        <div className="border-b border-white/10 pb-4 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
          {/* Mobile Header (Screen 4) */}
          <div className="md:hidden">
            <div className="text-xs font-mono tracking-widest text-[#38BDF8] uppercase font-semibold mb-1">
              03 / JOURNEY
            </div>
            <h2 className="text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              The journey.
            </h2>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1">
              <Milestone className="w-3.5 h-3.5" />
              <span>{content.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight">
              {content.title}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#94A3B8] mt-1">
              {content.subtitle}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#07101F] border border-[#38BDF8]/20 text-xs font-mono text-[#CBD5E1]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>{content.horizonAnchor}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        
        {/* ========================================================================= */}
        {/* 1. MOBILE VERTICAL TIMELINE (Screen 4) (< md)                             */}
        {/* ========================================================================= */}
        <div className="md:hidden relative pl-6 space-y-5">
          {/* Continuous vertical cyan line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#38BDF8] via-[#38BDF8]/40 to-transparent" />

          {milestoneList.map((m, idx) => {
            const isCurrent = m.status === 'current';
            return (
              <div key={m.year || idx} className="relative group">
                {/* Glowing node dot */}
                <div 
                  className={`absolute -left-[19.5px] top-2 w-3.5 h-3.5 rounded-full border-2 border-[#03050B] z-10 ${
                    isCurrent 
                      ? 'bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]' 
                      : 'bg-[#0B1528] border-white/20'
                  }`} 
                />

                {/* Milestone Card (Screen 4) */}
                <div className={`p-4 rounded-xl border backdrop-blur-md space-y-2.5 transition-all ${
                  isCurrent 
                    ? 'bg-[#07101F]/90 border-[#38BDF8]/40 shadow-[0_0_20px_rgba(56,189,248,0.12)]' 
                    : 'bg-[#050816]/80 border-white/10'
                }`}>
                  {/* Top row: Year & Status badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-display font-extrabold text-xl text-white">
                      {String(m.year)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider ${
                      isCurrent 
                        ? 'bg-[#38BDF8] text-[#03050B]' 
                        : 'bg-white/10 text-[#94A3B8] border border-white/10'
                    }`}>
                      {isCurrent ? 'NOW' : m.phase || 'HORIZON'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-base text-white leading-snug">
                    {m.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#CBD5E1] leading-relaxed font-light">
                    {m.description}
                  </p>

                  {/* Focus Tag (Screen 4) */}
                  {m.focusAreas && m.focusAreas.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#38BDF8]">
                      <span className="text-[#94A3B8]">Key focus:</span>
                      <span>{m.focusAreas.slice(0, 2).join(' · ')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP CONSTELLATION TIMELINE (md+) — 100% PRESERVED                  */}
        {/* ========================================================================= */}
        <div className="hidden md:block space-y-6 sm:space-y-10">
          {/* Constellation Year Scrubber / Navigation Rail */}
          <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-2 sm:pb-4 pt-1 scrollbar-none touch-pan-x">
            {/* Background constellation beam */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#1E3A8A]/40 -translate-y-1/2 z-0 pointer-events-none" />

            {milestoneList.map((m) => {
              const yearStr = String(m.year ?? '');
              const shortYear = yearStr.length >= 2 ? yearStr.slice(-2) : yearStr;
              const isSelected = yearStr === selectedYear;
              const isCurrent = m.status === 'current';

              return (
                <button
                  key={yearStr}
                  onClick={() => setSelectedYear(yearStr)}
                  className={`relative z-10 flex flex-col items-center gap-1.5 p-2 sm:p-3.5 rounded-xl border transition-all duration-200 min-w-[65px] min-h-[48px] sm:min-w-[120px] cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'border-[#38BDF8] bg-[#07101F] shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                      : 'border-white/10 bg-[#03050B]/80 hover:border-white/20 hover:bg-[#07101F]/60'
                  }`}
                >
                  {/* Small Node Orb */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#38BDF8] text-[#03050B] scale-105 shadow-[0_0_12px_#38BDF8]'
                      : isCurrent
                      ? 'bg-[#0B1120] text-[#38BDF8] border border-[#38BDF8]'
                      : 'bg-[#07101F] text-[#94A3B8] border border-white/10'
                  }`}>
                    {shortYear}
                  </div>

                  <div className="text-center">
                    <div className="font-mono text-xs font-bold text-white tracking-wider">
                      {yearStr}
                    </div>
                    <div className={`text-[9px] sm:text-[10px] font-mono truncate max-w-[65px] sm:max-w-[90px] ${
                      isCurrent ? 'text-[#38BDF8]' : 'text-[#94A3B8]'
                    }`}>
                      {m.phase}
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Milestone Detail Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={String(activeMilestone.year)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative rounded-2xl border border-[#38BDF8]/20 bg-[#050816]/90 backdrop-blur-xl p-4 sm:p-8 shadow-[0_0_40px_rgba(56,189,248,0.06)] overflow-hidden"
            >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
              
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl font-display font-extrabold text-[#38BDF8]">
                    {String(activeMilestone.year)}
                  </span>
                  <div className="h-5 w-[1px] bg-white/10" />
                  <span className="font-mono text-xs sm:text-sm tracking-wider uppercase text-white font-semibold">
                    {activeMilestone.phase}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                    activeMilestone.status === 'current'
                      ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
                      : activeMilestone.status === 'upcoming'
                      ? 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {activeMilestone.status === 'current' ? 'CURRENT FOCUS' : activeMilestone.status === 'upcoming' ? 'PLANNED TRAJECTORY' : 'ASPIRATIONAL HORIZON'}
                  </span>
                </div>

                <h3 className="text-lg sm:text-2xl font-display font-bold text-white">
                  {activeMilestone.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed font-light">
                  {activeMilestone.description}
                </p>

                {/* Key Pillars */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono tracking-wider text-[#38BDF8] uppercase flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>KEY TARGET MILESTONES</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(activeMilestone.pillars || []).map((pillar, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-[#07101F] border border-white/5 flex items-start gap-2 text-xs text-[#CBD5E1]"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                        <span>{pillar}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Strategic Focus Area Column (5 cols) */}
              <div className="lg:col-span-5 bg-[#03050B] rounded-xl border border-white/10 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
                    ACTIVE EXPLORATION DOMAINS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeMilestone.focusAreas || ['Systems Engineering', 'Software Architecture']).map((area) => (
                      <span
                        key={area}
                        className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#07101F] text-[#CBD5E1] border border-white/5"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Context Note */}
                <div className="p-3 rounded-lg bg-[#07101F]/80 border border-[#38BDF8]/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#38BDF8]">
                    <Clock className="w-3 h-3" />
                    <span>TRANSPARENT HORIZON</span>
                  </div>
                  <p className="text-[10px] text-[#94A3B8] leading-relaxed font-mono">
                    {activeMilestone.status === 'current'
                      ? 'Currently active in 2026: focusing on core CS fundamentals, firmware builds, and autonomous architecture.'
                      : 'Milestones represent forward-looking goals and planned trajectories across undergraduate study.'}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
        </div>

      </div>

    </section>
  );
};
