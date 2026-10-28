import { useRef, useEffect, useCallback } from 'react';

interface Raindrop {
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

const MAX_DROPS = 150;
const MAX_SPLASHES = 20;

export default function RainEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Raindrop[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const animFrameRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const createDrop = useCallback((w: number, h: number, startAtTop = false): Raindrop => ({
    x: Math.random() * w * 1.2 - w * 0.1,
    y: startAtTop ? -Math.random() * 100 : Math.random() * h,
    length: 12 + Math.random() * 18,
    speed: 4 + Math.random() * 6,
    opacity: 0.15 + Math.random() * 0.35,
    angle: 0.04 + Math.random() * 0.08,
  }), []);

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
      ctx.scale(dpr, dpr);
      sizeRef.current = { w: window.innerWidth, h: window.innerHeight };
    };

    resize();
    window.addEventListener('resize', resize);

    const { w, h } = sizeRef.current;
    dropsRef.current = Array.from({ length: MAX_DROPS }, () => createDrop(w, h, false));

    const animate = () => {
      const { w: cw, h: ch } = sizeRef.current;
      ctx.clearRect(0, 0, cw, ch);

      // Draw and update raindrops
      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const endX = d.x + Math.sin(d.angle) * d.length;
        const endY = d.y + d.length;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(174, 194, 224, ${d.opacity})`;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.stroke();

        d.y += d.speed;
        d.x += Math.sin(d.angle) * d.speed * 0.3;

        if (d.y > ch) {
          // Create splash
          if (splashesRef.current.length < MAX_SPLASHES && Math.random() > 0.6) {
            splashesRef.current.push({
              x: d.x,
              y: ch - 2,
              radius: 0,
              opacity: 0.4,
              maxRadius: 3 + Math.random() * 4,
            });
          }
          const newDrop = createDrop(cw, ch, true);
          drops[i] = newDrop;
        }
      }

      // Draw and update splashes
      const splashes = splashesRef.current;
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, -Math.PI, 0);
        ctx.strokeStyle = `rgba(174, 194, 224, ${s.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        s.radius += 0.3;
        s.opacity -= 0.015;

        if (s.opacity <= 0 || s.radius >= s.maxRadius) {
          splashes.splice(i, 1);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [createDrop]);

  return (
    <canvas
      ref={canvasRef}
      className="rain-canvas"
      aria-hidden="true"
    />
  );
}
