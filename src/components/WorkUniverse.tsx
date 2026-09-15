import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, 
  ChevronLeft, 
  ChevronRight, 
  Terminal, 
  Compass, 
  CloudRain,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Activity
} from 'lucide-react';
import { ProjectItem } from '../types';
import { PROJECTS } from '../data/siteContent';
import { AiBuilderScene3D } from './AiBuilderScene3D';
import { AquaSenseVisualizer } from './AquaSenseVisualizer';

interface WorkUniverseProps {
  projects?: ProjectItem[];
  onWorkTogether?: () => void;
}

export const WorkUniverse: React.FC<WorkUniverseProps> = ({ 
  projects = PROJECTS,
  onWorkTogether
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'afrid-cli@universe:~$ afrid-ai --init',
    '✓ Connected to stream gateway',
    '✓ Local buffer instantiated [128 tokens]',
    '✓ Ready for developer command orchestration.'
  ]);

  // Safely clamp active index within current projects length bounds
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, projects.length - 1));
  const activeProject = projects[safeIndex] || projects[0];
  const prevProject = safeIndex > 0 ? projects[safeIndex - 1] : null;
  const nextProject = safeIndex < projects.length - 1 ? projects[safeIndex + 1] : null;

  const goToProject = (newIndex: number) => {
    if (newIndex === safeIndex || newIndex < 0 || newIndex >= projects.length) return;
    setDirection(newIndex > safeIndex ? 1 : -1);
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    if (safeIndex < projects.length - 1) {
      goToProject(safeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      goToProject(safeIndex - 1);
    }
  };

  // Keyboard navigation for tablist / carousel
  const handleRailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToProject(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToProject(projects.length - 1);
    }
  };

  const runTerminalCommand = (cmd: string) => {
    if (cmd === 'status') {
      setTerminalOutput(prev => [
        ...prev,
        'afrid-cli@universe:~$ afrid-ai --status',
        'State: ONLINE · Active Thread: 0x4B · Latency: 42ms · Token rate: 84 tok/s'
      ]);
    } else if (cmd === 'arch') {
      setTerminalOutput(prev => [
        ...prev,
        'afrid-cli@universe:~$ afrid-ai --arch',
        'Pipeline: CLI Input -> Token Stream -> Context Filter -> Local Execution Preview'
      ]);
    } else {
      setTerminalOutput([
        'afrid-cli@universe:~$ clear',
        'Ready for developer command orchestration.'
      ]);
    }
  };

  return (
    <section id="work" className="relative w-full py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-12 z-10 overflow-x-hidden">
      
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span>SINGULAR CONTINUOUS WORK UNIVERSE</span>
            </div>
            <h2 className="text-4xl sm:text-[60px] sm:leading-[60px] font-display font-extrabold text-white tracking-tight leading-tight">
              PROJECTS.
            </h2>
          </div>

          {/* Trajectory Counter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#94A3B8] tracking-wider uppercase">
              ACTIVE TRAJECTORY
            </span>
            <div className="px-3 py-1 rounded-full bg-[#07101F] border border-white/10 font-mono text-xs">
              <span className="text-[#38BDF8] font-bold">{activeProject.number || (safeIndex < 9 ? `0${safeIndex + 1}` : `${safeIndex + 1}`)}</span>
              <span className="text-white/20 mx-1.5">/</span>
              <span className="text-[#94A3B8]">{projects.length < 10 ? `0${projects.length}` : projects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Centered Contextual Carousel Navigation: [Previous] [Active] [Next]       */}
      {/* ========================================================================= */}
      <div className="max-w-4xl sm:max-w-5xl mx-auto mb-8 sm:mb-12">
        <div 
          className="relative flex items-center justify-between gap-2 sm:gap-4 w-full"
          role="region"
          aria-label="Project selection carousel"
          onKeyDown={handleRailKeyDown}
        >
          {/* Previous Project Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={safeIndex === 0}
            aria-label="Previous project"
            className="shrink-0 p-2 sm:p-2.5 rounded-full border border-white/10 bg-[#07101F]/90 backdrop-blur-md text-[#CBD5E1] hover:text-white hover:border-[#38BDF8]/40 hover:bg-[#0B1528] active:scale-95 disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:bg-[#07101F]/90 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] z-10"
          >
            <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Exact Mathematically Centered 3-Column Contextual Stage */}
          <div 
            role="tablist"
            aria-label="Selected project carousel navigation"
            className="relative flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center h-14 sm:h-16"
          >
            {/* 1. PREVIOUS PROJECT SLOT (Left slot: right-aligned, faded, clickable) */}
            <div className="relative w-full h-full flex items-center justify-end pr-2 sm:pr-4 md:pr-6 min-w-0 overflow-hidden">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                {prevProject ? (
                  <motion.button
                    key={prevProject.id || `prev-${safeIndex - 1}`}
                    role="tab"
                    aria-selected={false}
                    aria-controls="active-project-panel"
                    type="button"
                    onClick={handlePrev}
                    custom={direction}
                    variants={{
                      enter: (dir: number) => ({
                        x: dir > 0 ? 24 : -24,
                        opacity: 0,
                      }),
                      center: {
                        x: 0,
                        opacity: 0.45,
                        transition: {
                          x: { type: 'spring', stiffness: 350, damping: 30 },
                          opacity: { duration: 0.25 },
                        },
                      },
                      exit: (dir: number) => ({
                        x: dir > 0 ? -24 : 24,
                        opacity: 0,
                        transition: {
                          x: { type: 'spring', stiffness: 350, damping: 30 },
                          opacity: { duration: 0.2 },
                        },
                      }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="group flex items-center gap-1.5 sm:gap-2 max-w-full text-right cursor-pointer hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8] rounded-lg py-1 px-1 sm:px-2 select-none"
                    title={`Previous: ${prevProject.title}`}
                  >
                    <span className="text-[10px] sm:text-xs font-mono text-[#94A3B8]/60 group-hover:text-[#38BDF8] hidden md:inline shrink-0">
                      {prevProject.number || (safeIndex < 10 ? `0${safeIndex}` : safeIndex)}
                    </span>
                    <span className="truncate text-xs sm:text-sm md:text-base font-display font-medium text-[#94A3B8] group-hover:text-white transition-colors">
                      {prevProject.title}
                    </span>
                  </motion.button>
                ) : (
                  <div key="empty-left" className="h-4" aria-hidden="true" />
                )}
              </AnimatePresence>
            </div>

            {/* 2. ACTIVE PROJECT SLOT (Exact Center: Highlighted, High-Contrast Focal Point) */}
            <div className="relative h-full flex items-center justify-center shrink-0 px-1 sm:px-2">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={activeProject.id || `active-${safeIndex}`}
                  role="tab"
                  id={`project-tab-${activeProject.id || safeIndex}`}
                  aria-selected={true}
                  aria-controls="active-project-panel"
                  tabIndex={0}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? 32 : dir < 0 ? -32 : 0,
                      opacity: 0,
                      scale: 0.95,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                      scale: 1,
                      transition: {
                        x: { type: 'spring', stiffness: 350, damping: 30 },
                        opacity: { duration: 0.25 },
                        scale: { duration: 0.25 },
                      },
                    },
                    exit: (dir: number) => ({
                      x: dir > 0 ? -32 : dir < 0 ? 32 : 0,
                      opacity: 0,
                      scale: 0.95,
                      transition: {
                        x: { type: 'spring', stiffness: 350, damping: 30 },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 },
                      },
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="relative px-3 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-2xl bg-[#0B1528]/95 border border-[#38BDF8]/40 shadow-[0_0_28px_rgba(56,189,248,0.2)] flex items-center gap-2 sm:gap-3 text-white select-none z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                >
                  {/* Active number indicator */}
                  <span className="font-mono text-xs text-[#38BDF8] font-bold shrink-0">
                    {activeProject.number || (safeIndex < 9 ? `0${safeIndex + 1}` : `${safeIndex + 1}`)}
                  </span>

                  {/* Glowing active pulse dot */}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8] shrink-0" />

                  {/* Active Project Title */}
                  <span className="whitespace-nowrap text-xs sm:text-base md:text-lg font-display font-extrabold tracking-tight text-white">
                    {activeProject.title}
                  </span>

                  {/* Flagship badge if flagged */}
                  {activeProject.isFlagship && (
                    <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-semibold bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 shrink-0">
                      FLAGSHIP
                    </span>
                  )}

                  {/* Subtle bottom active glow line */}
                  <div className="absolute -bottom-px left-3 right-3 h-[1.5px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent pointer-events-none" />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 3. NEXT PROJECT SLOT (Right slot: left-aligned, faded, clickable) */}
            <div className="relative w-full h-full flex items-center justify-start pl-2 sm:pl-4 md:pl-6 min-w-0 overflow-hidden">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                {nextProject ? (
                  <motion.button
                    key={nextProject.id || `next-${safeIndex + 1}`}
                    role="tab"
                    aria-selected={false}
                    aria-controls="active-project-panel"
                    type="button"
                    onClick={handleNext}
                    custom={direction}
                    variants={{
                      enter: (dir: number) => ({
                        x: dir > 0 ? 24 : -24,
                        opacity: 0,
                      }),
                      center: {
                        x: 0,
                        opacity: 0.45,
                        transition: {
                          x: { type: 'spring', stiffness: 350, damping: 30 },
                          opacity: { duration: 0.25 },
                        },
                      },
                      exit: (dir: number) => ({
                        x: dir > 0 ? -24 : 24,
                        opacity: 0,
                        transition: {
                          x: { type: 'spring', stiffness: 350, damping: 30 },
                          opacity: { duration: 0.2 },
                        },
                      }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="group flex items-center gap-1.5 sm:gap-2 max-w-full text-left cursor-pointer hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8] rounded-lg py-1 px-1 sm:px-2 select-none"
                    title={`Next: ${nextProject.title}`}
                  >
                    <span className="truncate text-xs sm:text-sm md:text-base font-display font-medium text-[#94A3B8] group-hover:text-white transition-colors">
                      {nextProject.title}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-[#94A3B8]/60 group-hover:text-[#38BDF8] hidden md:inline shrink-0">
                      {nextProject.number || (safeIndex + 2 < 10 ? `0${safeIndex + 2}` : safeIndex + 2)}
                    </span>
                  </motion.button>
                ) : (
                  <div key="empty-right" className="h-4" aria-hidden="true" />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Next Project Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={safeIndex === projects.length - 1}
            aria-label="Next project"
            className="shrink-0 p-2 sm:p-2.5 rounded-full border border-white/10 bg-[#07101F]/90 backdrop-blur-md text-[#CBD5E1] hover:text-white hover:border-[#38BDF8]/40 hover:bg-[#0B1528] active:scale-95 disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:bg-[#07101F]/90 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] z-10"
          >
            <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Active Project Presentation: Details, Stack, Highlights & Demos           */}
      {/* ========================================================================= */}
      <div 
        id="active-project-panel" 
        role="tabpanel" 
        aria-labelledby={`project-tab-${activeProject.id || currentIndex}`}
        className="w-full max-w-6xl mx-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProject.id || currentIndex}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(6px)', y: 14 }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)', y: -14 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Top Project Identification Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Number and titles (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#38BDF8]">
                    {activeProject.number || (currentIndex < 9 ? `0${currentIndex + 1}` : `${currentIndex + 1}`)} <span className="text-[#38BDF8]/40 font-normal">/ {projects.length < 10 ? `0${projects.length}` : projects.length}</span>
                  </span>
                  {activeProject.isFlagship && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-xs font-mono text-[#38BDF8] font-semibold">
                      FLAGSHIP SYSTEM
                    </span>
                  )}
                  <span className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">
                    {activeProject.category}
                  </span>
                </div>

                <h3 className="text-3xl sm:text-4xl xl:text-5xl font-display font-black text-white tracking-tight">
                  {activeProject.title}
                </h3>
                <p className="text-base sm:text-lg font-mono text-[#38BDF8] font-medium">
                  {activeProject.subtitle}
                </p>

                <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed max-w-2xl font-light">
                  {activeProject.description}
                </p>
              </div>

              {/* Technologies & Action Links (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5 sm:space-y-6 bg-[#050816]/60 p-5 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="space-y-3">
                  <div className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
                    ARCHITECTURAL STACK
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProject.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded text-xs font-mono bg-[#07101F] text-[#CBD5E1] border border-white/5"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="text-xs font-mono text-[#94A3B8] uppercase">
                    ENGINEERING HIGHLIGHTS
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#CBD5E1] font-mono">
                    {activeProject.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#38BDF8] mt-0.5">›</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Links */}
                <div className="flex items-center gap-4 pt-2">
                  {activeProject.githubUrl && (
                    <a
                      href={activeProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#07101F] hover:bg-[#0B1120] border border-white/10 hover:border-[#38BDF8]/40 text-xs font-mono text-white flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Github className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>REPOSITORY</span>
                      <ArrowUpRight className="w-3 h-3 text-[#94A3B8]" />
                    </a>
                  )}
                  {activeProject.liveUrl && activeProject.liveUrl !== '#' && (
                    <a
                      href={activeProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#38BDF8] text-[#03050B] font-bold text-xs font-mono flex items-center gap-2 hover:bg-[#7DD3FC] transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>LIVE SYSTEM</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Functional Showcase Zone for Desktop */}
            <div className="w-full pt-4">
              {/* Project 01: AquaSense X */}
              {activeProject.id === 'aquasense-x' && (
                <div className="w-full rounded-2xl border border-[#38BDF8]/20 bg-[#050816]/90 p-6 md:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(56,189,248,0.06)]">
                  <div className="mb-4 flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                      <span className="font-mono text-xs tracking-widest text-[#38BDF8] uppercase">
                        ESP32-S3 PHYSICAL TELEMETRY INTERPRETATION
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#94A3B8]">
                      SAMPLING RATE: 100Hz · ADC RESOLUTION: 12-BIT
                    </span>
                  </div>
                  <AquaSenseVisualizer />
                </div>
              )}

              {/* Project 02: Naval Battle Simulator */}
              {activeProject.id === 'naval-battle-simulator' && (
                <div className="w-full rounded-2xl border border-white/10 bg-[#050816]/90 p-6 md:p-8 backdrop-blur-xl space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#38BDF8]" />
                      <span className="font-mono text-xs tracking-widest text-[#38BDF8] uppercase">
                        HEURISTIC TARGETING ENGINE & COORDINATE GRID
                      </span>
                    </div>
                    <span className="font-mono text-xs text-emerald-400">STATE: DETERMINISTIC</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-7 bg-[#03050B] p-4 rounded-xl border border-white/10">
                      <div className="grid grid-cols-8 gap-1.5 aspect-square max-w-[320px] mx-auto">
                        {Array.from({ length: 64 }).map((_, i) => {
                          const isShip = [10, 11, 12, 28, 36, 44, 50, 51].includes(i);
                          const isHit = [11, 36].includes(i);
                          const isScanned = [2, 19, 27, 45, 60].includes(i);
                          return (
                            <div
                              key={i}
                              className={`rounded flex items-center justify-center font-mono text-[9px] transition-all ${
                                isHit
                                  ? 'bg-rose-500/80 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
                                  : isShip
                                  ? 'bg-[#38BDF8]/40 border border-[#38BDF8]'
                                  : isScanned
                                  ? 'bg-[#1E3A8A]/30 border border-white/5 text-[#94A3B8]'
                                  : 'bg-[#03050B] border border-white/5'
                              }`}
                            >
                              {isHit ? '✕' : ''}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-mono text-[#94A3B8]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#38BDF8]" /> Fleet Hull</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" /> Kinetic Strike</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#1E3A8A]" /> Scanned</span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-3 font-mono text-xs">
                      <div className="p-3.5 rounded-xl bg-[#07101F] border border-white/10">
                        <span className="text-[#94A3B8] block text-[10px]">COORDINATE ALGORITHM</span>
                        <span className="text-white font-semibold">Parity-Based Chequerboard Scan</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#07101F] border border-white/10">
                        <span className="text-[#94A3B8] block text-[10px]">STATE STORAGE</span>
                        <span className="text-white font-semibold">Serialized Bitboard Array</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#07101F] border border-white/10">
                        <span className="text-[#94A3B8] block text-[10px]">COLLISION LOGIC</span>
                        <span className="text-white font-semibold">Deterministic Boundary Validation</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Project 03: AI CLI Chatbot Interactive Terminal Stream */}
              {activeProject.id === 'ai-cli-chatbot' && (
                <div className="w-full rounded-2xl border border-white/10 bg-[#050816]/90 p-6 md:p-8 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#38BDF8]" />
                      <span className="font-mono text-xs tracking-widest text-[#38BDF8] uppercase">
                        CLI STREAM RUNTIME & REPL INTERFACE
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runTerminalCommand('status')}
                        className="px-2.5 py-1 rounded bg-[#07101F] hover:bg-[#0B1120] border border-[#38BDF8]/20 text-[#38BDF8] font-mono text-[11px] cursor-pointer"
                      >
                        --status
                      </button>
                      <button
                        onClick={() => runTerminalCommand('arch')}
                        className="px-2.5 py-1 rounded bg-[#07101F] hover:bg-[#0B1120] border border-[#38BDF8]/20 text-[#38BDF8] font-mono text-[11px] cursor-pointer"
                      >
                        --arch
                      </button>
                      <button
                        onClick={() => runTerminalCommand('clear')}
                        className="px-2.5 py-1 rounded bg-[#07101F] hover:bg-[#0B1120] border border-white/10 text-[#94A3B8] font-mono text-[11px] cursor-pointer"
                      >
                        clear
                      </button>
                    </div>
                  </div>

                  {/* Terminal Window */}
                  <div className="w-full rounded-xl bg-[#03050B] border border-white/10 p-4 font-mono text-xs sm:text-sm text-[#CBD5E1] min-h-[160px] space-y-1.5 overflow-x-auto shadow-inner">
                    {terminalOutput.map((line, idx) => (
                      <div key={idx} className={line.startsWith('afrid-cli') ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}>
                        {line}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-[#38BDF8] pt-1">
                      <span>afrid-cli@universe:~$</span>
                      <span className="w-2 h-4 bg-[#38BDF8] animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Project 04: Weather & Automation Data Engine */}
              {activeProject.id === 'weather-automation' && (
                <div className="w-full rounded-2xl border border-white/10 bg-[#050816]/90 p-6 md:p-8 backdrop-blur-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-[#38BDF8]" />
                      <span className="font-mono text-xs tracking-widest text-[#38BDF8] uppercase">
                        AUTONOMOUS CRON TELEMETRY & WEBHOOK PIPELINE
                      </span>
                    </div>
                    <span className="font-mono text-xs text-emerald-400">STATUS: SCHEDULED ACTIVE</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
                    <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
                      <span className="text-[#94A3B8] text-[10px]">INGESTION CYCLE</span>
                      <div className="text-lg font-bold text-white">Every 15 min</div>
                      <span className="text-emerald-400 text-[10px]">Exponential backoff retry</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
                      <span className="text-[#94A3B8] text-[10px]">ANOMALY DETECTOR</span>
                      <div className="text-lg font-bold text-white">Δ &gt; 2.5 hPa/hr</div>
                      <span className="text-[#38BDF8] text-[10px]">Barometric pressure surge</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
                      <span className="text-[#94A3B8] text-[10px]">DOWNSTREAM SINK</span>
                      <div className="text-lg font-bold text-white">Webhook Push</div>
                      <span className="text-[#CBD5E1] text-[10px]">Encrypted Payload</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Projects Visualizer / Architecture Panel */}
              {!['aquasense-x', 'naval-battle-simulator', 'ai-cli-chatbot', 'weather-automation'].includes(activeProject.id) && (
                <div className="w-full rounded-2xl border border-white/10 bg-[#050816]/90 p-6 md:p-8 backdrop-blur-xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#38BDF8]" />
                      <span className="font-mono text-xs tracking-widest text-[#38BDF8] uppercase">
                        {activeProject.category} · ARCHITECTURAL SYSTEM
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#38BDF8]">
                      PROJ #{activeProject.number || (currentIndex < 9 ? `0${currentIndex + 1}` : `${currentIndex + 1}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
                    <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
                      <span className="text-[#94A3B8] text-[10px]">CORE DOMAIN</span>
                      <div className="text-base font-bold text-white">{activeProject.category}</div>
                      <span className="text-[#38BDF8] text-[10px]">Production Tier</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
                      <span className="text-[#94A3B8] text-[10px]">PRIMARY STACK</span>
                      <div className="text-base font-bold text-white">{activeProject.technologies.slice(0, 2).join(' · ') || 'System Design'}</div>
                      <span className="text-emerald-400 text-[10px]">Verified Modules</span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
                      <span className="text-[#94A3B8] text-[10px]">KEY DELIVERABLE</span>
                      <div className="text-base font-bold text-white truncate">{activeProject.highlights[0] || activeProject.tagline || 'Engineered Solution'}</div>
                      <span className="text-[#CBD5E1] text-[10px]">Active Architecture</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Redesigned Concluding Work CTA: Two-Column Editorial Statement with AI Builder Visual */}
      <div className="max-w-6xl mx-auto mt-12 sm:mt-16 md:mt-20">
        <div 
          className="group relative rounded-2xl border border-white/10 hover:border-[#38BDF8]/40 bg-[#050816]/85 backdrop-blur-xl p-6 sm:p-8 md:p-10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(56,189,248,0.08)] overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          
          {/* Ambient subtle light accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#38BDF8]/6 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-[#38BDF8]/10 transition-all duration-500" />
          
          {/* Two-Column Grid Layout */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Typography & Left-aligned CTA Button */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                  <span>COLLABORATION INQUIRY</span>
                </div>

                <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                  BUILDING SOMETHING?
                </h3>

                <p className="text-sm sm:text-base text-[#CBD5E1] font-light leading-relaxed max-w-xl">
                  Need an AI workflow, automation, software project, or technical solution?
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="work-cta-work-together-btn"
                  onClick={() => {
                    if (onWorkTogether) {
                      onWorkTogether();
                    } else {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="group/btn min-h-[46px] px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-mono text-xs sm:text-sm font-bold tracking-wider uppercase inline-flex items-center gap-2.5 transition-all duration-200 shadow-[0_0_24px_rgba(56,189,248,0.25)] hover:shadow-[0_0_32px_rgba(56,189,248,0.4)] cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <span>LET'S WORK TOGETHER</span>
                  <span className="text-base transition-transform duration-200 group-hover/btn:translate-x-1.5">→</span>
                </button>
              </div>
            </div>

            {/* Right Column: Cinematic 3D Animated AI Builder Visual */}
            <div className="lg:col-span-5 flex items-center justify-center w-full">
              <AiBuilderScene3D isHovered={isHovered} />
            </div>

          </div>
        </div>
      </div>

    </section>
  );
};
