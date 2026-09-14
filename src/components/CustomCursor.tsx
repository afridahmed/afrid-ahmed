import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Only enable for desktop mice
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) setIsVisible(true);

      // Inspect target element for context cues
      const target = e.target as HTMLElement | null;
      if (target) {
        const clickable = target.closest('button, a, [role="button"], input, select');
        const customAction = target.closest('[data-cursor]')?.getAttribute('data-cursor');
        
        if (customAction) {
          setCursorText(customAction.toUpperCase());
          setIsHovered(true);
        } else if (clickable) {
          setIsHovered(true);
          const btnText = clickable.textContent?.trim().toLowerCase() || '';
          if (btnText.includes('watch') || btnText.includes('play')) {
            setCursorText('WATCH');
          } else if (btnText.includes('explore') || btnText.includes('orbit')) {
            setCursorText('EXPLORE');
          } else if (btnText.includes('connect') || btnText.includes('mail')) {
            setCursorText('CONNECT');
          } else {
            setCursorText('');
          }
        } else {
          setIsHovered(false);
          setCursorText('');
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const render = () => {
      currentX += (mouseX - currentX) * 0.18;
      currentY += (mouseY - currentY) * 0.18;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-50 transition-transform duration-75 ease-out will-change-transform hidden md:block"
      style={{ transform: 'translate3d(-100px, -100px, 0)' }}
    >
      <div
        className={`rounded-full flex items-center justify-center transition-all duration-300 ${
          isHovered
            ? cursorText
              ? 'w-16 h-16 bg-[#38BDF8]/20 border border-[#38BDF8] backdrop-blur-sm'
              : 'w-8 h-8 bg-[#38BDF8]/25 border border-[#38BDF8]'
            : 'w-3.5 h-3.5 bg-[#38BDF8]/60 border border-[#38BDF8]/80'
        }`}
      >
        {cursorText && (
          <span
            ref={labelRef}
            className="font-mono text-[9px] font-bold tracking-wider text-[#38BDF8] select-none"
          >
            {cursorText}
          </span>
        )}
      </div>
    </div>
  );
};
