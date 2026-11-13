/*
 * Shared artwork for the scene concepts: an original side-profile character,
 * two cat poses and common SVG filters. Everything faces RIGHT in its local
 * coordinates; flip with scale(-1 1) to face left.
 */

export const SKIN = { base: "#F6D2B8", shade: "#E7B394", blush: "#EE8F86", lip: "#C46E68", eye: "#3A2520" };

export type HairStyle = "bun" | "bob";
export interface Hair {
  base: string;
  dark: string;
  hi: string;
}
export const BROWN: Hair = { base: "#5A3426", dark: "#3F2219", hi: "#8A5238" };
export const AUBURN: Hair = { base: "#7A3B24", dark: "#552616", hi: "#B0603A" };
export const DARK: Hair = { base: "#3A2A2A", dark: "#241818", hi: "#6A4C48" };

const FACE =
  "M2 -38 C18 -38 30 -28 31 -12 C31 -7 33 -3 37 2 Q38.5 5 34 6.5 L33 9 Q35.5 11 33 13 Q31.5 14.5 33 16.5 Q33 22 29 26 Q24 32 14 31 C4 30 -6 22 -10 12 L-12 -24 Z";
const FACE_FRONT =
  "M16 -36 C27 -30 31 -20 31 -12 C31 -7 33 -3 37 2 Q38.5 5 34 6.5 L33 9 Q35.5 11 33 13 Q31.5 14.5 33 16.5 Q33 22 29 26 Q24 32 14 31";

