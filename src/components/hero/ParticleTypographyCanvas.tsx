import React, { useEffect, useRef, useState } from 'react';

interface ParticleTypographyCanvasProps {
  text?: string;
  variant: 'desktop' | 'mobile';
  reducedMotion?: boolean;
  interactiveContainerRef?: React.RefObject<HTMLElement | null>;
}

interface TextParticle {
  // Current position
  x: number;
  y: number;
  // Velocity
  vx: number;
  vy: number;
  // Target anchor inside letter glyph
  tx: number;
  ty: number;
  // Depth factor (0.65 - 1.18)
  z: number;
  // Base radius
  size: number;
  // Base opacity & current opacity
  baseAlpha: number;
  alpha: number;
  // Color role (0 = soft white, 1 = pale blue)
  hueType: 0 | 1;
  // Organic phase & frequency
  phase: number;
  freq: number;
  // Edge drift freedom (0.35 for core, 1.35 for edge)
  driftScale: number;
  // Formation stagger delay (0..1)
  delay: number;
}

interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  hueType: 0 | 1;
}

interface OrbitalArc {
  rxRatio: number;
  ryRatio: number;
  tilt: number;
  offsetXRatio: number;
  offsetYRatio: number;
  opacity: number;
  hueType: 0 | 1;
  runners: {
    angle: number;
    speed: number;
    size: number;
    trailLength: number;
  }[];
}

interface RibbonConfig {
  yRatio: number;
  amp1: number;
  amp2: number;
  freq: number;
  speed: number;
  phase: number;
  tiltSlope: number;
  width: number;
  opacity: number;
  hueType: 0 | 1;
}

