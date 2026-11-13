import type { SceneId } from "@/types";
import { mulberry32 } from "@/lib/audio/context";

/** Deterministic pseudo-random layouts (identical on server and client). */
export function scatter(n: number, seed: number) {
  const r = mulberry32(seed);
  const q = () => Math.round(r() * 1000) / 1000;
  return Array.from({ length: n }, () => [q(), q(), q()] as const);
}

const RAIN = scatter(46, 7);
const SNOW = scatter(40, 11);
const STARS = scatter(26, 5);
const LIGHTS = scatter(30, 3);
const FAR_PINES = scatter(14, 29);

/** Point on a quadratic curve, rounded so server and client agree. */
function quad(p0: [number, number], p1: [number, number], p2: [number, number], t: number) {
  const u = 1 - t;
  return [
    Math.round(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]),
    Math.round(u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]),
  ] as const;
}

// Window glass area in scene coordinates
export const WIN = { x: 208, y: 58, w: 304, h: 234 };

const SKIES: Record<SceneId, [string, string]> = {
  rainy: ["#1F2B45", "#4A5A7A"],
  sunny: ["#BFD8E0", "#F7DDB0"],
  night: ["#1E2741", "#3E4A69"],
  snowy: ["#C5D0D9", "#ECF0F2"],
};

export function WindowView({ scene, thunder }: { scene: SceneId; thunder: boolean }) {
  const { x, y, w, h } = WIN;
  const [top, bottom] = SKIES[scene];
  const ground = y + h;

  return (
    <g clipPath="url(#window-clip)">
      {/* far layer: drifts slightly with the pointer (parallax) */}
      <g className="parallax-far">
      <rect x={x - 12} y={y - 12} width={w + 24} height={h + 24} fill={`url(#sky-${scene})`} />
      <defs>
        <linearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <radialGradient id="sun-glow">
          <stop offset="0" stopColor="#FCE3A6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FCE3A6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {scene === "sunny" && (
        <>
          <circle cx={x + w * 0.8} cy={y + 50} r="84" fill="url(#sun-glow)" />
          <circle cx={x + w * 0.8} cy={y + 50} r="24" fill="#F8CD7A" />
          <g className="anim-drift" style={{ animationDuration: "70s" }}>
            <Cloud cx={x + 20} cy={y + 54} s={1} />
          </g>
          <g className="anim-drift" style={{ animationDuration: "95s", animationDelay: "-40s" }}>
            <Cloud cx={x - 40} cy={y + 96} s={0.7} />
          </g>
          {/* A few birds cross now and then */}
          <g transform={`translate(${x - 40} ${y + 96})`}>
            <g className="anim-birds" style={{ animationDelay: "-6s" }}>
              <Bird dx={0} dy={0} />
              <Bird dx={14} dy={-7} s={0.8} />
              <Bird dx={-12} dy={-10} s={0.7} />
            </g>
          </g>
          <g transform={`translate(${x - 40} ${y + 62})`}>
            <g className="anim-birds" style={{ animationDuration: "57s", animationDelay: "-31s" }}>
              <Bird dx={0} dy={0} s={0.7} />
              <Bird dx={11} dy={5} s={0.6} />
            </g>
          </g>
        </>
      )}

      {scene === "night" && (
        <>
          {STARS.map(([a, b, c], i) => (
            <circle
              key={i}
              cx={x + a * w}
              cy={y + b * h * 0.55}
              r={0.8 + c * 1.2}
              fill="#F6EBD0"
              className="anim-twinkle"
              style={{ animationDuration: `${2 + c * 4}s`, animationDelay: `${-a * 5}s` }}
            />
          ))}
          <circle cx={x + w * 0.25} cy={y + 56} r="20" fill="#F3E7C9" />
          <circle cx={x + w * 0.25 + 9} cy={y + 50} r="17" fill={top} opacity="0.95" />
        </>
      )}

      {/* Distant skyline / hills */}
      {scene === "sunny" ? (
        <HillsideTown />
      ) : scene === "snowy" ? (
        <SnowyWoods />
      ) : (
        <Skyline x={x} w={w} ground={ground} scene={scene} />
      )}

      {/* Weather */}
      {scene === "rainy" &&
        RAIN.map(([a, b, c], i) => (
          <line
            key={i}
            x1={x + a * (w + 40)}
            y1={y - 20 + b * 40}
            x2={x + a * (w + 40) - 4}
            y2={y - 20 + b * 40 + 14 + c * 8}
            stroke="#EEF2F4"
            strokeOpacity={0.35 + c * 0.35}
            strokeWidth="1.2"
            strokeLinecap="round"
            className="anim-rain"
            style={{ animationDuration: `${0.7 + c * 0.5}s`, animationDelay: `${-b * 2}s` }}
          />
        ))}
      {scene === "snowy" &&
        SNOW.map(([a, b, c], i) => (
          <circle
            key={i}
            cx={x + a * w}
            cy={y - 10 + b * 20}
            r={1.2 + c * 1.8}
            fill="#FFFFFF"
            opacity={0.7 + c * 0.3}
            className="anim-snow"
            style={{ animationDuration: `${6 + c * 6}s`, animationDelay: `${-b * 12}s` }}
          />
        ))}

      {scene === "rainy" && (
        <>
          {/* low mist over the city */}
          <rect x={x - 12} y={ground - 90} width={w + 24} height={102} fill="url(#mist)" />
          <defs>
            <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9FB0CC" stopOpacity="0" />
              <stop offset="1" stopColor="#9FB0CC" stopOpacity="0.35" />
            </linearGradient>
          </defs>
        </>
      )}
      </g>

      {scene === "snowy" && <Frost />}

      {thunder && <rect x={x} y={y} width={w} height={h} fill="#F4F1FF" className="anim-lightning" />}

      {/* Glass sheen */}
      <path d={`M${x} ${y} L${x + 90} ${y} L${x} ${y + 120} Z`} fill="#fff" opacity="0.06" />
    </g>
  );
}

