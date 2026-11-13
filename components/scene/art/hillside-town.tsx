import { CurledCat, DARK, Filters, GREY, Grain, Head } from "./parts";

const p = "ht";
const WALLS = ["#F6E3D2", "#EFCDB8", "#F2D9C0", "#E9BFA8", "#F8EBDD", "#E4C9B0"];
const ROOFS = ["#C9745A", "#B8644E", "#D98C6A", "#A85A48"];

/** Tiers of houses climbing the hill outside (all seeded/fixed for SSR). */
const TOWN: [number, number, number, number, number][] = [];
for (let row = 0; row < 6; row++) {
  const y = 300 - row * 34 - (row > 3 ? 8 : 0);
  for (let i = 0; i < 9; i++) {
    const x = 400 + i * 46 + (row % 2) * 22 - row * 6;
    const h = 26 + ((i * 7 + row * 3) % 4) * 6;
    const w = 34 + ((i + row) % 3) * 6;
    if (row > 3 && i < 3) continue;
    TOWN.push([x, y, w, h, (i + row * 2) % 6]);
  }
}

/** 5 · Hillside Town — a bright afternoon above a pastel town; she writes, headphones on, cat on the sill. */
export function HillsideTown() {
  return (
    <svg viewBox="0 0 800 500" className="size-full" aria-hidden="true">
      <defs>
        <Filters p={p} />
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9DCE0" />
          <stop offset="1" stopColor="#F2E7D4" />
        </linearGradient>
        <linearGradient id={`${p}-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#B9785A" />
          <stop offset="1" stopColor="#E3B48E" />
        </linearGradient>
        <clipPath id={`${p}-glass`}>
          <rect x="402" y="0" width="360" height="318" />
        </clipPath>
      </defs>

      <rect width="800" height="500" fill={`url(#${p}-wall)`} />

      {/* the view */}
      <rect x="388" y="-10" width="390" height="340" fill="#9E6A48" />
      <g clipPath={`url(#${p}-glass)`}>
        <rect x="402" y="0" width="360" height="318" fill={`url(#${p}-sky)`} />
        <g className="cx-drift" style={{ animationDuration: "80s" }}>
          <g transform="translate(420 50)" fill="#FFFDF6" opacity="0.9">
            <ellipse cx="0" cy="0" rx="34" ry="11" />
            <ellipse cx="-14" cy="-6" rx="16" ry="11" />
            <ellipse cx="12" cy="-9" rx="18" ry="13" />
          </g>
        </g>
        <path d="M402 140 Q520 90 640 104 T790 70 V318 H402 Z" fill="#C9C29A" />
        {TOWN.map(([x, y, w, h, c], i) => (
          <g key={i}>
            <rect x={x} y={y - h} width={w} height={h + 40} fill={WALLS[c]} />
            <rect x={x + w * 0.6} y={y - h} width={w * 0.4} height={h + 40} fill="#000" opacity="0.06" />
            <path d={`M${x - 3} ${y - h} L${x + w / 2} ${y - h - 12} L${x + w + 3} ${y - h} Z`} fill={ROOFS[c % 4]} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={x + 5 + k * ((w - 14) / 2)} y={y - h + 8} width="5" height="7" fill="#7A6A6A" opacity="0.45" />
            ))}
            {[0, 1, 2].map((k) => (
              <rect key={k} x={x + 5 + k * ((w - 14) / 2)} y={y - h + 22} width="5" height="7" fill="#7A6A6A" opacity="0.4" />
            ))}
          </g>
        ))}
        {/* church tower on top */}
        <g transform="translate(700 92)">
          <rect x="-9" y="-30" width="18" height="40" fill="#F8EBDD" />
          <path d="M-12 -30 L0 -52 L12 -30 Z" fill="#A85A48" />
          <rect x="-3" y="-22" width="6" height="9" rx="3" fill="#7A6A6A" opacity="0.6" />
        </g>
        {/* birds */}
        <g className="cx-drift" style={{ animationDuration: "26s", animationDelay: "-8s" }}>
          <g transform="translate(400 70)" stroke="#5B5148" strokeWidth="1.8" fill="none" strokeLinecap="round">
            <path d="M-6 0 Q-3 -4 0 0 Q3 -4 6 0" />
            <path d="M10 -8 Q13 -12 16 -8 Q19 -12 22 -8" />
          </g>
        </g>
      </g>
      <rect x="574" y="0" width="10" height="318" fill="#9E6A48" />
      <rect x="380" y="318" width="420" height="18" rx="3" fill="#B07A52" />

      {/* left wall: shelf with books + hanging plant */}
      <g filter={`url(#${p}-b2)`}>
        <rect x="0" y="130" width="230" height="10" fill="#6E3E2A" />
        {[[10, "#3F6A6A", 70], [28, "#C9503C", 80], [44, "#E6C9A0", 64], [62, "#5E7A4E", 76], [80, "#8C5A7A", 70], [100, "#D9A46A", 60]].map(
          ([x, c, h], i) => (
            <rect key={i} x={x as number} y={130 - (h as number)} width="15" height={h as number} fill={c as string} />
          ),
        )}
        <path d="M150 130 L156 104 L184 104 L190 130 Z" fill="#C9845F" />
      </g>
      <g className="cx-sway" style={{ transformOrigin: "170px 104px" }}>
        <path d="M170 104 C150 120 140 170 146 220" stroke="#5E7A4E" strokeWidth="4" fill="none" />
        <path d="M176 104 C190 130 194 170 186 200" stroke="#5E7A4E" strokeWidth="4" fill="none" />
        {[[148, 150], [144, 184], [147, 214], [190, 140], [191, 172], [186, 196]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="8" ry="5" fill="#7FA36A" transform={`rotate(${i % 2 ? 30 : -30} ${x} ${y})`} />
        ))}
      </g>

      {/* chair */}
      <path d="M86 220 C80 300 84 380 96 460 L150 460 C140 380 140 300 146 226 Z" fill="#3E7A78" />
      <path d="M92 232 C88 300 90 380 100 450" stroke="#5E9A96" strokeWidth="6" fill="none" opacity="0.6" />

      {/* her, writing */}
      <g transform="translate(250 178) scale(1.32)">
        <g className="cx-breathe-soft" style={{ transformOrigin: "0px 200px" }}>
          <path d="M-12 44 C-44 46 -70 86 -72 150 L-76 250 L64 250 L58 160 C54 110 40 60 14 46 Z" fill="#7FA3B5" />
          <path d="M-72 150 L-76 250 L-30 250 C-40 200 -46 140 -36 90 C-54 104 -68 124 -72 150 Z" fill="#628A9C" />
          <path d="M-14 42 C-4 52 8 52 16 44 L14 56 C4 62 -8 60 -14 52 Z" fill="#F6EDE0" />
          <path d="M14 46 C40 60 54 110 58 160" stroke="#FFF2D8" strokeWidth="3" fill="none" opacity="0.7" />
        </g>
        <g className="cx-nod" style={{ transformOrigin: "-2px 46px", animationDuration: "2.2s" }}>
          <Head eyes="down" hair={DARK} style="bob" clip="#8FD0B4" rim="#FFF2D8" phones={{ band: "#F3E7D3", cup: "#E2A84A", pad: "#F3E7D3" }} />
        </g>
        <path d="M-4 62 L40 130" stroke="#6E94A6" strokeWidth="28" strokeLinecap="round" />
        <g className="cx-write" style={{ animationDuration: "3.2s" }}>
          <path d="M40 130 L100 132" stroke="#7FA3B5" strokeWidth="22" strokeLinecap="round" />
          <ellipse cx="112" cy="130" rx="10" ry="7" fill="#F6D2B8" />
          <path d="M114 130 L134 112" stroke="#2E3A5A" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>

      {/* desk */}
      <path d="M0 360 L800 356 L800 500 L0 500 Z" fill="#8E5232" />
      <path d="M0 360 L800 356 L800 378 L0 382 Z" fill="#B87448" />
      {/* notebook */}
      <path d="M360 372 L470 364 L486 378 L374 388 Z" fill="#FBF3E2" />
      <path d="M380 372 L460 366 M384 378 L462 372" stroke="#8B735F" strokeOpacity="0.4" strokeWidth="1.2" />

      {/* cat on the sill */}
      <g transform="translate(660 320) scale(0.95)">
        <CurledCat coat={GREY} />
      </g>
      {/* plant + pencil cup + books on the desk */}
      <g transform="translate(540 362)">
        <path d="M-18 0 L-15 -32 L15 -32 L18 0 Z" fill="#C9845F" />
        <g className="cx-sway" style={{ transformOrigin: "0px -32px" }}>
          <ellipse cx="-12" cy="-44" rx="12" ry="7" fill="#7F9A5A" transform="rotate(-30 -12 -44)" />
          <ellipse cx="12" cy="-48" rx="12" ry="7" fill="#94B06A" transform="rotate(30 12 -48)" />
          <ellipse cx="0" cy="-58" rx="8" ry="12" fill="#A9C47A" />
        </g>
      </g>
      <g transform="translate(720 360)">
        <rect x="-50" y="-14" width="100" height="14" rx="3" fill="#3F6A6A" />
        <rect x="-44" y="-28" width="90" height="14" rx="3" fill="#E6C9A0" />
        <rect x="-48" y="-40" width="94" height="12" rx="3" fill="#C9503C" />
      </g>

      {/* blurred foreground */}
      <g filter={`url(#${p}-b6)`}>
        <path d="M600 500 C620 440 680 420 740 440 C700 460 680 480 676 500 Z" fill="#4E6A3E" />
        <rect x="-20" y="450" width="220" height="60" rx="8" fill="#5A2E22" />
      </g>
      <Grain p={p} opacity={0.06} />
    </svg>
  );
}
