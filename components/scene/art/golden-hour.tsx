import { CALICO, Filters, Grain, Head, SittingCat, Steam, AUBURN, seeded } from "./parts";

const SPARKS = seeded(18, 101);
const p = "gh";

/** 1 · Golden Hour — late sun pours in; she sips tea while the cat keeps her company on the desk. */
export function GoldenHour() {
  return (
    <svg viewBox="0 0 800 500" className="size-full" aria-hidden="true">
      <defs>
        <Filters p={p} />
        <linearGradient id={`${p}-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F4B36A" />
          <stop offset="0.55" stopColor="#D9844A" />
          <stop offset="1" stopColor="#9C4E2E" />
        </linearGradient>
        <linearGradient id={`${p}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF6D8" />
          <stop offset="1" stopColor="#FFD08A" />
        </linearGradient>
        <linearGradient id={`${p}-ray`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF0C2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE0A0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${p}-desk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C9804C" />
          <stop offset="0.25" stopColor="#8E4C2C" />
          <stop offset="1" stopColor="#5E2E1C" />
        </linearGradient>
        <radialGradient id={`${p}-sun`} cx="0.2" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFE9B8" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFE9B8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="500" fill={`url(#${p}-wall)`} />

      {/* window */}
      <rect x="20" y="-10" width="380" height="350" fill="#B9683A" />
      <rect x="34" y="0" width="352" height="326" fill={`url(#${p}-glass)`} />
      <g filter={`url(#${p}-b14)`} opacity="0.75">
        <ellipse cx="90" cy="250" rx="70" ry="90" fill="#E7B66A" />
        <ellipse cx="300" cy="210" rx="90" ry="70" fill="#EFC67E" />
        <ellipse cx="190" cy="120" rx="60" ry="40" fill="#FFF3D0" />
      </g>
      <g filter={`url(#${p}-b6)`} fill="#D59A55" opacity="0.6">
        <path d="M60 330 C40 260 70 200 110 170 C100 230 96 280 100 330 Z" />
        <path d="M120 330 C130 270 170 230 210 220 C180 260 160 300 156 330 Z" />
      </g>
      <g fill="#B9683A">
        <rect x="200" y="0" width="12" height="330" />
        <rect x="34" y="150" width="352" height="12" />
      </g>
      <rect x="10" y="322" width="400" height="16" rx="3" fill="#A65A32" />

      {/* plant on the sill, backlit */}
      <g transform="translate(118 322)">
        <path d="M-22 0 L-18 -34 L18 -34 L22 0 Z" fill="#B65A34" />
        <g className="cx-sway" style={{ transformOrigin: "0px -34px" }}>
          <path d="M0 -34 C-30 -60 -40 -90 -26 -110 C-14 -84 -6 -60 0 -34 Z" fill="#7C8A4A" />
          <path d="M0 -34 C20 -64 44 -76 60 -70 C40 -56 20 -46 0 -34 Z" fill="#95A257" />
          <path d="M0 -34 C4 -70 14 -96 30 -106 C26 -80 14 -56 0 -34 Z" fill="#A9B466" />
        </g>
      </g>

      {/* out-of-focus bookshelf on the right */}
      <g filter={`url(#${p}-b2)`}>
        <rect x="610" y="-10" width="200" height="370" fill="#6E3420" />
        {[
          [620, "#3F6A6A", 90], [638, "#C77B4A", 100], [652, "#E6C9A0", 84], [670, "#5E7A4E", 96], [688, "#8C3B2E", 104],
          [708, "#D9A46A", 88], [724, "#4A5A7A", 98], [742, "#B8603A", 92], [760, "#6A8A5A", 100], [778, "#E0B888", 86],
        ].map(([x, c, h], i) => (
          <rect key={i} x={x as number} y={160 - (h as number)} width="15" height={h as number} fill={c as string} opacity="0.85" />
        ))}
        <rect x="610" y="160" width="200" height="10" fill="#4E2214" />
        {[[620, "#5E7A4E", 110], [640, "#E6C9A0", 96], [660, "#8C3B2E", 104], [690, "#3F6A6A", 90], [712, "#D9A46A", 110], [740, "#6A4A7A", 96]].map(
          ([x, c, h], i) => (
            <rect key={i} x={x as number} y={330 - (h as number)} width="17" height={h as number} fill={c as string} opacity="0.8" />
          ),
        )}
        <rect x="610" y="330" width="200" height="10" fill="#4E2214" />
      </g>

      {/* sun rays */}
      <g style={{ mixBlendMode: "screen" }}>
        <path d="M60 0 L180 0 L640 500 L420 500 Z" fill={`url(#${p}-ray)`} className="cx-ray" />
        <path d="M230 0 L300 0 L800 420 L760 500 Z" fill={`url(#${p}-ray)`} className="cx-ray" style={{ animationDelay: "-3s" }} />
      </g>
      <rect width="800" height="500" fill={`url(#${p}-sun)`} style={{ mixBlendMode: "screen" }} />

      {/* chair back */}
      <path d="M700 230 L740 226 L760 400 L716 404 Z" fill="#5A2E1E" />
      <path d="M704 236 L712 236 L728 398 L720 398 Z" fill="#E7A066" opacity="0.4" />

      {/* her */}
      <g transform="translate(590 182) scale(-1.45 1.45)">
        <g className="cx-breathe-soft" style={{ transformOrigin: "0px 200px" }}>
          <path d="M-12 44 C-44 46 -70 86 -72 150 L-76 240 L64 240 L58 160 C54 110 40 60 14 46 Z" fill="#EDE2D3" />
          <path d="M-72 150 L-76 240 L-30 240 C-40 200 -46 140 -36 90 C-54 104 -68 124 -72 150 Z" fill="#CDBBA7" />
          <path d="M14 46 C40 60 54 110 58 160" stroke="#FFE2AE" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M-38 50 C-44 28 -14 24 2 40 C-10 48 -24 56 -38 50 Z" fill="#D8C7B3" />
        </g>
        <g className="cx-sip" style={{ transformOrigin: "-2px 50px" }}>
          <Head eyes="down" hair={AUBURN} rim="#FFD9A0" />
          {/* mug at her lips */}
          <g transform="rotate(-14 48 18)">
            <path d="M58 10 Q68 10 67 18 Q66 26 57 26" stroke="#8D8A86" strokeWidth="3.5" fill="none" />
            <rect x="38" y="4" width="22" height="28" rx="3" fill="#A9A6A1" />
            <rect x="38" y="4" width="7" height="28" rx="3" fill="#E9E4DC" opacity="0.5" />
          </g>
          <Steam x={46} y={-2} />
        </g>
        {/* arm: elbow on the desk, hand round the mug */}
        <path d="M-6 62 L36 128" stroke="#E3D6C5" strokeWidth="30" strokeLinecap="round" />
        <path d="M36 128 L42 44" stroke="#EDE2D3" strokeWidth="24" strokeLinecap="round" />
        <path d="M24 128 L30 50" stroke="#FFE2AE" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <ellipse cx="44" cy="30" rx="10" ry="9" fill="#F6D2B8" />
        <path d="M37 26 Q44 22 52 26" stroke="#E7B394" strokeWidth="1.4" fill="none" />
      </g>

      {/* desk */}
      <path d="M0 360 L800 356 L800 500 L0 500 Z" fill={`url(#${p}-desk)`} />
      <path d="M0 360 L800 356" stroke="#F2B57A" strokeWidth="2" opacity="0.7" />

      {/* books + pencil cup on the left */}
      <g>
        <rect x="18" y="330" width="150" height="16" rx="3" fill="#4A5A6A" />
        <rect x="24" y="314" width="140" height="16" rx="3" fill="#7C8A5A" />
        <rect x="14" y="298" width="148" height="16" rx="3" fill="#D9C8A8" />
        <rect x="14" y="298" width="148" height="3" fill="#FFF0CC" opacity="0.6" />
        <rect x="20" y="346" width="160" height="14" rx="3" fill="#8A4A3A" />
      </g>
      <g transform="translate(212 360)">
        <path d="M-16 0 L-14 -40 L14 -40 L16 0 Z" fill="#4E4A48" />
        <path d="M-14 -40 L14 -40" stroke="#F2B57A" strokeWidth="2" />
        <path d="M-4 -40 L-14 -70 M4 -40 L10 -66" stroke="#2E2A28" strokeWidth="3" strokeLinecap="round" />
        <path d="M-14 -70 L-16 -76" stroke="#E7A066" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* the cat */}
      <g transform="translate(330 372) scale(1.3)">
        <SittingCat coat={CALICO} rim="#FFE2AE" />
      </g>

      {/* open book */}
      <g>
        <path d="M380 404 L520 384 L640 404 L506 432 Z" fill="#5E2E1C" opacity="0.4" />
        <path d="M382 398 Q450 376 520 384 L512 424 Q448 414 388 428 Z" fill="#FFF8EA" />
        <path d="M520 384 Q586 378 640 396 L628 430 Q570 418 512 424 Z" fill="#F4E8D2" />
        <g stroke="#B08A6A" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round">
          <path d="M400 404 L500 392 M402 412 L502 400 M404 420 L470 412" />
          <path d="M532 394 L620 400 M532 402 L618 408 M530 410 L600 414" />
        </g>
      </g>

      {/* floating sparkles */}
      {SPARKS.map(([a, b, c], i) => (
        <circle
          key={i}
          cx={Math.round(240 + a * 520)}
          cy={Math.round(120 + b * 320)}
          r={(1.2 + c * 2.2).toFixed(1)}
          fill="#FFD48A"
          className="cx-spark"
          style={{ animationDuration: `${5 + c * 6}s`, animationDelay: `${-a * 9}s` }}
        />
      ))}

      {/* blurred foreground: plant leaves and books */}
      <g filter={`url(#${p}-b6)`}>
        <path d="M-30 500 C-10 420 60 380 150 400 C100 430 70 470 60 500 Z" fill="#3E4A26" />
        <path d="M40 500 C80 440 160 420 240 450 C190 460 150 480 140 500 Z" fill="#56622E" />
        <path d="M-20 430 C20 400 60 404 90 420 C50 430 20 440 -20 450 Z" fill="#C9A24A" opacity="0.8" />
        <rect x="640" y="440" width="200" height="40" rx="6" fill="#7A4A2E" />
        <rect x="660" y="470" width="180" height="40" rx="6" fill="#4F6A5A" />
      </g>

      <Grain p={p} />
    </svg>
  );
}