function createGlowSprite(r: number, g: number, b: number): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  const size = 28;
  sprite.width = size;
  sprite.height = size;
  const sctx = sprite.getContext('2d');
  if (sctx) {
    const center = size / 2;
    const grad = sctx.createRadialGradient(center, center, 0, center, center, center);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    grad.addColorStop(0.24, `rgba(${r}, ${g}, ${b}, 0.72)`);
    grad.addColorStop(0.58, `rgba(${r}, ${g}, ${b}, 0.18)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

function splitNameLines(raw: string): [string, string] {
  const cleaned = (raw || 'AFRID AHMED').trim().toUpperCase();
  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return [cleaned || 'AFRID', ''];
  return [parts[0], parts.slice(1).join(' ')];
}

function measureTrackedTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
): number {
  if (!text) return 0;
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += ctx.measureText(text[i]).width;
    if (i < text.length - 1) total += letterSpacing;
  }
  return total;
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  letterSpacing: number
) {
  const totalWidth = measureTrackedTextWidth(ctx, text, letterSpacing);
  let cursorX = centerX - totalWidth / 2;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const chWidth = ctx.measureText(ch).width;
    ctx.fillText(ch, cursorX, centerY);
    ctx.strokeText(ch, cursorX, centerY);
    cursorX += chWidth + letterSpacing;
  }
}

export const ParticleTypographyCanvas: React.FC<ParticleTypographyCanvasProps> = ({
  text = 'AFRID AHMED',
  variant,
  reducedMotion = false,
  interactiveContainerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasFailed, setCanvasFailed] = useState(false);

  const displayLines = splitNameLines(text);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      setCanvasFailed(true);
      return;
    }

    let isDisposed = false;
    let rafId = 0;
    let isInViewport = true;
    let isTabVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const isMobile = variant === 'mobile';
    const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const isLowPowerDevice = cpuCores <= 4;

    const whiteSprite = createGlowSprite(246, 248, 252);
    const blueSprite = createGlowSprite(168, 208, 255);

    let width = canvas.clientWidth || window.innerWidth;
    let height = canvas.clientHeight || window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let particles: TextParticle[] = [];
    let ambientMotes: AmbientMote[] = [];
    let formationElapsed = reducedMotion ? 10 : 0;
    let lastSampledWidth = 0;
    let lastSampledHeight = 0;

    // Pointer / parallax state (zero React re-renders)
    const pointer = {
      active: false,
      x: width / 2,
      y: height / 2,
      normX: 0,
      normY: 0,
      smoothNormX: 0,
      smoothNormY: 0,
      strength: 0,
    };

    const ribbons: RibbonConfig[] = isMobile
      ? [
          {
            yRatio: 0.44,
            amp1: 26,
            amp2: 14,
            freq: 0.0045,
            speed: 0.36,
            phase: 0.4,
            tiltSlope: -0.05,
            width: 24,
            opacity: 0.55,
            hueType: 1,
          },
          {
            yRatio: 0.52,
            amp1: 22,
            amp2: 12,
            freq: 0.0052,
            speed: -0.28,
            phase: 2.1,
            tiltSlope: 0.04,
            width: 18,
            opacity: 0.5,
            hueType: 0,
          },
        ]
      : [
          {
            yRatio: 0.415,
            amp1: 46,
            amp2: 22,
            freq: 0.0025,
            speed: 0.32,
            phase: 0.2,
            tiltSlope: -0.048,
            width: 36,
            opacity: 0.64,
            hueType: 1,
          },
          {
            yRatio: 0.46,
            amp1: 36,
            amp2: 18,
            freq: 0.0031,
            speed: -0.25,
            phase: 1.9,
            tiltSlope: 0.032,
            width: 26,
            opacity: 0.56,
            hueType: 0,
          },
          {
            yRatio: 0.51,
            amp1: 30,
            amp2: 16,
            freq: 0.0022,
            speed: 0.2,
            phase: 3.6,
            tiltSlope: -0.022,
            width: 30,
            opacity: 0.46,
            hueType: 1,
          },
        ];

    const orbitalArcs: OrbitalArc[] = isMobile
      ? [
          {
            rxRatio: 0.44,
            ryRatio: 0.145,
            tilt: -0.24,
            offsetXRatio: 0,
            offsetYRatio: -0.03,
            opacity: 0.14,
            hueType: 0,
            runners: [
              { angle: 0.4, speed: 0.28, size: 2.1, trailLength: 6 },
              { angle: 3.5, speed: 0.28, size: 1.7, trailLength: 5 },
            ],
          },
          {
            rxRatio: 0.39,
            ryRatio: 0.19,
            tilt: 0.28,
            offsetXRatio: 0,
            offsetYRatio: -0.03,
            opacity: 0.13,
            hueType: 1,
            runners: [{ angle: 1.9, speed: -0.21, size: 2.0, trailLength: 6 }],
          },
        ]
      : [
          {
            rxRatio: 0.43,
            ryRatio: 0.215,
            tilt: -0.14,
            offsetXRatio: 0,
            offsetYRatio: -0.04,
            opacity: 0.16,
            hueType: 0,
            runners: [
              { angle: 0.3, speed: 0.23, size: 2.4, trailLength: 8 },
              { angle: 3.45, speed: 0.23, size: 1.9, trailLength: 6 },
            ],
          },
          {
            rxRatio: 0.37,
            ryRatio: 0.27,
            tilt: 0.19,
            offsetXRatio: 0,
            offsetYRatio: -0.04,
            opacity: 0.14,
            hueType: 1,
            runners: [
              { angle: 1.4, speed: -0.18, size: 2.3, trailLength: 7 },
              { angle: 4.5, speed: -0.18, size: 1.7, trailLength: 5 },
            ],
          },
          {
            rxRatio: 0.47,
            ryRatio: 0.145,
            tilt: 0.045,
            offsetXRatio: 0,
            offsetYRatio: -0.04,
            opacity: 0.1,
            hueType: 0,
            runners: [{ angle: 2.6, speed: 0.14, size: 1.8, trailLength: 6 }],
          },
        ];

    const buildParticles = (preserveCurrentFormation: boolean) => {
      if (!canvas) return;
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));

      lastSampledWidth = width;
      lastSampledHeight = height;

      // Offscreen text mask canvas at 1:1 CSS pixels for fast accurate point sampling
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.max(1, Math.floor(width));
      offscreen.height = Math.max(1, Math.floor(height));
      const octx = offscreen.getContext('2d');
      if (!octx) return;

      const [line1, line2] = splitNameLines(text);
      const centerX = width / 2;
      const centerY = isMobile ? height * 0.45 : height * 0.455;

      octx.clearRect(0, 0, offscreen.width, offscreen.height);
      octx.fillStyle = '#FFFFFF';
      octx.strokeStyle = '#FFFFFF';
      octx.lineJoin = 'round';
      octx.lineCap = 'round';

      const fontFamily = `'Outfit', 'Syne', -apple-system, BlinkMacSystemFont, sans-serif`;

      if (isMobile) {
        const maxLineWidth = width * 0.84;
        let fontSize = Math.min(116, Math.max(48, width * 0.178));
        let tracking = fontSize * 0.1;

        octx.font = `800 ${fontSize}px ${fontFamily}`;
        const widerLine = line1.length >= line2.length ? line1 : line2;
        const measured = measureTrackedTextWidth(octx, widerLine, tracking);
        if (measured > maxLineWidth && measured > 0) {
          const ratio = maxLineWidth / measured;
          fontSize = Math.floor(fontSize * ratio);
          tracking = fontSize * 0.1;
          octx.font = `800 ${fontSize}px ${fontFamily}`;
        }

        octx.lineWidth = Math.max(1.2, fontSize * 0.026);

        if (line2) {
          const lineGap = fontSize * 1.06;
          drawTrackedText(octx, line1, centerX, centerY - lineGap * 0.5, tracking);
          drawTrackedText(octx, line2, centerX, centerY + lineGap * 0.5, tracking);
        } else {
          drawTrackedText(octx, line1, centerX, centerY, tracking);
        }
      } else {
        const fullLine = line2 ? `${line1} ${line2}` : line1;
        const maxLineWidth = Math.min(1340, width * 0.86);
        let fontSize = Math.min(156, Math.max(76, width * 0.112));
        let tracking = fontSize * 0.052;

        octx.font = `800 ${fontSize}px ${fontFamily}`;
        const measured = measureTrackedTextWidth(octx, fullLine, tracking);
        if (measured > maxLineWidth && measured > 0) {
          const ratio = maxLineWidth / measured;
          fontSize = Math.floor(fontSize * ratio);
          tracking = fontSize * 0.052;
          octx.font = `800 ${fontSize}px ${fontFamily}`;
        }

        octx.lineWidth = Math.max(2.2, fontSize * 0.036);
        drawTrackedText(octx, fullLine, centerX, centerY, tracking);
      }

      const imageData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imageData.data;

      // Match desktop density to mobile/tablet visual crispness while staying smooth at 60fps
      const maxParticles = isMobile
        ? isLowPowerDevice
          ? 880
          : 1250
        : isLowPowerDevice
        ? 3000
        : 4600;

      // Collect candidate pixels across a fine 3px lattice on both mobile & desktop
      const baseStep = 3;
      const candidates: { x: number; y: number; alpha: number }[] = [];

      for (let y = 1; y < offscreen.height - 1; y += baseStep) {
        for (let x = 1; x < offscreen.width - 1; x += baseStep) {
          const idx = (y * offscreen.width + x) * 4 + 3;
          const a = data[idx];
          if (a > 90) {
            candidates.push({ x, y, alpha: a });
          }
        }
      }

      // Uniform Fisher-Yates selection avoids scanline gaps/moire when subsampling
      if (candidates.length > maxParticles) {
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = candidates[i];
          candidates[i] = candidates[j];
          candidates[j] = tmp;
        }
      }

      const selectedCandidates =
        candidates.length > maxParticles ? candidates.slice(0, maxParticles) : candidates;
      const nextParticles: TextParticle[] = [];

      for (let i = 0; i < selectedCandidates.length; i++) {
        const sample = selectedCandidates[i];
        if (!sample) continue;

        const isEdge = sample.alpha < 225;
        const jitter = isMobile ? 0.85 : 1.15;
        const tx = sample.x + (Math.random() - 0.5) * jitter;
        const ty = sample.y + (Math.random() - 0.5) * jitter;

        const z = 0.68 + Math.random() * 0.5;
        const isPaleBlue = Math.random() < (isEdge ? 0.24 : 0.13);
        const size = isMobile
          ? isEdge
            ? 0.9 + Math.random() * 1.15
            : 1.05 + Math.random() * 1.25
          : isEdge
          ? 0.98 + Math.random() * 1.2
          : 1.15 + Math.random() * 1.35;

        // Formation start coordinates: graceful wide elliptical dispersion around canvas
        const scatterAngle = Math.atan2(ty - centerY, tx - centerX) + (Math.random() - 0.5) * 1.3;
        const scatterDist = (isMobile ? 110 : 190) + Math.random() * (isMobile ? 160 : 280);
        const startX = preserveCurrentFormation || reducedMotion
          ? tx
          : tx + Math.cos(scatterAngle) * scatterDist;
        const startY = preserveCurrentFormation || reducedMotion
          ? ty
          : ty + Math.sin(scatterAngle) * scatterDist * 0.65;

        const normalizedX = Math.max(0, Math.min(1, tx / Math.max(1, width)));

        nextParticles.push({
          x: startX,
          y: startY,
          vx: 0,
          vy: 0,
          tx,
          ty,
          z,
          size,
          baseAlpha: isEdge ? 0.52 + Math.random() * 0.34 : 0.72 + Math.random() * 0.28,
          alpha: preserveCurrentFormation || reducedMotion ? 1 : 0.06,
          hueType: isPaleBlue ? 1 : 0,
          phase: Math.random() * Math.PI * 2,
          freq: 0.7 + Math.random() * 0.9,
          driftScale: isEdge ? 1.55 : 0.42,
          delay: normalizedX * 0.38 + Math.random() * 0.16,
        });
      }

      particles = nextParticles;

      // Ambient sparse space motes around the composition
      const moteCount = isMobile ? 34 : 72;
      ambientMotes = Array.from({ length: moteCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.12 - 0.04,
        size: 0.8 + Math.random() * 1.4,
        alpha: 0.14 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        hueType: Math.random() < 0.28 ? 1 : 0,
      }));
    };

    const drawLiquidRibbons = (t: number, parallaxX: number, parallaxY: number) => {
      const stepX = isMobile ? 18 : 22;

      for (const rib of ribbons) {
        const baseY = height * rib.yRatio + parallaxY * 0.35;
        const pts: { x: number; y: number }[] = [];

        for (let x = -40; x <= width + 40; x += stepX) {
          const centeredX = x - width * 0.5;
          const wave1 = Math.sin(x * rib.freq + t * rib.speed + rib.phase) * rib.amp1;
          const wave2 = Math.cos(x * rib.freq * 1.75 - t * rib.speed * 0.75 + rib.phase) * rib.amp2;
          const envelope = Math.sin((Math.max(0, Math.min(width, x)) / width) * Math.PI);
          const y = baseY + centeredX * rib.tiltSlope + (wave1 + wave2) * (0.45 + 0.55 * envelope);
          pts.push({ x: x + parallaxX * 0.4, y });
        }

        if (pts.length < 2) continue;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const traceCurve = () => {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const xc = (pts[i].x + pts[i + 1].x) * 0.5;
            const yc = (pts[i].y + pts[i + 1].y) * 0.5;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
          }
          const last = pts[pts.length - 1];
          ctx.lineTo(last.x, last.y);
        };

        // Soft outer luminous flow ribbon (translucent pale-blue or soft white)
        const strokeGrad = ctx.createLinearGradient(0, baseY, width, baseY);
        if (rib.hueType === 1) {
          strokeGrad.addColorStop(0, 'rgba(148, 198, 255, 0)');
          strokeGrad.addColorStop(0.22, `rgba(154, 202, 255, ${0.045 * rib.opacity})`);
          strokeGrad.addColorStop(0.5, `rgba(186, 218, 255, ${0.072 * rib.opacity})`);
          strokeGrad.addColorStop(0.78, `rgba(154, 202, 255, ${0.045 * rib.opacity})`);
          strokeGrad.addColorStop(1, 'rgba(148, 198, 255, 0)');
        } else {
          strokeGrad.addColorStop(0, 'rgba(245, 248, 255, 0)');
          strokeGrad.addColorStop(0.25, `rgba(245, 248, 255, ${0.036 * rib.opacity})`);
          strokeGrad.addColorStop(0.5, `rgba(245, 248, 255, ${0.058 * rib.opacity})`);
          strokeGrad.addColorStop(0.75, `rgba(245, 248, 255, ${0.036 * rib.opacity})`);
          strokeGrad.addColorStop(1, 'rgba(245, 248, 255, 0)');
        }

        traceCurve();
        ctx.strokeStyle = strokeGrad;
        ctx.lineWidth = rib.width;
        ctx.stroke();

        // Delicate inner filament thread (non-metallic, soft edge light)
        const innerGrad = ctx.createLinearGradient(0, baseY, width, baseY);
        const innerColor = rib.hueType === 1 ? '184, 218, 255' : '245, 247, 252';
        innerGrad.addColorStop(0, `rgba(${innerColor}, 0)`);
        innerGrad.addColorStop(0.28, `rgba(${innerColor}, ${0.08 * rib.opacity})`);
        innerGrad.addColorStop(0.5, `rgba(${innerColor}, ${0.15 * rib.opacity})`);
        innerGrad.addColorStop(0.72, `rgba(${innerColor}, ${0.08 * rib.opacity})`);
        innerGrad.addColorStop(1, `rgba(${innerColor}, 0)`);

        traceCurve();
        ctx.strokeStyle = innerGrad;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.restore();
      }
    };

    const drawOrbitals = (t: number, parallaxX: number, parallaxY: number) => {
      for (const arc of orbitalArcs) {
        const cx = width * 0.5 + arc.offsetXRatio * width + parallaxX * 0.55;
        const cy = height * 0.5 + arc.offsetYRatio * height + parallaxY * 0.55;
        const rx = width * arc.rxRatio;
        const ry = height * arc.ryRatio;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(arc.tilt);

        // Fine curved orbital path
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle =
          arc.hueType === 1
            ? `rgba(170, 210, 255, ${arc.opacity})`
            : `rgba(245, 245, 245, ${arc.opacity})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();

        // Small luminous particles gliding smoothly along the orbital ellipse
        for (const runner of arc.runners) {
          const theta = runner.angle + t * runner.speed;
          const sprite = arc.hueType === 1 ? blueSprite : whiteSprite;

          for (let step = runner.trailLength; step >= 0; step--) {
            const trailTheta = theta - Math.sign(runner.speed) * step * 0.045;
            const px = Math.cos(trailTheta) * rx;
            const py = Math.sin(trailTheta) * ry;
            const falloff = 1 - step / (runner.trailLength + 1);
            const r = runner.size * (0.45 + 0.55 * falloff);

            ctx.globalAlpha = falloff * (step === 0 ? 0.9 : 0.35);
            ctx.drawImage(sprite, px - r * 2.2, py - r * 2.2, r * 4.4, r * 4.4);
          }

          const headX = Math.cos(theta) * rx;
          const headY = Math.sin(theta) * ry;
          ctx.globalAlpha = 0.95;
          ctx.fillStyle = arc.hueType === 1 ? '#D6EAFF' : '#FFFFFF';
          ctx.beginPath();
          ctx.arc(headX, headY, runner.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    let lastFrameTime = performance.now();
    let time = 0;

    const renderFrame = (now: number) => {
      if (isDisposed) return;

      const rawDt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      const dt = Math.min(0.05, Math.max(0.008, rawDt));

      if (!reducedMotion) {
        time += dt;
        formationElapsed = Math.min(4, formationElapsed + dt);
      }

      // Smooth pointer & parallax easing
      if (!isMobile && !reducedMotion) {
        pointer.smoothNormX += (pointer.normX - pointer.smoothNormX) * 0.06;
        pointer.smoothNormY += (pointer.normY - pointer.smoothNormY) * 0.06;
        pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;
      } else if (isMobile && !reducedMotion) {
        pointer.strength += ((pointer.active ? 0.75 : 0) - pointer.strength) * 0.06;
      }

      const parallaxX = isMobile ? 0 : pointer.smoothNormX * 8;
      const parallaxY = isMobile ? 0 : pointer.smoothNormY * 5;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Subtle pointer light aura on desktop
      if (!isMobile && pointer.strength > 0.02) {
        const auraRadius = 175;
        const aura = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          auraRadius
        );
        aura.addColorStop(0, `rgba(182, 214, 255, ${0.075 * pointer.strength})`);
        aura.addColorStop(0.45, `rgba(245, 247, 255, ${0.025 * pointer.strength})`);
        aura.addColorStop(1, 'rgba(8, 8, 8, 0)');
        ctx.fillStyle = aura;
        ctx.fillRect(
          pointer.x - auraRadius,
          pointer.y - auraRadius,
          auraRadius * 2,
          auraRadius * 2
        );
      }

      // 1. Liquid-Light Ribbons behind typography
      drawLiquidRibbons(time, parallaxX, parallaxY);

      // 2. Orbital Energy Curves & Runners
      drawOrbitals(time, parallaxX, parallaxY);

      // 3. Ambient Floating Space Motes
      for (let i = 0; i < ambientMotes.length; i++) {
        const m = ambientMotes[i];
        if (!reducedMotion) {
          m.x = (m.x + m.vx + width) % width;
          m.y = (m.y + m.vy + height) % height;
        }
        const twinkle = reducedMotion ? 0 : Math.sin(time * 1.1 + m.phase) * 0.12;
        const alpha = Math.max(0.06, Math.min(0.48, m.alpha + twinkle));
        const sprite = m.hueType === 1 ? blueSprite : whiteSprite;
        const r = m.size * 2.4;

        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, m.x + parallaxX * 0.3 - r, m.y + parallaxY * 0.3 - r, r * 2, r * 2);
      }

      // 4. Main Luminous Letter Constellation Particles
      const interactRadius = isMobile ? 88 : 118;
      const interactRadiusSq = interactRadius * interactRadius;
      const springStiffness = 0.095;
      const damping = 0.79;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (reducedMotion) {
          p.x = p.tx;
          p.y = p.ty;
          p.alpha = p.baseAlpha;
        } else {
          // Staggered formation activation
          const formationProgress = Math.max(0, Math.min(1, (formationElapsed - p.delay) / 1.35));
          const easeTargetAlpha = 0.08 + formationProgress * (p.baseAlpha - 0.08);
          p.alpha += (easeTargetAlpha - p.alpha) * 0.12;

          // Organic breathing & subtle edge drift once near target
          const breathRadius = p.driftScale * (0.65 + 0.55 * formationProgress);
          const ox = Math.sin(time * p.freq + p.phase) * breathRadius * 1.35;
          const oy = Math.cos(time * (p.freq * 0.85) + p.phase * 1.3) * breathRadius * 1.25;

          const depthParallaxX = parallaxX * (p.z - 0.5);
          const depthParallaxY = parallaxY * (p.z - 0.5);

          const targetX = p.tx + ox + depthParallaxX;
          const targetY = p.ty + oy + depthParallaxY;

          // Spring back cleanly toward letter shape with smooth staggered sweep
          const pullRate =
            formationProgress <= 0
              ? 0.008
              : formationProgress < 1
              ? 0.015 + formationProgress * 0.08
              : springStiffness;
          p.vx += (targetX - p.x) * pullRate;
          p.vy += (targetY - p.y) * pullRate;

          // Restrained cursor / touch deflection force
          if (pointer.strength > 0.02) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < interactRadiusSq && distSq > 0.25) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / interactRadius) * (isMobile ? 2.4 : 3.1) * pointer.strength;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          }

          p.vx *= damping;
          p.vy *= damping;
          p.x += p.vx;
          p.y += p.vy;
        }

        // Subtle brightness modulation
        const shimmer = reducedMotion ? 0 : Math.sin(time * 1.6 + p.phase) * 0.12;
        const finalAlpha = Math.max(0.12, Math.min(1, p.alpha + shimmer));

        // Draw luminous halo sprite + crisp specular core point
        const haloRadius = p.size * (p.hueType === 1 ? 2.8 : 2.35);
        const sprite = p.hueType === 1 ? blueSprite : whiteSprite;

        ctx.globalAlpha = finalAlpha * 0.72;
        ctx.drawImage(sprite, p.x - haloRadius, p.y - haloRadius, haloRadius * 2, haloRadius * 2);

        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = p.hueType === 1 ? '#DDF0FF' : '#F8FAFC';
        const coreSize = Math.max(1.05, p.size * 0.82);
        ctx.fillRect(p.x - coreSize * 0.5, p.y - coreSize * 0.5, coreSize, coreSize);
      }

      ctx.globalAlpha = 1;

      if (!reducedMotion && isInViewport && isTabVisible) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    const startLoop = () => {
      cancelAnimationFrame(rafId);
      if (isDisposed) return;
      lastFrameTime = performance.now();
      rafId = requestAnimationFrame(renderFrame);
    };

    const stopLoop = () => {
      cancelAnimationFrame(rafId);
    };

    const init = async () => {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Proceed with system sans fallback cleanly
        }
      }
      if (isDisposed) return;
      buildParticles(false);
      startLoop();
    };

    init();

    // Pointer listeners on interactive parent container (preserves native scroll)
    const targetEl = interactiveContainerRef?.current || canvas;

    const updatePointerFromClient = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      pointer.x = localX;
      pointer.y = localY;
      pointer.normX = (localX / Math.max(1, rect.width) - 0.5) * 2;
      pointer.normY = (localY / Math.max(1, rect.height) - 0.5) * 2;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (reducedMotion) return;
      if (e.pointerType === 'touch' && !isMobile) return;
      pointer.active = true;
      updatePointerFromClient(e.clientX, e.clientY);
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (reducedMotion || !e.touches[0]) return;
      pointer.active = true;
      updatePointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (reducedMotion || !e.touches[0]) return;
      pointer.active = true;
      updatePointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchEnd = () => {
      pointer.active = false;
    };

    targetEl.addEventListener('pointermove', onPointerMove as EventListener, { passive: true });
    targetEl.addEventListener('pointerleave', onPointerLeave as EventListener, { passive: true });
    if (isMobile) {
      targetEl.addEventListener('touchstart', onTouchStart as EventListener, { passive: true });
      targetEl.addEventListener('touchmove', onTouchMove as EventListener, { passive: true });
      targetEl.addEventListener('touchend', onTouchEnd as EventListener, { passive: true });
    }

    // Debounced ResizeObserver (only rebuilds when dimensions actually change)
    let resizeTimer: number | undefined;
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (Math.abs(w - lastSampledWidth) < 10 && Math.abs(h - lastSampledHeight) < 80) {
        return;
      }
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!isDisposed) {
          buildParticles(true);
          if (reducedMotion) {
            renderFrame(performance.now());
          }
        }
      }, 120);
    });
    ro.observe(canvas);

    // Pause when scrolled offscreen
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isInViewport = entry.isIntersecting;
        if (isInViewport && isTabVisible && !reducedMotion) {
          startLoop();
        } else if (!isInViewport) {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    // Pause when browser tab is backgrounded
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && isInViewport && !reducedMotion) {
        startLoop();
      } else {
        stopLoop();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isDisposed = true;
      stopLoop();
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      targetEl.removeEventListener('pointermove', onPointerMove as EventListener);
      targetEl.removeEventListener('pointerleave', onPointerLeave as EventListener);
      if (isMobile) {
        targetEl.removeEventListener('touchstart', onTouchStart as EventListener);
        targetEl.removeEventListener('touchmove', onTouchMove as EventListener);
        targetEl.removeEventListener('touchend', onTouchEnd as EventListener);
      }
    };
  }, [text, variant, reducedMotion, interactiveContainerRef]);

  if (canvasFailed) {
    return (
      <div className="w-full h-full flex items-center justify-center px-6 text-center">
        <div
          className="font-display font-black uppercase tracking-[0.12em] text-[#F5F5F5] leading-[0.95]"
          style={{
            fontSize: variant === 'mobile' ? 'clamp(2.8rem, 15vw, 4.4rem)' : 'clamp(3.6rem, 7.5vw, 6.5rem)',
            textShadow: '0 0 28px rgba(175, 212, 255, 0.22)',
          }}
        >
          {variant === 'mobile' && displayLines[1] ? (
            <>
              <span className="block">{displayLines[0]}</span>
              <span className="block mt-1">{displayLines[1]}</span>
            </>
          ) : (
            displayLines.filter(Boolean).join(' ')
          )}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="w-full h-full block pointer-events-none select-none"
    />
  );
};
