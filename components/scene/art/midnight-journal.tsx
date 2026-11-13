import { CurledCat, Filters, GINGER, Grain, SKIN, Steam, seeded } from "./parts";

const p = "mj";
const BOKEH = seeded(14, 401);
const GRAIN_LINES = seeded(16, 402);

/** Handwriting-ish squiggle along a line (for the journal pages). */
function scribble(x0: number, y0: number, len: number, seed: number, slope = 0) {
  const pts = seeded(Math.max(4, Math.round(len / 9)), seed);
  let d = `M${x0} ${y0}`;
  pts.forEach(([a, b], i) => {
    const x = Math.round(x0 + ((i + 1) * len) / pts.length);
    const y = Math.round((y0 + slope * (x - x0) + (a - 0.5) * 5) * 10) / 10;
    d += ` Q${Math.round(x - len / pts.length / 2)} ${Math.round((y - 3 - b * 3) * 10) / 10} ${x} ${y}`;
  });
  return d;
}

/** 4 · Midnight Journal — your own desk from above: lamp, open journal, a pen that keeps writing. */
export function MidnightJournal() {
  return (
    <svg viewBox="0 0 800 500" className="size-full" aria-hidden="true">
      <defs>
        <Filters p={p} />
        <linearGradient id={`${p}-desk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E4128" />
          <stop offset="1" stopColor="#8E5A36" />
        </linearGradient>
        <radialGradient id={`${p}-lamp`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFD493" stopOpacity="0.8" />
          <stop offset="0.45" stopColor="#FFB867" stopOpacity="0.3" />
          <stop offset="1" stopColor="#FFB867" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}-vig`} cx="0.42" cy="0.5" r="0.75">
          <stop offset="0.5" stopColor="#120A06" stopOpacity="0" />
          <stop offset="1" stopColor="#120A06" stopOpacity="0.75" />
        </radialGradient>
      </defs>

      {/* wall + night window */}
      <rect width="800" height="160" fill="#3A2A22" />
      <rect x="170" y="-10" width="420" height="150" fill="#2A1C16" />
      <rect x="180" y="0" width="400" height="132" fill="#1A2140" />
      <g filter={`url(#${p}-b6)`}>
        {BOKEH.map(([a, b, c], i) => (
          <circle
            key={i}
            cx={Math.round(190 + a * 380)}
            cy={Math.round(20 + b * 100)}
            r={Math.round(6 + c * 12)}
            fill={i % 3 ? "#FFC774" : "#FF9A7A"}
            opacity="0.5"
            className="cx-twinkle"
            style={{ animationDuration: `${5 + c * 6}s`, animationDelay: `${-a * 8}s` }}
          />
        ))}
      </g>
      <rect x="376" y="0" width="8" height="132" fill="#2A1C16" />
      {/* sticky notes on the glass */}
      {[
        [210, 96, "#F6E08A", -6],
        [262, 104, "#F2B6C6", 4],
        [430, 98, "#F6C88A", -3],
        [500, 104, "#BFE0A8", 5],
      ].map(([x, y, c, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <rect x={x as number} y={y as number} width="36" height="32" fill={c as string} />
          <path d={`M${(x as number) + 6} ${(y as number) + 10} h22 M${(x as number) + 6} ${(y as number) + 17} h18 M${(x as number) + 6} ${(y as number) + 24} h14`} stroke="#6A5040" strokeOpacity="0.5" strokeWidth="1.4" />
        </g>
      ))}
      <rect x="0" y="140" width="800" height="18" fill="#4E3424" />

      {/* desk */}
      <rect y="158" width="800" height="342" fill={`url(#${p}-desk)`} />
      {GRAIN_LINES.map(([a, b], i) => (
        <path key={i} d={`M0 ${Math.round(170 + a * 330)} Q400 ${Math.round(166 + a * 330 + b * 8)} 800 ${Math.round(172 + a * 330)}`} stroke="#4A2A18" strokeOpacity="0.18" strokeWidth="1.5" fill="none" />
      ))}

      {/* lamp light */}
      <circle cx="230" cy="290" r="340" fill={`url(#${p}-lamp)`} style={{ mixBlendMode: "screen" }} className="cx-flicker" />

      {/* loose papers under the journal */}
      <path d="M210 240 L380 216 L404 400 L230 424 Z" fill="#F2E6CC" transform="rotate(-6 300 320)" />
      <path d="M470 230 L640 226 L650 420 L480 430 Z" fill="#EFE2C6" transform="rotate(7 560 330)" />

      {/* open journal */}
      <g>
        <path d="M248 252 L424 232 L434 430 L238 452 Z" fill="#FBF3E2" />
        <path d="M424 232 L604 252 L618 452 L434 430 Z" fill="#F6ECD6" />
        <path d="M424 232 L434 430" stroke="#C9B08A" strokeWidth="2" />
        <path d="M238 452 L434 430 L618 452 L618 458 L434 436 L238 458 Z" fill="#8A4A32" />
        <g stroke="#3A3A5A" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={scribble(262, 276 + i * 18, i === 8 ? 90 : 140, 410 + i, -0.1)} />
          ))}
          <path d="M290 420 Q320 400 350 420 Q370 432 390 412" stroke="#C9503C" opacity="0.6" />
        </g>
        {/* right page: being written now */}
        <g stroke="#2E2E50" strokeWidth="1.5" fill="none" strokeLinecap="round">
          {Array.from({ length: 6 }, (_, i) => (
            <path
              key={i}
              d={scribble(448, 262 + i * 20, 136, 430 + i, 0.1)}
              pathLength={1}
              strokeDasharray="1 1"
              className="cx-ink"
              style={{ animationDelay: `${i * 1.4 - 9}s`, animationDuration: "9s" }}
              opacity="0.75"
            />
          ))}
        </g>
      </g>

      {/* your hand writing */}
      <g className="cx-write">
        <path d="M800 500 L640 380 L700 330 L820 420 Z" fill="#D9A24A" />
        <path d="M660 368 L700 336" stroke="#B8842E" strokeWidth="4" strokeDasharray="5 5" />
        <path d="M596 360 C604 340 630 330 652 342 L676 362 C672 384 648 398 624 392 C608 388 596 376 596 360 Z" fill={SKIN.base} />
        <path d="M604 352 C598 346 590 350 592 358" fill={SKIN.shade} />
        <path d="M612 344 L568 384" stroke="#2E3A5A" strokeWidth="5" strokeLinecap="round" />
        <path d="M570 382 L562 390" stroke="#C9A050" strokeWidth="3" strokeLinecap="round" />
        <path d="M600 350 C594 360 598 372 608 376" stroke={SKIN.shade} strokeWidth="2" fill="none" />
      </g>

      {/* mug + book stack (right), steam */}
      <g transform="translate(676 212)">
        <ellipse cx="0" cy="34" rx="30" ry="10" fill="#2A1A10" opacity="0.4" />
        <rect x="-26" y="-6" width="52" height="40" rx="8" fill="#EDE4D6" />
        <ellipse cx="0" cy="-6" rx="26" ry="9" fill="#EDE4D6" />
        <ellipse cx="0" cy="-5" rx="21" ry="6.5" fill="#6A3A22" />
        <path d="M26 6 Q42 6 40 18 Q38 28 26 28" stroke="#EDE4D6" strokeWidth="5" fill="none" />
        <Steam x={-6} y={-12} color="#FFF3E0" />
      </g>
      <g transform="translate(730 170)">
        <rect x="-60" y="-6" width="120" height="22" rx="3" fill="#5E3A2A" />
        <rect x="-54" y="-26" width="110" height="20" rx="3" fill="#8A5A3A" />
        <rect x="-58" y="-44" width="114" height="18" rx="3" fill="#6E4A3A" />
        <path d="M30 16 L30 34 L34 30 L38 34 L38 16" fill="#C9503C" />
      </g>

      {/* headphones on a notebook (bottom left) */}
      <g transform="translate(140 430) rotate(-10)">
        <rect x="-80" y="-50" width="160" height="110" rx="6" fill="#7A4A30" />
        <rect x="-80" y="-50" width="10" height="110" fill="#5E3624" />
        <path d="M-40 10 C-40 -40 40 -40 40 10" stroke="#4A3A34" strokeWidth="9" fill="none" strokeLinecap="round" />
        <ellipse cx="-42" cy="18" rx="18" ry="22" fill="#5A4A44" />
        <ellipse cx="42" cy="18" rx="18" ry="22" fill="#5A4A44" />
        <ellipse cx="-42" cy="18" rx="10" ry="13" fill="#3A2E2A" />
        <ellipse cx="42" cy="18" rx="10" ry="13" fill="#3A2E2A" />
      </g>
      {/* pens + highlighters */}
      <path d="M440 470 L520 488" stroke="#E8B04B" strokeWidth="6" strokeLinecap="round" />
      <path d="M560 480 L640 470" stroke="#F09AA8" strokeWidth="7" strokeLinecap="round" />
      <path d="M652 450 L700 470" stroke="#3A3A4A" strokeWidth="4" strokeLinecap="round" />
      <path d="M520 190 L580 200" stroke="#A9C47A" strokeWidth="7" strokeLinecap="round" />

      {/* glasses case */}
      <g transform="translate(330 196) rotate(-8)">
        <rect x="-44" y="-14" width="88" height="28" rx="14" fill="#3A3230" />
        <rect x="-38" y="-8" width="76" height="6" rx="3" fill="#5A4E4A" />
      </g>

      {/* lamp (top left) */}
      <g>
        <ellipse cx="96" cy="250" rx="46" ry="16" fill="#2A1A10" opacity="0.45" />
        <ellipse cx="96" cy="244" rx="42" ry="14" fill="#B8863E" />
        <path d="M96 240 L70 150 L140 92" stroke="#A9762E" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120 64 C150 50 190 64 200 96 L140 124 C124 110 116 90 120 64 Z" fill="#C9963E" />
        <ellipse cx="172" cy="112" rx="32" ry="12" transform="rotate(-24 172 112)" fill="#FFF0C0" />
      </g>

      {/* cat asleep in the lamplight */}
      <g transform="translate(110 340) scale(0.9)">
        <CurledCat coat={GINGER} />
      </g>

      <rect width="800" height="500" fill={`url(#${p}-vig)`} />
      <Grain p={p} opacity={0.09} />
    </svg>
  );
}
