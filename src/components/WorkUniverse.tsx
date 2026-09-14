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
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'afrid-cli@universe:~$ afrid-ai --init',
    '✓ Connected to stream gateway',
    '✓ Local buffer instantiated [128 tokens]',
    '✓ Ready for developer command orchestration.'
  ]);

  const activeProject = projects[currentIndex] || projects[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
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
    <section id="work" className="relative w-full py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-12 z-10">
      
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-8 sm:mb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span>SINGULAR CONTINUOUS WORK UNIVERSE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
              ENGINEERED BUILDS.
            </h2>
          </div>

          {/* Desktop Universe Trajectory Selector (hidden on mobile, visible on lg) */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#07101F] border border-white/10 rounded-full p-1">
              {projects.map((proj, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={proj.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-[#38BDF8] text-[#03050B] font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {proj.number}
                  </button>
                );
              })}
            </div>

            {/* Prev / Next controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full border border-white/10 bg-[#07101F] text-[#CBD5E1] hover:text-white hover:border-[#38BDF8]/40 hover:bg-[#0B1120] transition-all cursor-pointer"
                aria-label="Previous Project"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-full border border-white/10 bg-[#07101F] text-[#CBD5E1] hover:text-white hover:border-[#38BDF8]/40 hover:bg-[#0B1120] transition-all cursor-pointer"
                aria-label="Next Project"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MOBILE WORK EXPERIENCE (< lg): Intentional Vertical Project Sequence     */}
      {/* ========================================================================= */}
      <div className="lg:hidden max-w-xl mx-auto space-y-6">
        {projects.map((proj, index) => {
          return (
            <div
              key={proj.id}
              className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#050816]/90 backdrop-blur-md space-y-3.5 relative overflow-hidden"
            >
              {/* Subtle top corner glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#38BDF8]/5 rounded-full blur-2xl pointer-events-none" />

              {/* 01 / 04 & Category Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-[#38BDF8]">
                    {proj.number}
                  </span>
                  <span className="font-mono text-xs text-[#94A3B8]">
                    / 0{projects.length}
                  </span>
                  {proj.isFlagship && (
                    <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[9px] font-mono text-[#38BDF8] font-semibold">
                      FLAGSHIP
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[#94A3B8] tracking-wider truncate max-w-[140px]">
                  {proj.category}
                </span>
              </div>

              {/* Project Visual Snippet (Compact, intentional) */}
              <div className="rounded-xl border border-white/5 bg-[#03050B] p-3 overflow-hidden">
                {proj.id === 'aquasense-x' && (
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-[#38BDF8]">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      <span>TELEMETRY</span>
                    </div>
                    <div className="flex gap-2 text-[11px]">
                      <span className="text-[#CBD5E1]">Turbidity: <b className="text-emerald-400">0.8 NTU</b></span>
                      <span className="text-[#CBD5E1]">TDS: <b className="text-[#38BDF8]">142 ppm</b></span>
                    </div>
                  </div>
                )}
                {proj.id === 'naval-battle-simulator' && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#CBD5E1]">
                    <span className="text-[#38BDF8]">HEURISTIC ENGINE</span>
                    <span>Deterministic Probability Map</span>
                  </div>
                )}
                {proj.id === 'ai-cli-chatbot' && (
                  <div className="font-mono text-[11px] text-[#38BDF8] flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-[#38BDF8]" />
                    <span>afrid-cli@universe:~$ streaming tokens [84 tok/s]</span>
                  </div>
                )}
                {proj.id === 'weather-automation' && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#CBD5E1]">
                    <span className="text-[#38BDF8] flex items-center gap-1">
                      <CloudRain className="w-3 h-3" />
                      <span>CRON INGEST</span>
                    </span>
                    <span className="text-emerald-400">Every 15 min</span>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="text-xl font-display font-extrabold text-white tracking-tight">
                  {proj.title}
                </h3>
                <p className="text-xs font-mono text-[#38BDF8] mt-0.5">
                  {proj.subtitle}
                </p>
              </div>

              {/* Short Description */}
              <p className="text-xs text-[#CBD5E1] leading-relaxed font-light">
                {proj.description}
              </p>

              {/* Technologies */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {proj.technologies.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#07101F] text-[#CBD5E1] border border-white/5"
                  >
                    {tech}
                  </span>
                ))}
                {proj.technologies.length > 4 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#94A3B8]">
                    +{proj.technologies.length - 4}
                  </span>
                )}
              </div>

              {/* Explore Link (Touch-friendly 44px min height) */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <a
                  href={proj.githubUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#07101F] hover:bg-[#0B1120] border border-white/10 text-xs font-mono text-white flex items-center gap-2"
                >
                  <Github className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>EXPLORE CODE</span>
                  <ArrowUpRight className="w-3 h-3 text-[#94A3B8]" />
                </a>

                <span className="text-[10px] font-mono text-[#94A3B8]">
                  {proj.category.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP WORK EXPERIENCE (lg+): One Project At A Time System             */}
      {/* ========================================================================= */}
      <div className="hidden lg:block max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProject.id}
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)', y: 20 }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)', y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Top Project Identification Header */}
            <div className="grid grid-cols-12 gap-8 items-start">
              
              {/* Number and titles (7 cols) */}
              <div className="col-span-7 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-black text-[#38BDF8]">
                    {activeProject.number} <span className="text-[#38BDF8]/40 font-normal">/ 0{projects.length}</span>
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

                <h3 className="text-4xl xl:text-5xl font-display font-black text-white tracking-tight">
                  {activeProject.title}
                </h3>
                <p className="text-lg font-mono text-[#38BDF8] font-medium">
                  {activeProject.subtitle}
                </p>

                <p className="text-base text-[#CBD5E1] leading-relaxed max-w-2xl font-light">
                  {activeProject.description}
                </p>
              </div>

              {/* Technologies & Action Links (5 cols) */}
              <div className="col-span-5 flex flex-col justify-between space-y-6 bg-[#050816]/60 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
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

                  <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-7 bg-[#03050B] p-4 rounded-xl border border-white/10">
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

                    <div className="col-span-5 space-y-3 font-mono text-xs">
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

                  <div className="grid grid-cols-3 gap-4 font-mono text-xs">
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
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Refined Compact Work CTA: Continuation of Work Section */}
      <div className="max-w-6xl mx-auto mt-8 sm:mt-10">
        <div className="rounded-xl border border-white/10 hover:border-[#38BDF8]/30 bg-[#050816]/75 backdrop-blur-md px-5 py-3.5 sm:px-7 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 transition-all duration-300 shadow-[0_0_24px_rgba(56,189,248,0.03)]">
          
          <div className="space-y-1">
            <span className="text-xs font-mono tracking-widest text-[#38BDF8] font-semibold uppercase block">
              BUILDING SOMETHING?
            </span>
            <p className="text-xs sm:text-sm text-[#CBD5E1] font-light leading-snug">
              Need an AI workflow, automation, software project, or technical solution?
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center pt-1 sm:pt-0">
            <button
              id="work-cta-work-together-btn"
              onClick={() => {
                if (onWorkTogether) {
                  onWorkTogether();
                } else {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group min-h-[40px] px-5 py-2 rounded-full bg-[#07101F] hover:bg-[#0E1A33] border border-[#38BDF8]/35 hover:border-[#38BDF8]/75 text-[#38BDF8] hover:text-white font-mono text-xs font-bold tracking-wider uppercase inline-flex items-center gap-2 transition-all duration-200 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span>LET'S WORK TOGETHER</span>
              <span className="text-sm transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>

        </div>
      </div>

    </section>
  );
};
