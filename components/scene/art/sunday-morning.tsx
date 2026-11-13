import { CurledCat, Filters, Grain, Head, SKIN, TUXEDO, BROWN, seeded } from "./parts";

const p = "sm";
const PETALS = seeded(16, 301);

/** 3 · Sunday Morning — a slow morning reading in bed, sun through sheer curtains, cat at her feet. */
export function SundayMorning() {
  return (
    <svg viewBox="0 0 800 500" className="size-full" aria-hidden="true">
      <defs>
        <Filters p={p} />
        <linearGradient id={`${p}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFDF0" />
          <stop offset="1" stopColor="#F4F0C8" />
        </linearGradient>
        <radialGradient id={`${p}-sun`} cx="0.25" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFF4C8" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFF4C8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-ray`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF6D2" stopOpacity="0.6" />
          <stop offset="1" stopColor="#FFF6D2" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="800" height="500" fill="#DDE2CB" />
      <rect x="440" width="360" height="500" fill="#D2D8BE" />

      {/* posters */}
      <g transform="translate(560 40)">
        <rect width="80" height="96" rx="3" fill="#F6EFE0" />
        <circle cx="40" cy="40" r="20" fill="#E8A35E" />
        <path d="M8 88 Q40 56 72 88 Z" fill="#8FAE8A" />
      </g>
      <g transform="translate(664 64)">
        <rect width="70" height="70" rx="3" fill="#F6EFE0" />
        <path d="M14 54 L35 18 L56 54 Z" fill="#6E9C98" />
        <circle cx="50" cy="22" r="7" fill="#E5B45F" />
      </g>

      {/* window */}
      <rect x="40" y="0" width="300" height="296" fill="#F4EEE2" />
      <rect x="52" y="0" width="276" height="284" fill={`url(#${p}-glass)`} />
      <g filter={`url(#${p}-b14)`}>
        <ellipse cx="120" cy="220" rx="80" ry="70" fill="#B9D08E" />
        <ellipse cx="260" cy="180" rx="90" ry="60" fill="#A7C47E" />
        <ellipse cx="180" cy="80" rx="70" ry="40" fill="#E3EDBE" />
      </g>
      <g fill="#F4EEE2">
        <rect x="186" y="0" width="8" height="284" />
        <rect x="52" y="140" width="276" height="8" />
      </g>
      <rect x="30" y="284" width="320" height="14" rx="3" fill="#EDE5D4" />
      {/* sill plants */}
      {[
        [110, "#C98A5F", 1],
        [250, "#D9A46A", 0.85],
      ].map(([x, pot, s], i) => (
        <g key={i} transform={`translate(${x} 284) scale(${s})`}>
          <path d="M-16 0 L-13 -24 L13 -24 L16 0 Z" fill={pot as string} />
          <g className="cx-sway" style={{ transformOrigin: "0px -24px", animationDelay: `${-i * 2}s` }}>
            <path d="M0 -24 C-16 -44 -18 -60 -8 -70 C-4 -52 -2 -40 0 -24 Z" fill="#7FA36A" />
            <path d="M0 -24 C12 -40 26 -48 34 -44 C24 -34 12 -28 0 -24 Z" fill="#94B87A" />
            <circle cx="-8" cy="-70" r="4" fill="#FFF8E8" />
            <circle cx="34" cy="-46" r="3.5" fill="#FFF8E8" />
          </g>
        </g>
      ))}
      {/* radiator */}
      <g transform="translate(70 312)">
        <rect width="240" height="70" rx="6" fill="#ECE6D6" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={10 + i * 19} y="6" width="10" height="58" rx="5" fill="#F7F2E6" />
        ))}
      </g>
      {/* sheer curtains */}
      <g className="cx-curtain">
        <path d="M14 0 L96 0 Q86 120 100 220 Q90 300 96 390 L14 390 Z" fill="#FFF9EC" opacity="0.7" />
      </g>
      <g className="cx-curtain" style={{ animationDelay: "-3s" }}>
        <path d="M284 0 L370 0 L370 390 L290 390 Q296 300 284 220 Q298 120 284 0 Z" fill="#FFF9EC" opacity="0.7" />
      </g>

      {/* sun rays */}
      <g style={{ mixBlendMode: "screen" }}>
        <path d="M60 0 L200 0 L620 500 L380 500 Z" fill={`url(#${p}-ray)`} className="cx-ray" />
      </g>
      <rect width="800" height="500" fill={`url(#${p}-sun)`} style={{ mixBlendMode: "screen" }} />

      {/* plant beside the bed */}
      <g transform="translate(420 380)">
        <path d="M-24 0 L-20 -40 L20 -40 L24 0 Z" fill="#C98A5F" />
        <g className="cx-sway" style={{ transformOrigin: "0px -40px" }}>
          <path d="M0 -40 C-40 -70 -60 -120 -40 -160 C-24 -120 -10 -80 0 -40 Z" fill="#5E8A5A" />
          <path d="M0 -40 C30 -80 70 -100 90 -96 C70 -76 30 -56 0 -40 Z" fill="#6E9C66" />
          <path d="M0 -40 C4 -90 20 -140 44 -170 C40 -120 20 -80 0 -40 Z" fill="#7FAE72" />
        </g>
      </g>

      {/* bed: pillows, mattress */}
      <path d="M600 390 L600 210 Q700 176 820 196 L820 390 Z" fill="#C79A6E" />
      <path d="M612 380 L612 218 Q700 190 808 206" stroke="#A97E56" strokeWidth="4" fill="none" />
      <path d="M440 372 Q620 352 820 360 L820 410 L440 410 Z" fill="#EFE6D6" />
      <path d="M560 236 Q640 220 720 240 L740 340 Q650 350 570 340 Z" fill="#E5B45F" />
      <path d="M650 220 Q720 210 790 226 L800 330 Q730 336 670 330 Z" fill="#6E9C98" />
      <path d="M0 400 Q400 370 800 380 L800 500 L0 500 Z" fill="#FBF6EC" />

      {/* her, reclining with a book (faces left) */}
      <g transform="translate(624 190) scale(-1.3 1.3)">
        <path d="M-14 44 C10 40 36 60 44 100 L54 176 L0 186 C-14 150 -24 100 -20 60 Z" fill="#F7F3EC" />
        <path d="M-14 44 C-24 70 -24 120 -10 180 L0 186 C-14 150 -20 100 -14 60 Z" fill="#E0D9CC" />
        <ellipse cx="34" cy="176" rx="34" ry="20" fill="#B9B4B0" />
        {/* legs, knees up */}
        <path d="M34 170 L108 120" stroke={SKIN.base} strokeWidth="30" strokeLinecap="round" />
        <path d="M108 120 L166 196" stroke={SKIN.base} strokeWidth="22" strokeLinecap="round" />
        <path d="M100 112 L118 108" stroke="#FFF6DA" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <ellipse cx="174" cy="202" rx="16" ry="8" fill={SKIN.base} />
        <Head eyes="down" hair={BROWN} rim="#FFF4C8" />
        {/* arms holding the book */}
        <path d="M-2 62 L30 112" stroke={SKIN.base} strokeWidth="18" strokeLinecap="round" />
        <path d="M-6 54 L8 76" stroke="#F7F3EC" strokeWidth="24" strokeLinecap="round" />
        <path d="M30 112 L62 52" stroke={SKIN.base} strokeWidth="15" strokeLinecap="round" />
        <g transform="rotate(-18 70 34)">
          <rect x="54" y="6" width="38" height="54" rx="3" fill="#C9503C" />
          <rect x="54" y="6" width="5" height="54" fill="#9E3A2C" />
          <rect x="88" y="8" width="5" height="50" fill="#FFF8EA" />
          <rect x="64" y="20" width="18" height="2.5" fill="#F4C9A0" />
          <rect x="66" y="26" width="14" height="2" fill="#F4C9A0" />
          <g className="cx-page" style={{ animationDuration: "11s" }}>
            <rect x="88" y="8" width="16" height="50" fill="#FFFBF2" opacity="0.9" />
          </g>
        </g>
        <ellipse cx="62" cy="50" rx="8" ry="7" fill={SKIN.base} />
      </g>

      {/* blanket over the end of the bed */}
      <path d="M0 420 Q260 396 520 430 L540 500 L0 500 Z" fill="#E2894C" />
      <g stroke="#FBEBD2" strokeWidth="6" opacity="0.8">
        <path d="M0 440 Q260 416 524 448" fill="none" />
        <path d="M0 470 Q260 448 532 476" fill="none" />
      </g>

      {/* the cat at her feet */}
      <g transform="translate(250 430) scale(1.05)">
        <CurledCat coat={TUXEDO} />
      </g>

      {/* drifting petals / light specks */}
      {PETALS.map(([a, b, c], i) => (
        <circle
          key={i}
          cx={Math.round(120 + a * 620)}
          cy={Math.round(80 + b * 340)}
          r={(1.5 + c * 2.5).toFixed(1)}
          fill="#FFFFFF"
          className="cx-spark"
          style={{ animationDuration: `${6 + c * 6}s`, animationDelay: `${-a * 9}s` }}
        />
      ))}

      {/* blurred foreground leaves */}
      <g filter={`url(#${p}-b6)`}>
        <path d="M-40 500 C-20 380 40 320 110 300 C80 380 60 440 60 500 Z" fill="#4E7A4A" />
        <path d="M20 500 C60 420 120 400 190 420 C140 440 100 470 90 500 Z" fill="#6E9C5E" />
        <path d="M840 500 C820 400 760 340 700 330 C730 400 744 450 740 500 Z" fill="#4E7A4A" />
        <path d="M800 360 C760 330 720 334 690 350 C730 356 760 366 800 390 Z" fill="#7FAE72" />
      </g>
      <Grain p={p} opacity={0.06} />
    </svg>
  );
}
