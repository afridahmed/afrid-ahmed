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
    <div className={`flex items-center justify-center w-full shrink-0 select-none ${className}`}>
      {/* Generously Sized Interactive Robot Canvas */}
      <div
        className="relative w-[206px] min-[390px]:w-[224px] sm:w-[240px] md:w-[228px] lg:w-[clamp(230px,26vh,292px)] aspect-square shrink-0 flex items-center justify-center cursor-pointer group"
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
        {/* Subtle silver & pale-blue stage halo behind robot */}
        <div
          className="absolute inset-2 rounded-full pointer-events-none group-hover:scale-105 transition-transform duration-700"
          style={{
            background:
              'radial-gradient(circle at 50% 52%, rgba(220, 236, 255, 0.11) 0%, rgba(245, 245, 245, 0.05) 45%, transparent 72%)',
            filter: 'blur(22px)',
          }}
          aria-hidden="true"
        />

        {/* Lottie Canvas filling dedicated 1:1 visual stage */}
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <DotLottieReact
            src="/animations/robot.json"
            dotLottieRefCallback={setDotLottie}
            autoplay={!reducedMotion}
            loop={currentAction === 'idle' && !reducedMotion}
            renderConfig={{ autoResize: true }}
            className="block w-full h-full pointer-events-auto filter drop-shadow-[0_14px_26px_rgba(0,0,0,0.5)]"
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
});

InteractiveRobot.displayName = 'InteractiveRobot';
