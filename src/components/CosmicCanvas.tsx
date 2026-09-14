import React, { useEffect, useRef } from 'react';

interface CosmicCanvasProps {
  reducedMotion?: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number; // depth: 1 (distant) to 3 (foreground)
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

interface NebulaCloud {
  xRatio: number;
  yRatio: number;
  radiusRatio: number;
  color: string;
  speed: number;
  angle: number;
}

export const CosmicCanvas: React.FC<CosmicCanvasProps> = ({ reducedMotion = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, velocity: 0, lastY: 0, lastTime: Date.now() });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;
    const starCount = isMobile ? 80 : 300;
    const particleCount = isMobile ? 12 : 50;

    // Generate Stars across depths
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const z = Math.random() < 0.65 ? 1 : Math.random() < 0.85 ? 2 : 3;
      const isBlue = Math.random() < 0.25;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        size: z === 1 ? Math.random() * 0.9 + 0.5 : z === 2 ? Math.random() * 1.2 + 0.8 : Math.random() * 1.6 + 1.2,
        baseAlpha: z === 1 ? Math.random() * 0.4 + 0.2 : z === 2 ? Math.random() * 0.5 + 0.4 : Math.random() * 0.6 + 0.4,
        alpha: 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: isBlue ? '#60A5FA' : '#F8FAFC'
      });
    }

    // Generate floating cosmic dust particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15 - 0.06,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.3 + 0.1,
        hue: Math.random() < 0.4 ? 195 : 215 // Cyan to deep blue hue
      });
    }

    // Nebula volumetric clouds
    const nebulas: NebulaCloud[] = [
      { xRatio: 0.2, yRatio: 0.3, radiusRatio: 0.45, color: 'rgba(7, 16, 31, 0.55)', speed: 0.0003, angle: 0 },
      { xRatio: 0.8, yRatio: 0.65, radiusRatio: 0.5, color: 'rgba(11, 22, 45, 0.45)', speed: -0.00025, angle: 1.5 },
      { xRatio: 0.5, yRatio: 0.85, radiusRatio: 0.4, color: 'rgba(2, 132, 199, 0.06)', speed: 0.0002, angle: 3.2 }
    ];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Re-distribute any out-of-bounds stars
      for (const s of stars) {
        if (s.x > width) s.x = Math.random() * width;
        if (s.y > height) s.y = Math.random() * height;
      }
    };

    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (isTouch || isMobile) return;
      // Normalised coordinates (-1 to +1)
      mouseRef.current.targetX = (e.clientX / width - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / height - 0.5) * 2;
    };

    const handleScroll = () => {
      if (isTouch || isMobile) return;
      const currentY = window.scrollY;
      const now = Date.now();
      const dt = Math.max(now - scrollRef.current.lastTime, 16);
      const dy = currentY - scrollRef.current.lastY;
      scrollRef.current.velocity = dy / dt;
      scrollRef.current.y = currentY;
      scrollRef.current.lastY = currentY;
      scrollRef.current.lastTime = now;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    if (!isTouch && !isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation
      if (!reducedMotion) {
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;
        scrollRef.current.velocity *= 0.92; // decay scroll velocity
      } else {
        mouseRef.current.x = 0;
        mouseRef.current.y = 0;
        scrollRef.current.velocity = 0;
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const scrollV = Math.min(Math.max(scrollRef.current.velocity * 4, -8), 8);

      // 1. Deep Space Base Clear
      ctx.fillStyle = '#03050B';
      ctx.fillRect(0, 0, width, height);

      // 2. Multi-layer volumetric nebulae
      for (const neb of nebulas) {
        neb.angle += neb.speed;
        const currentX = (neb.xRatio + Math.cos(neb.angle) * 0.04) * width + mx * 15;
        const currentY = (neb.yRatio + Math.sin(neb.angle) * 0.04) * height + my * 15;
        const radius = neb.radiusRatio * Math.min(width, height);

        const grad = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, radius);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(0.6, 'rgba(5, 8, 22, 0.2)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft ambient blue light glow at top center
      const ambientGrad = ctx.createRadialGradient(width * 0.5 + mx * 20, height * 0.15 + my * 15, 0, width * 0.5, height * 0.2, width * 0.7);
      ambientGrad.addColorStop(0, 'rgba(56, 189, 248, 0.045)');
      ambientGrad.addColorStop(0.5, 'rgba(7, 16, 31, 0.15)');
      ambientGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Render Stars with Depth & Parallax
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        
        // Depth-based parallax offset
        const parallaxFactor = star.z === 1 ? 4 : star.z === 2 ? 14 : 26;
        const starX = (star.x + mx * parallaxFactor + width) % width;
        
        // Scroll velocity drift
        star.y = (star.y - star.z * (0.08 + scrollV * 0.3) + height) % height;
        const starY = (star.y + my * parallaxFactor + height) % height;

        // Subtle twinkling calculation
        const twinkle = Math.sin(time * (star.twinkleSpeed * 50) + star.twinkleOffset);
        const alpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle * 0.25));

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(starX, starY, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render Floating Particles / Cosmic Dust
      for (let j = 0; j < particles.length; j++) {
        const p = particles[j];
        p.x += p.vx + mx * 0.25;
        p.y += p.vy - scrollV * 0.6;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw soft glowing dust mote
        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        pGrad.addColorStop(0, `hsla(${p.hue}, 85%, 65%, ${p.alpha})`);
        pGrad.addColorStop(1, `hsla(${p.hue}, 85%, 65%, 0)`);

        ctx.fillStyle = pGrad;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [reducedMotion]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: 'block' }}
      />
      {/* Film grain subtle overlay */}
      <div className="absolute inset-0 cosmic-grain mix-blend-overlay opacity-40 pointer-events-none" />
      {/* Vignette depth mask */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3, 5, 11, 0.75) 100%)'
        }}
      />
    </div>
  );
};
