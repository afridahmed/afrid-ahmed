import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-react';

interface InteractiveRobotProps {
  reducedMotion?: boolean;
  className?: string;
}

type RobotAction = 'idle' | 'jump' | 'thinking' | 'yes' | 'alert';

const REACTIONS: readonly RobotAction[] = ['jump', 'thinking', 'yes', 'alert'];
const MIN_REACTION_DELAY_MS = 3000;
const MAX_REACTION_DELAY_MS = 5000;

export const InteractiveRobot: React.FC<InteractiveRobotProps> = React.memo(({
  reducedMotion = false,
  className = '',
}) => {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [currentAction, setCurrentAction] = useState<RobotAction>('idle');

  const isPlayingReactionRef = useRef(false);
  const lastReactionRef = useRef<RobotAction | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const pickNextRandomReaction = useCallback((): RobotAction => {
    const candidates = REACTIONS.filter((r) => r !== lastReactionRef.current);
    const pool = candidates.length > 0 ? candidates : REACTIONS;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lastReactionRef.current = chosen;
    return chosen;
  }, []);

  const scheduleNextReactionRef = useRef<() => void>(() => {});

  const playMarker = useCallback((marker: RobotAction) => {
    if (!dotLottie || !isMountedRef.current) return;

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
        clearTimers();
        isPlayingReactionRef.current = true;
        lastReactionRef.current = marker;
        setCurrentAction(marker);
        dotLottie.setLoop(false);
        dotLottie.setMarker(marker);
        dotLottie.play();

        // Safety recovery if browser throttles background animation frames
        safetyTimerRef.current = window.setTimeout(() => {
          if (isMountedRef.current && isPlayingReactionRef.current) {
            isPlayingReactionRef.current = false;
            playMarker('idle');
            scheduleNextReactionRef.current();
          }
        }, 3200);
      }
    } catch {
      isPlayingReactionRef.current = false;
      dotLottie.play();
    }
  }, [dotLottie, reducedMotion, clearTimers]);

  const scheduleNextReaction = useCallback(() => {
    clearTimers();
    if (!dotLottie || reducedMotion || !isMountedRef.current) return;

    const randomDelay =
      MIN_REACTION_DELAY_MS +
      Math.random() * (MAX_REACTION_DELAY_MS - MIN_REACTION_DELAY_MS);

    autoTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current || reducedMotion || isPlayingReactionRef.current) {
        return;
      }
      const next = pickNextRandomReaction();
      playMarker(next);
    }, randomDelay);
  }, [dotLottie, reducedMotion, clearTimers, pickNextRandomReaction, playMarker]);

  scheduleNextReactionRef.current = scheduleNextReaction;

  // Trigger a non-repeating random reaction on tap/click
  const handleRobotClick = useCallback(() => {
    if (!dotLottie || reducedMotion) return;
    const nextMarker = pickNextRandomReaction();
    playMarker(nextMarker);
  }, [dotLottie, reducedMotion, pickNextRandomReaction, playMarker]);

  // Subtle alert reaction when hovering while idle
  const handleMouseEnter = useCallback(() => {
    if (!dotLottie || reducedMotion || isPlayingReactionRef.current) return;
    const nextMarker = lastReactionRef.current === 'alert' ? pickNextRandomReaction() : 'alert';
    playMarker(nextMarker);
  }, [dotLottie, reducedMotion, pickNextRandomReaction, playMarker]);

  // Track mount lifecycle cleanly
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  // Initialize player events and automatic random reaction loop
  useEffect(() => {
    if (!dotLottie) return;

    const handleReady = () => {
      if (!isMountedRef.current) return;
      if (reducedMotion) {
        clearTimers();
        dotLottie.pause();
      } else {
        playMarker('idle');
        scheduleNextReaction();
      }
    };

    const handleComplete = () => {
      if (!isMountedRef.current) return;
      if (isPlayingReactionRef.current) {
        isPlayingReactionRef.current = false;
        playMarker('idle');
        scheduleNextReaction();
      }
    };

    dotLottie.addEventListener('ready', handleReady);
    dotLottie.addEventListener('complete', handleComplete);

    if (dotLottie.isLoaded) {
      handleReady();
    }

    return () => {
      clearTimers();
      try {
        dotLottie.removeEventListener('ready', handleReady);
        dotLottie.removeEventListener('complete', handleComplete);
      } catch {
        // Cleanup safety
      }
    };
  }, [dotLottie, reducedMotion, playMarker, scheduleNextReaction, clearTimers]);

  // Respond cleanly to reduced motion toggles
  useEffect(() => {
    if (!dotLottie) return;
    if (reducedMotion) {
      clearTimers();
      isPlayingReactionRef.current = false;
      setCurrentAction('idle');
      dotLottie.pause();
    } else if (!isPlayingReactionRef.current) {
      playMarker('idle');
      scheduleNextReaction();
    }
  }, [reducedMotion, dotLottie, playMarker, scheduleNextReaction, clearTimers]);

  return (
    <div className={`flex items-center justify-center w-full select-none ${className}`}>
      {/* Compact Interactive Robot Canvas */}
      <div
        className="relative w-[156px] sm:w-[176px] lg:w-[clamp(154px,19vh,202px)] aspect-square flex items-center justify-center cursor-pointer group"
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
        aria-label="Interactive AI Robot: Click or tap to trigger a reaction"
      >
        {/* Soft cosmic glow behind robot */}
        <div
          className="absolute inset-3 rounded-full bg-gradient-to-tr from-[#38BDF8]/15 to-[#60A5FA]/10 blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700"
          aria-hidden="true"
        />

        {/* Lottie Canvas with 100% transparent background */}
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <DotLottieReact
            src="/animations/robot.json"
            dotLottieRefCallback={setDotLottie}
            autoplay={!reducedMotion}
            loop={currentAction === 'idle' && !reducedMotion}
            className="w-full h-full object-contain pointer-events-auto filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
            style={{ background: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
});

InteractiveRobot.displayName = 'InteractiveRobot';
