import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
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

// ============================================================================
// MEMOIZED PROJECT SHOWCASE COMPONENTS
// Prevents heavy visual trees from re-rendering during navigation
// ============================================================================

const AquaSenseShowcase = React.memo(() => (
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
));

AquaSenseShowcase.displayName = 'AquaSenseShowcase';

const NavalBattleShowcase = React.memo(() => (
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
));

NavalBattleShowcase.displayName = 'NavalBattleShowcase';

interface AiCliChatbotShowcaseProps {
  terminalOutput: string[];
  onRunCommand: (cmd: string) => void;
}

const AiCliChatbotShowcase: React.FC<AiCliChatbotShowcaseProps> = React.memo(({
  terminalOutput,
  onRunCommand
}) => (
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
          type="button"
          onClick={() => onRunCommand('status')}
          className="px-2.5 py-1 rounded bg-[#07101F] hover:bg-[#0B1120] border border-[#38BDF8]/20 text-[#38BDF8] font-mono text-[11px] cursor-pointer active:scale-95 transition-all"
        >
          --status
        </button>
        <button
          type="button"
          onClick={() => onRunCommand('arch')}
          className="px-2.5 py-1 rounded bg-[#07101F] hover:bg-[#0B1120] border border-[#38BDF8]/20 text-[#38BDF8] font-mono text-[11px] cursor-pointer active:scale-95 transition-all"
        >
          --arch
        </button>
        <button
          type="button"
          onClick={() => onRunCommand('clear')}
          className="px-2.5 py-1 rounded bg-[#07101F] hover:bg-[#0B1120] border border-white/10 text-[#94A3B8] font-mono text-[11px] cursor-pointer active:scale-95 transition-all"
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
));

AiCliChatbotShowcase.displayName = 'AiCliChatbotShowcase';

const WeatherAutomationShowcase = React.memo(() => (
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
));

WeatherAutomationShowcase.displayName = 'WeatherAutomationShowcase';

interface DynamicProjectShowcaseProps {
  project: ProjectItem;
  index: number;
}

const DynamicProjectShowcase: React.FC<DynamicProjectShowcaseProps> = React.memo(({
  project,
  index
}) => (
  <div className="w-full rounded-2xl border border-white/10 bg-[#050816]/90 p-6 md:p-8 backdrop-blur-xl space-y-5">
    <div className="flex items-center justify-between pb-3 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-[#38BDF8]" />
        <span className="font-mono text-xs tracking-widest text-[#38BDF8] uppercase">
          {project.category} · ARCHITECTURAL SYSTEM
        </span>
      </div>
      <span className="font-mono text-xs text-[#38BDF8]">
        PROJ #{project.number || (index < 9 ? `0${index + 1}` : `${index + 1}`)}
      </span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
      <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
        <span className="text-[#94A3B8] text-[10px]">CORE DOMAIN</span>
        <div className="text-base font-bold text-white">{project.category}</div>
        <span className="text-[#38BDF8] text-[10px]">Production Tier</span>
      </div>
      <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
        <span className="text-[#94A3B8] text-[10px]">PRIMARY STACK</span>
        <div className="text-base font-bold text-white">{project.technologies.slice(0, 2).join(' · ') || 'System Design'}</div>
        <span className="text-emerald-400 text-[10px]">Verified Modules</span>
      </div>
      <div className="p-4 rounded-xl bg-[#03050B] border border-white/5 space-y-1">
        <span className="text-[#94A3B8] text-[10px]">KEY DELIVERABLE</span>
        <div className="text-base font-bold text-white truncate">{project.highlights[0] || project.tagline || 'Engineered Solution'}</div>
        <span className="text-[#CBD5E1] text-[10px]">Active Architecture</span>
      </div>
    </div>
  </div>
));

DynamicProjectShowcase.displayName = 'DynamicProjectShowcase';

// ============================================================================
// MEMOIZED VISUALIZER SLOT WRAPPER
// Keeps children continuously mounted in the DOM to avoid re-instantiation
// ============================================================================

interface VisualizerSlotProps {
  id: string;
  activeId: string;
  direction: number;
  reducedMotion: boolean;
  children: React.ReactNode;
}