function Cloud({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} fill="#FFFDF8" opacity="0.92">
      <ellipse cx="0" cy="0" rx="30" ry="12" />
      <ellipse cx="-16" cy="-6" rx="16" ry="12" />
      <ellipse cx="10" cy="-10" rx="18" ry="14" />
    </g>
  );
}

function Pine({
  cx,
  base,
  s,
  fill = "#7E9184",
  snow = 0.8,
}: {
  cx: number;
  base: number;
  s: number;
  fill?: string;
  snow?: number;
}) {
  return (
    <g transform={`translate(${cx} ${base}) scale(${s})`}>
      <rect x="-2" y="2" width="4" height="8" fill="#6B5A4C" opacity="0.6" />
      <path d="M0 -46 L14 -14 L6 -14 L18 6 L-18 6 L-6 -14 L-14 -14 Z" fill={fill} />
      <path d="M0 -46 L7 -30 L-7 -30 Z M-6 -14 L6 -14 L9 -8 L-9 -8 Z M-18 6 L18 6 L15 2 L-15 2 Z" fill="#FFFFFF" opacity={snow} />
    </g>
  );
}

function Bird({ dx, dy, s = 1 }: { dx: number; dy: number; s?: number }) {
  return (
    <g transform={`translate(${dx} ${dy}) scale(${s})`}>
      <path
        d="M-6 0 Q-3 -4 0 0 Q3 -4 6 0"
        stroke="#5B5148"
        strokeOpacity="0.75"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="anim-flap"
        style={{ animationDuration: `${(0.42 + Math.abs(dx) * 0.004).toFixed(3)}s` }}
      />
    </g>
  );
}

// ---------- Sunny Hillside Town ----------

