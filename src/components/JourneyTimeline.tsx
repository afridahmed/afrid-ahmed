import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  BrainCircuit,
  Briefcase,
  Layers,
  GraduationCap,
  Check,
  Clock,
  Target,
  Compass,
  Milestone,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { JourneyMilestone, JourneyContent } from '../types';
import { JOURNEY } from '../data/siteContent';

interface JourneyTimelineProps {
  content?: JourneyContent;
  milestones?: JourneyMilestone[];
}

type DerivedStage = 'completed' | 'current' | 'upcoming' | 'horizon';

interface StageVisuals {
  stage: DerivedStage;
  statusLabel: string;
  desktopStatusLabel: 'Completed' | 'In Progress' | 'Upcoming';
  cardClass: string;
  iconBoxClass: string;
  yearClass: string;
  statusClass: string;
  topAccentClass: string;
}

function getStageVisuals(stage: DerivedStage): StageVisuals {
  switch (stage) {
    case 'completed':
      return {
        stage,
        statusLabel: 'Completed',
        desktopStatusLabel: 'Completed',
        cardClass: 'bg-[#050B18]/80 border-[#38BDF8]/25',
        iconBoxClass: 'bg-[#38BDF8]/10 border-[#38BDF8]/25 text-[#7DD3FC]',
        yearClass: 'text-white/90',
        statusClass: 'text-[#7DD3FC]',
        topAccentClass: 'bg-gradient-to-r from-[#38BDF8]/55 via-[#38BDF8]/15 to-transparent',
      };
    case 'current':
      return {
        stage,
        statusLabel: 'Current',
        desktopStatusLabel: 'In Progress',
        cardClass:
          'bg-[#071428]/95 border-[#38BDF8]/60 shadow-[0_0_28px_rgba(56,189,248,0.14)]',
        iconBoxClass:
          'bg-[#38BDF8]/15 border-[#38BDF8]/45 text-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.2)]',
        yearClass: 'text-[#38BDF8]',
        statusClass: 'text-[#38BDF8]',
        topAccentClass: 'bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-transparent',
      };
    case 'horizon':
      return {
        stage,
        statusLabel: 'Horizon',
        desktopStatusLabel: 'Upcoming',
        cardClass: 'bg-[#050816]/75 border-indigo-400/20 hover:border-indigo-400/35',
        iconBoxClass: 'bg-indigo-400/10 border-indigo-400/25 text-[#A5B4FC]',
        yearClass: 'text-[#C7D2FE]',
        statusClass: 'text-[#A5B4FC]',
        topAccentClass: 'bg-gradient-to-r from-indigo-400/45 via-transparent to-transparent',
      };
    case 'upcoming':
    default:
      return {
        stage: 'upcoming',
        statusLabel: 'Planned',
        desktopStatusLabel: 'Upcoming',
        cardClass: 'bg-[#050816]/72 border-white/10 hover:border-white/20',
        iconBoxClass: 'bg-white/[0.04] border-white/10 text-[#94A3B8]',
        yearClass: 'text-white/90',
        statusClass: 'text-[#94A3B8]',
        topAccentClass: 'bg-gradient-to-r from-white/15 via-transparent to-transparent',
      };
  }
}

function getMilestoneIcon(m: JourneyMilestone, idx: number, stage: DerivedStage) {
  const haystack = `${m.year} ${m.phase} ${m.title}`.toLowerCase();
  if (stage === 'horizon' || haystack.includes('graduation') || haystack.includes('2030') || haystack.includes('degree')) {
    return GraduationCap;
  }
  if (haystack.includes('foundation') || haystack.includes('fundamental') || haystack.includes('2026')) {
    return Terminal;
  }
  if (haystack.includes('artificial intelligence') || haystack.includes('ml') || haystack.includes('deeper') || haystack.includes('2027')) {
    return BrainCircuit;
  }
  if (haystack.includes('industry') || haystack.includes('internship') || haystack.includes('real-world') || haystack.includes('2028')) {
    return Briefcase;
  }
  if (haystack.includes('complex') || haystack.includes('product') || haystack.includes('prototype') || haystack.includes('2029')) {
    return Layers;
  }
  const fallbacks = [Terminal, BrainCircuit, Briefcase, Layers, GraduationCap];
  return fallbacks[idx % fallbacks.length];
}

