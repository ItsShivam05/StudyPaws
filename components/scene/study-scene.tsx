"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SceneId } from "@/types";
import { WindowView, WIN, scatter } from "./window-view";
import { RainGlass } from "./rain-glass";
import { DeskFx, RoomFx, SceneFxDefs, WallFx } from "./scene-fx";
import { useUiStore } from "@/lib/stores/ui";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

const MOTES = scatter(10, 23);

/** Wall clock that shows the real time (fixed 10:10 until hydrated, to match SSR). */
function ClockHands() {
  const hydrated = useUiStore((s) => s.hydrated);
  const now = new Date(useNow(30_000));
  const h = hydrated ? now.getHours() % 12 : 10;
  const m = hydrated ? now.getMinutes() : 10;
  const minuteAngle = m * 6;
  const hourAngle = h * 30 + m * 0.5;
  return (
    <g stroke="#3D322B" strokeLinecap="round">
      <line x1="0" y1="0" x2="0" y2="-9" strokeWidth="2.2" transform={`rotate(${hourAngle})`} />
      <line x1="0" y1="0" x2="0" y2="-13" strokeWidth="1.5" transform={`rotate(${minuteAngle})`} />
      <circle r="1.6" fill="#3D322B" stroke="none" />
    </g>
  );
}

/**
 * The cozy room, drawn as one responsive SVG (viewBox 800×500). Colours
 * come from CSS variables so light/dark themes switch without re-rendering.
 * Children are absolutely positioned HTML overlays (the cat, timers…).
 */