const TOWN_RIDGE: [[number, number], [number, number], [number, number]] = [
  [208, 240],
  [350, 168],
  [512, 232],
];
const WALLS = ["#F4EAD8", "#EAD9BF", "#F2E1C8", "#E6D5BE"];
const ROOFS = ["#C9845F", "#B86F4E", "#D69A6E", "#A9634A"];
// [position along the ridge, depth below it, width, height, colour index]
const HOUSES = (
  [
    [0.15, 6, 18, 13, 1],
    [0.25, 4, 15, 12, 2],
    [0.37, 5, 20, 14, 3],
    [0.6, 4, 17, 13, 0],
    [0.71, 7, 19, 12, 2],
    [0.83, 5, 16, 13, 1],
    [0.08, 20, 20, 15, 0],
    [0.31, 18, 22, 16, 1],
    [0.46, 20, 18, 14, 2],
    [0.65, 18, 21, 15, 3],
    [0.77, 21, 17, 13, 0],
    [0.9, 18, 20, 15, 2],
  ] as const
).map(([t, depth, hw, hh, c]) => {
  const [hx, hy] = quad(...TOWN_RIDGE, t);
  return [hx, hy + depth, hw, hh, c] as const;
});
// Left of the window bar so the tower stays in view
const [CHURCH_X, CHURCH_Y] = quad(...TOWN_RIDGE, 0.42);

function House({ cx, base, w, h, c }: { cx: number; base: number; w: number; h: number; c: number }) {
  const left = Math.round(cx - w / 2);
  const roof = Math.round(w * 0.42);
  return (
    <g>
      <rect x={left} y={base - h} width={w} height={h} fill={WALLS[c]} />
      <rect x={cx} y={base - h} width={Math.round(w / 2)} height={h} fill="#000" opacity="0.06" />
      <path d={`M${left - 2} ${base - h} L${cx} ${base - h - roof} L${left + w + 2} ${base - h} Z`} fill={ROOFS[c]} />
      {c % 2 ? <rect x={left + Math.round(w * 0.66)} y={base - h - roof + 1} width="3" height={roof - 2} fill={ROOFS[(c + 1) % 4]} /> : null}
      <rect x={left + 3} y={base - h + 4} width="3" height="3.5" fill="#7A6A5A" opacity="0.55" />
      <rect x={left + w - 6} y={base - h + 4} width="3" height="3.5" fill="#7A6A5A" opacity="0.55" />
    </g>
  );
}

function HillsideTown() {
  const { x, y, w, h } = WIN;
  const ground = y + h;
  return (
    <g>
      {/* far hills, hazy */}
      <path
        d={`M${x - 12} ${ground - 74} Q${x + 90} ${ground - 108} ${x + 172} ${ground - 86} T${x + w + 12} ${ground - 92} V${ground} H${x - 12} Z`}
        fill="#C8D3B6"
      />
      {/* the town's hill */}
      <path
        d={`M${x - 12} ${TOWN_RIDGE[0][1] + 4} Q${TOWN_RIDGE[1][0]} ${TOWN_RIDGE[1][1]} ${x + w + 12} ${TOWN_RIDGE[2][1] + 4} V${ground} H${x - 12} Z`}
        fill="#AEBD92"
      />
      {/* church with a little bell tower at the top of the hill */}
      <g>
        <rect x={CHURCH_X - 6} y={CHURCH_Y - 30} width="12" height="36" fill="#F4EAD8" />
        <rect x={CHURCH_X} y={CHURCH_Y - 30} width="6" height="36" fill="#000" opacity="0.06" />
        <path d={`M${CHURCH_X - 8} ${CHURCH_Y - 30} L${CHURCH_X} ${CHURCH_Y - 48} L${CHURCH_X + 8} ${CHURCH_Y - 30} Z`} fill="#A9634A" />
        <rect x={CHURCH_X - 2} y={CHURCH_Y - 24} width="4" height="6" rx="2" fill="#7A6A5A" opacity="0.6" />
      </g>
      {HOUSES.map(([hx, hy, hw, hh, c], i) => (
        <House key={i} cx={hx} base={hy} w={hw} h={hh} c={c} />
      ))}
      {/* near meadow with round trees */}
      <path
        d={`M${x - 12} ${ground - 30} Q${x + 82} ${ground - 58} ${x + 172} ${ground - 38} T${x + w + 12} ${ground - 42} V${ground} H${x - 12} Z`}
        fill="#95A77B"
      />
      {(
        [
          [x + 22, ground - 40, 1],
          [x + 46, ground - 47, 0.8],
          [x + w - 42, ground - 41, 0.9],
          [x + w - 16, ground - 37, 1.1],
        ] as const
      ).map(([tx, ty, s], i) => (
        <g key={i} transform={`translate(${tx} ${ty}) scale(${s})`}>
          <rect x="-1.5" y="-2" width="3" height="10" fill="#6B5A4C" />
          <circle cx="0" cy="-10" r="10" fill="#7F9068" />
          <circle cx="-4" cy="-13" r="5" fill="#8FA078" />
        </g>
      ))}
    </g>
  );
}

