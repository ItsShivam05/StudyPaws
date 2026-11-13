"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CatMood } from "@/types";
import type { CatCoat } from "@/lib/avatars";
import { CatHead, type EyeStyle } from "./cat-parts";
import { cn } from "@/lib/utils";

const INK = "#3D322B";

interface CatProps {
  mood: CatMood;
  coat: CatCoat;
  name: string;
  onPet?: () => void;
  className?: string;
}

/**
 * The study companion. Pure SVG + Framer Motion, so it stays crisp at any
 * size and costs almost nothing to animate.
 */
export function Cat({ mood, coat, name, onPet, className }: CatProps) {
  const reduce = useReducedMotion();
  const [blink, setBlink] = useState(false);
  const [twitch, setTwitch] = useState(false);
  const [pupil, setPupil] = useState(0);

  // Natural, irregular blinking and ear twitches.
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 140);
        if (Math.random() < 0.3) {
          setTwitch(true);
          setTimeout(() => alive && setTwitch(false), 220);
        }
        loop();
      }, 2200 + Math.random() * 3800);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduce]);

  // Reading: eyes drift left → right across the page, then snap back.
  useEffect(() => {
    if (mood !== "studying" || reduce) return;
    let x = -2;
    const id = setInterval(() => {
      x = x >= 2 ? -2 : x + 1;
      setPupil(x);
    }, 650);
    return () => clearInterval(id);
  }, [mood, reduce]);

  const eyes: EyeStyle = mood === "sleeping" ? "closed" : mood === "happy" || mood === "celebrating" ? "happy" : "open";

  const bodyAnim = reduce
    ? {}
    : mood === "celebrating"
      ? { y: [0, -16, 0, -9, 0], transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.25, ease: "easeOut" as const } }
      : mood === "happy"
        ? { y: [0, -4, 0], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" as const } }
        : { y: 0 };

  const breathe = reduce
    ? {}
    : {
        scaleY: mood === "sleeping" ? [1, 1.035, 1] : [1, 1.018, 1],
        transition: { duration: mood === "sleeping" ? 4.2 : 3.2, repeat: Infinity, ease: "easeInOut" as const },
      };

  const tailAnim = reduce
    ? {}
    : {
        rotate:
          mood === "happy" || mood === "celebrating"
            ? [0, 14, -4, 14, 0]
            : mood === "sleeping"
              ? [0, 3, 0]
              : [0, 8, -3, 0],
        transition: {
          duration: mood === "happy" || mood === "celebrating" ? 1.1 : mood === "sleeping" ? 6 : 4.5,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  const headTilt = mood === "sleeping" ? { rotate: -6, y: 7 } : mood === "studying" ? { rotate: 0, y: 3 } : { rotate: 0, y: 0 };

  return (
    <div className={cn("relative select-none", className)}>
      <motion.button
        type="button"
        onClick={onPet}
        aria-label={`Pet ${name}`}
        title={`Pet ${name}`}
        className="block size-full cursor-pointer rounded-[40%] focus-visible:outline-offset-[-8px]"
        whileTap={reduce ? undefined : { scale: 0.96 }}
      >
        <motion.svg viewBox="0 0 220 210" className="size-full overflow-visible" animate={bodyAnim}>
          {/* Soft contact shadow */}
          <ellipse cx="112" cy="200" rx="70" ry="7" fill={INK} opacity="0.12" />

          {/* Tail */}
          <motion.g style={{ originX: 0, originY: 1 }} animate={tailAnim}>
            <path
              d="M150 182 C186 184 200 160 192 134 C188 120 178 114 172 120"
              fill="none"
              stroke={coat.shade}
              strokeWidth="15"
              strokeLinecap="round"
            />
            {coat.stripe ? (
              <path
                d="M190 150 L178 147 M193 136 L181 138"
                stroke={coat.stripe}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            ) : null}
          </motion.g>

          {/* Body */}
          <motion.g style={{ originX: 0.5, originY: 1 }} animate={breathe}>
            <path d="M58 194 C50 150 72 112 110 112 C148 112 170 150 162 194 Z" fill={coat.base} />
            <path d="M60 194 C54 160 66 132 84 120 C74 146 72 170 78 194 Z" fill={coat.shade} opacity="0.45" />
            {coat.patch ? (
              <path d="M132 120 C152 128 164 152 162 178 C150 176 138 160 134 142 C132 134 131 126 132 120 Z" fill={coat.patch} />
            ) : null}
            <ellipse cx="110" cy="164" rx="27" ry="27" fill={coat.belly} opacity="0.9" />
            {coat.stripe ? (
              <g stroke={coat.stripe} strokeWidth="3.4" strokeLinecap="round" fill="none" opacity="0.8">
                <path d="M66 150 Q74 148 78 152" />
                <path d="M64 164 Q72 162 77 166" />
                <path d="M154 150 Q146 148 142 152" />
                <path d="M156 164 Q148 162 143 166" />
              </g>
            ) : null}
            {/* Paws */}
            <ellipse cx="92" cy="194" rx="14" ry="8.5" fill={coat.base} />
            <ellipse cx="128" cy="194" rx="14" ry="8.5" fill={coat.base} />
            <path d="M88 196 L88 191 M96 196 L96 191 M124 196 L124 191 M132 196 L132 191" stroke={INK} strokeOpacity="0.18" strokeWidth="1.4" strokeLinecap="round" />
          </motion.g>

          {/* Head */}
          <motion.g
            style={{ originX: 0.5, originY: 0.85 }}
            animate={reduce ? headTilt : { ...headTilt, transition: { type: "spring", stiffness: 120, damping: 14 } }}
          >
            <CatHead
              coat={coat}
              eyes={eyes}
              blush={mood === "happy" || mood === "celebrating" ? 0.6 : 0.28}
              mouthOpen={mood === "celebrating"}
              pupilX={mood === "studying" ? pupil : 0}
              blinkScale={blink && eyes === "open" ? 0.1 : 1}
              earTwitch={twitch ? 10 : 0}
            />
            {/* Study glasses */}
            <AnimatePresence>
              {mood === "studying" ? (
                <motion.g
                  key="glasses"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <circle cx="91" cy="89" r="12.5" fill="#fff" fillOpacity="0.14" stroke={INK} strokeWidth="2.2" />
                  <circle cx="129" cy="89" r="12.5" fill="#fff" fillOpacity="0.14" stroke={INK} strokeWidth="2.2" />
                  <path d="M103.5 88 Q110 84 116.5 88" stroke={INK} strokeWidth="2.2" fill="none" />
                </motion.g>
              ) : null}
            </AnimatePresence>
          </motion.g>

          {/* Book while studying */}
          <AnimatePresence>
            {mood === "studying" ? (
              <motion.g
                key="book"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                transition={{ type: "spring", stiffness: 160, damping: 18 }}
              >
                <path d="M64 178 L110 186 L156 178 L156 204 L110 210 L64 204 Z" fill="#7F9068" />
                <path d="M68 174 Q90 168 110 180 L110 204 Q90 194 68 199 Z" fill="#FBF6EE" />
                <path d="M152 174 Q130 168 110 180 L110 204 Q130 194 152 199 Z" fill="#F3EADC" />
                <g stroke={INK} strokeOpacity="0.2" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M76 180 L102 185 M76 186 L102 191 M76 192 L96 196" />
                  <path d="M118 185 L144 180 M118 191 L144 186 M118 197 L138 193" />
                </g>
              </motion.g>
            ) : null}
          </AnimatePresence>

          {/* Sleepy Zzz */}
          <AnimatePresence>
            {mood === "sleeping" && !reduce ? (
              <motion.g key="z" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[0, 1, 2].map((i) => (
                  <motion.text
                    key={i}
                    x={160 + i * 9}
                    y={52 - i * 12}
                    fontSize={12 + i * 4}
                    fontFamily="var(--font-display-face), serif"
                    fill={INK}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: [0, 0.7, 0], y: [6, -6, -14] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                  >
                    z
                  </motion.text>
                ))}
              </motion.g>
            ) : null}
          </AnimatePresence>

          {/* Celebration sparkles */}
          <AnimatePresence>
            {mood === "celebrating" && !reduce ? (
              <motion.g key="sparkles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[
                  [36, 70, "#E8B04B"],
                  [186, 64, "#A3B18A"],
                  [24, 130, "#EE9C93"],
                  [200, 116, "#E8B04B"],
                  [60, 30, "#A3B18A"],
                  [170, 24, "#EE9C93"],
                ].map(([x, y, c], i) => (
                  <motion.path
                    key={i}
                    d={`M${x} ${(y as number) - 7} L${(x as number) + 2} ${(y as number) - 2} L${(x as number) + 7} ${y} L${(x as number) + 2} ${(y as number) + 2} L${x} ${(y as number) + 7} L${(x as number) - 2} ${(y as number) + 2} L${(x as number) - 7} ${y} L${(x as number) - 2} ${(y as number) - 2} Z`}
                    fill={c as string}
                    style={{ originX: 0.5, originY: 0.5 }}
                    animate={{ scale: [0, 1.2, 0], rotate: [0, 90] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22 }}
                  />
                ))}
              </motion.g>
            ) : null}
          </AnimatePresence>
        </motion.svg>
      </motion.button>
    </div>
  );
}
