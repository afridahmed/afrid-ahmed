import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFinished(true);
            setTimeout(onLoaded, 500);
          }, 200);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25) + 15;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-[#03050B] flex flex-col items-center justify-center p-6 select-none"
        >
          {/* Ambient center celestial glow */}
          <div className="absolute w-72 h-72 rounded-full bg-[#38BDF8]/10 blur-3xl pointer-events-none" />

          {/* AFRID Wordmark with Passing Cosmic Signal */}
          <div className="relative mb-6">
            <h1 className="text-4xl sm:text-6xl font-display font-black tracking-[0.3em] text-white/20">
              AFRID
            </h1>
            
            {/* Illuminated sweep */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-80 mix-blend-screen pointer-events-none"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)'
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-4xl sm:text-6xl font-display font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#38BDF8] to-white">
                AFRID
              </span>
            </div>
          </div>

          {/* Subtitle & Progress */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>COSMIC TELEMETRY INITIALIZING</span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-48 h-1 bg-[#07101F] rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[#38BDF8] to-[#60A5FA]"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <span className="text-[10px] font-mono text-[#94A3B8]">
              {Math.min(progress, 100)}% · ORBIT 2026-2030
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