const StageStatusIcon: React.FC<{ stage: DerivedStage; className?: string }> = ({
  stage,
  className = 'w-3 h-3',
}) => {
  switch (stage) {
    case 'completed':
      return <Check className={className} aria-hidden="true" />;
    case 'current':
      return <Target className={className} aria-hidden="true" />;
    case 'horizon':
      return <Compass className={className} aria-hidden="true" />;
    case 'upcoming':
    default:
      return <Clock className={className} aria-hidden="true" />;
  }
};

interface MarkerPosition {
  centerX: number;
  nodeY: number;
  isActive: boolean;
}

const AMBIENT_STARS = [
  { xPct: 0.05, yPct: 0.18, r: 1.1, o: 0.35 },
  { xPct: 0.11, yPct: 0.78, r: 0.9, o: 0.25 },
  { xPct: 0.17, yPct: 0.32, r: 1.3, o: 0.38 },
  { xPct: 0.24, yPct: 0.84, r: 0.85, o: 0.22 },
  { xPct: 0.32, yPct: 0.22, r: 1.0, o: 0.28 },
  { xPct: 0.4, yPct: 0.87, r: 1.0, o: 0.24 },
  { xPct: 0.61, yPct: 0.16, r: 1.0, o: 0.28 },
  { xPct: 0.69, yPct: 0.85, r: 1.15, o: 0.26 },
  { xPct: 0.78, yPct: 0.25, r: 0.9, o: 0.32 },
  { xPct: 0.85, yPct: 0.76, r: 1.25, o: 0.34 },
  { xPct: 0.92, yPct: 0.29, r: 1.0, o: 0.3 },
  { xPct: 0.96, yPct: 0.66, r: 0.85, o: 0.24 },
];

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  content = JOURNEY,
  milestones,
}) => {
  const milestoneList: JourneyMilestone[] = useMemo(() => {
    if (Array.isArray(milestones)) return milestones;
    if (Array.isArray((milestones as any)?.milestones)) return (milestones as any).milestones;
    return content?.milestones || [];
  }, [milestones, content]);

  const currentIndex = useMemo(
    () => milestoneList.findIndex((m) => m.status === 'current'),
    [milestoneList]
  );

  const initialYear = () => {
    const current = milestoneList.find((m) => m.status === 'current');
    if (current?.year !== undefined && current?.year !== null) return String(current.year);
    return milestoneList[0]?.year !== undefined && milestoneList[0]?.year !== null
      ? String(milestoneList[0].year)
      : '2026';
  };

  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [transitionDir, setTransitionDir] = useState<number>(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const [stageWidth, setStageWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.min(1560, Math.max(1180, window.innerWidth - 64));
    }
    return 1320;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Keep selectedYear synced if milestones update from CMS
  useEffect(() => {
    if (milestoneList.length > 0 && !milestoneList.some((m) => String(m.year) === String(selectedYear))) {
      const current = milestoneList.find((m) => m.status === 'current');
      setSelectedYear(
        current?.year !== undefined && current?.year !== null
          ? String(current.year)
          : String(milestoneList[0].year)
      );
    }
  }, [milestoneList, selectedYear]);

  // Measure desktop orbital stage width cleanly
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w >= 600) {
        setStageWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
      }
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [milestoneList.length]);

  const resolveStage = (m: JourneyMilestone, idx: number): DerivedStage => {
    if ((m.status as string) === 'completed') return 'completed';
    if (m.status === 'current') return 'current';
    if (currentIndex !== -1 && idx < currentIndex) return 'completed';
    if (m.status === 'aspirational') return 'horizon';
    return 'upcoming';
  };

  const activeIdx = useMemo(() => {
    if (milestoneList.length === 0) return 0;
    const found = milestoneList.findIndex((m) => String(m.year) === String(selectedYear));
    if (found !== -1) return found;
    return currentIndex !== -1 ? currentIndex : 0;
  }, [milestoneList, selectedYear, currentIndex]);

  const selectByIndex = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= milestoneList.length) return;
    const target = milestoneList[targetIdx];
    if (!target) return;
    setTransitionDir(targetIdx >= activeIdx ? 1 : -1);
    setSelectedYear(String(target.year));
  };

  const cardVariants = useMemo(
    () => ({
      enter: (dir: number) => ({
        opacity: 0,
        scale: 0.88,
        x: dir * 64,
        filter: 'blur(6px)',
      }),
      center: {
        opacity: 1,
        scale: 1,
        x: 0,
        filter: 'blur(0px)',
      },
      exit: (dir: number) => ({
        opacity: 0,
        scale: 0.88,
        x: dir * -64,
        filter: 'blur(6px)',
      }),
    }),
    []
  );

  // Compute mathematically exact centered active card + curved orbital year markers
  const desktopGeometry = useMemo(() => {
    const count = milestoneList.length;
    const safeW = Math.max(1140, stageWidth);
    const stageHeight = Math.round(Math.min(435, Math.max(380, safeW * 0.265)));
    const midY = Math.round(stageHeight / 2);

    // Central active feature card width
    const activeWidth = Math.round(Math.min(450, Math.max(360, safeW * 0.295)));

    // Exact parabolic orbital curve spanning the stage: y(x) = yApex + arcDrop * (x / curveHalfW)^2
    const edgeMargin = 42;
    const curveHalfW = safeW / 2 - edgeMargin;
    const yApex = midY - 12;
    const yEdge = midY + 30;
    const arcDrop = yEdge - yApex;
    const yCtrl = 2 * yApex - yEdge;

    const arcY = (offsetX: number) => {
      const t = Math.min(1.05, Math.abs(offsetX) / Math.max(1, curveHalfW));
      return yApex + arcDrop * t * t;
    };

    const leftCount = activeIdx;
    const rightCount = Math.max(0, count - 1 - activeIdx);
    const maxSide = Math.max(leftCount, rightCount, 1);

    // Clearance from active card edge to nearest year marker center
    const clearance = Math.round(Math.max(46, Math.min(68, safeW * 0.042)));
    const baseOffset = activeWidth / 2 + clearance;
    const stepCount = Math.max(1, maxSide - 1);
    const markerStep = Math.min(132, Math.max(82, (curveHalfW - baseOffset) / stepCount));

    const markers: MarkerPosition[] = new Array(count);

    // Active milestone ALWAYS centered at exact centerX = 0
    markers[activeIdx] = {
      centerX: 0,
      nodeY: arcY(0),
      isActive: true,
    };

    // Place upcoming/right markers progressively toward the right
    for (let k = 1; activeIdx + k < count; k++) {
      const cx = baseOffset + (k - 1) * markerStep;
      markers[activeIdx + k] = {
        centerX: cx,
        nodeY: arcY(cx),
        isActive: false,
      };
    }

    // Place previous/left markers progressively toward the left
    for (let k = 1; activeIdx - k >= 0; k++) {
      const cx = -(baseOffset + (k - 1) * markerStep);
      markers[activeIdx - k] = {
        centerX: cx,
        nodeY: arcY(cx),
        isActive: false,
      };
    }

    const svgCenter = safeW / 2;
    const leftX = svgCenter - curveHalfW;
    const rightX = svgCenter + curveHalfW;
    const orbitArcPath = `M ${leftX.toFixed(1)} ${yEdge.toFixed(1)} Q ${svgCenter.toFixed(1)} ${yCtrl.toFixed(1)} ${rightX.toFixed(1)} ${yEdge.toFixed(1)}`;

    return {
      safeW,
      stageHeight,
      midY,
      yApex,
      activeWidth,
      curveHalfW,
      orbitArcPath,
      markers,
      leftCount,
      rightCount,
    };
  }, [milestoneList.length, stageWidth, activeIdx]);

  const handleStageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selectByIndex(Math.min(milestoneList.length - 1, activeIdx + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selectByIndex(Math.max(0, activeIdx - 1));
    }
  };

  if (milestoneList.length === 0) {
    return (
      <section
        id="journey"
        className="journey-desktop-section relative w-full py-12 md:py-16 px-4 sm:px-6 md:px-10 xl:px-8 z-10 scroll-mt-20"
      >
        <div className="max-w-4xl xl:max-w-[1600px] mx-auto w-full">
          <div className="border-b border-white/10 pb-4 mb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1">
                <Milestone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{content.badge}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-display font-extrabold text-white tracking-tight">
                {content.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 font-light">
                {content.subtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-white/10 rounded-xl bg-[#050816]/75 backdrop-blur-md">
            <Compass className="w-5 h-5 text-[#38BDF8] mb-2.5" aria-hidden="true" />
            <p className="text-white font-display font-semibold text-base mb-1">
              Trajectory Roadmaps Updating
            </p>
            <p className="text-xs font-mono text-[#94A3B8] max-w-md">
              Milestones from 2026 to 2030 are currently being refreshed. Check back shortly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const activeMilestone = milestoneList[activeIdx] || milestoneList[0];
  const activeStage = resolveStage(activeMilestone, activeIdx);
  const activeVisuals = getStageVisuals(activeStage);
  const ActiveIcon = getMilestoneIcon(activeMilestone, activeIdx, activeStage);
  const activePillars = Array.isArray(activeMilestone.pillars) ? activeMilestone.pillars : [];

  const trueCurrentMilestone = currentIndex !== -1 ? milestoneList[currentIndex] : null;
  const isViewingTrueCurrent = currentIndex === -1 || activeIdx === currentIndex;

  return (
    <section
      id="journey"
      className="journey-desktop-section relative w-full py-10 sm:py-14 xl:py-0 px-4 sm:px-6 md:px-10 xl:px-8 z-10 scroll-mt-20"
    >
      <div className="max-w-4xl xl:max-w-[1600px] mx-auto w-full">
        {/* ========================================================================= */}
        {/* COMPACT HEADER                                                            */}
        {/* ========================================================================= */}
        <div className="journey-desktop-header border-b border-white/10 pb-3.5 mb-5 md:mb-6 xl:mb-0 flex flex-col xl:flex-row xl:items-end justify-between gap-2 xl:gap-4">
          {/* Mobile & Tablet Header (< xl / < 1280px) — UNCHANGED */}
          <div className="xl:hidden space-y-1">
            <div className="text-xs font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
              03 / JOURNEY
            </div>
            <h2 className="text-3xl font-display font-extrabold text-white tracking-tight leading-tight">
              The journey.
            </h2>
            <p className="text-xs text-[#94A3B8] font-light leading-relaxed">
              {content.subtitle}
            </p>
          </div>

          {/* Desktop/Laptop Header (xl+ / >= 1280px) */}
          <div className="hidden xl:block min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-[#38BDF8] uppercase mb-0.5">
              <Milestone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{content.badge}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
              <h2 className="journey-desktop-title text-3xl xl:text-4xl font-display font-extrabold text-white tracking-tight">
                {content.title}
              </h2>
              <p className="journey-desktop-subtitle text-xs xl:text-sm text-[#94A3B8] font-light">
                {content.subtitle}
              </p>
            </div>
          </div>

          {/* Desktop Horizon & Quick Reset */}
          <div className="hidden xl:flex items-center gap-4 shrink-0 text-[11px] font-mono text-[#CBD5E1]">
            {!isViewingTrueCurrent && trueCurrentMilestone && (
              <button
                type="button"
                onClick={() => selectByIndex(currentIndex)}
                className="inline-flex items-center gap-1.5 text-[#38BDF8] hover:text-[#7DD3FC] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded px-1.5 py-0.5"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Return to Current ({String(trueCurrentMilestone.year)})</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{content.horizonAnchor}</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. MOBILE & TABLET VERTICAL TIMELINE (< xl / < 1280px) — UNCHANGED        */}
        {/* ========================================================================= */}
        <div className="xl:hidden relative pl-6 space-y-3.5">
          {/* Thin vertical connecting line */}
          <div
            className="absolute left-2.5 top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-[#38BDF8] via-[#60A5FA]/40 to-indigo-400/20"
            aria-hidden="true"
          />

          {milestoneList.map((m, idx) => {
            const yearStr = String(m.year ?? idx);
            const stage = resolveStage(m, idx);
            const visuals = getStageVisuals(stage);
            const MilestoneIcon = getMilestoneIcon(m, idx, stage);

            return (
              <motion.article
                key={yearStr}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.16) }}
                className="relative"
              >
                {/* Node on vertical line */}
                <div
                  className={`absolute -left-[19.5px] top-4 rounded-full z-10 ${
                    stage === 'current'
                      ? 'w-3.5 h-3.5 bg-[#38BDF8] border-2 border-[#03050B] shadow-[0_0_10px_rgba(56,189,248,0.75)]'
                      : stage === 'completed'
                      ? 'w-3 h-3 bg-[#38BDF8]/80 border-2 border-[#03050B]'
                      : stage === 'horizon'
                      ? 'w-3 h-3 bg-[#050816] border-2 border-indigo-400/65'
                      : 'w-3 h-3 bg-[#050816] border-2 border-white/30'
                  }`}
                  aria-hidden="true"
                />

                <div
                  className={`relative overflow-hidden p-3.5 rounded-xl border backdrop-blur-md space-y-1.5 transition-colors ${visuals.cardClass}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-[2px] ${visuals.topAccentClass}`} />

                  {/* Top Row: Icon + Year + Phase + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${visuals.iconBoxClass}`}
                      >
                        <MilestoneIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span className={`font-display font-extrabold text-lg tabular-nums ${visuals.yearClass}`}>
                        {yearStr}
                      </span>
                      <span className="text-white/20 text-xs" aria-hidden="true">·</span>
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#94A3B8] truncate">
                        {m.phase}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider font-semibold shrink-0 ${visuals.statusClass}`}
                    >
                      <StageStatusIcon stage={stage} className="w-3 h-3" />
                      <span>{visuals.statusLabel}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-[15px] text-white leading-snug">
                    {m.title}
                  </h3>

                  {/* Concise readable description */}
                  <p className="text-xs text-[#CBD5E1] leading-relaxed font-light">
                    {m.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP INTERACTIVE COSMIC ORBITAL TIMELINE (xl+ / >= 1280px)          */}
        {/*    One centered holographic feature card + minimal orbital year markers   */}
        {/* ========================================================================= */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="hidden xl:block relative select-none"
          onKeyDown={handleStageKeyDown}
        >
          <div
            ref={stageRef}
            className="relative w-full overflow-x-clip overflow-y-visible rounded-2xl"
            style={{ height: `${desktopGeometry.stageHeight}px` }}
            role="region"
            aria-label="Interactive 2026 to 2030 journey explorer"
          >
            {/* Atmospheric Deep-Space Nebula Backdrop */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 48% 66% at 50% 50%, rgba(56, 189, 248, 0.09) 0%, rgba(30, 58, 138, 0.045) 50%, transparent 78%)',
              }}
              aria-hidden="true"
            />

            {/* Soft Pulsing Center Aura Behind Active Feature Card */}
            <div
              className="journey-halo-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
              style={{
                width: `${desktopGeometry.activeWidth + 110}px`,
                height: '300px',
                background:
                  'radial-gradient(circle at center, rgba(56, 189, 248, 0.22) 0%, rgba(96, 165, 250, 0.08) 46%, transparent 72%)',
                filter: 'blur(28px)',
              }}
              aria-hidden="true"
            />

            {/* Subtle Orbital Horizon Echoes on Open Cosmic Side when First or Last Year Centered */}
            {desktopGeometry.leftCount === 0 && (
              <div
                className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-55"
                aria-hidden="true"
              >
                <div className="relative w-36 h-36">
                  <div className="absolute inset-0 rounded-full border border-[#38BDF8]/12" />
                  <div className="absolute inset-5 rounded-full border border-dashed border-[#38BDF8]/15" />
                  <div className="absolute inset-11 rounded-full bg-[#38BDF8]/6 blur-md" />
                </div>
              </div>
            )}

            {desktopGeometry.rightCount === 0 && (
              <div
                className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-55"
                aria-hidden="true"
              >
                <div className="relative w-36 h-36">
                  <div className="absolute inset-0 rounded-full border border-indigo-400/12" />
                  <div className="absolute inset-5 rounded-full border border-dashed border-[#38BDF8]/15" />
                  <div className="absolute inset-11 rounded-full bg-indigo-400/8 blur-md" />
                </div>
              </div>
            )}

            {/* SVG Orbital Horizon: Stars, Active Rings, Curved Path & Gliding Light Particles */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${desktopGeometry.safeW} ${desktopGeometry.stageHeight}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="journey-orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0.04)" />
                  <stop offset="22%" stopColor="rgba(96, 165, 250, 0.25)" />
                  <stop offset="50%" stopColor="rgba(56, 189, 248, 0.72)" />
                  <stop offset="78%" stopColor="rgba(96, 165, 250, 0.25)" />
                  <stop offset="100%" stopColor="rgba(129, 140, 248, 0.05)" />
                </linearGradient>

                <linearGradient id="journey-active-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0.08)" />
                  <stop offset="55%" stopColor="rgba(56, 189, 248, 0.85)" />
                  <stop offset="100%" stopColor="rgba(125, 211, 252, 0.95)" />
                </linearGradient>

                <filter id="journey-node-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <clipPath id="journey-illuminated-clip">
                  <rect
                    x="0"
                    y="0"
                    width={desktopGeometry.safeW / 2}
                    height={desktopGeometry.stageHeight}
                  />
                </clipPath>
              </defs>

              {/* Subtle Static Stars */}
              {AMBIENT_STARS.map((star, idx) => (
                <circle
                  key={idx}
                  cx={star.xPct * desktopGeometry.safeW}
                  cy={star.yPct * desktopGeometry.stageHeight}
                  r={star.r}
                  fill="#BAE6FD"
                  opacity={star.o}
                />
              ))}

              {/* Subtle Concentric Orbital Rings Around Active Center */}
              <g transform={`translate(${desktopGeometry.safeW / 2}, ${desktopGeometry.midY})`}>
                <circle
                  r={desktopGeometry.activeWidth * 0.48}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.12)"
                  strokeWidth="1"
                />
                <circle
                  r={desktopGeometry.activeWidth * 0.62}
                  fill="none"
                  stroke="rgba(96, 165, 250, 0.14)"
                  strokeWidth="1"
                  strokeDasharray="4 9"
                  className="journey-orbit-ring-spin"
                />
              </g>

              {/* Ambient Background Secondary Arc */}
              <path
                d={`M 0 ${desktopGeometry.stageHeight * 0.64} Q ${desktopGeometry.safeW / 2} ${
                  desktopGeometry.stageHeight * 0.12
                } ${desktopGeometry.safeW} ${desktopGeometry.stageHeight * 0.64}`}
                fill="none"
                stroke="rgba(56, 189, 248, 0.06)"
                strokeWidth="1"
                strokeDasharray="3 10"
              />

              {/* Primary Curved Orbital Timeline Track */}
              <path
                id="journey-desktop-orbit-path"
                d={desktopGeometry.orbitArcPath}
                fill="none"
                stroke="url(#journey-orbit-grad)"
                strokeWidth="1.75"
              />

              {/* Illuminated Cyan Trajectory Reaching Center Active Milestone */}
              <path
                d={desktopGeometry.orbitArcPath}
                clipPath="url(#journey-illuminated-clip)"
                fill="none"
                stroke="url(#journey-active-grad)"
                strokeWidth="2.25"
              />

              {/* Delicate Light Particles Gliding Along Orbital Curve */}
              {!reducedMotion && (
                <>
                  <circle r="2.6" fill="#7DD3FC" filter="url(#journey-node-glow)" opacity="0.85">
                    <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
                      <mpath href="#journey-desktop-orbit-path" />
                    </animateMotion>
                  </circle>
                  <circle r="1.8" fill="#38BDF8" opacity="0.58">
                    <animateMotion dur="9s" begin="-4.5s" repeatCount="indefinite" rotate="auto">
                      <mpath href="#journey-desktop-orbit-path" />
                    </animateMotion>
                  </circle>
                </>
              )}
            </svg>

            {/* Minimal Year Navigation Markers Along Curved Orbital Trajectory */}
            {milestoneList.map((m, idx) => {
              const yearStr = String(m.year ?? idx);
              const pos = desktopGeometry.markers[idx];
              if (!pos) return null;

              const stage = resolveStage(m, idx);
              const isSelected = pos.isActive;
              const isCompleted = stage === 'completed';
              const isTrueCurrent = stage === 'current';
              const isHorizon = stage === 'horizon';

              return (
                <motion.button
                  key={yearStr}
                  type="button"
                  initial={false}
                  animate={{
                    x: pos.centerX,
                    y: pos.nodeY,
                    scale: isSelected ? 0.85 : 1,
                    opacity: isSelected ? 0 : 1,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.52,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    left: '50%',
                    top: 0,
                    pointerEvents: isSelected ? 'none' : 'auto',
                  }}
                  onClick={() => selectByIndex(idx)}
                  aria-hidden={isSelected}
                  tabIndex={isSelected ? -1 : 0}
                  aria-label={`Select ${yearStr} milestone: ${m.title}`}
                  className="absolute -translate-x-1/2 -translate-y-[14px] z-20 group flex flex-col items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-xl px-2.5 py-1.5"
                >
                  {/* Minimal Orbital Node Indicator */}
                  <span
                    className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      isTrueCurrent
                        ? 'bg-[#0B223D] border-[#38BDF8] text-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.55)] ring-4 ring-[#38BDF8]/15 group-hover:scale-110'
                        : isCompleted
                        ? 'bg-[#091C32] border-[#38BDF8]/65 text-[#7DD3FC] shadow-[0_0_12px_rgba(56,189,248,0.22)] group-hover:border-[#38BDF8] group-hover:scale-110'
                        : isHorizon
                        ? 'bg-[#06091A] border-indigo-400/55 text-[#A5B4FC] group-hover:border-[#38BDF8]/70 group-hover:text-[#7DD3FC] group-hover:scale-110'
                        : 'bg-[#060B18] border-white/25 text-[#94A3B8] group-hover:border-[#38BDF8]/65 group-hover:text-[#7DD3FC] group-hover:scale-110'
                    }`}
                  >
                    {isTrueCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : isHorizon ? (
                      <Compass className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] group-hover:bg-[#38BDF8] transition-colors" />
                    )}
                  </span>

                  {/* Minimal Year Label Only */}
                  <span
                    className={`mt-2 font-display font-bold text-sm tracking-wide tabular-nums transition-colors duration-200 ${
                      isTrueCurrent
                        ? 'text-[#38BDF8]'
                        : isCompleted
                        ? 'text-[#CBD5E1] group-hover:text-[#7DD3FC]'
                        : 'text-[#94A3B8] group-hover:text-white'
                    }`}
                  >
                    {yearStr}
                  </span>
                </motion.button>
              );
            })}

            {/* ONE Central Detailed Holographic Feature Card (Always Mathematically Centered) */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ width: `${desktopGeometry.activeWidth}px` }}
            >
              <div className="journey-active-float">
                <AnimatePresence mode="popLayout" custom={transitionDir}>
                  <motion.article
                    key={String(activeMilestone.year ?? activeIdx)}
                    custom={transitionDir}
                    variants={cardVariants}
                    initial={reducedMotion ? false : 'enter'}
                    animate="center"
                    exit={reducedMotion ? undefined : 'exit'}
                    transition={{
                      duration: reducedMotion ? 0 : 0.46,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative overflow-hidden rounded-2xl border border-[#38BDF8]/65 bg-[#07152B]/92 backdrop-blur-xl p-5 min-[1440px]:p-6 shadow-[0_0_44px_rgba(56,189,248,0.2),inset_0_1px_0_rgba(125,211,252,0.25)]"
                  >
                    {/* Top holographic cyan light beam */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent"
                      aria-hidden="true"
                    />

                    {/* Subtle corner holographic sheen */}
                    <div
                      className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#38BDF8]/10 blur-2xl pointer-events-none"
                      aria-hidden="true"
                    />

                    <div className="relative z-10 space-y-3">
                      {/* 1. Large Icon + Prominent Year + Status Indicator */}
                      <motion.div
                        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: reducedMotion ? 0 : 0.05 }}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-11 h-11 min-[1440px]:w-12 min-[1440px]:h-12 rounded-xl border border-[#38BDF8]/45 bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.25)] shrink-0">
                            <ActiveIcon className="w-5 h-5 min-[1440px]:w-6 min-[1440px]:h-6" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-display font-extrabold text-3xl min-[1440px]:text-[34px] leading-none text-[#38BDF8] tabular-nums">
                              {String(activeMilestone.year)}
                            </div>
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#94A3B8] mt-1 truncate">
                              {activeMilestone.phase}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border whitespace-nowrap shrink-0 ${
                            activeStage === 'current'
                              ? 'bg-[#38BDF8]/15 text-[#7DD3FC] border-[#38BDF8]/45 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                              : activeStage === 'completed'
                              ? 'bg-[#38BDF8]/10 text-[#7DD3FC] border-[#38BDF8]/30'
                              : 'bg-white/[0.06] text-[#CBD5E1] border-white/15'
                          }`}
                        >
                          <StageStatusIcon stage={activeStage} className="w-3 h-3" />
                          <span>{activeVisuals.desktopStatusLabel}</span>
                        </span>
                      </motion.div>

                      {/* 2. Clear Milestone Title */}
                      <motion.h3
                        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, delay: reducedMotion ? 0 : 0.1 }}
                        className="font-display font-bold text-lg min-[1440px]:text-xl text-white leading-snug"
                      >
                        {activeMilestone.title}
                      </motion.h3>

                      {/* 3. Existing Milestone Description */}
                      <motion.p
                        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.14 }}
                        className="text-xs min-[1440px]:text-[13.5px] text-[#E2E8F0] leading-relaxed font-light"
                      >
                        {activeMilestone.description}
                      </motion.p>

                      {/* 4. Compact Key Pillars Line */}
                      {activePillars.length > 0 && (
                        <motion.div
                          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.34, delay: reducedMotion ? 0 : 0.18 }}
                          className="pt-2.5 border-t border-white/10 text-[11px] font-mono text-[#94A3B8] leading-relaxed"
                        >
                          <span className="text-[#38BDF8]">Key Milestones: </span>
                          <span className="text-[#CBD5E1]">{activePillars.slice(0, 3).join(' · ')}</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.article>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Subtle Bottom Step Controls */}
          <div className="mt-2 flex items-center justify-between px-1">
            <div className="text-[11px] font-mono text-[#64748B]">
              Select any year marker along the trajectory to bring it into focus
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectByIndex(activeIdx - 1)}
                disabled={activeIdx <= 0}
                aria-label="Previous milestone"
                className="w-8 h-8 rounded-full border border-white/10 bg-[#050816]/80 text-[#CBD5E1] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums px-1.5">
                {activeIdx + 1} / {milestoneList.length}
              </span>
              <button
                type="button"
                onClick={() => selectByIndex(activeIdx + 1)}
                disabled={activeIdx >= milestoneList.length - 1}
                aria-label="Next milestone"
                className="w-8 h-8 rounded-full border border-white/10 bg-[#050816]/80 text-[#CBD5E1] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
