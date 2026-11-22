import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Compass, Clock, Target } from 'lucide-react';
import { JourneyMilestone } from '../../types';

interface MobileJourneyProps {
  milestones: JourneyMilestone[];
  currentIndex: number;
  reducedMotion?: boolean;
}

type StageKey = 'completed' | 'current' | 'upcoming' | 'horizon';

function resolveStageKey(m: JourneyMilestone, idx: number, currentIndex: number): StageKey {
  if ((m.status as string) === 'completed') return 'completed';
  if (m.status === 'current') return 'current';
  if (currentIndex !== -1 && idx < currentIndex) return 'completed';
  if (m.status === 'aspirational') return 'horizon';
  return 'upcoming';
}

function getStageLabel(stage: StageKey): string {
  switch (stage) {
    case 'completed':
      return 'Completed';
    case 'current':
      return 'Current Orbit';
    case 'horizon':
      return 'Horizon';
    case 'upcoming':
    default:
      return 'Planned';
  }
}

export const MobileJourney: React.FC<MobileJourneyProps> = ({
  milestones,
  currentIndex,
  reducedMotion = false,
}) => {
  const defaultExpanded = currentIndex !== -1 ? String(milestones[currentIndex]?.year) : String(milestones[0]?.year ?? '');
  const [expandedYear, setExpandedYear] = useState<string>(defaultExpanded);

  return (
    <div className="xl:hidden relative">
      {/* Vertical Axis Spine */}
      <div
        className="absolute left-[13px] top-3 bottom-3 w-[1px] bg-gradient-to-b from-white/50 via-[var(--border-strong)] to-transparent"
        aria-hidden="true"
      />

      <div className="space-y-3">
        {milestones.map((m, idx) => {
          const yearStr = String(m.year ?? idx);
          const stage = resolveStageKey(m, idx, currentIndex);
          const isCurrent = stage === 'current';
          const isExpanded = expandedYear === yearStr;
          const pillars = Array.isArray(m.pillars) ? m.pillars : [];

          return (
            <motion.article
              key={yearStr}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.16) }}
              className="relative pl-9"
            >
              {/* Precision Axis Node */}
              <div
                className={`absolute left-[7px] top-5 w-[13px] h-[13px] rounded-full border flex items-center justify-center z-10 transition-colors ${
                  isCurrent
                    ? 'bg-[#F5F5F5] border-[#F5F5F5] shadow-[0_0_12px_rgba(245,245,245,0.45)]'
                    : stage === 'completed'
                    ? 'bg-[#1B1B1B] border-[#A0A0A0]'
                    : 'bg-[#080808] border-[#525252]'
                }`}
                aria-hidden="true"
              >
                {isCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#080808]" />
                ) : stage === 'completed' ? (
                  <Check className="w-2 h-2 text-[#F5F5F5]" />
                ) : null}
              </div>

              {/* Milestone Card */}
              <div
                className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
                  isCurrent
                    ? 'bg-[#141414] border-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.65)]'
                    : isExpanded
                    ? 'bg-[#111111] border-[var(--border-strong)]'
                    : 'bg-[#0E0E0E] border-[var(--border-subtle)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedYear(isExpanded ? '' : yearStr)}
                  aria-expanded={isExpanded}
                  className="w-full text-left px-4 py-3.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  {/* Top Row: Year · Phase + Stage */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-display font-extrabold text-xl tabular-nums leading-none ${
                          isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {yearStr}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] truncate">
                        {m.phase}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider ${
                          isCurrent ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {stage === 'current' && <Target className="w-3 h-3" aria-hidden="true" />}
                        {stage === 'horizon' && <Compass className="w-3 h-3" aria-hidden="true" />}
                        {stage === 'upcoming' && <Clock className="w-3 h-3" aria-hidden="true" />}
                        {stage === 'completed' && <Check className="w-3 h-3" aria-hidden="true" />}
                        <span>{getStageLabel(stage)}</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-[var(--text-primary)]' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* Milestone Title */}
                  <h3 className="mt-2 font-display font-bold text-[15.5px] text-[var(--text-primary)] leading-snug">
                    {m.title}
                  </h3>
                </button>

                {/* Expandable Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-[var(--border-subtle)]/70 space-y-2.5">
                        <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-light">
                          {m.description}
                        </p>

                        {pillars.length > 0 && (
                          <div className="pt-1 font-mono text-[10.5px] text-[var(--text-muted)] leading-relaxed">
                            <span className="text-[var(--text-secondary)] uppercase tracking-wider mr-1.5">
                              Focus:
                            </span>
                            <span className="text-[var(--text-primary)]/85">
                              {pillars.slice(0, 3).join(' · ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
};
