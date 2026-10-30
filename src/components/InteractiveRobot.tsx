import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';
import { Sparkles, Hand, Brain, CheckCircle2, Eye } from 'lucide-react';

interface InteractiveRobotProps {
  reducedMotion?: boolean;
  className?: string;
}

type RobotAction = 'idle' | 'jump' | 'thinking' | 'yes' | 'alert' | 'no';

interface ActionOption {
  key: RobotAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

const ACTION_OPTIONS: ActionOption[] = [
  { key: 'jump', label: 'Say Hi', icon: Hand, hint: 'Waves & jumps with excitement' },
  { key: 'thinking', label: 'Brainstorm', icon: Brain, hint: 'Contemplates architecture' },
  { key: 'yes', label: 'Agree', icon: CheckCircle2, hint: 'Nods enthusiastically' },
  { key: 'alert', label: 'Perk Up', icon: Eye, hint: 'Notices new message' },
];

export const InteractiveRobot: React.FC<InteractiveRobotProps> = ({
  reducedMotion = false,
  className = '',
}) => {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [currentAction, setCurrentAction] = useState<RobotAction>('idle');
  const [reactionIndex, setReactionIndex] = useState(0);
  const isPlayingReactionRef = useRef(false);

  // Play a specific marker
  const playMarker = useCallback((marker: RobotAction) => {
    if (!dotLottie) return;

    try {
      if (marker === 'idle') {
        isPlayingReactionRef.current = false;
        setCurrentAction('idle');
        dotLottie.setLoop(true);
        dotLottie.setMarker('idle');
        if (!reducedMotion) {
          dotLottie.play();
        }
      } else {
        isPlayingReactionRef.current = true;
        setCurrentAction(marker);
        dotLottie.setLoop(false);
        dotLottie.setMarker(marker);
        dotLottie.play();
      }
    } catch {
      // Fallback if marker fails
      dotLottie.play();
    }
  }, [dotLottie, reducedMotion]);

  // Cycle to next playful reaction on direct robot tap
  const handleRobotClick = useCallback(() => {
    if (!dotLottie) return;
    const reactions: RobotAction[] = ['jump', 'thinking', 'yes', 'alert'];
    const nextMarker = reactions[reactionIndex % reactions.length];
    setReactionIndex((prev) => prev + 1);
    playMarker(nextMarker);
  }, [dotLottie, reactionIndex, playMarker]);

  // Hover reaction on desktop
  const handleMouseEnter = useCallback(() => {
    if (!dotLottie || reducedMotion || isPlayingReactionRef.current) return;
    // When hovering while idle, trigger a subtle alert/notice
    playMarker('alert');
  }, [dotLottie, reducedMotion, playMarker]);

  // Initialize and register event listeners
  useEffect(() => {
    if (!dotLottie) return;

    const handleReady = () => {
      if (reducedMotion) {
        dotLottie.pause();
      } else {
        // Start in idle loop
        playMarker('idle');
      }
    };

    const handleComplete = () => {
      // When a single-shot reaction finishes, return smoothly to idle loop
      if (isPlayingReactionRef.current) {
        isPlayingReactionRef.current = false;
        playMarker('idle');
      }
    };

    dotLottie.addEventListener('ready', handleReady);
    dotLottie.addEventListener('complete', handleComplete);

    // Initial trigger if already ready
    if (dotLottie.isLoaded) {
      handleReady();
    }

    return () => {
      try {
        dotLottie.removeEventListener('ready', handleReady);
        dotLottie.removeEventListener('complete', handleComplete);
      } catch {
        // Cleanup safety
      }
    };
  }, [dotLottie, reducedMotion, playMarker]);

  // Update on reduced motion change
  useEffect(() => {
    if (!dotLottie) return;
    if (reducedMotion) {
      dotLottie.pause();
    } else if (!isPlayingReactionRef.current) {
      playMarker('idle');
    }
  }, [reducedMotion, dotLottie, playMarker]);

  return (
    <div className={`flex flex-col items-center justify-center w-full select-none ${className}`}>
      {/* Robot Canvas Container */}
      <div 
        className="relative w-full max-w-[240px] sm:max-w-[270px] lg:max-w-[310px] aspect-square flex items-center justify-center cursor-pointer group"
        onClick={handleRobotClick}
        onMouseEnter={handleMouseEnter}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRobotClick();
          }
        }}
        aria-label="Interactive AI Robot: Click or tap to trigger reactions"
      >
        {/* Soft cosmic glow behind robot */}
        <div 
          className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#38BDF8]/15 to-[#60A5FA]/10 blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700" 
          aria-hidden="true" 
        />

        {/* Lottie Canvas with 100% transparent background */}
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <DotLottieReact
            src="/animations/robot.json"
            dotLottieRefCallback={setDotLottie}
            autoplay={!reducedMotion}
            loop={currentAction === 'idle' && !reducedMotion}
            className="w-full h-full object-contain pointer-events-auto filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            style={{ background: 'transparent' }}
          />
        </div>

        {/* Subtle interactive hover cue pill */}
        <div 
          className="absolute -top-1 right-2 sm:right-4 z-20 px-2 py-0.5 rounded-full bg-[#0B1120]/90 border border-[#38BDF8]/30 text-[10px] font-mono text-[#38BDF8] flex items-center gap-1 shadow-lg pointer-events-none opacity-80 group-hover:opacity-100 group-hover:border-[#38BDF8]/60 transition-all"
        >
          <Sparkles className="w-2.5 h-2.5 text-[#38BDF8] animate-spin-slow" />
          <span>{currentAction === 'idle' ? 'Tap to react' : currentAction.toUpperCase()}</span>
        </div>
      </div>

      {/* Interactive Micro Reaction Chips */}
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-[320px]">
        {ACTION_OPTIONS.map((action) => {
          const Icon = action.icon;
          const isActive = currentAction === action.key;

          return (
            <button
              key={action.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playMarker(action.key);
              }}
              title={action.hint}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#38BDF8] text-[#03050B] font-bold border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-105'
                  : 'bg-[#0B1120]/75 hover:bg-[#0E172B] text-[#94A3B8] hover:text-white border-white/10 hover:border-[#38BDF8]/40 active:scale-95'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-[#03050B]' : 'text-[#38BDF8]'}`} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
