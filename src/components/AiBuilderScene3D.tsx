import React, { useEffect, useRef, useState } from 'react';

interface AiBuilderScene3DProps {
  isHovered: boolean;
}

export const AiBuilderScene3D: React.FC<AiBuilderScene3DProps> = ({ isHovered }) => {
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

    // Abstract 3D Architecture Modules assembling and locking into place
    interface Module3D {
      id: number;
      angle: number;
      radius: number;
      yPos: number;
      targetRadius: number;
      progress: number; // 0 to 1 assembling
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
        progress: Math.random(), // staggered initial assembly
        speed: 0.005 + Math.random() * 0.008,
        type: i % 4 === 0 ? 'block' : i % 3 === 0 ? 'ring' : i % 2 === 0 ? 'strut' : 'node',
        size: 3 + Math.random() * 4
      });
    }

    // Energy / Data streams flowing between core and modules
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
      ambientGrad.addColorStop(0, isHovered ? 'rgba(56, 189, 248, 0.22)' : 'rgba(56, 189, 248, 0.12)');
      ambientGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.5)');
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

      // Ring 1 (X-axis tilt illusion)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 85, 30, ringAngles[0], 0, Math.PI * 2);
      ctx.stroke();

      // Ring 2 (Y-axis tilt illusion)
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 75, ringAngles[1], 0, Math.PI * 2);
      ctx.stroke();

      // Ring 3 (Outer precision frame)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, 68, ringAngles[2], ringAngles[2] + Math.PI * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // 3. Central AI Core (Brain/Heart of Machine Construction)
      const corePulse = Math.sin(globalTime * 3) * 3;
      
      // Outer crystalline shell layers
      for (let layer = 3; layer > 0; layer--) {
        const radius = 16 + layer * 8 + corePulse * (layer * 0.3);
        const rot = globalTime * (layer % 2 === 0 ? 0.5 : -0.5);
        
        ctx.save();
        ctx.translate(centerX + mouseRef.current.x * 8, centerY + mouseRef.current.y * 8);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 + layer * 0.12})`;
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

      // Central Luminescent Core Energy
      const coreGrad = ctx.createRadialGradient(
        centerX + mouseRef.current.x * 5, 
        centerY + mouseRef.current.y * 5, 
        2, 
        centerX, 
        centerY, 
        26
      );
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.35, '#38BDF8');
      coreGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      
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

      // 4. Continuous Assembly Modules (Real-time Construction System)
      modules.forEach((mod) => {
        if (!reducedMotion) {
          mod.progress += mod.speed * (isHovered ? 1.5 : 1.0);
          if (mod.progress > 1) {
            mod.progress = 0; // reset to simulate continuous building cycles
            mod.radius = 70 + Math.random() * 45; // new incoming component position
          }
        }

        // Interpolate distance from outer space (radius) to core (targetRadius) as it assembles
        const currentRadius = mod.radius + (mod.targetRadius - mod.radius) * Math.min(1, mod.progress * 1.5);
        const currentAngle = mod.angle + globalTime * 0.3;

        const px = centerX + Math.cos(currentAngle) * currentRadius + mouseRef.current.x * 15;
        const py = centerY + Math.sin(currentAngle) * (currentRadius * 0.65) + mod.yPos * (1 - mod.progress) + mouseRef.current.y * 15;

        const alpha = Math.min(1, mod.progress * 2) * (0.5 + 0.5 * Math.sin(globalTime + mod.id));

        ctx.save();
        ctx.translate(px, py);

        if (mod.type === 'block') {
          // Assembling modular housing block
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.8})`;
          ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.85})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(-mod.size, -mod.size, mod.size * 2, mod.size * 2);
          ctx.fill();
          ctx.stroke();

          // Inner lock node
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(-1, -1, 2, 2);
        } else if (mod.type === 'node') {
          // Neural junction point locking in
          ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, mod.size * 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.arc(0, 0, mod.size + 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Precision structural strut / connector
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-mod.size * 1.5, 0);
          ctx.lineTo(mod.size * 1.5, 0);
          ctx.stroke();
        }

        ctx.restore();

        // Connect assembling modules to the central core with fine laser guides
        if (mod.progress > 0.3) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.25})`;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(centerX + mouseRef.current.x * 5, centerY + mouseRef.current.y * 5);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 5. Data Flow Streams travelling through core to active modules
      dataStreams.forEach((stream) => {
        if (!reducedMotion) {
          stream.distance += stream.speed * (isHovered ? 1.8 : 1.0);
          if (stream.distance > 65) stream.distance = 12;
        }

        const sx = centerX + Math.cos(stream.angle + globalTime * 0.2) * stream.distance + mouseRef.current.x * 10;
        const sy = centerY + Math.sin(stream.angle + globalTime * 0.2) * (stream.distance * 0.7) + mouseRef.current.y * 10;

        ctx.fillStyle = `rgba(56, 189, 248, ${stream.brightness})`;
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
    <div className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] flex items-center justify-center rounded-xl bg-[#03050B]/80 border border-white/10 overflow-hidden shadow-2xl group-hover:border-[#38BDF8]/30 transition-all duration-500">
      {/* Background Grid & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />
      
      {/* Canvas for 3D Machine Construction Environment */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
};
