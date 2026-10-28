import { useRef, useEffect } from 'react';
import type { Season } from '../types';

interface SeasonalEffectProps {
  season: Season;
}

// Particle structures
interface Raindrop {
  type: 'rain';
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  maxRadius: number;
}

interface SummerMote {
  type: 'mote';
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  pulseSpeed: number;
  pulsePhase: number;
  hue: number;
  baseOpacity: number;
}

interface Petal {
  type: 'petal';
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  tilt: number;
  vTilt: number;
  color: string;
  opacity: number;
}

interface WinterMist {
  type: 'mist';
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  isCrystal: boolean;
}

export default function SeasonalEffect({ season }: SeasonalEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Store particles in ref to maintain continuity
  const particlesRef = useRef<any[]>([]);
  const splashesRef = useRef<Splash[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      sizeRef.current = { w: window.innerWidth, h: window.innerHeight };
    };

    resize();
    window.addEventListener('resize', resize);

    const { w, h } = sizeRef.current;

    // Initialize particles based on selected season
    if (season === 'monsoon') {
      const MAX_DROPS = 140;
      particlesRef.current = Array.from({ length: MAX_DROPS }, () => ({
        type: 'rain',
        x: Math.random() * w * 1.2 - w * 0.1,
        y: Math.random() * h,
        length: 12 + Math.random() * 20,
        speed: 5 + Math.random() * 7,
        opacity: 0.2 + Math.random() * 0.45,
        angle: 0.05 + Math.random() * 0.08,
      } as Raindrop));
      splashesRef.current = [];
    } else if (season === 'summer') {
      const MAX_MOTES = 60;
      particlesRef.current = Array.from({ length: MAX_MOTES }, () => ({
        type: 'mote',
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 1.5 + Math.random() * 3.5,
        baseRadius: 1.5 + Math.random() * 3.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.45,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
        hue: 35 + Math.random() * 20, // Warm gold to amber
        baseOpacity: 0.3 + Math.random() * 0.5,
      } as SummerMote));
    } else if (season === 'spring') {
      const MAX_PETALS = 45;
      const petalColors = [
        'rgba(255, 195, 210,', // Cherry blossom pink
        'rgba(255, 215, 225,', // Soft blush
        'rgba(255, 240, 245,', // Jasmine white-pink
        'rgba(240, 185, 205,', // Deep petal
      ];
      particlesRef.current = Array.from({ length: MAX_PETALS }, () => ({
        type: 'petal',
        x: Math.random() * w,
        y: Math.random() * h,
        size: 7 + Math.random() * 7,
        vx: 0.4 + Math.random() * 0.8,
        vy: 0.6 + Math.random() * 1.0,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.025,
        tilt: Math.random() * Math.PI,
        vTilt: 0.02 + Math.random() * 0.03,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        opacity: 0.5 + Math.random() * 0.4,
      } as Petal));
    } else if (season === 'tropicalWinter') {
      const MAX_MIST = 70;
      particlesRef.current = Array.from({ length: MAX_MIST }, () => ({
        type: 'mist',
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 1.2 + Math.random() * 3.5,
        vx: 0.15 + Math.random() * 0.35,
        vy: 0.2 + Math.random() * 0.4,
        opacity: 0.25 + Math.random() * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.015 + Math.random() * 0.025,
        isCrystal: Math.random() > 0.6,
      } as WinterMist));
    }

    let time = 0;

    const animate = () => {
      const { w: cw, h: ch } = sizeRef.current;
      ctx.clearRect(0, 0, cw, ch);
      time += 0.016;

      if (season === 'monsoon') {
        const drops = particlesRef.current as Raindrop[];
        const splashes = splashesRef.current;

        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          const endX = d.x + Math.sin(d.angle) * d.length;
          const endY = d.y + d.length;

          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = `rgba(160, 205, 230, ${d.opacity})`;
          ctx.lineWidth = 1.1;
          ctx.lineCap = 'round';
          ctx.stroke();

          d.y += d.speed;
          d.x += Math.sin(d.angle) * d.speed * 0.3;

          if (d.y > ch) {
            if (splashes.length < 25 && Math.random() > 0.6) {
              splashes.push({
                x: d.x,
                y: ch - 2,
                radius: 0,
                opacity: 0.45,
                maxRadius: 3 + Math.random() * 5,
              });
            }
            d.y = -d.length - Math.random() * 60;
            d.x = Math.random() * cw * 1.2 - cw * 0.1;
          }
        }

        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, -Math.PI, 0);
          ctx.strokeStyle = `rgba(160, 205, 230, ${s.opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          s.radius += 0.35;
          s.opacity -= 0.018;

          if (s.opacity <= 0 || s.radius >= s.maxRadius) {
            splashes.splice(i, 1);
          }
        }
      } else if (season === 'summer') {
        const motes = particlesRef.current as SummerMote[];
        for (let i = 0; i < motes.length; i++) {
          const m = motes[i];
          m.pulsePhase += m.pulseSpeed;
          const currentPulse = Math.sin(m.pulsePhase);
          const currentOpacity = Math.max(0.08, m.baseOpacity + currentPulse * 0.25);
          const r = m.baseRadius + currentPulse * 0.8;

          // Soft glowing aura
          const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 2.5);
          grad.addColorStop(0, `hsla(${m.hue}, 95%, 65%, ${currentOpacity})`);
          grad.addColorStop(0.5, `hsla(${m.hue}, 90%, 55%, ${currentOpacity * 0.4})`);
          grad.addColorStop(1, `hsla(${m.hue}, 85%, 50%, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(m.x, m.y, r * 2.5, 0, Math.PI * 2);
          ctx.fill();

          m.x += m.vx + Math.sin(time + i) * 0.35;
          m.y += m.vy;

          if (m.y < -15) {
            m.y = ch + 15;
            m.x = Math.random() * cw;
          }
          if (m.x < -20) m.x = cw + 20;
          if (m.x > cw + 20) m.x = -20;
        }
      } else if (season === 'spring') {
        const petals = particlesRef.current as Petal[];
        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];
          p.angle += p.vAngle;
          p.tilt += p.vTilt;

          const tiltCos = Math.cos(p.tilt);
          const petalWidth = p.size * (0.6 + 0.4 * Math.abs(tiltCos));
          const petalHeight = p.size;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          // Draw realistic flower petal path
          ctx.beginPath();
          ctx.moveTo(0, -petalHeight / 2);
          ctx.bezierCurveTo(
            petalWidth / 2, -petalHeight / 3,
            petalWidth / 2, petalHeight / 3,
            0, petalHeight / 2
          );
          ctx.bezierCurveTo(
            -petalWidth / 2, petalHeight / 3,
            -petalWidth / 2, -petalHeight / 3,
            0, -petalHeight / 2
          );

          ctx.fillStyle = `${p.color} ${p.opacity})`;
          ctx.fill();

          // Subtle petal central vein
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -petalHeight / 3);
          ctx.lineTo(0, petalHeight / 3);
          ctx.stroke();

          ctx.restore();

          // Gentle sway with breeze
          p.x += p.vx + Math.sin(time * 0.8 + i) * 0.6;
          p.y += p.vy;

          if (p.y > ch + 20) {
            p.y = -20;
            p.x = Math.random() * cw;
          }
          if (p.x > cw + 30) p.x = -30;
        }
      } else if (season === 'tropicalWinter') {
        const mist = particlesRef.current as WinterMist[];
        for (let i = 0; i < mist.length; i++) {
          const m = mist[i];
          m.twinklePhase += m.twinkleSpeed;
          const twinkle = (Math.sin(m.twinklePhase) + 1) / 2;
          const currentOpacity = Math.max(0.1, m.opacity * (0.6 + 0.4 * twinkle));

          if (m.isCrystal) {
            // Subtle cool crystalline diamond
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(time * 0.2 + i);
            ctx.fillStyle = `rgba(215, 240, 255, ${currentOpacity})`;
            ctx.beginPath();
            ctx.moveTo(0, -m.radius * 1.4);
            ctx.lineTo(m.radius * 1.4, 0);
            ctx.lineTo(0, m.radius * 1.4);
            ctx.lineTo(-m.radius * 1.4, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else {
            // Soft cool morning mist droplet
            const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius * 2);
            grad.addColorStop(0, `rgba(180, 225, 255, ${currentOpacity})`);
            grad.addColorStop(1, `rgba(180, 225, 255, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          m.x += m.vx + Math.sin(time * 0.5 + i) * 0.3;
          m.y += m.vy;

          if (m.y > ch + 15) {
            m.y = -15;
            m.x = Math.random() * cw;
          }
          if (m.x > cw + 20) m.x = -20;
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [season]);

  return (
    <canvas
      ref={canvasRef}
      className="seasonal-canvas"
      aria-hidden="true"
    />
  );
}
