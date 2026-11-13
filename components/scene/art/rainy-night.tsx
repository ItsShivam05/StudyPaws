import { BROWN, CurledCat, Filters, GINGER, Grain, Head, Steam, seeded } from "./parts";

const p = "rn";
const RAIN = seeded(60, 202);
const BOKEH = seeded(16, 203);
const LIT = seeded(46, 204);
const BEADS = seeded(40, 205);
const BOKEH_COLORS = ["#FFB86B", "#FF7EA8", "#6BD9FF", "#FFD98A"];

/** 2 · Rainy Night — city lights blur behind the rain while she types; the cat naps on the sill. */
export function RainyNight() {
  const buildings: [number, number, number][] = [
    [380, 40, 120], [420, 30, 160], [450, 46, 110], [496, 34, 180], [530, 50, 130], [580, 30, 200],
    [610, 44, 140], [654, 36, 170], [690, 52, 120], [742, 40, 190], [782, 30, 140],
  ];
  return (
    <svg viewBox="0 0 800 500" className="size-full" aria-hidden="true">
      <defs>
        <Filters p={p} />
        <linearGradient id={`${p}-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3A2A2C" />
          <stop offset="1" stopColor="#1E1A26" />
        </linearGradient>
        <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#111833" />
          <stop offset="1" stopColor="#2E3765" />
        </linearGradient>
        <radialGradient id={`${p}-lamp`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFC778" stopOpacity="0.75" />
          <stop offset="0.4" stopColor="#FFB060" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FFB060" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${p}-screen`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#CFE6FF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#CFE6FF" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${p}-glass`}>
          <rect x="384" y="34" width="402" height="292" />
        </clipPath>
      </defs>

      <rect width="800" height="500" fill={`url(#${p}-wall)`} />

      {/* window onto the rainy city */}
      <rect x="370" y="20" width="430" height="320" fill="#2A1E1C" />
      <g clipPath={`url(#${p}-glass)`}>
        <rect x="384" y="34" width="402" height="292" fill={`url(#${p}-sky)`} />
        <path d="M384 230 Q470 190 560 214 T786 200 V326 H384 Z" fill="#1C2347" />
        {buildings.map(([x, w, h], i) => (
          <rect key={i} x={x} y={326 - h} width={w} height={h} fill={i % 2 ? "#161B36" : "#1B2140"} />
        ))}
        {LIT.map(([a, b, c], i) => {
          const [bx, bw, bh] = buildings[Math.floor(a * buildings.length)];
          const x = bx + 5 + Math.floor(c * (bw - 12) / 7) * 7;
          const y = 326 - bh + 10 + Math.floor(b * (bh - 30) / 11) * 11;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="4"
              height="6"
              fill={c > 0.85 ? "#FF8FB8" : c > 0.75 ? "#7FE0FF" : "#FFC56B"}
              className="cx-twinkle"
              style={{ animationDuration: `${4 + c * 9}s`, animationDelay: `${-a * 10}s` }}
            />
          );
        })}
        <g filter={`url(#${p}-b6)`}>
          {BOKEH.map(([a, b, c], i) => (
            <circle
              key={i}
              cx={Math.round(390 + a * 400)}
              cy={Math.round(150 + b * 170)}
              r={Math.round(8 + c * 16)}
              fill={BOKEH_COLORS[i % 4]}
              opacity="0.45"
              className="cx-twinkle"
              style={{ animationDuration: `${6 + c * 6}s`, animationDelay: `${-b * 8}s` }}
            />
          ))}
        </g>
        {RAIN.map(([a, b, c], i) => (
          <line
            key={i}
            x1={Math.round(384 + a * 410)}
            y1={Math.round(-20 + b * 60)}
            x2={Math.round(380 + a * 410)}
            y2={Math.round(-4 + b * 60 + c * 10)}
            stroke="#C9D6F2"
            strokeOpacity={0.25 + c * 0.35}
            strokeWidth="1.2"
            className="cx-rain"
            style={{ animationDuration: `${0.7 + c * 0.5}s`, animationDelay: `${-b * 2}s` }}
          />
        ))}
        {BEADS.map(([a, b, c], i) => (
          <circle key={i} cx={Math.round(388 + a * 396)} cy={Math.round(40 + b * 280)} r={(0.8 + c * 1.6).toFixed(1)} fill="#DCE6FF" opacity="0.5" />
        ))}
      </g>
      <g fill="#2A1E1C">
        <rect x="582" y="34" width="10" height="292" />
        <rect x="384" y="176" width="402" height="8" />
      </g>
      <rect x="360" y="326" width="440" height="16" rx="3" fill="#3E2C24" />
      {/* sheer curtain */}
      <path d="M352 10 L408 10 Q396 120 410 200 Q398 280 404 350 L352 350 Z" fill="#5A4A66" opacity="0.85" />
      <path d="M372 14 Q368 160 378 346" stroke="#000" strokeOpacity="0.15" strokeWidth="3" fill="none" />

      {/* plants + cat on the sill */}
      <g transform="translate(752 326)">
        <path d="M-16 0 L-13 -26 L13 -26 L16 0 Z" fill="#7A4A36" />
        <g className="cx-sway" style={{ transformOrigin: "0px -26px" }}>
          <path d="M0 -26 C-20 -44 -26 -64 -16 -76 C-8 -58 -2 -44 0 -26 Z" fill="#3E5A3E" />
          <path d="M0 -26 C14 -46 30 -56 40 -52 C28 -40 14 -32 0 -26 Z" fill="#4E6E48" />
        </g>
      </g>
      <g transform="translate(640 328) scale(0.95)">
        <CurledCat coat={GINGER} />
      </g>

      {/* lamp glow */}
      <circle cx="200" cy="300" r="300" fill={`url(#${p}-lamp)`} style={{ mixBlendMode: "screen" }} className="cx-flicker" />

      {/* chair */}
      <g>
        <path d="M150 230 Q174 214 204 222 L214 440 L164 444 Z" fill="#5A3A2C" />
        <path d="M160 246 L196 240 M162 280 L198 274 M164 314 L200 308" stroke="#3A2620" strokeWidth="4" />
        <path d="M152 232 Q174 218 202 224" stroke="#FFC778" strokeWidth="2.5" fill="none" opacity="0.6" />
      </g>

      {/* her, typing */}
      <g transform="translate(300 186) scale(1.3)">
        <g className="cx-breathe-soft" style={{ transformOrigin: "0px 200px" }}>
          <path d="M-12 44 C-44 46 -70 86 -72 150 L-76 250 L64 250 L58 160 C54 110 40 60 14 46 Z" fill="#E59A7C" />
          <path d="M-72 150 L-76 250 L-30 250 C-40 200 -46 140 -36 90 C-54 104 -68 124 -72 150 Z" fill="#C27A60" />
          <path d="M-38 50 C-44 28 -14 24 2 40 C-10 48 -24 56 -38 50 Z" fill="#CF8468" />
          <path d="M-60 120 C-50 100 -40 92 -30 90" stroke="#FFC98A" strokeWidth="3" fill="none" opacity="0.5" />
        </g>
        <g className="cx-nod" style={{ transformOrigin: "-2px 46px" }}>
          <Head eyes="open" hair={BROWN} rim="#CFE6FF" phones={{ band: "#F3E7D3", cup: "#8A5A44", pad: "#F3E7D3" }} />
        </g>
        <path d="M-4 62 L40 128" stroke="#D88C6E" strokeWidth="28" strokeLinecap="round" />
        <path d="M40 128 L96 124" stroke="#E59A7C" strokeWidth="22" strokeLinecap="round" />
        <g className="cx-type">
          <ellipse cx="108" cy="122" rx="10" ry="6.5" fill="#F6D2B8" />
        </g>
      </g>

      {/* desk */}
      <path d="M0 356 L800 352 L800 500 L0 500 Z" fill="#3A2820" />
      <path d="M0 356 L800 352 L800 372 L0 376 Z" fill="#5E4232" />
      <ellipse cx="220" cy="366" rx="240" ry="18" fill="#FFC778" opacity="0.35" filter={`url(#${p}-b14)`} style={{ mixBlendMode: "screen" }} />

      {/* laptop, screen facing her */}
      <circle cx="470" cy="290" r="90" fill={`url(#${p}-screen)`} style={{ mixBlendMode: "screen" }} className="cx-flicker" />
      <path d="M420 352 L540 352 L536 346 L424 346 Z" fill="#8C9096" />
      <path d="M536 348 L512 256" stroke="#5E6268" strokeWidth="7" strokeLinecap="round" />
      <path d="M531 344 L508 258" stroke="#DCEBFF" strokeWidth="1.5" opacity="0.6" />

      {/* mug */}
      <g transform="translate(590 352)">
        <rect x="-12" y="-28" width="24" height="28" rx="4" fill="#E9DFD2" />
        <path d="M12 -22 Q22 -22 21 -14 Q20 -6 12 -6" stroke="#E9DFD2" strokeWidth="3.5" fill="none" />
        <Steam x={-4} y={-32} color="#E9DFD2" />
      </g>

      {/* desk lamp */}
      <g>
        <ellipse cx="80" cy="356" rx="34" ry="7" fill="#1E140F" opacity="0.6" />
        <rect x="52" y="346" width="56" height="10" rx="5" fill="#B8683A" />
        <path d="M80 348 L64 250 L140 196" stroke="#B8683A" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M122 178 L176 196 L160 236 Q134 232 118 214 Z" fill="#C9783F" />
        <ellipse cx="148" cy="222" rx="18" ry="7" transform="rotate(24 148 222)" fill="#FFE7B0" />
      </g>

      {/* blurred foreground notebook edge */}
      <g filter={`url(#${p}-b6)`}>
        <rect x="560" y="440" width="260" height="70" rx="8" fill="#2A3048" />
        <rect x="-20" y="460" width="200" height="60" rx="8" fill="#4A2E26" />
      </g>
      <Grain p={p} opacity={0.08} />
    </svg>
  );
}