export function StudyScene({
  scene,
  thunder = false,
  children,
  className,
  lampOn = true,
  animate = true,
  notebook = true,
}: {
  /** false when the student is at the desk with their own notebook */
  notebook?: boolean;
  scene: SceneId;
  thunder?: boolean;
  children?: ReactNode;
  className?: string;
  lampOn?: boolean;
  /** false = low-motion: no canvas rain, no parallax/camera (CSS handles the rest) */
  animate?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  // Theme cross-fade: keep the previous theme on screen while the new one fades in.
  const [shown, setShown] = useState<{ scene: SceneId; prev: SceneId | null }>({ scene, prev: null });
  if (shown.scene !== scene) setShown({ scene, prev: animate ? shown.scene : null });
  const prev = shown.prev;
  useEffect(() => {
    if (!prev) return;
    const t = setTimeout(() => setShown((v) => ({ ...v, prev: null })), 950);
    return () => clearTimeout(t);
  }, [prev]);
  const layers = prev && prev !== scene ? [prev, scene] : [scene];
  /**
   * Renders one copy per visible theme. The incoming one fades in on top; for
   * see-through effects the outgoing one fades out too (an opaque window view
   * underneath just stays until it's covered).
   */
  const fade = (render: (s: SceneId) => ReactNode, fadeOut = true) =>
    layers.map((s) => (
      <g key={s} className={layers.length > 1 ? (s === scene ? "anim-scene-in" : fadeOut ? "anim-scene-out" : undefined) : undefined}>
        {render(s)}
      </g>
    ));
  // Parallax: write CSS variables directly (no React re-render per mouse move).
  const onPointerMove = (e: React.PointerEvent) => {
    const el = boxRef.current;
    if (!el || !animate || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const onPointerLeave = () => {
    boxRef.current?.style.setProperty("--px", "0");
    boxRef.current?.style.setProperty("--py", "0");
  };
  const fill = (v: string) => ({ fill: `var(${v})` });
  const { x, y, w, h } = WIN;
  const evening = scene === "night" || scene === "rainy";

  return (
    <div
      ref={boxRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("relative aspect-[8/5] w-full overflow-hidden", className)}
    >
      <div className={cn("absolute inset-0", animate && "anim-camera")}>
      <svg viewBox="0 0 800 500" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <clipPath id="window-clip">
            <rect x={x} y={y} width={w} height={h} rx="3" />
          </clipPath>
          <radialGradient id="lamp-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFD58F" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#FFC873" stopOpacity="0.18" />
            <stop offset="1" stopColor="#FFC873" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lamp-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE2A8" stopOpacity="0.38" />
            <stop offset="1" stopColor="#FFE2A8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="desk-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--scene-desk-hi)" }} />
            <stop offset="1" style={{ stopColor: "var(--scene-desk)" }} />
          </linearGradient>
          <radialGradient id="lamp-pool" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFC46E" stopOpacity="1" />
            <stop offset="0.5" stopColor="#FFB45A" stopOpacity="0.35" />
            <stop offset="1" stopColor="#FFB45A" stopOpacity="0" />
          </radialGradient>
          <clipPath id="under-sill">
            <rect x="186" y="322" width="348" height="62" />
          </clipPath>
          <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.55" stopColor="#1d1916" stopOpacity="0" />
            <stop offset="1" stopColor="#1d1916" stopOpacity="0.35" />
          </radialGradient>
          <SceneFxDefs />
        </defs>

        {/* Wall */}
        <rect width="800" height="500" style={fill("--scene-wall")} />
        <rect y="318" width="800" height="70" style={fill("--scene-wall-shade")} />
        <rect y="316" width="800" height="4" style={fill("--scene-trim")} />

        {/* Framed print */}
        <g transform="translate(70 92)">
          <rect width="84" height="104" rx="4" style={fill("--scene-frame")} />
          <rect x="8" y="8" width="68" height="88" rx="2" fill="#F4ECDF" />
          <circle cx="42" cy="38" r="12" fill="#E7A467" opacity="0.85" />
          <path d="M8 96 L8 70 Q26 54 42 66 Q58 54 76 68 L76 96 Z" fill="#A3B18A" />
          <path d="M8 96 L8 80 Q30 70 50 82 Q64 76 76 84 L76 96 Z" fill="#7F9068" />
        </g>

        {/* Window */}
        <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx="8" style={fill("--scene-frame")} />
        {fade((s) => <WindowView scene={s} thunder={thunder} />, false)}
        <g style={fill("--scene-frame")}>
          <rect x={x + w / 2 - 4} y={y} width="8" height={h} />
          <rect x={x} y={y + h / 2 - 4} width={w} height="8" />
        </g>
        <rect x={x - 26} y={y + h + 8} width={w + 52} height="14" rx="4" style={fill("--scene-sill")} />

        {/* Theme light on the wall: rain shadows, sunbeams */}
        {fade((s) => <WallFx scene={s} />)}

        {/* Curtain rod + curtains */}
        <rect x={x - 70} y={y - 30} width={w + 140} height="5" rx="2.5" style={fill("--scene-frame")} />
        <circle cx={x - 72} cy={y - 27.5} r="6" style={fill("--scene-frame")} />
        <circle cx={x + w + 72} cy={y - 27.5} r="6" style={fill("--scene-frame")} />
        <g className={scene === "sunny" ? "anim-curtain" : undefined}>
        <path
          d={`M${x - 58} ${y - 26} L${x + 6} ${y - 26} Q${x - 4} ${y + 80} ${x + 10} ${y + 160} Q${x - 10} ${y + 230} ${x - 4} ${y + h + 40} L${x - 58} ${y + h + 40} Q${x - 50} ${y + 120} ${x - 58} ${y - 26} Z`}
          style={fill("--scene-curtain")}
        />
        <path d={`M${x - 36} ${y - 20} Q${x - 30} ${y + 120} ${x - 34} ${y + h + 36}`} stroke="#000" strokeOpacity="0.07" strokeWidth="3" fill="none" />
        </g>
        <g className={scene === "sunny" ? "anim-curtain" : undefined} style={{ animationDelay: "-2.6s", animationDuration: "8.2s" }}>
        <path
          d={`M${x + w + 58} ${y - 26} L${x + w - 6} ${y - 26} Q${x + w + 4} ${y + 80} ${x + w - 10} ${y + 160} Q${x + w + 10} ${y + 230} ${x + w + 4} ${y + h + 40} L${x + w + 58} ${y + h + 40} Q${x + w + 50} ${y + 120} ${x + w + 58} ${y - 26} Z`}
          style={fill("--scene-curtain")}
        />
        <path d={`M${x + w + 36} ${y - 20} Q${x + w + 30} ${y + 120} ${x + w + 34} ${y + h + 36}`} stroke="#000" strokeOpacity="0.07" strokeWidth="3" fill="none" />
        </g>

        {/* Fairy lights along the rod */}
        <path
          d={`M${x - 64} ${y - 22} Q${x + 40} ${y + 6} ${x + w / 2} ${y - 18} Q${x + w - 40} ${y + 6} ${x + w + 64} ${y - 22}`}
          stroke="#6B5A4C"
          strokeOpacity="0.5"
          strokeWidth="1.2"
          fill="none"
        />
        {Array.from({ length: 13 }, (_, i) => {
          const t = i / 12;
          // Approximate the two quadratic arcs
          const half = t < 0.5 ? t * 2 : (t - 0.5) * 2;
          const x0 = t < 0.5 ? x - 64 : x + w / 2;
          const x2 = t < 0.5 ? x + w / 2 : x + w + 64;
          const cx = t < 0.5 ? x + 40 : x + w - 40;
          const y0 = t < 0.5 ? y - 22 : y - 18;
          const y2 = t < 0.5 ? y - 18 : y - 22;
          const px = (1 - half) ** 2 * x0 + 2 * (1 - half) * half * cx + half ** 2 * x2;
          const py = (1 - half) ** 2 * y0 + 2 * (1 - half) * half * (y + 6) + half ** 2 * y2;
          const colors = ["#F6C67A", "#F2A7A0", "#C8D5B0", "#F6C67A"];
          return (
            <g key={i} className="anim-twinkle" style={{ animationDuration: `${3 + (i % 4)}s`, animationDelay: `${-i * 0.7}s` }}>
              <circle cx={Math.round(px * 10) / 10} cy={Math.round((py + 4) * 10) / 10} r="7" fill={colors[i % 4]} opacity={evening ? 0.35 : 0.15} />
              <circle cx={Math.round(px * 10) / 10} cy={Math.round((py + 4) * 10) / 10} r="2.6" fill={colors[i % 4]} />
            </g>
          );
        })}

        {/* Shelf with books & plant */}
        <g transform="translate(600 120)">
          <rect x="0" y="92" width="168" height="8" rx="2" style={fill("--scene-frame")} />
          <rect x="16" y="100" width="6" height="16" style={fill("--scene-frame")} />
          <rect x="146" y="100" width="6" height="16" style={fill("--scene-frame")} />
          {[
            [12, 60, 14, "#A3B18A"],
            [27, 68, 12, "#C98F6B"],
            [40, 54, 16, "#E8DCCB"],
            [57, 64, 11, "#7F9068"],
            [69, 58, 13, "#B9A07F"],
          ].map(([bx, bh, bw, c], i) => (
            <rect key={i} x={bx as number} y={92 - (bh as number)} width={bw as number} height={bh as number} rx="1.5" fill={c as string} />
          ))}
          <rect x="84" y="40" width="12" height="52" rx="1.5" fill="#D8A48A" transform="rotate(14 90 92)" />
          {/* little plant */}
          <path d="M118 92 L122 70 L146 70 L150 92 Z" fill="#C9845F" />
          <g className="anim-leaf">
            <path d="M134 70 C126 52 112 46 104 50 C114 56 122 62 134 70 Z" fill="#7F9068" />
            <path d="M134 70 C136 48 148 36 158 36 C152 48 144 58 134 70 Z" fill="#A3B18A" />
            <path d="M134 70 C132 56 134 40 140 30 C142 44 140 58 134 70 Z" fill="#8FA078" />
          </g>
        </g>
        {/* Wall clock */}
        <g transform="translate(684 66)">
          <circle r="22" style={fill("--scene-frame")} />
          <circle r="17" fill="#F7F1E7" />
          <ClockHands />
        </g>

        {/* Lamp glow (behind desk items) */}
        {lampOn && (
          <g className="anim-lamp">
            <circle cx="652" cy="300" r={evening ? 190 : 140} fill="url(#lamp-glow)" />
            <path d="M622 286 L682 286 L742 392 L562 392 Z" fill="url(#lamp-cone)" />
          </g>
        )}
        {lampOn && (
          <>
            {/* warm light pooling on the desk and wall */}
            <ellipse cx="640" cy="372" rx="300" ry="170" fill="url(#lamp-pool)" style={{ opacity: "var(--scene-lamp-pool)" }} />
            {/* dust floating in the lamp beam */}
            {MOTES.map(([a, b, c], i) => (
              <circle
                key={i}
                cx={Math.round(590 + a * 120)}
                cy={Math.round(300 + b * 80)}
                r={(0.8 + c * 1.1).toFixed(2)}
                fill="#FFE6B0"
                className="anim-mote"
                style={{ animationDuration: `${6 + c * 6}s`, animationDelay: `${-a * 8}s` }}
              />
            ))}
          </>
        )}

        {/* Desk */}
        <rect y="384" width="800" height="22" style={{ fill: "url(#desk-top)" }} />
        <rect y="404" width="800" height="96" style={fill("--scene-desk-front")} />
        <rect y="404" width="800" height="3" fill="#000" opacity="0.08" />
        <rect x="40" y="430" width="250" height="44" rx="6" fill="#000" opacity="0.05" />
        <circle cx="165" cy="452" r="4" style={fill("--scene-desk")} />
        <rect x="510" y="430" width="250" height="44" rx="6" fill="#000" opacity="0.05" />
        <circle cx="635" cy="452" r="4" style={fill("--scene-desk")} />

        {/* Theme light on the desk top (sun patches) */}
        {fade((s) => <DeskFx scene={s} />)}

        {/* Foreground desk items: move a touch with the pointer (parallax) */}
        <g className="parallax-near">
        {/* Book stack */}
        <g transform="translate(78 336)">
          <rect x="4" y="34" width="112" height="16" rx="3" fill="#7F9068" />
          <rect x="4" y="34" width="8" height="16" fill="#000" opacity="0.08" />
          <rect x="12" y="18" width="98" height="16" rx="3" fill="#C98F6B" />
          <rect x="0" y="4" width="104" height="14" rx="3" fill="#E8DCCB" />
          <rect x="14" y="9" width="40" height="3" rx="1.5" fill="#8B735F" opacity="0.5" />
        </g>

        {/* Notebook & pencil (the student brings their own) */}
        {notebook && (
          <g transform="translate(204 372)">
            <path d="M0 14 L92 6 L104 16 L12 24 Z" fill="#F7F1E7" />
            <path d="M0 14 L12 24 L12 26 L0 16 Z" fill="#D8CCB9" />
            <path d="M20 14 L80 9 M24 18 L84 13" stroke="#8B735F" strokeOpacity="0.35" strokeWidth="1.2" />
            <rect x="70" y="-2" width="54" height="5" rx="2.5" fill="#E8B04B" transform="rotate(-8 70 0)" />
          </g>
        )}

        {/* Mug with steam */}
        <g transform="translate(548 340)">
          <g className="anim-steam" style={{ animationDelay: "0s" }}>
            <path d="M14 -2 C8 -12 20 -18 14 -30" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          <g className="anim-steam" style={{ animationDelay: "-1.8s" }}>
            <path d="M26 -2 C20 -12 32 -18 26 -30" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          <path d="M2 4 L38 4 L35 46 Q34 50 30 50 L10 50 Q6 50 5 46 Z" fill="#A3B18A" />
          <path d="M38 14 Q52 14 50 26 Q48 36 36 36" stroke="#A3B18A" strokeWidth="5" fill="none" />
          <ellipse cx="20" cy="5" rx="18" ry="3.5" fill="#6B4F3D" />
          <rect x="9" y="22" width="14" height="10" rx="5" fill="#fff" opacity="0.25" />
        </g>

        {/* Desk lamp */}
        <g>
          <ellipse cx="690" cy="390" rx="34" ry="7" fill="#3D322B" opacity="0.18" />
          <rect x="664" y="378" width="52" height="10" rx="5" style={fill("--scene-lamp")} />
          <path d="M690 380 L700 330 L656 290" stroke="var(--scene-lamp)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="700" cy="330" r="6" style={fill("--scene-lamp")} />
          <path d="M630 288 L674 262 L690 290 Q672 304 642 302 Z" style={fill("--scene-lamp")} />
          <ellipse cx="660" cy="296" rx="22" ry="5" transform="rotate(-30 660 296)" fill={lampOn ? "#FFE3A3" : "#D9CDBB"} />
        </g>

        {/* Plant pot on desk */}
        <g transform="translate(742 330)">
          <path d="M-18 24 L18 24 L14 56 L-14 56 Z" fill="#C9845F" />
          <rect x="-20" y="20" width="40" height="8" rx="3" fill="#B87452" />
          <g className="anim-leaf" style={{ animationDelay: "-2s" }}>
            <path d="M0 22 C-6 4 -22 -4 -30 0 C-20 6 -10 14 0 22 Z" fill="#7F9068" />
            <path d="M0 22 C4 0 16 -12 26 -12 C20 0 12 12 0 22 Z" fill="#A3B18A" />
            <path d="M0 22 C-2 4 2 -14 8 -22 C10 -6 6 10 0 22 Z" fill="#8FA078" />
          </g>
        </g>

        </g>

        {/* Theme light over the room (fireplace glow) */}
        {fade((s) => <RoomFx scene={s} />)}

        {/* Evening vignette */}
        <rect width="800" height="500" fill="url(#vignette)" style={{ opacity: "var(--scene-vignette)" }} />
      </svg>
      {layers.includes("rainy") ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0",
            layers.length > 1 && (scene === "rainy" ? "anim-scene-in" : "anim-scene-out"),
          )}
        >
          <RainGlass heavy={thunder} animate={animate} />
        </div>
      ) : null}
      {children}
      </div>
    </div>
  );
}
