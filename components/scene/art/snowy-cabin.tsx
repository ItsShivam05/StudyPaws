import { AUBURN, CALICO, CurledCat, Filters, Grain, Head, Steam, seeded } from "./parts";

const p = "sc";
const SNOW = seeded(50, 601);
const STONES = seeded(26, 602);

/** 6 · Snowy Cabin — wrapped in a blanket by the fire with cocoa, cat asleep on her lap. */
export function SnowyCabin() {
  return (
    <svg viewBox="0 0 800 500" className="size-full" aria-hidden="true">
      <defs>
        <Filters p={p} />
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34446E" />
          <stop offset="1" stopColor="#8EA1C4" />
        </linearGradient>
        <radialGradient id={`${p}-fire`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFB060" stopOpacity="0.7" />
          <stop offset="0.45" stopColor="#FF8A3D" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FF8A3D" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}-frost`} cx="0.5" cy="0.45" r="0.72">
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.55" />
        </radialGradient>
        <clipPath id={`${p}-glass`}>
          <rect x="452" y="64" width="276" height="226" />
        </clipPath>
      </defs>

      {/* plank walls */}
      <rect width="800" height="500" fill="#5E3A28" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} y={i * 40} width="800" height="3" fill="#3E2418" opacity="0.5" />
      ))}
      {/* floor + rug */}
      <rect y="430" width="800" height="70" fill="#3E2418" />
      <ellipse cx="420" cy="474" rx="300" ry="26" fill="#9E4A3A" />
      <ellipse cx="420" cy="474" rx="260" ry="18" fill="none" stroke="#E7C29A" strokeWidth="3" strokeDasharray="10 8" />

      {/* window with snowy woods */}
      <rect x="438" y="50" width="304" height="254" fill="#3E2418" />
      <g clipPath={`url(#${p}-glass)`}>
        <rect x="452" y="64" width="276" height="226" fill={`url(#${p}-sky)`} />
        <circle cx="660" cy="110" r="16" fill="#F3EBD6" opacity="0.9" />
        <path d="M452 220 Q540 180 620 200 T740 190 V290 H452 Z" fill="#B9C6DA" />
        {[470, 500, 540, 590, 650, 690, 720].map((x, i) => (
          <g key={i} transform={`translate(${x} ${248 - (i % 3) * 8}) scale(${0.8 + (i % 3) * 0.3})`}>
            <path d="M0 -46 L14 -14 L6 -14 L18 6 L-18 6 L-6 -14 L-14 -14 Z" fill="#2E3E54" />
            <path d="M0 -46 L7 -30 L-7 -30 Z M-6 -14 L6 -14 L9 -8 L-9 -8 Z" fill="#E8EEF6" opacity="0.8" />
          </g>
        ))}
        <path d="M452 260 Q560 240 640 256 T740 250 V290 H452 Z" fill="#DCE4EE" />
        {SNOW.map(([a, b, c], i) => (
          <circle
            key={i}
            cx={Math.round(452 + a * 276)}
            cy={Math.round(40 + b * 20)}
            r={(1 + c * 1.8).toFixed(1)}
            fill="#fff"
            opacity={0.6 + c * 0.4}
            className="cx-snow"
            style={{ animationDuration: `${7 + c * 6}s`, animationDelay: `${-b * 13}s` }}
          />
        ))}
        <rect x="452" y="64" width="276" height="226" fill={`url(#${p}-frost)`} />
        <path d="M452 290 L452 280 Q480 270 510 280 Q560 268 600 280 Q650 270 700 280 L728 278 L728 290 Z" fill="#F4F7FA" />
      </g>
      <rect x="586" y="64" width="8" height="226" fill="#3E2418" />
      <rect x="430" y="300" width="320" height="14" rx="3" fill="#6E4630" />
      {/* fairy lights */}
      <path d="M430 46 Q590 80 750 46" stroke="#2A1810" strokeWidth="1.2" fill="none" />
      {Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        const x = Math.round(430 + t * 320);
        const y = Math.round(46 + 4 * t * (1 - t) * 34) + 4;
        return (
          <g key={i} className="cx-twinkle" style={{ animationDuration: `${2.5 + (i % 4)}s`, animationDelay: `${-i * 0.6}s` }}>
            <circle cx={x} cy={y} r="7" fill={i % 2 ? "#FFD27A" : "#FF9E8A"} opacity="0.35" />
            <circle cx={x} cy={y} r="2.6" fill={i % 2 ? "#FFD27A" : "#FF9E8A"} />
          </g>
        );
      })}

      {/* fireplace */}
      <g>
        <rect x="10" y="190" width="230" height="250" rx="6" fill="#7A6E66" />
        {STONES.map(([a, b, c], i) => (
          <ellipse
            key={i}
            cx={Math.round(20 + a * 210)}
            cy={Math.round(200 + b * 230)}
            rx={Math.round(12 + c * 10)}
            ry={Math.round(8 + c * 6)}
            fill={i % 2 ? "#8E827A" : "#6A5E58"}
          />
        ))}
        <rect x="0" y="178" width="250" height="16" rx="3" fill="#4E3020" />
        <path d="M50 440 L50 320 Q125 260 200 320 L200 440 Z" fill="#1A100C" />
        {/* logs */}
        <rect x="70" y="414" width="110" height="16" rx="8" fill="#5A3420" />
        <rect x="80" y="404" width="90" height="14" rx="7" fill="#6E4228" transform="rotate(-8 125 411)" />
        {/* flames */}
        <g>
          <path d="M80 416 C70 380 96 360 100 330 C112 360 130 370 126 416 Z" fill="#E8602E" className="cx-flame" />
          <path d="M110 416 C100 370 130 350 136 310 C150 350 170 370 160 416 Z" fill="#F07A34" className="cx-flame" style={{ animationDelay: "-0.3s" }} />
          <path d="M94 416 C90 390 108 376 112 356 C120 380 134 390 130 416 Z" fill="#FFC060" className="cx-flame" style={{ animationDelay: "-0.6s" }} />
          <path d="M124 416 C120 394 136 384 140 366 C148 386 156 396 152 416 Z" fill="#FFE08A" className="cx-flame" style={{ animationDelay: "-0.15s" }} />
        </g>
        {/* mantel: candles + a plant */}
        <rect x="40" y="152" width="14" height="26" rx="2" fill="#F3E7D3" />
        <ellipse cx="47" cy="148" rx="3" ry="6" fill="#FFC060" className="cx-flame" />
        <rect x="64" y="160" width="12" height="18" rx="2" fill="#F3E7D3" />
        <ellipse cx="70" cy="156" rx="2.6" ry="5" fill="#FFC060" className="cx-flame" style={{ animationDelay: "-0.4s" }} />
        <path d="M184 178 L188 156 L212 156 L216 178 Z" fill="#C9845F" />
        <path d="M200 156 C190 140 186 126 192 118 C198 132 200 144 200 156 Z M200 156 C210 142 222 136 228 140 C220 148 210 152 200 156 Z" fill="#6E8A5A" />
      </g>

      {/* firelight over the room */}
      <ellipse cx="130" cy="380" rx="420" ry="340" fill={`url(#${p}-fire)`} style={{ mixBlendMode: "screen" }} className="cx-flicker" />

      {/* armchair */}
      <g>
        <path d="M330 250 C326 200 360 180 470 180 C580 180 614 200 610 250 L620 440 L320 440 Z" fill="#8E4632" />
        <path d="M300 300 C290 280 330 270 350 290 L360 440 L306 440 Z" fill="#A4523A" />
        <path d="M640 300 C650 280 610 270 590 290 L580 440 L634 440 Z" fill="#7A3A2A" />
        <path d="M330 250 C326 200 360 180 470 180" stroke="#E08A5A" strokeWidth="3" fill="none" opacity="0.5" />
      </g>

      {/* her, wrapped in a blanket, facing the fire */}
      <g transform="translate(470 222) scale(-1.25 1.25)">
        <Head eyes="closed" hair={AUBURN} rim="#FFC27A" />
        {/* blanket */}
        <path d="M-60 60 C-56 40 -20 32 0 40 C30 32 60 44 70 70 L96 170 C40 190 -40 190 -96 172 Z" fill="#EFE3CF" />
        <path d="M-60 60 C-70 100 -86 140 -96 172 C-70 180 -50 182 -30 184 C-44 150 -50 110 -60 60 Z" fill="#D9C9B0" />
        <g stroke="#D2BFA2" strokeWidth="2.4" fill="none" opacity="0.8">
          <path d="M-40 80 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8" />
          <path d="M-50 120 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8" />
        </g>
        <path d="M0 40 C30 32 60 44 70 70" stroke="#FFC27A" strokeWidth="3" fill="none" opacity="0.7" />
        {/* cocoa, held in both hands */}
        <g transform="translate(40 70)">
          <rect x="-12" y="-6" width="26" height="28" rx="4" fill="#C9503C" />
          <ellipse cx="1" cy="-6" rx="13" ry="3.5" fill="#6A3A22" />
          <ellipse cx="-12" cy="14" rx="8" ry="7" fill="#F6D2B8" />
          <ellipse cx="14" cy="14" rx="8" ry="7" fill="#F6D2B8" />
          <Steam x={-6} y={-12} />
        </g>
      </g>

      {/* the cat asleep on her lap */}
      <g transform="translate(470 432) scale(0.95)">
        <CurledCat coat={CALICO} />
      </g>

      {/* blurred foreground */}
      <g filter={`url(#${p}-b6)`}>
        <rect x="660" y="400" width="160" height="110" rx="10" fill="#2A1810" />
        <path d="M-20 500 C10 450 60 440 100 450 C70 470 50 490 46 500 Z" fill="#2E3A26" />
      </g>
      <Grain p={p} opacity={0.08} />
    </svg>
  );
}
