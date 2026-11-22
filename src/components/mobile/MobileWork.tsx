import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Layers,
} from 'lucide-react';
import { ProjectItem } from '../../types';
import { ProjectMediaStage } from '../ProjectMediaStage';

interface MobileWorkProps {
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
  onOpenDetail: () => void;
}

export const MobileWork: React.FC<MobileWorkProps> = ({
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
  onOpenDetail,
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
      if (!touchStartRef.current || projects.length <= 1) return;
      const dx = touchStartRef.current.x - e.changedTouches[0].clientX;
      const dy = touchStartRef.current.y - e.changedTouches[0].clientY;
      touchStartRef.current = null;

      const now = Date.now();
      if (now - transitionLockRef.current < 200) return;

      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        transitionLockRef.current = now;
        if (dx > 0) {
          onNext();
        } else {
          onPrev();
        }
      }
    },
    [projects.length, onNext, onPrev]
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
      }
    },
    [projects.length, onNext, onPrev]
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
  const actionCount = (hasLive ? 1 : 0) + (hasGithub ? 1 : 0) + 1;
  const actionGridColsClass =
    actionCount === 3 ? 'grid-cols-3' : actionCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="md:hidden w-full flex flex-col gap-2.5">
      {/* 1. Compact Projects Heading & Project Counter */}
      <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase shrink-0">
            02 /
          </span>
          <h2 className="text-[22px] min-[390px]:text-2xl font-display font-extrabold text-[var(--text-primary)] tracking-tight leading-none">
            Projects.
          </h2>
        </div>

        <span className="font-mono text-xs text-[var(--text-secondary)] tabular-nums shrink-0">
          <span className="text-[var(--text-primary)] font-bold">{projectNumber}</span>
          <span className="text-[var(--text-muted)]"> / {totalFormatted}</span>
        </span>
      </div>

      {/* 2. Centered Swipeable Project Selector (Prev/Next Partially Visible + Arrows) */}
      <div
        className="relative flex items-center justify-between gap-1.5 w-full"
        role="region"
        aria-label="Project selector"
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={onPrev}
          disabled={activeIndex <= 0}
          aria-label="Previous project"
          className="shrink-0 w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer active:scale-90 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={viewportRef}
          role="tablist"
          aria-label="Select project"
          className="relative flex-1 min-w-0 h-10 overflow-hidden flex items-center touch-pan-y"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          <motion.div
            ref={trackRef}
            className="relative flex items-center gap-2 w-max select-none will-change-transform"
            initial={false}
            animate={{ x: trackTranslateX }}
            transition={
              !hasMounted
                ? { duration: 0 }
                : reducedMotion
                ? { duration: 0.12 }
                : { type: 'spring', stiffness: 390, damping: 36, mass: 0.7 }
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
                    opacity: isActive ? 1 : isNeighbor ? 0.52 : 0.2,
                  }}
                  transition={reducedMotion ? { duration: 0.1 } : { duration: 0.2 }}
                  className={`relative shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer focus:outline-none ${
                    isActive ? 'z-10' : 'z-0'
                  }`}
                >
                  <div
                    className={`absolute inset-0 z-0 rounded-lg transition-all duration-200 pointer-events-none ${
                      isActive
                        ? 'bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-sm'
                        : 'bg-transparent border border-transparent'
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-0 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[var(--text-primary)] to-transparent rounded-full transition-opacity duration-200 pointer-events-none ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span
                    className={`relative z-10 font-mono text-[10px] tabular-nums ${
                      isActive
                        ? 'text-[var(--text-primary)] font-bold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {num}
                  </span>
                  <span
                    className={`relative z-10 font-display text-[13px] whitespace-nowrap max-w-[165px] truncate ${
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
          className="shrink-0 w-9 h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer active:scale-90 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Image-Dominant Simplified One-Screen Project Showcase Card */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.article
          key={activeProject.id}
          custom={direction}
          initial={reducedMotion ? false : { opacity: 0, x: direction >= 0 ? 14 : -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: direction >= 0 ? -14 : 14 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="rounded-2xl border border-[var(--border-strong)] bg-[#101010]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-2.5 min-[390px]:p-3 space-y-2.5 touch-pan-y"
        >
          {/* A. Dominant Project Preview Image */}
          <ProjectMediaStage
            project={activeProject}
            variant="mobile-compact"
            controlledMediaIndex={activeMediaIndex}
            onMediaIndexChange={onMediaIndexChange}
          />

          {/* B. Project Name & Compact Action Row */}
          <div className="px-0.5 space-y-2.5">
            <h3 className="font-display font-extrabold text-[19px] min-[390px]:text-[21px] leading-snug tracking-tight text-[var(--text-primary)] break-words">
              {activeProject.title}
            </h3>

            <div className={`pt-2 border-t border-[var(--border-subtle)] grid ${actionGridColsClass} gap-2`}>
              {hasLive && (
                <a
                  href={rawLive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-w-0 h-10 px-2.5 rounded-xl bg-[var(--accent-solid)] text-[var(--accent-contrast)] border border-[var(--accent-solid)] font-mono font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-all duration-150 shadow-sm whitespace-nowrap"
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
                  className="w-full min-w-0 h-10 px-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-mono font-medium text-[11px] tracking-wide flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all duration-150 whitespace-nowrap"
                >
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  <span>REPO</span>
                </a>
              )}

              <button
                type="button"
                onClick={onOpenDetail}
                aria-label="View project details"
                className="w-full min-w-0 h-10 px-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-strong)] text-[var(--text-primary)] font-mono font-semibold text-[11px] tracking-wide flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all duration-150 cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5 shrink-0 text-[var(--text-secondary)]" />
                <span>DETAILS</span>
              </button>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>

      {/* 4. Progress Indicator */}
      {projects.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 pt-0.5"
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
