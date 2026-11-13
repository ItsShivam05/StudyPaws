"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CatCoat } from "@/lib/avatars";
import { cn } from "@/lib/utils";

const INK = "#3D322B";

/** The companion curled up asleep on the windowsill while you focus. */
export function CurledCat({
  coat,
  name,
  onPet,
  still = false,
  className,
}: {
  coat: CatCoat;
  name: string;
  onPet?: () => void;
  still?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const calm = still || !!reduce;
  return (
    <motion.button
      type="button"
      onClick={onPet}
      aria-label={`Pet ${name}`}
      title={`Pet ${name}`}
      className={cn("block w-full cursor-pointer select-none rounded-[40%]", className)}
      whileTap={calm ? undefined : { scale: 0.95 }}
    >
      <svg viewBox="0 0 130 78" className="w-full overflow-visible">
        <ellipse cx="66" cy="72" rx="52" ry="4" fill={INK} opacity="0.14" />
        <motion.g
          style={{ originX: 0.5, originY: 1 }}
          animate={calm ? {} : { scaleY: [1, 1.045, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M22 70 C14 44 40 24 72 24 C102 24 122 44 116 70 Z" fill={coat.base} />
          <path d="M84 70 C82 50 96 37 110 45 C118 52 119 62 116 70 Z" fill={coat.shade} opacity="0.45" />
          {coat.patch ? <path d="M60 26 C76 22 94 28 102 38 C90 44 72 42 60 26 Z" fill={coat.patch} /> : null}
          {coat.stripe ? (
            <g stroke={coat.stripe} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8">
              <path d="M66 26 Q68 32 66 38" />
              <path d="M78 26 Q80 32 78 38" />
              <path d="M90 29 Q92 35 90 41" />
            </g>
          ) : null}
        </motion.g>
        {/* Tail wrapped round the front */}
        <path d="M112 65 C96 76 62 76 46 68" fill="none" stroke={coat.shade} strokeWidth="10" strokeLinecap="round" />
        {/* Head tucked on the paws */}
        <path d="M20 46 L21 27 L36 37 Z" fill={coat.base} stroke={coat.base} strokeWidth="4" strokeLinejoin="round" />
        <path d="M43 36 L53 23 L58 42 Z" fill={coat.base} stroke={coat.base} strokeWidth="4" strokeLinejoin="round" />
        <path d="M24 41 L24.5 32 L32 37 Z" fill={coat.ear} />
        <path d="M47 36 L52 29 L54.5 39 Z" fill={coat.ear} />
        <ellipse cx="38" cy="52" rx="22" ry="17.5" fill={coat.base} />
        <ellipse cx="38" cy="59" rx="11" ry="7" fill={coat.belly} opacity="0.85" />
        <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M26 53 Q30 56.5 34 53" />
          <path d="M42 53 Q46 56.5 50 53" />
        </g>
        <path d="M36.2 58 Q38 57.2 39.8 58 Q38.9 60 38 60.2 Q37.1 60 36.2 58 Z" fill="#D98A86" />
        <ellipse cx="27" cy="60" rx="4" ry="2.4" fill="#EE9C93" opacity="0.3" />
        <ellipse cx="49" cy="60" rx="4" ry="2.4" fill="#EE9C93" opacity="0.3" />
        {!calm
          ? [0, 1, 2].map((i) => (
              <motion.text
                key={i}
                x={62 + i * 7}
                y={22 - i * 9}
                fontSize={9 + i * 3}
                fontFamily="var(--font-display-face), serif"
                fill={INK}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: [0, 0.7, 0], y: [4, -4, -10] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
              >
                z
              </motion.text>
            ))
          : null}
      </svg>
    </motion.button>
  );
}