const VisualizerSlot: React.FC<VisualizerSlotProps> = React.memo(({
  id,
  activeId,
  direction,
  reducedMotion,
  children
}) => {
  const isActive = id === activeId;

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isActive ? 1 : 0,
        x: isActive ? 0 : reducedMotion ? 0 : direction > 0 ? -24 : 24,
      }}
      transition={
        reducedMotion
          ? { duration: 0.12 }
          : {
              x: { type: 'spring', stiffness: 450, damping: 36, mass: 0.65 },
              opacity: { duration: 0.22, ease: 'easeOut' },
            }
      }
      style={{
        position: isActive ? 'relative' : 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        pointerEvents: isActive ? 'auto' : 'none',
        visibility: isActive ? 'visible' : 'hidden',
        willChange: 'transform, opacity',
      }}
      aria-hidden={!isActive}
    >
      {children}
    </motion.div>
  );
});

VisualizerSlot.displayName = 'VisualizerSlot';

// ============================================================================
// MEMOIZED PROJECT IDENTIFICATION HEADER
// ============================================================================

interface ProjectHeaderContentProps {
  project: ProjectItem;
  totalProjects: number;
  index: number;
}

const ProjectHeaderContent: React.FC<ProjectHeaderContentProps> = React.memo(({
  project,
  totalProjects,
  index
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
    {/* Number and titles (7 cols) */}
    <div className="lg:col-span-7 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xl sm:text-2xl font-black text-[#38BDF8]">
          {project.number || (index < 9 ? `0${index + 1}` : `${index + 1}`)}{' '}
          <span className="text-[#38BDF8]/40 font-normal">
            / {totalProjects < 10 ? `0${totalProjects}` : totalProjects}
          </span>
        </span>
        {project.isFlagship && (
          <span className="px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-xs font-mono text-[#38BDF8] font-semibold">
            FLAGSHIP SYSTEM
          </span>
        )}
        <span className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">
          {project.category}
        </span>
      </div>

      <h3 className="text-3xl sm:text-4xl xl:text-5xl font-display font-black text-white tracking-tight">
        {project.title}
      </h3>
      <p className="text-base sm:text-lg font-mono text-[#38BDF8] font-medium">
        {project.subtitle}
      </p>

      <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed max-w-2xl font-light">
        {project.description}
      </p>
    </div>

    {/* Technologies & Action Links (5 cols) */}
    <div className="lg:col-span-5 flex flex-col justify-between space-y-5 sm:space-y-6 bg-[#050816]/60 p-5 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-md">
      <div className="space-y-3">
        <div className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
          ARCHITECTURAL STACK
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(project.technologies || []).map((tech) => (
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
          {(project.highlights || []).map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[#38BDF8] mt-0.5">›</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Links */}
      <div className="flex items-center gap-4 pt-2">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-[#07101F] hover:bg-[#0B1120] border border-white/10 hover:border-[#38BDF8]/40 text-xs font-mono text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Github className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>REPOSITORY</span>
            <ArrowUpRight className="w-3 h-3 text-[#94A3B8]" />
          </a>
        )}
        {project.liveUrl && project.liveUrl !== '#' && (
          <a
            href={project.liveUrl}
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
));

ProjectHeaderContent.displayName = 'ProjectHeaderContent';

// ============================================================================
// MAIN WORKUNIVERSE COMPONENT
// ============================================================================

interface WorkUniverseProps {
  projects?: ProjectItem[];
  onWorkTogether?: () => void;
}

export const WorkUniverse: React.FC<WorkUniverseProps> = ({ 
  projects = PROJECTS,
  onWorkTogether
}) => {
  // 1. SINGLE SOURCE OF TRUTH: filter published projects strictly before state & carousel calculations
  const visibleProjects = useMemo(() => {
    return (projects || [])
      .filter((p: any) => p.is_published !== false && p.isPublished !== false)
      .sort((a: any, b: any) => {
        const orderA = a.displayOrder ?? a.display_order ?? 0;
        const orderB = b.displayOrder ?? b.display_order ?? 0;
        return orderA - orderB;
      });
  }, [projects]);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return visibleProjects[0]?.id || null;
  });
  const [direction, setDirection] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'afrid-cli@universe:~$ afrid-ai --init',
    '✓ Connected to stream gateway',
    '✓ Local buffer instantiated [128 tokens]',
    '✓ Ready for developer command orchestration.'
  ]);

  // Respect system prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Compute active index safely based on activeProjectId in visibleProjects
  const activeIndex = useMemo(() => {
    if (visibleProjects.length === 0) return -1;
    const found = visibleProjects.findIndex((p) => p.id === activeProjectId);
    if (found !== -1) return found;
    return 0;
  }, [visibleProjects, activeProjectId]);

  const activeProject = useMemo(() => {
    if (activeIndex === -1 || visibleProjects.length === 0) return null;
    return visibleProjects[activeIndex] || null;
  }, [visibleProjects, activeIndex]);

  // Track previous active index to select nearest valid successor if active project is unpublished
  const prevIndexRef = useRef<number>(activeIndex);

  // Synchronize active project when visibleProjects changes (e.g. project unpublished or reordered)
  useEffect(() => {
    const prevIdx = prevIndexRef.current;

    if (visibleProjects.length === 0) {
      if (activeProjectId !== null) {
        setActiveProjectId(null);
      }
      prevIndexRef.current = -1;
      return;
    }

    // Check if the currently active project is still published
    const stillVisible = visibleProjects.some((p) => p.id === activeProjectId);

    if (!stillVisible) {
      // The active project was hidden or deleted!
      // Select the nearest valid successor (or predecessor)
      const targetIdx = Math.min(Math.max(0, prevIdx >= 0 ? prevIdx : 0), visibleProjects.length - 1);
      const replacement = visibleProjects[targetIdx];
      if (replacement) {
        setDirection(0);
        setActiveProjectId(replacement.id);
        prevIndexRef.current = targetIdx;
      }
    } else {
      // Current project is still visible; update prevIndexRef to its new position in the array
      const currentIdx = visibleProjects.findIndex((p) => p.id === activeProjectId);
      if (currentIdx !== -1) {
        prevIndexRef.current = currentIdx;
      }
    }
  }, [visibleProjects, activeProjectId]);

  // Persistent Navigation Rail Track & Centering Architecture
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [trackTranslateX, setTrackTranslateX] = useState<number>(0);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  const updateTrackPosition = useCallback(() => {
    if (!viewportRef.current || !trackRef.current || !activeProject) return;
    const viewport = viewportRef.current;
    const activeItem = itemRefs.current.get(activeProject.id);
    if (!activeItem) return;

    // Use transform-independent layout properties (offsetLeft, offsetWidth)
    const itemLeft = activeItem.offsetLeft;
    const itemWidth = activeItem.offsetWidth;
    const itemCenter = itemLeft + itemWidth / 2;

    const viewportWidth = viewport.clientWidth;
    const viewportCenter = viewportWidth / 2;

    const targetX = viewportCenter - itemCenter;
    setTrackTranslateX(targetX);
  }, [activeProject]);

  // Synchronously compute the centered translation whenever activeIndex, activeProject, or visibleProjects change
  useLayoutEffect(() => {
    updateTrackPosition();
    const rafId = requestAnimationFrame(updateTrackPosition);
    return () => cancelAnimationFrame(rafId);
  }, [activeIndex, activeProject, visibleProjects, updateTrackPosition]);

  // Enable animated spring transitions only after the initial layout is positioned
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Recalculate on container resize, window resize, font loading, or orientation change
  useEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver(() => {
      updateTrackPosition();
    });
    ro.observe(viewportRef.current);
    if (trackRef.current) {
      ro.observe(trackRef.current);
    }
    window.addEventListener('resize', updateTrackPosition);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateTrackPosition);
    };
  }, [updateTrackPosition]);

  // Preload adjacent project images if any exist
  useEffect(() => {
    if (visibleProjects.length <= 1 || activeIndex === -1) return;
    const nextIdx = activeIndex < visibleProjects.length - 1 ? activeIndex + 1 : 0;
    const prevIdx = activeIndex > 0 ? activeIndex - 1 : visibleProjects.length - 1;
    [visibleProjects[nextIdx]?.imageUrl, visibleProjects[prevIdx]?.imageUrl].forEach((url) => {
      if (url && typeof Image !== 'undefined') {
        const img = new Image();
        img.src = url;
      }
    });
  }, [activeIndex, visibleProjects]);

  // Unified single-batch navigation handler
  const goToProject = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= visibleProjects.length) return;
    const target = visibleProjects[newIndex];
    if (!target || target.id === activeProjectId) return;
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveProjectId(target.id);
    prevIndexRef.current = newIndex;
  }, [activeIndex, activeProjectId, visibleProjects]);

  const handleNext = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < visibleProjects.length - 1) {
      goToProject(activeIndex + 1);
    }
  }, [activeIndex, visibleProjects.length, goToProject]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      goToProject(activeIndex - 1);
    }
  }, [activeIndex, goToProject]);

  // Keyboard navigation for tablist / carousel
  const handleRailKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (visibleProjects.length <= 1) return;
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
      goToProject(visibleProjects.length - 1);
    }
  }, [handleNext, handlePrev, goToProject, visibleProjects.length]);

  const runTerminalCommand = useCallback((cmd: string) => {
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
  }, []);

  const isCoreProject = useMemo(() => {
    if (!activeProject) return false;
    return ['aquasense-x', 'naval-battle-simulator', 'ai-cli-chatbot', 'weather-automation'].includes(activeProject.id);
  }, [activeProject]);

  const activeVisualizerId = activeProject ? (isCoreProject ? activeProject.id : 'dynamic-project') : '';

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
              <span className="text-[#38BDF8] font-bold">
                {activeProject ? (activeProject.number || (activeIndex < 9 ? `0${activeIndex + 1}` : `${activeIndex + 1}`)) : '--'}
              </span>
              <span className="text-white/20 mx-1.5">/</span>
              <span className="text-[#94A3B8]">{visibleProjects.length < 10 ? `0${visibleProjects.length}` : visibleProjects.length}</span>
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
            disabled={activeIndex <= 0}
            aria-label="Previous project"
            className="shrink-0 p-2 sm:p-2.5 rounded-full border border-white/10 bg-[#07101F]/90 backdrop-blur-md text-[#CBD5E1] hover:text-white hover:border-[#38BDF8]/40 hover:bg-[#0B1528] active:scale-95 disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:bg-[#07101F]/90 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] z-20"
          >
            <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Continuous Premium Carousel Viewport */}
          <div 
            ref={viewportRef}
            role="tablist"
            aria-label="Selected project carousel navigation"
            className="relative flex-1 min-w-0 h-14 sm:h-16 overflow-hidden flex items-center"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            }}
          >
            <motion.div
              ref={trackRef}
              className="relative flex items-center gap-3 sm:gap-5 w-max select-none will-change-transform"
              initial={false}
              animate={{ x: trackTranslateX }}
              transition={
                !hasMounted
                  ? { duration: 0 }
                  : reducedMotion
                  ? { duration: 0.12 }
                  : {
                      type: 'spring',
                      stiffness: 380,
                      damping: 38,
                      mass: 0.7,
                    }
              }
            >
              {visibleProjects.map((project, idx) => {
                const isActive = project.id === activeProjectId;
                const isNeighbor = Math.abs(idx - activeIndex) === 1;

                return (
                  <motion.button
                    key={project.id || idx}
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(project.id, el);
                      } else {
                        itemRefs.current.delete(project.id);
                      }
                    }}
                    role="tab"
                    id={`project-tab-${project.id || idx}`}
                    aria-selected={isActive}
                    aria-controls="active-project-panel"
                    tabIndex={isActive ? 0 : -1}
                    type="button"
                    onClick={() => goToProject(idx)}
                    animate={{
                      opacity: isActive ? 1 : isNeighbor ? 0.65 : 0.22,
                    }}
                    whileHover={{
                      opacity: isActive ? 1 : 0.9,
                    }}
                    transition={
                      reducedMotion
                        ? { duration: 0.12 }
                        : { duration: 0.24, ease: 'easeOut' }
                    }
                    style={{ willChange: 'transform, opacity' }}
                    className={`group relative shrink-0 px-3.5 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 sm:gap-3 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                      isActive ? 'z-10' : 'z-0'
                    }`}
                    title={isActive ? `Current: ${project.title}` : `Navigate to: ${project.title}`}
                  >
                    {/* Active highlighted container: refined translucent frosted surface */}
                    <div
                      className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${
                        isActive
                          ? 'bg-[#0B1528]/95 border border-[#38BDF8]/40 shadow-[0_0_24px_rgba(56,189,248,0.18)] backdrop-blur-md'
                          : 'bg-transparent border border-transparent group-hover:bg-[#07101F]/40'
                      }`}
                    />

                    {/* Underneath active accent glow line */}
                    <div
                      className={`absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent rounded-full shadow-[0_0_8px_#38BDF8] transition-opacity duration-300 pointer-events-none ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Number indicator */}
                    <span
                      className={`font-mono text-xs shrink-0 transition-colors duration-300 ${
                        isActive
                          ? 'text-[#38BDF8] font-bold'
                          : 'text-[#94A3B8]/75 group-hover:text-[#38BDF8]'
                      }`}
                    >
                      {project.number || (idx < 9 ? `0${idx + 1}` : `${idx + 1}`)}
                    </span>

                    {/* Active pulse dot */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8] shrink-0 transition-all duration-300 ${
                        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`}
                    />

                    {/* Project title: High-contrast, crystal clear typography */}
                    <span
                      className={`text-sm sm:text-base md:text-lg font-display tracking-normal sm:tracking-wide whitespace-nowrap transition-colors duration-300 ${
                        isActive
                          ? 'font-semibold text-white drop-shadow-[0_1px_8px_rgba(255,255,255,0.25)]'
                          : 'font-normal sm:font-medium text-[#CBD5E1] group-hover:text-white'
                      }`}
                    >
                      {project.title}
                    </span>

                    {/* Flagship chip for flagship project */}
                    {project.isFlagship && (
                      <span
                        className={`hidden lg:inline-flex items-center px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[10px] font-mono text-[#38BDF8] font-semibold tracking-wider uppercase ml-1 shrink-0 transition-all duration-300 ${
                          isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                        }`}
                      >
                        FLAGSHIP
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Next Project Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={activeIndex >= visibleProjects.length - 1}
            aria-label="Next project"
            className="shrink-0 p-2 sm:p-2.5 rounded-full border border-white/10 bg-[#07101F]/90 backdrop-blur-md text-[#CBD5E1] hover:text-white hover:border-[#38BDF8]/40 hover:bg-[#0B1528] active:scale-95 disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:bg-[#07101F]/90 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] z-20"
          >
            <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Active Project Presentation Panel (Stable height, smooth GPU transition)   */}
      {/* ========================================================================= */}
      <div 
        id="active-project-panel" 
        role="tabpanel" 
        aria-labelledby={activeProject ? `project-tab-${activeProject.id}` : undefined}
        className="w-full max-w-6xl mx-auto min-h-[620px] sm:min-h-[580px]"
      >
        {!activeProject ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-white/10 rounded-2xl bg-[#07101F]/60 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse mb-3" />
            <p className="text-white font-display font-semibold text-lg mb-1">
              No Published Projects
            </p>
            <p className="text-sm font-mono text-[#94A3B8] max-w-md">
              Projects are currently being updated in the command center. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            
            {/* Top Project Identification Header (Directional PopLayout crossfade) */}
            <div className="relative min-h-[260px] sm:min-h-[220px]">
              <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                  key={activeProject.id}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      x: reducedMotion ? 0 : dir > 0 ? 24 : -24,
                      opacity: 0,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                      transition: reducedMotion
                        ? { duration: 0.12 }
                        : {
                            x: { type: 'spring', stiffness: 450, damping: 36, mass: 0.65 },
                            opacity: { duration: 0.22, ease: 'easeOut' },
                          },
                    },
                    exit: (dir: number) => ({
                      x: reducedMotion ? 0 : dir > 0 ? -24 : 24,
                      opacity: 0,
                      transition: reducedMotion
                        ? { duration: 0.1 }
                        : {
                            x: { type: 'spring', stiffness: 450, damping: 36, mass: 0.65 },
                            opacity: { duration: 0.18, ease: 'easeIn' },
                          },
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ willChange: 'transform, opacity' }}
                  className="w-full"
                >
                  <ProjectHeaderContent
                    project={activeProject}
                    totalProjects={visibleProjects.length}
                    index={activeIndex}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive Functional Showcase Zone for Desktop (Permanently mounted shells) */}
            <div className="w-full pt-4 min-h-[380px] sm:min-h-[420px] relative">
              
              {/* Project 01: AquaSense X */}
              <VisualizerSlot
                id="aquasense-x"
                activeId={activeVisualizerId}
                direction={direction}
                reducedMotion={reducedMotion}
              >
                <AquaSenseShowcase />
              </VisualizerSlot>

              {/* Project 02: Naval Battle Simulator */}
              <VisualizerSlot
                id="naval-battle-simulator"
                activeId={activeVisualizerId}
                direction={direction}
                reducedMotion={reducedMotion}
              >
                <NavalBattleShowcase />
              </VisualizerSlot>

              {/* Project 03: AI CLI Chatbot */}
              <VisualizerSlot
                id="ai-cli-chatbot"
                activeId={activeVisualizerId}
                direction={direction}
                reducedMotion={reducedMotion}
              >
                <AiCliChatbotShowcase
                  terminalOutput={terminalOutput}
                  onRunCommand={runTerminalCommand}
                />
              </VisualizerSlot>

              {/* Project 04: Weather Automation */}
              <VisualizerSlot
                id="weather-automation"
                activeId={activeVisualizerId}
                direction={direction}
                reducedMotion={reducedMotion}
              >
                <WeatherAutomationShowcase />
              </VisualizerSlot>

              {/* Dynamic Project Slot (CMS/Custom projects) */}
              <VisualizerSlot
                id="dynamic-project"
                activeId={activeVisualizerId}
                direction={direction}
                reducedMotion={reducedMotion}
              >
                <DynamicProjectShowcase
                  project={activeProject}
                  index={activeIndex}
                />
              </VisualizerSlot>

            </div>

          </div>
        )}
      </div>

      {/* Concluding Work Collaboration Section: Compact Premium Statement with 3D Visualizer */}
      <div className="max-w-6xl mx-auto mt-12 sm:mt-16 md:mt-20">
        <div 
          className="group relative rounded-2xl border border-white/10 hover:border-[#38BDF8]/40 bg-[#050816]/85 backdrop-blur-xl p-6 sm:p-8 md:p-10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(56,189,248,0.08)] overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          
          {/* Ambient subtle light accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#38BDF8]/6 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-[#38BDF8]/10 transition-all duration-500" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Column: Authentic Direct Technical Statement (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#38BDF8] tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                <span>CO-CREATION & ENGINEERING</span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-tight">
                LET'S WORK.
              </h3>

              <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed max-w-xl font-light">
                Whether you need low-level embedded telemetry with the ESP32-S3, high-performance C state engines, or modern web interfaces powered by TypeScript and AI, I build clean, reliable systems from the ground up.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (onWorkTogether) {
                      onWorkTogether();
                    } else {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-[#38BDF8] text-[#03050B] font-mono font-bold text-xs flex items-center gap-2 hover:bg-[#7DD3FC] transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.3)] active:scale-95"
                >
                  <span>LET'S TALK</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Available for summer & project collaborations</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3D Canvas Visualizer (5 cols) */}
            <div className="lg:col-span-5 h-56 sm:h-64 lg:h-72 w-full rounded-xl bg-[#03050B]/80 border border-white/5 overflow-hidden relative">
              <AiBuilderScene3D isHovered={isHovered} />
            </div>

          </div>
        </div>
      </div>

    </section>
  );
};