// ---------- Snowy Cabin ----------

function SnowyWoods() {
  const { x, y, w, h } = WIN;
  const ground = y + h;
  const cabinX = Math.round(x + w * 0.4);
  const cabinY = ground - 44;
  return (
    <g>
      <path
        d={`M${x - 12} ${ground - 66} Q${x + 90} ${ground - 104} ${x + 170} ${ground - 72} T${x + w + 12} ${ground - 78} V${ground} H${x - 12} Z`}
        fill="#DCE3E8"
      />
      {/* far treeline */}
      {FAR_PINES.map(([a, b, c], i) => (
        <Pine
          key={i}
          cx={Math.round(x + a * w)}
          base={Math.round(ground - 64 + b * 10)}
          s={Math.round((0.38 + c * 0.24) * 100) / 100}
          fill="#B4C2C9"
          snow={0.55}
        />
      ))}
      <path
        d={`M${x - 12} ${ground - 46} Q${x + 100} ${ground - 66} ${x + 200} ${ground - 50} T${x + w + 12} ${ground - 52} V${ground} H${x - 12} Z`}
        fill="#EBF0F2"
      />
      {/* a neighbour's cabin across the clearing, lit and smoking */}
      <g>
        <g className="anim-steam" style={{ animationDuration: "6s" }}>
          <path
            d={`M${cabinX + 9} ${cabinY - 26} C${cabinX + 4} ${cabinY - 36} ${cabinX + 14} ${cabinY - 42} ${cabinX + 8} ${cabinY - 54}`}
            stroke="#AAB6BE"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        <rect x={cabinX + 6} y={cabinY - 26} width="5" height="10" fill="#6E5446" />
        <rect x={cabinX - 16} y={cabinY - 12} width="32" height="18" fill="#7A5E4E" />
        <path d={`M${cabinX - 20} ${cabinY - 11} L${cabinX} ${cabinY - 26} L${cabinX + 20} ${cabinY - 11} Z`} fill="#F7F9FA" />
        <rect x={cabinX - 11} y={cabinY - 8} width="10" height="10" rx="2" fill="#F6CF7E" opacity="0.3" />
        <rect x={cabinX - 9} y={cabinY - 6} width="6" height="6" fill="#F6CF7E" />
        <rect x={cabinX + 4} y={cabinY - 4} width="6" height="10" fill="#5A4338" />
      </g>
      {/* near pines framing the view */}
      {(
        [
          [0.06, 1.25, 0],
          [0.17, 1.0, 10],
          [0.29, 0.7, 6],
          [0.7, 0.75, 8],
          [0.83, 1.15, 4],
          [0.95, 1.45, 0],
        ] as const
      ).map(([p, s, lift], i) => (
        <Pine key={i} cx={Math.round(x + w * p)} base={ground - 18 - lift} s={s} fill={i % 2 ? "#6F8577" : "#7E9184"} />
      ))}
      <path
        d={`M${x - 12} ${ground - 22} Q${x + 120} ${ground - 40} ${x + 220} ${ground - 24} T${x + w + 12} ${ground - 28} V${ground} H${x - 12} Z`}
        fill="#F5F7F8"
      />
    </g>
  );
}

