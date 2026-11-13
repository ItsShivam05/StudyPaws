"use client";

import { useEffect, useRef } from "react";

interface Drop {
  x: number;
  y: number;
  r: number;
  vy: number;
  stick: number; // frames left before it slides again (stick-slip motion)
  trail: number; // y where the current trail starts
}

/**
 * Raindrops on the window glass: tiny static beads plus bigger drops that
 * slide down in little stick-slip jumps, leaving a fading trail.
 * Drawn on a canvas so it costs nothing in React renders.
 * Positioned over the window glass (see WIN in window-view.tsx).
 */
export function RainGlass({ heavy = false, animate = true }: { heavy?: boolean; animate?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let frame = 0;
    let beads: { x: number; y: number; r: number; a: number }[] = [];
    let drops: Drop[] = [];
    const trails: { x: number; y0: number; y1: number; r: number; life: number }[] = [];

    const seedBeads = () => {
      const count = Math.round((w * h) / (heavy ? 900 : 1400));
      beads = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (0.4 + Math.random() * 1.1) * dpr,
        a: 0.25 + Math.random() * 0.45,
      }));
      drops = [];
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width * dpr));
      h = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      seedBeads();
      draw();
    };

    const spawn = () => {
      const r = (1.6 + Math.random() * (heavy ? 2.6 : 2)) * dpr;
      const y = Math.random() * h * 0.6;
      drops.push({ x: Math.random() * w, y, r, vy: 0, stick: Math.random() * 40, trail: y });
    };

    const drawDrop = (x: number, y: number, r: number, alpha = 1) => {
      // body: slightly darker rim, lighter core = refracted light
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.9, r, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 225, 240, ${0.22 * alpha})`;
      ctx.fill();
      ctx.lineWidth = Math.max(0.6, r * 0.25);
      ctx.strokeStyle = `rgba(20, 30, 50, ${0.28 * alpha})`;
      ctx.stroke();
      // highlight
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * alpha})`;
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const t of trails) {
        ctx.strokeStyle = `rgba(220, 232, 245, ${0.16 * t.life})`;
        ctx.lineWidth = t.r * 0.7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(t.x, t.y0);
        ctx.lineTo(t.x, t.y1);
        ctx.stroke();
      }
      for (const b of beads) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 235, 245, ${b.a * 0.5})`;
        ctx.fill();
      }
      for (const d of drops) drawDrop(d.x, d.y, d.r);
    };

    const step = () => {
      raf = requestAnimationFrame(step);
      if (document.hidden) return;
      frame++;
      if (frame % 2) return; // ~30 fps is plenty for rain

      if (drops.length < (heavy ? 26 : 16) && Math.random() < (heavy ? 0.5 : 0.3)) spawn();
      // beads slowly refresh so the glass never looks frozen
      if (beads.length && Math.random() < 0.3) {
        const b = beads[Math.floor(Math.random() * beads.length)];
        b.x = Math.random() * w;
        b.y = Math.random() * h;
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (d.stick > 0) {
          d.stick--;
          continue;
        }
        d.vy = Math.min(d.vy + 0.08 * dpr, (2.2 + d.r * 0.25) * dpr);
        d.y += d.vy;
        d.x += (Math.random() - 0.5) * 0.4 * dpr;
        // occasionally catch on the glass again
        if (Math.random() < 0.025) {
          d.stick = 8 + Math.random() * 30;
          d.vy = 0;
          trails.push({ x: d.x, y0: d.trail, y1: d.y - d.r, r: d.r, life: 1 });
          d.trail = d.y;
        }
        // absorb beads on the way down (keeps the glass clear behind drops)
        for (const b of beads) {
          if (Math.abs(b.x - d.x) < d.r && Math.abs(b.y - d.y) < d.r) b.y = -10;
        }
        if (d.y - d.r > h) {
          trails.push({ x: d.x, y0: d.trail, y1: h, r: d.r, life: 1 });
          drops.splice(i, 1);
        }
      }
      for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].life -= 0.012;
        if (trails[i].life <= 0) trails.splice(i, 1);
      }
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate && !reduce) raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [heavy, animate]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute left-[26%] top-[11.6%] h-[46.8%] w-[38%] rounded-[3px]"
    />
  );
}
