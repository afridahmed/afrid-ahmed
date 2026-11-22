import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
} from 'lucide-react';
import { ProjectItem } from '../../types';
import { ProjectMediaStage } from '../ProjectMediaStage';

interface TabletWorkProps {
  projects: ProjectItem[];
  activeProject: ProjectItem | null;
  activeIndex: number;
  direction: number;
  reducedMotion?: boolean;
  activeMediaIndex?: number;
  onMediaIndexChange?: (index: number) => void;
  onSelectProject: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const TabletWork: React.FC<TabletWorkProps> = ({
  projects,
  activeProject,
  activeIndex,
  direction,
  reducedMotion = false,
  activeMediaIndex,
  onMediaIndexChange,
  onSelectProject,
  onPrev,
  onNext,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const transitionLockRef = useRef<number>(0);

  const [trackTranslateX, setTrackTranslateX] = useState<number>(0);
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  const updateTrackPosition = useCallback(() => {
    if (!viewportRef.current || !trackRef.current || !activeProject) return;
    const activeItem = itemRefs.current.get(activeProject.id);
    if (!activeItem) return;

    const itemCenter = activeItem.offsetLeft + activeItem.offsetWidth / 2;
    const viewportCenter = viewportRef.current.clientWidth / 2;
    setTrackTranslateX(viewportCenter - itemCenter);
  }, [activeProject]);

  useLayoutEffect(() => {
    updateTrackPosition();
    const rafId = requestAnimationFrame(updateTrackPosition);
    return () => cancelAnimationFrame(rafId);
  }, [activeIndex, activeProject, projects, updateTrackPosition]);

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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = touchStartRef.current.x - e.changedTouches[0].clientX;
      const dy = touchStartRef.current.y - e.changedTouches[0].clientY;
      touchStartRef.current = null;

      const now = Date.now();
      if (now - transitionLockRef.current < 180) return;

      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        transitionLockRef.current = now;
        if (dx > 0) {
          onNext();
        } else {
          onPrev();
        }
      }
    },
    [onNext, onPrev]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (projects.length <= 1) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        onSelectProject(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onSelectProject(projects.length - 1);
      }
    },
    [projects.length, onNext, onPrev, onSelectProject]
  );

  if (!activeProject || projects.length === 0) {
    return null;
  }

  const projectNumber =
    activeProject.number || (activeIndex < 9 ? `0${activeIndex + 1}` : `${activeIndex + 1}`);
  const totalFormatted = projects.length < 10 ? `0${projects.length}` : `${projects.length}`;

  const rawGithub = (activeProject.githubUrl || '').trim();
  const rawLive = (activeProject.liveUrl || '').trim();
  const isPrivateRepo = rawGithub.toLowerCase() === 'private' || rawGithub === '#private';
  const hasGithub = Boolean(rawGithub && rawGithub !== '#' && !isPrivateRepo);
  const hasLive = Boolean(rawLive && rawLive !== '#');
  const hasActions = hasLive || hasGithub;
  const actionGridColsClass = hasLive && hasGithub ? 'grid-cols-2' : 'grid-cols-1';
  const technologies = activeProject.technologies || [];
  const highlights = activeProject.highlights || [];
  const hasTechnologies = technologies.length > 0;
  const hasHighlights = highlights.length > 0;

  return (
    <div className="hidden md:block lg:hidden w-full">
      {/* 1. Compact Header */}
      <div className="flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-2.5 mb-3">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] text-[var(--text-muted)] uppercase mb-0.5">
            02 / Selected Work
          </div>
          <h2 className="text-[28px] min-[820px]:text-3xl font-display font-extrabold text-[var(--text-primary)] tracking-tight leading-none">
            PROJECTS.
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-[var(--text-secondary)] tracking-wider uppercase">
            Active
          </span>
          <div className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs tabular-nums">
            <span className="text-[var(--text-primary)] font-bold">{projectNumber}</span>
            <span className="text-[var(--text-muted)] mx-1">/</span>
            <span className="text-[var(--text-secondary)]">{totalFormatted}</span>
          </div>
        </div>
      </div>

      {/* 2. Centralized Smooth-Transition Project Rail (Compact Tablet Scale) */}
      {projects.length > 0 && (
        <div
          className="relative flex items-center justify-between gap-2.5 w-full mb-3.5"
          role="region"
          aria-label="Tablet project selection carousel"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={onPrev}
            disabled={activeIndex <= 0}
            aria-label="Previous project"
            className="shrink-0 min-w-[38px] min-h-[38px] p-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={viewportRef}
            role="tablist"
            aria-label="Project selector"
            className="relative flex-1 min-w-0 h-12 overflow-hidden flex items-center touch-pan-y"
            style={{
              maskImage:
                'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
            }}
          >
            <motion.div
              ref={trackRef}
              className="relative flex items-center gap-3 w-max select-none will-change-transform"
              initial={false}
              animate={{ x: trackTranslateX }}
              transition={
                !hasMounted
                  ? { duration: 0 }
                  : reducedMotion
                  ? { duration: 0.12 }
                  : { type: 'spring', stiffness: 380, damping: 38, mass: 0.7 }
              }
            >
              {projects.map((project, idx) => {
                const isActive = project.id === activeProject.id;
                const isNeighbor = Math.abs(idx - activeIndex) === 1;
                const num = project.number || (idx < 9 ? `0${idx + 1}` : `${idx + 1}`);

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
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onSelectProject(idx)}
                    animate={{
                      opacity: isActive ? 1 : isNeighbor ? 0.65 : 0.3,
                    }}
                    transition={reducedMotion ? { duration: 0.1 } : { duration: 0.22 }}
                    className={`relative shrink-0 px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] ${
                      isActive ? 'z-10' : 'z-0'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 z-0 rounded-xl transition-all duration-300 pointer-events-none ${
                        isActive
                          ? 'bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-sm'
                          : 'bg-transparent border border-transparent'
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-0 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[var(--text-primary)] to-transparent rounded-full transition-opacity duration-300 pointer-events-none ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span
                      className={`relative z-10 font-mono text-[11px] tabular-nums ${
                        isActive
                          ? 'text-[var(--text-primary)] font-bold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {num}
                    </span>
                    <span
                      className={`relative z-10 font-display text-sm whitespace-nowrap ${
                        isActive
                          ? 'font-semibold text-[var(--text-primary)]'
                          : 'font-medium text-[var(--text-secondary)]'
                      }`}
                    >
                      {project.title}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={activeIndex >= projects.length - 1}
            aria-label="Next project"
            className="shrink-0 min-w-[38px] min-h-[38px] p-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Tablet-Adapted Showcase Stage (Prominent Preview + Full Direct Info) */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.article
          key={activeProject.id}
          custom={direction}
          initial={reducedMotion ? false : { opacity: 0, x: direction >= 0 ? 16 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: direction >= 0 ? -16 : 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-2xl border border-[var(--border-strong)] bg-[#101010]/95 backdrop-blur-xl p-4 min-[820px]:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden touch-pan-y space-y-3.5"
        >
          {/* A. Prominent Full-Width Media Preview */}
          <div className="w-full h-[285px] min-[820px]:h-[340px]">
            <ProjectMediaStage
              project={activeProject}
              variant="tablet-compact"
              controlledMediaIndex={activeMediaIndex}
              onMediaIndexChange={onMediaIndexChange}
            />
          </div>

          {/* B. Complete Direct Project Information */}
          <div className="space-y-3">
            {/* Metadata + Name + Subtitle + Description */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono">
                <span className="font-bold text-[var(--text-primary)] tabular-nums">
                  {projectNumber}
                  <span className="text-[var(--text-muted)] font-normal"> / {totalFormatted}</span>
                </span>
                <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                {activeProject.isFlagship && (
                  <>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-primary)]">
                      Flagship
                    </span>
                    <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                  </>
                )}
                <span className="uppercase tracking-wider text-[var(--text-secondary)]">
                  {activeProject.category}
                </span>
              </div>

              <div>
                <h3 className="font-display font-extrabold text-[22px] min-[820px]:text-[26px] text-[var(--text-primary)] tracking-tight leading-tight">
                  {activeProject.title}
                </h3>
                {activeProject.subtitle && (
                  <p className="mt-0.5 font-mono text-xs min-[820px]:text-[13px] text-[var(--text-secondary)]">
                    {activeProject.subtitle}
                  </p>
                )}
              </div>

              {activeProject.description && (
                <p className="text-[13px] min-[820px]:text-[13.5px] leading-relaxed text-[var(--text-secondary)] font-light pt-0.5">
                  {activeProject.description}
                </p>
              )}
            </div>

            {/* Technology Stack & Engineering Highlights (Side-by-Side Tablet Balance) */}
            {(hasTechnologies || hasHighlights) && (
              <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-12 gap-4 items-start">
                {hasTechnologies && (
                  <div className={hasHighlights ? 'col-span-5 min-w-0' : 'col-span-12 min-w-0'}>
                    <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium mb-2">
                      Architectural Stack
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hasHighlights && (
                  <div
                    className={
                      hasTechnologies
                        ? 'col-span-7 min-w-0 border-l border-[var(--border-subtle)] pl-4'
                        : 'col-span-12 min-w-0'
                    }
                  >
                    <div className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium mb-2">
                      Engineering Highlights
                    </div>
                    <ul className="space-y-1.5 text-[11.5px] min-[820px]:text-xs text-[var(--text-secondary)] font-mono leading-snug">
                      {highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--text-primary)] shrink-0">›</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions: Equal-Width Distribution for Valid LIVE / REPO Links Only */}
            {hasActions && (
              <div
                className={`pt-3 border-t border-[var(--border-subtle)] grid ${actionGridColsClass} gap-2.5`}
              >
                {hasLive && (
                  <a
                    href={rawLive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-w-0 h-10 px-3 rounded-xl bg-[var(--accent-solid)] text-[var(--accent-contrast)] border border-[var(--accent-solid)] font-mono font-bold text-[11px] tracking-wide flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-sm whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>LIVE</span>
                  </a>
                )}

                {hasGithub && (
                  <a
                    href={rawGithub}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-w-0 h-10 px-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-mono font-medium text-[11px] tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 whitespace-nowrap"
                  >
                    <Github className="w-3.5 h-3.5 shrink-0" />
                    <span>REPO</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.article>
      </AnimatePresence>

      {/* 4. Progress Indicator */}
      {projects.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 pt-2.5"
          role="navigation"
          aria-label="Project progress"
        >
          {projects.map((project, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={project.id || idx}
                type="button"
                onClick={() => onSelectProject(idx)}
                aria-label={`Select project ${idx + 1}: ${project.title}`}
                aria-current={isActive ? 'true' : undefined}
                className="py-1.5 px-0.5 cursor-pointer flex items-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-6 bg-[var(--text-primary)]'
                      : 'w-1.5 bg-[var(--border-strong)] opacity-60'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