export function Head({
  eyes = "open",
  hair = BROWN,
  style = "bun",
  phones,
  rim,
  clip,
}: {
  eyes?: "open" | "down" | "closed";
  hair?: Hair;
  style?: HairStyle;
  phones?: { band: string; cup: string; pad: string };
  rim?: string;
  clip?: string;
}) {
  return (
    <g>
      {/* neck */}
      <path d="M-11 14 L-9 50 L13 50 L10 22 Z" fill={SKIN.shade} />
      {/* back hair */}
      {style === "bun" ? (
        <>
          <path d="M-34 -18 C-46 6 -38 28 -18 32 L-6 28 L-8 -10 Z" fill={hair.base} />
          <circle cx="-30" cy="-46" r="18" fill={hair.base} />
          <path d="M-44 -52 Q-30 -64 -16 -52 M-42 -40 Q-30 -34 -18 -42" stroke={hair.dark} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M-36 -58 Q-30 -62 -24 -60" stroke={hair.hi} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <path d="M-42 -22 C-52 8 -46 34 -22 40 C-6 43 6 36 10 26 L6 -12 Z" fill={hair.base} />
      )}
      <ellipse cx="-6" cy="-14" rx="38" ry="35" fill={hair.base} />

      {/* face */}
      <path d={FACE} fill={SKIN.base} />
      <path d="M-10 12 C-4 22 6 29 14 31 C6 26 0 18 -2 8 Z" fill={SKIN.shade} opacity="0.55" />
      {rim ? <path d={FACE_FRONT} stroke={rim} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85" /> : null}
      <ellipse cx="20" cy="7" rx="6.5" ry="3" fill={SKIN.blush} opacity="0.45" />
      <path d="M31 14.6 L33.6 14.6" stroke={SKIN.lip} strokeWidth="1.6" strokeLinecap="round" />

      {/* eye + brow */}
      <path d="M15 -18 Q22 -21 28 -16.5" stroke={hair.dark} strokeWidth="2" fill="none" strokeLinecap="round" />
      {eyes === "open" ? (
        <g className="cx-blink">
          <ellipse cx="22.5" cy="-4" rx="3.3" ry="4.8" fill={SKIN.eye} />
          <circle cx="23.6" cy="-6" r="1.2" fill="#fff" />
          <path d="M15 -9 Q21.5 -12.5 28 -7.5" stroke={SKIN.eye} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M27.5 -7.8 L30 -9.5" stroke={SKIN.eye} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ) : eyes === "down" ? (
        <g className="cx-blink">
          <path d="M20 -3 Q23 -0.5 26 -3 Z" fill={SKIN.eye} />
          <path d="M15 -5 Q21.5 -7.5 28 -2.5" stroke={SKIN.eye} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M27.5 -2.8 L30 -3.8" stroke={SKIN.eye} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M15.5 -4 Q21.5 0.5 27.5 -4" stroke={SKIN.eye} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M18 -2.2 L17 0.2 M21.5 -1 L21 1.6 M25 -2 L25.4 0.4" stroke={SKIN.eye} strokeWidth="1.1" strokeLinecap="round" />
        </g>
      )}

      {/* ear */}
      {!phones ? (
        <g>
          <ellipse cx="-4" cy="0" rx="6" ry="8.5" fill={SKIN.base} />
          <path d="M-5 -4 Q-1 0 -5 4" stroke={SKIN.shade} strokeWidth="1.6" fill="none" />
        </g>
      ) : null}

      {/* top hair + bangs */}
      <path
        d={
          style === "bun"
            ? "M-42 -14 C-46 -46 -20 -58 4 -54 C22 -51 35 -38 33 -22 C29 -25 25 -24 22 -20 C20 -26 16 -28 12 -25 C10 -21 8 -18 5 -16 C3 -23 -2 -27 -8 -25 C-10 -16 -9 -6 -5 4 C-14 0 -18 -6 -20 -14 Z"
            : "M-46 -10 C-50 -48 -20 -60 6 -55 C26 -51 38 -36 35 -16 C31 -20 28 -19 25 -15 C22 -22 17 -24 13 -21 C11 -16 8 -13 5 -11 C3 -20 -2 -24 -8 -22 C-10 -10 -8 6 -2 20 C-12 14 -18 4 -22 -6 Z"
        }
        fill={hair.base}
      />
      <path
        d={style === "bun" ? "M-30 -44 C-16 -52 4 -50 18 -40" : "M-34 -42 C-16 -52 6 -50 22 -38"}
        stroke={hair.hi}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path d="M-4 -40 C6 -36 14 -30 20 -22 M-16 -36 C-12 -26 -10 -16 -8 -6" stroke={hair.dark} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6" />
      {clip ? <rect x="2" y="-44" width="14" height="5" rx="2.5" fill={clip} transform="rotate(28 9 -42)" /> : null}

      {/* headphones */}
      {phones ? (
        <g>
          <path d="M-8 -14 C-14 -40 -4 -58 12 -56" stroke={phones.band} strokeWidth="6.5" fill="none" strokeLinecap="round" />
          <ellipse cx="-6" cy="0" rx="12" ry="15" fill={phones.cup} />
          <ellipse cx="-6" cy="0" rx="7" ry="10" fill={phones.pad} />
          <ellipse cx="-8" cy="-4" rx="2.5" ry="4" fill="#fff" opacity="0.25" />
        </g>
      ) : null}
    </g>
  );
}

export interface Coat {
  base: string;
  shade: string;
  belly: string;
  patch?: string;
  patch2?: string;
  stripe?: string;
  ear: string;
}
export const CALICO: Coat = { base: "#FBF4EA", shade: "#E4D6C4", belly: "#FFFFFF", patch: "#E19A52", patch2: "#5A4436", ear: "#F2B2A8" };
export const GINGER: Coat = { base: "#EE9F57", shade: "#D27F3C", belly: "#FCE7CF", stripe: "#C66E2F", ear: "#F4B2A2" };
export const TUXEDO: Coat = { base: "#3D3A3E", shade: "#2A272C", belly: "#F7F3EE", ear: "#E7A49C" };
export const GREY: Coat = { base: "#9AA0A8", shade: "#7D838C", belly: "#E9ECEF", stripe: "#6E747D", ear: "#E9AAA4" };

/** Cat sitting upright, three-quarter view. Origin: between the front paws, on the ground. */
export function SittingCat({ coat, rim }: { coat: Coat; rim?: string }) {
  return (
    <g>
      <ellipse cx="2" cy="1" rx="40" ry="5" fill="#000" opacity="0.18" />
      <g className="cx-tail" style={{ transformOrigin: "24px -8px" }}>
        <path d="M22 -8 C52 -12 56 -54 40 -84" stroke={coat.base} strokeWidth="11" fill="none" strokeLinecap="round" />
        {coat.patch ? <path d="M48 -48 C51 -62 47 -74 40 -84" stroke={coat.patch} strokeWidth="11" fill="none" strokeLinecap="round" /> : null}
        {coat.stripe ? <path d="M42 -30 L54 -32 M48 -50 L58 -48" stroke={coat.stripe} strokeWidth="3.5" strokeLinecap="round" /> : null}
      </g>
      {/* body */}
      <path d="M-32 0 C-38 -34 -24 -68 2 -70 C28 -68 38 -34 32 0 Z" fill={coat.base} />
      <path d="M8 -68 C26 -62 36 -36 32 0 L22 0 C26 -30 22 -54 8 -68 Z" fill={coat.shade} opacity="0.7" />
      {coat.patch ? <path d="M-30 -20 C-34 -44 -20 -62 -6 -64 C-8 -48 -14 -34 -30 -20 Z" fill={coat.patch} /> : null}
      {coat.patch2 ? <path d="M14 -64 C26 -58 32 -44 30 -30 C22 -36 16 -48 14 -64 Z" fill={coat.patch2} /> : null}
      {coat.stripe ? (
        <g stroke={coat.stripe} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M-30 -30 Q-22 -32 -18 -26" />
          <path d="M-31 -16 Q-23 -18 -19 -12" />
          <path d="M30 -30 Q22 -32 18 -26" />
        </g>
      ) : null}
      <path d="M-12 -62 C-18 -40 -14 -16 -8 0 L10 0 C16 -16 18 -40 12 -62 Z" fill={coat.belly} />
      {/* front legs */}
      <path d="M-14 -30 L-14 -2 Q-14 2 -9 2 L-4 2 Q-1 2 -1 -2 L-1 -30 Z" fill={coat.belly} />
      <path d="M3 -30 L3 -2 Q3 2 8 2 L12 2 Q16 2 16 -2 L16 -30 Z" fill={coat.belly} />
      <path d="M-11 0 L-11 -3 M-6 0 L-6 -3 M7 0 L7 -3 M12 0 L12 -3" stroke="#000" strokeOpacity="0.15" strokeWidth="1.2" strokeLinecap="round" />
      {rim ? <path d="M-32 0 C-38 -34 -24 -68 2 -70" stroke={rim} strokeWidth="2.5" fill="none" opacity="0.8" strokeLinecap="round" /> : null}
      {/* head */}
      <g transform="translate(0 -88)">
        <path d="M-24 -6 L-20 -34 L-4 -20 Z" fill={coat.patch ?? coat.base} stroke={coat.patch ?? coat.base} strokeWidth="4" strokeLinejoin="round" />
        <path d="M24 -6 L20 -34 L4 -20 Z" fill={coat.patch2 ?? coat.base} stroke={coat.patch2 ?? coat.base} strokeWidth="4" strokeLinejoin="round" />
        <path d="M-19 -12 L-17 -27 L-8 -19 Z" fill={coat.ear} />
        <path d="M19 -12 L17 -27 L8 -19 Z" fill={coat.ear} />
        <path d="M-27 2 C-28 -16 -14 -24 0 -24 C14 -24 28 -16 27 2 C26 16 14 22 0 22 C-14 22 -26 16 -27 2 Z" fill={coat.base} />
        {coat.patch ? <path d="M-27 2 C-28 -16 -14 -24 -2 -24 C-6 -14 -10 -6 -24 -2 Z" fill={coat.patch} /> : null}
        {coat.patch2 ? <path d="M27 2 C28 -16 14 -24 4 -24 C8 -12 14 -6 26 -4 Z" fill={coat.patch2} /> : null}
        {coat.stripe ? (
          <g stroke={coat.stripe} strokeWidth="2.8" strokeLinecap="round">
            <path d="M-5 -23 L-4 -15 M0 -24 L0 -15 M5 -23 L4 -15" />
          </g>
        ) : null}
        <ellipse cx="0" cy="10" rx="13" ry="9" fill={coat.belly} />
        <g className="cx-blink">
          <ellipse cx="-10" cy="0" rx="4.4" ry="5.4" fill="#C9A13A" />
          <ellipse cx="10" cy="0" rx="4.4" ry="5.4" fill="#C9A13A" />
          <ellipse cx="-9.6" cy="0.4" rx="1.8" ry="4.4" fill="#2A1E18" />
          <ellipse cx="10.4" cy="0.4" rx="1.8" ry="4.4" fill="#2A1E18" />
          <circle cx="-8.6" cy="-2" r="1.3" fill="#fff" />
          <circle cx="11.4" cy="-2" r="1.3" fill="#fff" />
        </g>
        <path d="M-2.6 7 L2.6 7 L0 10 Z" fill="#D98A86" />
        <path d="M0 10 Q-2 14 -5 13 M0 10 Q2 14 5 13" stroke="#3A2A24" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <g stroke="#3A2A24" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round">
          <path d="M-10 9 L-30 6 M-10 12 L-30 13 M10 9 L30 6 M10 12 L30 13" />
        </g>
      </g>
    </g>
  );
}

/** Cat curled up asleep, side view. Origin: bottom centre. */
export function CurledCat({ coat }: { coat: Coat }) {
  return (
    <g>
      <ellipse cx="0" cy="1" rx="54" ry="5" fill="#000" opacity="0.18" />
      <g className="cx-breathe" style={{ transformOrigin: "0px 0px" }}>
        <path d="M-50 0 C-54 -26 -26 -44 6 -44 C36 -44 56 -26 52 0 Z" fill={coat.base} />
        <path d="M14 -42 C38 -38 54 -22 52 0 L30 0 C34 -18 28 -32 14 -42 Z" fill={coat.shade} opacity="0.6" />
        {coat.patch2 ? <path d="M-6 -44 C14 -46 32 -40 40 -30 C24 -24 4 -28 -6 -44 Z" fill={coat.patch2} /> : null}
        {coat.stripe ? (
          <g stroke={coat.stripe} strokeWidth="3.4" strokeLinecap="round" fill="none">
            <path d="M0 -44 Q3 -36 0 -28" />
            <path d="M14 -43 Q17 -35 14 -27" />
            <path d="M28 -38 Q31 -30 28 -22" />
          </g>
        ) : null}
      </g>
      <path d="M48 -6 C40 8 -2 8 -24 -2" stroke={coat.shade} strokeWidth="11" fill="none" strokeLinecap="round" />
      {coat.stripe ? <path d="M30 2 L28 -6 M14 4 L13 -4" stroke={coat.stripe} strokeWidth="3" strokeLinecap="round" /> : null}
      {/* tucked head */}
      <g transform="translate(-30 -18)">
        <path d="M-18 -4 L-17 -26 L-3 -14 Z" fill={coat.base} stroke={coat.base} strokeWidth="4" strokeLinejoin="round" />
        <path d="M6 -14 L14 -28 L18 -8 Z" fill={coat.patch2 ?? coat.base} stroke={coat.patch2 ?? coat.base} strokeWidth="4" strokeLinejoin="round" />
        <path d="M-14 -8 L-14 -20 L-7 -14 Z" fill={coat.ear} />
        <ellipse cx="0" cy="2" rx="22" ry="17" fill={coat.base} />
        <ellipse cx="2" cy="10" rx="11" ry="6.5" fill={coat.belly} />
        <path d="M-12 2 Q-8 5.5 -4 2 M6 2 Q10 5.5 14 2" stroke="#2A1E18" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M0.4 7.6 L4.4 7.6 L2.4 10 Z" fill="#D98A86" />
        <ellipse cx="-12" cy="9" rx="4" ry="2.2" fill="#EE9C93" opacity="0.35" />
      </g>
      <ellipse cx="-14" cy="-2" rx="9" ry="5" fill={coat.belly} />
    </g>
  );
}

/** Common filters. Pass a unique prefix per SVG. */
export function Filters({ p }: { p: string }) {
  return (
    <>
      <filter id={`${p}-b2`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
      <filter id={`${p}-b6`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id={`${p}-b14`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <filter id={`${p}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </>
  );
}

/** Painterly film grain over the whole scene. */
export function Grain({ p, opacity = 0.07 }: { p: string; opacity?: number }) {
  return <rect width="800" height="500" filter={`url(#${p}-grain)`} opacity={opacity} style={{ mixBlendMode: "overlay" }} />;
}

export function Steam({ x, y, color = "#fff" }: { x: number; y: number; color?: string }) {
  return (
    <g>
      {[0, 1].map((i) => (
        <path
          key={i}
          d={`M${x + i * 9} ${y} c-6 -10 6 -16 0 -28`}
          stroke={color}
          strokeOpacity="0.6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          className="cx-steam"
          style={{ animationDelay: `${-i * 1.6}s` }}
        />
      ))}
    </g>
  );
}

/** Seeded positions so server and client agree. */
export function seeded(n: number, seed: number) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: n }, () => [Math.round(r() * 1000) / 1000, Math.round(r() * 1000) / 1000, Math.round(r() * 1000) / 1000] as const);
}
