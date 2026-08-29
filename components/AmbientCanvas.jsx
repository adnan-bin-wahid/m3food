'use client';

import { useEffect, useRef } from 'react';

export default function AmbientCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let pointer = { x: 0.5, y: 0.5 };

    const dots = Array.from({ length: 46 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 2.1,
      speed: 0.00004 + Math.random() * 0.00012,
      phase: i * 0.77 + Math.random() * Math.PI,
      drift: 8 + Math.random() * 24,
      alpha: 0.08 + Math.random() * 0.22
    }));

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onPointerMove(e) {
      pointer.x = e.clientX / Math.max(window.innerWidth, 1);
      pointer.y = e.clientY / Math.max(window.innerHeight, 1);
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        const pulse = Math.sin(time * dot.speed + dot.phase);
        const px = dot.x * width + pulse * dot.drift + (pointer.x - 0.5) * 18;
        const py = dot.y * height + Math.cos(time * dot.speed * 1.7 + dot.phase) * dot.drift;
        const g = ctx.createRadialGradient(px, py, 0, px, py, dot.r * 6);
        g.addColorStop(0, `rgba(84, 143, 82, ${dot.alpha * 0.72})`);
        g.addColorStop(1, 'rgba(84, 143, 82, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, dot.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />;
}
