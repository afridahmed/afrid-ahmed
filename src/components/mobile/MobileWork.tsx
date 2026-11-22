import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, Github, Lock } from 'lucide-react';
import { ProjectItem } from '../../types';
import { ProjectMediaStage } from '../ProjectMediaStage';

interface MobileWorkProps {
  projects: ProjectItem[];
  activeProject: ProjectItem | null;
  activeIndex: number;
  direction: number;
  reducedMotion?: boolean;
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
  onSelectProject,
  onPrev,
  onNext,
  onOpenDetail,
}) => {
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

  return (
    <div className="lg:hidden space-y-4">
      {/* Compact Editorial Index Tabs — Single-Line Scrollable Strip */}
      <div
        role="tablist"
        aria-label="Select featured project"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--border-subtle)] touch-pan-x -mx-1 px-1"
      >
        {projects.map((project, idx) => {
          const isActive = project.id === activeProject.id;
          const num = project.number || (idx < 9 ? `0${idx + 1}` : `${idx + 1}`);
          return (
            <button
              key={project.id || idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectProject(idx)}
              className={`relative shrink-0 min-h-[44px] px-3.5 py-2.5 flex items-center gap-2 text-xs whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span className="font-mono text-[10.5px] tabular-nums opacity-75">{num}</span>
              <span className="font-display tracking-tight">{project.title}</span>
              {isActive && (
                <motion.span
                  layoutId="mobile-work-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--text-primary)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Prominent Media-First Project Showcase Card */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.article
          key={activeProject.id}
          custom={direction}
          initial={reducedMotion ? false : { opacity: 0, x: direction >= 0 ? 14 : -14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: direction >= 0 ? -14 : 14 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-[var(--border-strong)] bg-[#101010] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
        >
          {/* Top Large Visual Media Stage */}
          <div className="p-2.5 pb-0">
            <ProjectMediaStage project={activeProject} />
          </div>

          {/* Minimal Clean Architectural Metadata & Summary */}
          <div className="p-4 pt-3.5 space-y-3">
            {/* Unboxed Metadata Row */}
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] min-w-0">
                <span className="text-[var(--text-primary)] font-bold tabular-nums">
                  {projectNumber}
                </span>
                <span className="text-[var(--text-muted)]">/ {totalFormatted}</span>
                <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                <span className="uppercase tracking-wider truncate">
                  {activeProject.category}
                </span>
              </div>

              {activeProject.isFlagship && (
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-primary)] shrink-0">
                  Flagship
                </span>
              )}
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="font-display font-extrabold text-[22px] leading-tight tracking-tight text-[var(--text-primary)]">
                {activeProject.title}
              </h3>
              {activeProject.subtitle && (
                <p className="mt-1 font-mono text-xs text-[var(--text-secondary)] leading-snug">
                  {activeProject.subtitle}
                </p>
              )}
            </div>

            {/* Concise 3-line Editorial Description */}
            {activeProject.description && (
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] font-light line-clamp-3">
                {activeProject.description}
              </p>
            )}

            {/* Clean Typographic Tech Stack (Zero Pill Clutter) */}
            {activeProject.technologies && activeProject.technologies.length > 0 && (
              <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] leading-relaxed">
                {activeProject.technologies.slice(0, 5).join(' · ')}
              </div>
            )}

            {/* Action & Navigation Row */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenDetail}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-display font-bold text-xs tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Inspect Case Study</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {hasLive && (
                  <a
                    href={rawLive}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open live ${activeProject.title}`}
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {hasGithub && (
                  <a
                    href={rawGithub}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${activeProject.title} repository`}
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-all"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}

                {!hasGithub && isPrivateRepo && !hasLive && (
                  <span
                    aria-label="Private repository"
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-[var(--border-subtle)] bg-[#141414] text-[var(--text-muted)] flex items-center justify-center"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>

      {/* Thumb-Zone Prev / Next Switcher */}
      {projects.length > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={activeIndex <= 0}
            aria-label="Previous project"
            className="min-h-[44px] px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[#111111] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 font-mono text-xs cursor-pointer active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
            {projectNumber} / {totalFormatted}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={activeIndex >= projects.length - 1}
            aria-label="Next project"
            className="min-h-[44px] px-3.5 rounded-xl border border-[var(--border-subtle)] bg-[#111111] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 font-mono text-xs cursor-pointer active:scale-95 transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
