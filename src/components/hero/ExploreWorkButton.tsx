import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

interface ExploreWorkButtonProps {
  id?: string;
  onClick: () => void;
  reducedMotion?: boolean;
  label?: string;
}

export const ExploreWorkButton: React.FC<ExploreWorkButtonProps> = ({
  id = 'hero-explore',
  onClick,
  reducedMotion = false,
  label = 'EXPLORE',
}) => {
  return (
    <motion.button
      id={id}
      type="button"
      onClick={onClick}
      aria-label="Explore About section"
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: reducedMotion ? 0 : 1.05, ease: [0.16, 1, 0.3, 1] }}
      className="group relative inline-flex flex-col items-center justify-center min-h-[48px] min-w-[140px] px-6 py-2.5 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B6D6FF]/70 rounded-full"
    >
      {/* Top fine luminous horizon line with soft shimmer sweep */}
      <div className="relative w-24 h-[1px] mb-3 overflow-hidden bg-white/15">
        {!reducedMotion && (
          <motion.div
            aria-hidden="true"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              repeat: Infinity,
              repeatDelay: 2.2,
              duration: 1.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-[#CFE6FF] to-transparent"
          />
        )}
      </div>

      {/* Label + Animated Down Arrow */}
      <div className="flex items-center gap-2.5 font-mono text-[11px] sm:text-xs tracking-[0.26em] text-[#E5ECF6] group-hover:text-white transition-colors duration-200 uppercase">
        <span>{label}</span>
        <motion.span
          aria-hidden="true"
          animate={reducedMotion ? undefined : { y: [0, 3, 0] }}
          transition={
            reducedMotion
              ? undefined
              : {
                  repeat: Infinity,
                  duration: 2.2,
                  ease: 'easeInOut',
                }
          }
          className="inline-flex items-center justify-center text-[#B8D8FF] group-hover:text-white transition-colors"
        >
          <ArrowDown className="w-3.5 h-3.5 stroke-[1.75]" />
        </motion.span>
      </div>

      {/* Subtle bottom hairline expand on hover */}
      <span
        aria-hidden="true"
        className="mt-2 h-[1px] w-0 group-hover:w-16 bg-gradient-to-r from-transparent via-[#B8D8FF]/70 to-transparent transition-all duration-300"
      />
    </motion.button>
  );
};
