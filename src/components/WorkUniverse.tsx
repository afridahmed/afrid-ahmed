import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowRight, 
  ExternalLink, 
  X,
  Lock
} from 'lucide-react';
import { ProjectItem } from '../types';
import { PROJECTS } from '../data/siteContent';
import { InteractiveRobot } from './InteractiveRobot';
import { ProjectMediaStage } from './ProjectMediaStage';

// ============================================================================
// MEMOIZED DESKTOP EDITORIAL PROJECT DETAILS (Right Column)
// ============================================================================

interface DesktopProjectDetailsProps {
  project: ProjectItem;
  totalProjects: number;
  index: number;
}

const DesktopProjectDetails: React.FC<DesktopProjectDetailsProps> = React.memo(({
  project,
  totalProjects,
  index
}) => (
  <div className="work-desktop-info min-w-0">
    {/* 1. Project number & flagship/category indicator */}
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums">
        {project.number || (index < 9 ? `0${index + 1}` : `${index + 1}`)}
        <span className="text-[var(--text-muted)] font-normal">
          {' '}/ {totalProjects < 10 ? `0${totalProjects}` : totalProjects}
        </span>
      </span>
      <span className="text-[var(--text-muted)] text-xs" aria-hidden="true">·</span>
      {project.isFlagship && (
        <>
          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[10px] font-mono text-[var(--text-primary)] font-semibold tracking-wider uppercase whitespace-nowrap">
            Flagship System
          </span>
          <span className="text-[var(--text-muted)] text-xs" aria-hidden="true">·</span>
        </>
      )}
      <span className="text-[11px] font-mono text-[var(--text-secondary)] tracking-wider uppercase">
        {project.category}
      </span>
    </div>

    {/* 2. Project name & 3. Short subtitle */}
    <div className="space-y-1">
      <h3 className="work-desktop-project-title font-display font-black text-[var(--text-primary)] tracking-tight text-balance">
        {project.title}
      </h3>
      {project.subtitle && (
        <p className="work-desktop-project-subtitle font-mono text-[var(--text-secondary)] font-medium">
          {project.subtitle}
        </p>
      )}
    </div>

    {/* 4. Project description */}
    {project.description && (
      <p className="work-desktop-project-desc text-[var(--text-secondary)] font-light">
        {project.description}
      </p>
    )}

    {/* 5. Architectural Stack heading & technology chips */}
    {project.technologies && project.technologies.length > 0 && (
      <div className="work-desktop-divider-block border-t border-[var(--border-subtle)] space-y-1.5">
        <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium">
          Architectural Stack
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-[3px] rounded-md text-[11px] font-mono bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* 6. Engineering highlights, if available */}
    {project.highlights && project.highlights.length > 0 && (
      <div className="work-desktop-divider-block border-t border-[var(--border-subtle)] space-y-1.5">
        <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium">
          Engineering Highlights
        </div>
        <ul className="work-desktop-highlights space-y-1 text-[var(--text-secondary)] font-mono">
          {project.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-[var(--text-primary)] shrink-0">›</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Optional external repository & live links */}
    {(() => {
      const rawGithub = (project.githubUrl || '').trim();
      const rawLive = (project.liveUrl || '').trim();
      const isPrivateRepo = rawGithub.toLowerCase() === 'private' || rawGithub === '#private';
      const hasGithub = Boolean(rawGithub && rawGithub !== '#' && !isPrivateRepo);
      const hasLive = Boolean(rawLive && rawLive !== '#');
      const showRepoSlot = hasGithub || isPrivateRepo;

      if (!showRepoSlot && !hasLive) return null;

      const isTwoCol = showRepoSlot && hasLive;

      return (
        <div
          className={`work-desktop-divider-block border-t border-[var(--border-subtle)] grid gap-2.5 w-full ${
            isTwoCol ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {hasGithub && (
            <a
              href={rawGithub}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-w-0 min-h-[42px] px-4 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[11px] font-mono font-medium text-[var(--text-primary)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Github className="w-3.5 h-3.5 text-[var(--text-primary)] shrink-0" />
              <span className="truncate">REPOSITORY</span>
              <ArrowUpRight className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
            </a>
          )}

          {isPrivateRepo && (
            <div
              aria-label="Private repository"
              className="w-full min-w-0 min-h-[42px] px-4 py-2 rounded-lg bg-[var(--bg-elevated)]/70 border border-[var(--border-subtle)] text-[11px] font-mono font-medium text-[var(--text-secondary)] flex items-center justify-center gap-2 select-none whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              <span className="truncate">PRIVATE</span>
            </div>
          )}

          {hasLive && (
            <a
              href={rawLive}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-w-0 min-h-[42px] px-4 py-2 rounded-lg bg-[var(--accent-solid)] border border-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold text-[11px] font-mono flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">LIVE SYSTEM</span>
            </a>
          )}
        </div>
      );
    })()}
  </div>
));

DesktopProjectDetails.displayName = 'DesktopProjectDetails';

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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

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

  const prevIndexRef = useRef<number>(activeIndex);

  useEffect(() => {
    const prevIdx = prevIndexRef.current;

    if (visibleProjects.length === 0) {
      if (activeProjectId !== null) {
        setActiveProjectId(null);
      }
      prevIndexRef.current = -1;
      return;
    }

    const stillVisible = visibleProjects.some((p) => p.id === activeProjectId);

    if (!stillVisible) {
      const targetIdx = Math.min(Math.max(0, prevIdx >= 0 ? prevIdx : 0), visibleProjects.length - 1);
      const replacement = visibleProjects[targetIdx];
      if (replacement) {
        setDirection(0);
        setActiveProjectId(replacement.id);
        prevIndexRef.current = targetIdx;
      }
    } else {
      const currentIdx = visibleProjects.findIndex((p) => p.id === activeProjectId);
      if (currentIdx !== -1) {
        prevIndexRef.current = currentIdx;
      }
    }
  }, [visibleProjects, activeProjectId]);

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

    const itemLeft = activeItem.offsetLeft;
    const itemWidth = activeItem.offsetWidth;
    const itemCenter = itemLeft + itemWidth / 2;

    const viewportWidth = viewport.clientWidth;
    const viewportCenter = viewportWidth / 2;

    const targetX = viewportCenter - itemCenter;
    setTrackTranslateX(targetX);
  }, [activeProject]);

  useLayoutEffect(() => {
    updateTrackPosition();
    const rafId = requestAnimationFrame(updateTrackPosition);
    return () => cancelAnimationFrame(rafId);
  }, [activeIndex, activeProject, visibleProjects, updateTrackPosition]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  return (
    <section id="work" className="relative w-full py-14 sm:py-20 md:py-28 work-desktop-section px-4 sm:px-8 md:px-12 z-10 overflow-x-hidden scroll-mt-20 sm:scroll-mt-24">
      
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-4 sm:mb-8 work-desktop-header-wrap">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4 sm:pb-6 work-desktop-header">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="text-xs font-mono tracking-widest text-[var(--text-secondary)] uppercase font-semibold mb-1">
              02 / WORK
            </div>
            <h2 className="text-3xl font-display font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
              Selected Work.
            </h2>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[var(--text-secondary)] uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-[var(--text-primary)]" />
              <span>SINGULAR CONTINUOUS WORK UNIVERSE</span>
            </div>
            <h2 className="work-desktop-title font-display font-extrabold text-[var(--text-primary)] tracking-tight">
              PROJECTS.
            </h2>
          </div>

          {/* Trajectory Counter — Desktop only */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-secondary)] tracking-wider uppercase">
              ACTIVE TRAJECTORY
            </span>
            <div className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs tabular-nums">
              <span className="text-[var(--text-primary)] font-bold">
                {activeProject ? (activeProject.number || (activeIndex < 9 ? `0${activeIndex + 1}` : `${activeIndex + 1}`)) : '--'}
              </span>
              <span className="text-[var(--text-muted)] mx-1.5">/</span>
              <span className="text-[var(--text-secondary)]">{visibleProjects.length < 10 ? `0${visibleProjects.length}` : visibleProjects.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE HORIZONTAL PILL RAIL (< lg)                                        */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-4 touch-pan-x -mx-1 px-1">
        {visibleProjects.map((project, idx) => {
          const isActive = project.id === activeProjectId;
          return (
            <button
              key={project.id || idx}
              type="button"
              onClick={() => goToProject(idx)}
              className={`px-4 py-2 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold shadow-sm'
                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium'
              }`}
            >
              {project.title}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP CONTEXTUAL CAROUSEL RAIL (lg+) — 100% PRESERVED                   */}
      {/* ========================================================================= */}
      <div className="hidden lg:block max-w-4xl sm:max-w-5xl mx-auto mb-6 sm:mb-10 work-desktop-rail-wrap">
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
            className="shrink-0 p-2 sm:p-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] active:scale-95 disabled:opacity-20 disabled:hover:border-[var(--border-subtle)] disabled:hover:bg-[var(--bg-surface-blur)] disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] z-20 min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Continuous Premium Carousel Viewport */}
          <div 
            ref={viewportRef}
            role="tablist"
            aria-label="Selected project carousel navigation"
            className="relative flex-1 min-w-0 h-14 sm:h-16 overflow-hidden flex items-center touch-pan-y"
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
                      opacity: isActive ? 1 : isNeighbor ? 0.65 : 0.28,
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
                    className={`group relative shrink-0 px-3.5 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 sm:gap-3 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] ${
                      isActive ? 'z-10' : 'z-0'
                    }`}
                    title={isActive ? `Current: ${project.title}` : `Navigate to: ${project.title}`}
                  >
                    {/* Active highlighted container */}
                    <div
                      className={`absolute inset-0 z-0 rounded-xl transition-all duration-300 pointer-events-none ${
                        isActive
                          ? 'bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-sm backdrop-blur-md'
                          : 'bg-transparent border border-transparent group-hover:bg-[var(--bg-surface)]/70'
                      }`}
                    />

                    {/* Underneath active accent beam */}
                    <div
                      className={`absolute -bottom-[1px] left-1/2 -translate-x-1/2 z-0 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[var(--text-primary)] to-transparent rounded-full transition-opacity duration-300 pointer-events-none ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Number indicator */}
                    <span
                      className={`relative z-10 font-mono text-xs shrink-0 transition-colors duration-300 ${
                        isActive
                          ? 'text-[var(--text-primary)] font-bold'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {project.number || (idx < 9 ? `0${idx + 1}` : `${idx + 1}`)}
                    </span>

                    {/* Active pulse dot */}
                    <span
                      className={`relative z-10 w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] shrink-0 transition-all duration-300 ${
                        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`}
                    />

                    {/* Project title */}
                    <span
                      className={`relative z-10 text-sm sm:text-base md:text-lg font-display tracking-normal sm:tracking-wide whitespace-nowrap transition-colors duration-300 ${
                        isActive
                          ? 'font-semibold text-[var(--text-primary)]'
                          : 'font-normal sm:font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {project.title}
                    </span>

                    {/* Flagship chip */}
                    {project.isFlagship && (
                      <span
                        className={`relative z-10 hidden lg:inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[10px] font-mono text-[var(--text-primary)] font-semibold tracking-wider uppercase ml-1 shrink-0 transition-all duration-300 ${
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
            className="shrink-0 p-2 sm:p-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] active:scale-95 disabled:opacity-20 disabled:hover:border-[var(--border-subtle)] disabled:hover:bg-[var(--bg-surface-blur)] disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] z-20"
          >
            <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Active Project Presentation Panel                                         */}
      {/* ========================================================================= */}
      <div 
        id="active-project-panel" 
        role="tabpanel" 
        aria-labelledby={activeProject ? `project-tab-${activeProject.id}` : undefined}
        className="w-full max-w-6xl mx-auto"
      >
        {!activeProject ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface-blur)] backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)] animate-pulse mb-3" />
            <p className="text-[var(--text-primary)] font-display font-semibold text-lg mb-1">
              No Published Projects
            </p>
            <p className="text-sm font-mono text-[var(--text-secondary)] max-w-md">
              Projects are currently being updated in the command center. Check back shortly.
            </p>
          </div>
        ) : (
          <>
            {/* 1. MOBILE PROJECT CARD (< lg) */}
            <div className="lg:hidden flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] backdrop-blur-md overflow-hidden shadow-[var(--shadow-card)]">
              <div className="w-full">
                <ProjectMediaStage project={activeProject} />
              </div>

              <div className="p-4 sm:p-5 flex flex-col space-y-2.5">
                <div>
                  <h3 className="text-xl font-display font-extrabold text-[var(--text-primary)]">
                    {activeProject.title}
                  </h3>
                  {activeProject.subtitle && (
                    <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                      {activeProject.subtitle}
                    </p>
                  )}
                </div>

                {/* Tech stack tags */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(activeProject.technologies || []).slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-full text-[11px] font-mono bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* View project action link */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileDetailOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer py-1"
                  >
                    <span>View project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. DESKTOP PROJECT PRESENTATION (lg+) */}
            <div className="hidden lg:block">
              <div className="relative work-desktop-showcase rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-surface-blur)] backdrop-blur-xl shadow-[var(--shadow-card)] overflow-hidden transition-colors duration-300">
                {/* Restrained Monochrome Ambient Glow */}
                <div
                  className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#111111]/[0.03] dark:bg-[#F5F5F5]/[0.04] blur-3xl pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#111111]/[0.03] dark:bg-[#F5F5F5]/[0.04] blur-3xl pointer-events-none"
                  aria-hidden="true"
                />

                <div className="work-desktop-grid relative z-10">
                  {/* LEFT COLUMN */}
                  <div className="min-w-0 h-full">
                    <ProjectMediaStage project={activeProject} variant="desktop-compact" />
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="relative min-w-0 flex flex-col justify-center overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                      <motion.div
                        key={activeProject.id}
                        custom={direction}
                        variants={{
                          enter: (dir: number) => ({
                            x: reducedMotion ? 0 : dir > 0 ? 18 : -18,
                            opacity: 0,
                          }),
                          center: {
                            x: 0,
                            opacity: 1,
                            transition: reducedMotion
                              ? { duration: 0.1 }
                              : {
                                  x: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                                  opacity: { duration: 0.18, ease: 'easeOut' },
                                },
                          },
                          exit: (dir: number) => ({
                            x: reducedMotion ? 0 : dir > 0 ? -18 : 18,
                            opacity: 0,
                            transition: reducedMotion
                              ? { duration: 0.08 }
                              : {
                                  x: { duration: 0.13, ease: 'easeIn' },
                                  opacity: { duration: 0.12, ease: 'easeIn' },
                                },
                          }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={{ willChange: 'transform, opacity' }}
                        className="w-full"
                      >
                        <DesktopProjectDetails
                          project={activeProject}
                          totalProjects={visibleProjects.length}
                          index={activeIndex}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE PROJECT DETAIL MODAL                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileDetailOpen && activeProject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[65] bg-[var(--bg-canvas)]/98 backdrop-blur-2xl flex flex-col p-4 sm:p-6 overflow-y-auto lg:hidden"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileDetailOpen(false)}
                className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--text-primary)]" />
                <span>Back to projects</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMobileDetailOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Stage */}
            <div className="w-full mb-4 shrink-0">
              <ProjectMediaStage project={activeProject} />
            </div>

            {/* Details Content */}
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)] font-bold">{activeProject.number || (activeIndex < 9 ? `0${activeIndex + 1}` : `${activeIndex + 1}`)}</span>
                <span>/</span>
                <span className="uppercase tracking-widest">{activeProject.category}</span>
              </div>

              <h2 className="text-2xl font-display font-black text-[var(--text-primary)]">
                {activeProject.title}
              </h2>

              {activeProject.subtitle && (
                <p className="text-sm font-mono text-[var(--text-secondary)]">
                  {activeProject.subtitle}
                </p>
              )}

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light">
                {activeProject.description}
              </p>

              {/* Technologies Stack */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-mono text-[var(--text-muted)] uppercase">Technologies</div>
                <div className="flex flex-wrap gap-1.5">
                  {(activeProject.technologies || []).map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded text-xs font-mono bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              {activeProject.highlights && activeProject.highlights.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="text-xs font-mono text-[var(--text-muted)] uppercase">Engineering Highlights</div>
                  <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-mono">
                    {activeProject.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--text-primary)] shrink-0 mt-0.5">›</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 pb-6">
                {activeProject.liveUrl && activeProject.liveUrl !== '#' && (
                  <a
                    href={activeProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[46px] rounded-full bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-display font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
                  >
                    <span>View live demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {activeProject.githubUrl && (
                  <a
                    href={activeProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[46px] rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-mono text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Github className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                    <span>View code</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concluding Work Collaboration Section */}
      <div className="max-w-6xl mx-auto mt-8 sm:mt-10 lg:mt-10">
        <div
          className="group relative rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-surface-blur)] backdrop-blur-xl px-5 py-5 sm:px-7 sm:py-5 lg:px-8 lg:py-5 transition-all duration-300 shadow-[var(--shadow-card)] overflow-hidden"
        >
          {/* Ambient subtle light accent */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#111111]/[0.03] dark:bg-[#F5F5F5]/[0.04] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 transition-all duration-500" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-center relative z-10">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-2.5 text-left min-w-0">
              <h3 className="text-2xl sm:text-3xl lg:text-[clamp(1.65rem,2.3vw,2.1rem)] font-display font-black text-[var(--text-primary)] tracking-tight leading-tight">
                LET&apos;S WORK.
              </h3>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg font-light">
                Have an idea worth building? Let&apos;s turn it into something real through engineering, software, and creative collaboration.
              </p>

              <div className="pt-1.5 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={onWorkTogether || (() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }))}
                  className="min-h-[42px] px-5 py-2 rounded-full bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-mono font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                >
                  <span>LET&apos;S TALK</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </button>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] shrink-0" />
                  <span>Available for project collaborations</span>
                </div>
              </div>
            </div>

            {/* Right Column: Compact Interactive Robot Visual */}
            <div className="lg:col-span-4 w-full flex items-center justify-center">
              <InteractiveRobot reducedMotion={reducedMotion} />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