const DRIFT_BUMPS = scatter(8, 41);

/** Snow drift along the bottom of a pane. */
function drift(x0: number, x1: number, base: number, seed: number) {
  const n = 4;
  const step = (x1 - x0) / n;
  let d = `M${x0} ${base} L${x0} ${base - 7}`;
  for (let i = 0; i < n; i++) {
    const [a, b] = DRIFT_BUMPS[(i + seed) % DRIFT_BUMPS.length];
    const peak = Math.round(base - 11 - a * 8);
    const end = Math.round(base - 6 - b * 6);
    d += ` Q${Math.round(x0 + step * (i + 0.5))} ${peak} ${Math.round(x0 + step * (i + 1))} ${end}`;
  }
  return `${d} L${x1} ${base} Z`;
}

/** Frosted pane edges, and snow piling up (slowly) on the outside ledges. */
function Frost() {
  const { x, y, w, h } = WIN;
  const mx = x + w / 2;
  const my = y + h / 2;
  const panes = [
    [x, y, mx - 4, my - 4],
    [mx + 4, y, x + w, my - 4],
    [x, my + 4, mx - 4, y + h],
    [mx + 4, my + 4, x + w, y + h],
  ];
  return (
    <g>
      <defs>
        <radialGradient id="frost" cx="0.5" cy="0.45" r="0.72">
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.8" stopColor="#F4F8FB" stopOpacity="0.38" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      {panes.map(([x0, y0, x1, y1], i) => (
        <g key={i}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#frost)" />
          <path d={drift(x0, x1, y1, i * 2)} fill="#FBFCFD" className="anim-pile" />
        </g>
      ))}
    </g>
  );
}

function Skyline({ x, w, ground, scene }: { x: number; w: number; ground: number; scene: SceneId }) {
  // Rainy Night City shares the night skyline (lit windows), tinted bluer.
  const night = scene === "night" || scene === "rainy";
  const far = scene === "rainy" ? "#34425E" : night ? "#2E3753" : "#7E8B96";
  const near = scene === "rainy" ? "#28324A" : night ? "#252C43" : "#6C7883";
  const blocks: [number, number, number][] = [
    [0, 26, 70], [26, 34, 96], [60, 22, 62], [82, 40, 118], [122, 28, 80],
    [150, 36, 104], [186, 24, 70], [210, 42, 128], [252, 30, 88], [282, 30, 66],
  ];
  return (
    <g>
      <path d={`M${x} ${ground - 50} Q${x + 100} ${ground - 80} ${x + 200} ${ground - 56} T${x + w} ${ground - 60} V${ground} H${x} Z`} fill={far} opacity="0.7" />
      {blocks.map(([bx, bw, bh], i) => (
        <rect key={i} x={x + bx} y={ground - bh * 0.85} width={bw} height={bh} fill={near} />
      ))}
      {LIGHTS.map(([a, b, c], i) => {
        const bi = Math.floor(a * blocks.length);
        const [bx, bw, bh] = blocks[bi];
        const lx = x + bx + 5 + Math.floor(c * Math.max(1, bw - 14) / 7) * 7;
        const ly = ground - bh * 0.85 + 8 + Math.floor(b * (bh * 0.6) / 10) * 10;
        return (
          <g key={i}>
            {night ? <rect x={lx - 2} y={ly - 2} width="8" height="9" rx="2" fill="#F6CF7E" opacity="0.18" /> : null}
            <rect x={lx} y={ly} width="4" height="5" rx="0.6" fill={night ? "#F6CF7E" : "#E9D7AE"} opacity={night ? 0.9 : 0.35} />
          </g>
        );
      })}
    </g>
  );
}
