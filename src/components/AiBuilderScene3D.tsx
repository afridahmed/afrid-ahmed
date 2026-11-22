import React, { useEffect, useRef, useState } from 'react';

interface AiBuilderScene3DProps {
  isHovered: boolean;
}

export const AiBuilderScene3D: React.FC<AiBuilderScene3DProps> = React.memo(({ isHovered }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const inkRgb = '245, 245, 245';
    const secondaryInkRgb = '160, 160, 160';
    const surfaceFillRgb = '18, 18, 18';
    const coreCenterHex = '#F5F5F5';
    const coreMidHex = '#A0A0A0';

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 380);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    const parent = canvas.parentElement;
    parent?.addEventListener('mousemove', handleMouseMove);
    parent?.addEventListener('mouseleave', handleMouseLeave);

    interface Module3D {
      id: number;
      angle: number;
      radius: number;
      yPos: number;
      targetRadius: number;
      progress: number;
      speed: number;
      type: 'ring' | 'block' | 'strut' | 'node';
      size: number;
    }

    const modules: Module3D[] = [];
    const moduleCount = 22;

    for (let i = 0; i < moduleCount; i++) {
      modules.push({
        id: i,
        angle: (i / moduleCount) * Math.PI * 2 + Math.random() * 0.5,
        radius: 70 + Math.random() * 45,
        targetRadius: 45 + (i % 3) * 15,
        yPos: (Math.random() - 0.5) * 60,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.008,
        type: i % 4 === 0 ? 'block' : i % 3 === 0 ? 'ring' : i % 2 === 0 ? 'strut' : 'node',
        size: 3 + Math.random() * 4
      });
    }

    const dataStreams: Array<{
      angle: number;
      distance: number;
      speed: number;
      size: number;
      brightness: number;
    }> = [];

    for (let i = 0; i < 16; i++) {
      dataStreams.push({
        angle: Math.random() * Math.PI * 2,
        distance: 10 + Math.random() * 55,
        speed: 0.01 + Math.random() * 0.02,
        size: 1 + Math.random() * 1.5,
        brightness: 0.4 + Math.random() * 0.6
      });
    }

    let globalTime = 0;

    const render = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;

      const timeSpeed = reducedMotion ? 0.2 : isHovered ? 1.6 : 1.0;
      globalTime += 0.015 * timeSpeed;

      // 1. Ambient Background Core Glow
      const ambientGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 150);
      ambientGrad.addColorStop(0, `rgba(${inkRgb}, ${isHovered ? 0.14 : 0.08})`);
      ambientGrad.addColorStop(0.5, `rgba(${surfaceFillRgb}, 0.45)`);
      ambientGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Rotating Architectural Outer Construct Rings
      const ringAngles = [
        globalTime * 0.4,
        -globalTime * 0.3,
        globalTime * 0.6
      ];

      ctx.save();
      ctx.translate(centerX + mouseRef.current.x * 12, centerY + mouseRef.current.y * 12);

      // Ring 1
      ctx.strokeStyle = `rgba(${inkRgb}, 0.22)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 85, 30, ringAngles[0], 0, Math.PI * 2);
      ctx.stroke();

      // Ring 2
      ctx.strokeStyle = `rgba(${secondaryInkRgb}, 0.25)`;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 75, ringAngles[1], 0, Math.PI * 2);
      ctx.stroke();

      // Ring 3
      ctx.strokeStyle = `rgba(${inkRgb}, 0.32)`;
      ctx.lineWidth = 1.25;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, 68, ringAngles[2], ringAngles[2] + Math.PI * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // 3. Central AI Core
      const corePulse = Math.sin(globalTime * 3) * 3;

      for (let layer = 3; layer > 0; layer--) {
        const radius = 16 + layer * 8 + corePulse * (layer * 0.3);
        const rot = globalTime * (layer % 2 === 0 ? 0.5 : -0.5);

        ctx.save();
        ctx.translate(centerX + mouseRef.current.x * 8, centerY + mouseRef.current.y * 8);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(${inkRgb}, ${0.14 + layer * 0.1})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        const sides = 6;
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2;
          const sx = Math.cos(a) * radius;
          const sy = Math.sin(a) * radius;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      const coreGrad = ctx.createRadialGradient(
        centerX + mouseRef.current.x * 5,
        centerY + mouseRef.current.y * 5,
        2,
        centerX,
        centerY,
        26
      );
      coreGrad.addColorStop(0, coreCenterHex);
      coreGrad.addColorStop(0.35, coreMidHex);
      coreGrad.addColorStop(1, `rgba(${inkRgb}, 0)`);

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(
        centerX + mouseRef.current.x * 5,
        centerY + mouseRef.current.y * 5,
        24 + corePulse,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 4. Continuous Assembly Modules
      modules.forEach((mod) => {
        if (!reducedMotion) {
          mod.progress += mod.speed * (isHovered ? 1.5 : 1.0);
          if (mod.progress > 1) {
            mod.progress = 0;
            mod.radius = 70 + Math.random() * 45;
          }
        }

        const currentRadius = mod.radius + (mod.targetRadius - mod.radius) * Math.min(1, mod.progress * 1.5);
        const currentAngle = mod.angle + globalTime * 0.3;

        const px = centerX + Math.cos(currentAngle) * currentRadius + mouseRef.current.x * 15;
        const py = centerY + Math.sin(currentAngle) * (currentRadius * 0.65) + mod.yPos * (1 - mod.progress) + mouseRef.current.y * 15;

        const alpha = Math.min(1, mod.progress * 2) * (0.5 + 0.5 * Math.sin(globalTime + mod.id));

        ctx.save();
        ctx.translate(px, py);

        if (mod.type === 'block') {
          ctx.strokeStyle = `rgba(${inkRgb}, ${alpha * 0.65})`;
          ctx.fillStyle = `rgba(${surfaceFillRgb}, ${alpha * 0.85})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(-mod.size, -mod.size, mod.size * 2, mod.size * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = coreCenterHex;
          ctx.fillRect(-1, -1, 2, 2);
        } else if (mod.type === 'node') {
          ctx.fillStyle = `rgba(${secondaryInkRgb}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, mod.size * 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(${inkRgb}, ${alpha * 0.8})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.arc(0, 0, mod.size + 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = `rgba(${inkRgb}, ${alpha * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-mod.size * 1.5, 0);
          ctx.lineTo(mod.size * 1.5, 0);
          ctx.stroke();
        }

        ctx.restore();

        if (mod.progress > 0.3) {
          ctx.strokeStyle = `rgba(${inkRgb}, ${alpha * 0.22})`;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(centerX + mouseRef.current.x * 5, centerY + mouseRef.current.y * 5);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 5. Data Flow Streams
      dataStreams.forEach((stream) => {
        if (!reducedMotion) {
          stream.distance += stream.speed * (isHovered ? 1.8 : 1.0);
          if (stream.distance > 65) stream.distance = 12;
        }

        const sx = centerX + Math.cos(stream.angle + globalTime * 0.2) * stream.distance + mouseRef.current.x * 10;
        const sy = centerY + Math.sin(stream.angle + globalTime * 0.2) * (stream.distance * 0.7) + mouseRef.current.y * 10;

        ctx.fillStyle = `rgba(${inkRgb}, ${stream.brightness * 0.75})`;
        ctx.beginPath();
        ctx.arc(sx, sy, stream.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      parent?.removeEventListener('mousemove', handleMouseMove);
      parent?.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered, reducedMotion]);

  return (
    <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-card)] group-hover:border-[var(--border-strong)] transition-all duration-500">
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
});

AiBuilderScene3D.displayName = 'AiBuilderScene3D';
