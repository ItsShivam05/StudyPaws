import type { CatCoat } from "@/lib/avatars";

export type EyeStyle = "open" | "closed" | "happy";

const INK = "#3D322B";

/** Ears + head + face. Shared by the big companion and the small avatars. */
export function CatHead({
  coat,
  eyes,
  blush = 0.25,
  mouthOpen = false,
  pupilX = 0,
  blinkScale = 1,
  earTwitch = 0,
}: {
  coat: CatCoat;
  eyes: EyeStyle;
  blush?: number;
  mouthOpen?: boolean;
  pupilX?: number;
  blinkScale?: number;
  earTwitch?: number;
}) {
  return (
    <g>
      {/* Ears */}
      <g style={{ transformOrigin: "84px 62px", transform: `rotate(${-earTwitch}deg)` }}>
        <path d="M66 74 L70 30 L100 50 Z" fill={coat.base} stroke={coat.base} strokeWidth="8" strokeLinejoin="round" />
        <path d="M74 64 L76 41 L92 53 Z" fill={coat.ear} stroke={coat.ear} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g>
        <path
          d="M154 74 L150 30 L120 50 Z"
          fill={coat.patch ? INK : coat.base}
          stroke={coat.patch ? INK : coat.base}
          strokeWidth="8"
          strokeLinejoin="round"
          opacity={coat.patch ? 0.85 : 1}
        />
        <path d="M146 64 L144 41 L128 53 Z" fill={coat.ear} stroke={coat.ear} strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* Head */}
      <path
        d="M60 92 C58 58 84 46 110 46 C136 46 162 58 160 92 C159 117 137 129 110 129 C83 129 61 117 60 92 Z"
        fill={coat.base}
      />
      {coat.patch ? (
        <>
          <path d="M62 86 C62 62 80 50 100 48 C98 62 90 74 74 82 C70 84 66 86 62 86 Z" fill={coat.patch} />
          <path d="M150 58 C158 66 160 78 159 88 C150 84 140 76 136 64 C140 60 145 58 150 58 Z" fill={INK} opacity="0.85" />
        </>
      ) : null}
      {/* Muzzle */}
      <ellipse cx="110" cy="106" rx="24" ry="16" fill={coat.belly} opacity="0.85" />

      {/* Stripes */}
      {coat.stripe ? (
        <g stroke={coat.stripe} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M103 51 L105 62" />
          <path d="M110 49 L110 62" />
          <path d="M117 51 L115 62" />
          <path d="M62 92 L72 94" />
          <path d="M63 100 L72 100" />
          <path d="M158 92 L148 94" />
          <path d="M157 100 L148 100" />
        </g>
      ) : null}

      {/* Blush */}
      <ellipse cx="80" cy="106" rx="8" ry="4.5" fill="#EE9C93" opacity={blush} />
      <ellipse cx="140" cy="106" rx="8" ry="4.5" fill="#EE9C93" opacity={blush} />

      {/* Eyes */}
      {eyes === "open" ? (
        <g style={{ transformOrigin: "110px 89px", transform: `scaleY(${blinkScale})` }}>
          <ellipse cx="91" cy="89" rx="6.4" ry="7.6" fill={coat.eye === INK ? INK : coat.eye} />
          <ellipse cx="129" cy="89" rx="6.4" ry="7.6" fill={coat.eye === INK ? INK : coat.eye} />
          {coat.eye !== INK ? (
            <>
              <ellipse cx={91 + pupilX} cy="89.5" rx="2.6" ry="6" fill={INK} />
              <ellipse cx={129 + pupilX} cy="89.5" rx="2.6" ry="6" fill={INK} />
            </>
          ) : null}
          <circle cx={93.2 + pupilX * 0.6} cy="86" r="2.2" fill="#fff" />
          <circle cx={131.2 + pupilX * 0.6} cy="86" r="2.2" fill="#fff" />
          <circle cx={89.5 + pupilX * 0.6} cy="92" r="1" fill="#fff" opacity="0.8" />
          <circle cx={127.5 + pupilX * 0.6} cy="92" r="1" fill="#fff" opacity="0.8" />
        </g>
      ) : eyes === "closed" ? (
        <g stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M84 90 Q91 95 98 90" />
          <path d="M122 90 Q129 95 136 90" />
        </g>
      ) : (
        <g stroke={INK} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M84 92 Q91 82 98 92" />
          <path d="M122 92 Q129 82 136 92" />
        </g>
      )}

      {/* Nose & mouth */}
      <path d="M106 100 Q110 98.5 114 100 Q112 104 110 104.5 Q108 104 106 100 Z" fill="#D98A86" />
      {mouthOpen ? (
        <path d="M103 107 Q110 106 117 107 Q116 116 110 116 Q104 116 103 107 Z" fill="#B65E5A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      ) : (
        <path d="M110 104.5 Q108 110 102.5 108.5 M110 104.5 Q112 110 117.5 108.5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      )}

      {/* Whiskers */}
      <g stroke={INK} strokeOpacity="0.28" strokeWidth="1.3" strokeLinecap="round">
        <path d="M80 101 L56 97" />
        <path d="M80 106 L57 108" />
        <path d="M140 101 L164 97" />
        <path d="M140 106 L163 108" />
      </g>
    </g>
  );
}
