"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** What the student is doing, derived from the timer (see RoomStage). */
export type StudentPose = "focus" | "break" | "idle" | "doze" | "complete";

type Action = "write" | "chin" | "doze" | "stretch" | "look" | "sip" | "cheer";

const HOODIE = "#8E9E7C";
const HOODIE_LIT = "#A0AE8C";
const HOODIE_SHADE = "#74846A";
const HOOD = "#7E8E70";
const SKIN = "#EBC2A2";
const SKIN_SHADE = "#D9A988";
const HAIR = "#4B3A33";
const HAIR_DARK = "#3A2C27";
const CREAM = "#F1E7D8";
const CUP = "#C98F6B";
const CUP_DARK = "#A8704F";
const INK = "#3D322B";
const RIM = "#FFD9A0";

/**
 * Joint angles (degrees) per action. Right arm: `ru` turns the upper arm at
 * the shoulder, `rf` the forearm at the elbow (relative to the upper arm).
 * Left arm likewise; at rest it is tucked behind the torso.
 */
const POSES: Record<Action, { head: number; headY: number; ru: number; rf: number; lu: number; lf: number; lift: number }> = {
  write: { head: 4, headY: 3, ru: 0, rf: 0, lu: 0, lf: 0, lift: 0 },
  chin: { head: 7, headY: 2, ru: -48, rf: -72, lu: 0, lf: 0, lift: 0 },
  doze: { head: 12, headY: 6, ru: -48, rf: -72, lu: 0, lf: 0, lift: 2 },
  look: { head: -4, headY: -2, ru: 0, rf: 0, lu: 0, lf: 0, lift: 0 },
  sip: { head: -2, headY: -1, ru: -50, rf: -70, lu: 0, lf: 0, lift: 0 },
  stretch: { head: -7, headY: -4, ru: -62, rf: 5, lu: -196, lf: 104, lift: -5 },
  cheer: { head: -7, headY: -4, ru: -62, rf: 5, lu: -196, lf: 104, lift: -6 },
};

/** Rotate around a point given in the drawing's own coordinates. */
function pivot(x: number, y: number) {
  return { transformBox: "view-box" as const, originX: `${x}px`, originY: `${y}px` };
}

const loop = (duration: number, repeatDelay = 0) => ({
  duration,
  repeat: Infinity,
  repeatDelay,
  ease: "easeInOut" as const,
});

/**
 * The study buddy: an original character seated at the desk, seen from
 * behind in three-quarter view. Drawn in its own 800×520 space and placed
 * over the scene (viewBox 800×500) so joints can pivot on exact points.
 */
export function Student({
  pose,
  still = false,
  className,
}: {
  pose: StudentPose;
  /** low-motion: hold each pose, no loops */
  still?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const calm = still || !!reduce;

  // Break routine: stretch once, then alternate looking outside and sipping tea.
  const [cycle, setCycle] = useState({ pose, n: 0 });
  const n = cycle.pose === pose ? cycle.n : 0;
  useEffect(() => {
    if (pose !== "break" || calm) return;
    const ms = n === 0 ? 3400 : n % 2 ? 6500 : 2800;
    const t = setTimeout(() => setCycle({ pose, n: n + 1 }), ms);
    return () => clearTimeout(t);
  }, [pose, n, calm]);

  // Turn a page every so often while writing.
  const [flip, setFlip] = useState(0);
  useEffect(() => {
    if (pose !== "focus" || calm) return;
    const id = setInterval(() => setFlip((f) => f + 1), 17_000);
    return () => clearInterval(id);
  }, [pose, calm]);

  const action: Action =
    pose === "focus"
      ? "write"
      : pose === "idle"
        ? "chin"
        : pose === "doze"
          ? "doze"
          : pose === "complete"
            ? "cheer"
            : calm
              ? "look"
              : n === 0
                ? "stretch"
                : n % 2
                  ? "look"
                  : "sip";
  const p = POSES[action];
  const holdingMug = action === "look" || action === "sip";
  const mugOnDesk = pose === "break" && !holdingMug;
  const writing = action === "write";

  const move = calm ? { duration: 0 } : ({ type: "spring", stiffness: 60, damping: 13 } as const);
  const rest = calm ? { duration: 0 } : { duration: 0.4 };

  return (
    <svg
      viewBox="0 0 800 500"
      className={cn("parallax-near pointer-events-none absolute inset-0 size-full", className)}
      aria-hidden="true"
    >
      <svg x="-40" y="39" width="720" height="468" viewBox="0 0 800 520" overflow="visible">
        {/* Notebook */}
        <ellipse cx="404" cy="397" rx="58" ry="4.5" fill={INK} opacity="0.1" />
        <path d="M350 385 L442 377 L454 387 L362 395 Z" fill="#F7F1E7" />
        <path d="M350 385 L362 395 L362 397.5 L350 387.5 Z" fill="#D8CCB9" />
        <path d="M362 395 L454 387 L454 389.5 L362 397.5 Z" fill="#E4D9C8" />
        <path d="M396 381 L408 391" stroke="#CFC2AE" strokeWidth="1.4" />
        <path
          d="M362 387 L390 384.6 M366 390.4 L394 388 M412 383 L440 380.6 M416 386.4 L444 384"
          stroke="#8B735F"
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />
        {writing && flip > 0 && !calm ? (
          <motion.path
            key={flip}
            fill="#FBF6EE"
            stroke="#D8CCB9"
            strokeWidth="0.8"
            initial={{ d: "M396 381 L442 377 L454 387 L408 391 Z", opacity: 0 }}
            animate={{
              d: [
                "M396 381 L442 377 L454 387 L408 391 Z",
                "M396 381 L404 359 L416 369 L408 391 Z",
                "M396 381 L350 385 L362 395 L408 391 Z",
              ],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />
        ) : null}
        {/* Pencil put down / mug set down when the hands are busy elsewhere */}
        {!writing ? <path d="M442 394 L470 390" stroke="#E8B04B" strokeWidth="4" strokeLinecap="round" /> : null}
        <motion.g initial={false} animate={{ opacity: mugOnDesk ? 1 : 0 }} transition={rest}>
          <Mug />
        </motion.g>

        <motion.g initial={false} animate={{ y: p.lift }} transition={move}>
          <motion.g
            initial={false}
            animate={calm ? { y: 0 } : action === "cheer" ? { y: [0, -5, 0] } : { y: [0, -1.4, 0] }}
            transition={calm ? rest : action === "cheer" ? loop(1.1, 0.2) : loop(action === "doze" ? 5 : 4.2)}
          >
            {/* Left arm — tucked behind the torso until it stretches */}
            <motion.g style={pivot(134, 418)} initial={false} animate={{ rotate: p.lu }} transition={move}>
              <path d="M134 418 L134 470" stroke={HOODIE_SHADE} strokeWidth="36" strokeLinecap="round" />
              <motion.g style={pivot(134, 470)} initial={false} animate={{ rotate: p.lf }} transition={move}>
                <path d="M134 470 L180 470" stroke={HOODIE_SHADE} strokeWidth="28" strokeLinecap="round" />
                <circle cx="193" cy="470" r="10" fill={SKIN_SHADE} />
              </motion.g>
            </motion.g>

            {/* Hoodie */}
            <path
              d="M92 520 C92 452 104 410 138 394 C162 383 188 378 214 378 C246 378 282 382 304 396 C326 410 334 452 336 520 Z"
              fill={HOODIE}
            />
            <path
              d="M92 520 C92 452 104 410 138 394 C150 389 160 386 172 383 C150 410 140 456 140 520 Z"
              fill={HOODIE_SHADE}
              opacity="0.55"
            />
            <path d="M214 412 L212 520" stroke={INK} strokeOpacity="0.07" strokeWidth="2" />
            <path d="M302 395 C325 409 333 452 335 520" stroke={RIM} strokeOpacity="0.4" strokeWidth="3" fill="none" />
            <rect x="208" y="336" width="30" height="36" rx="12" fill={SKIN_SHADE} />
            <path
              d="M150 392 C160 366 190 356 216 356 C244 356 272 366 282 390 C262 404 236 410 214 410 C192 410 168 404 150 392 Z"
              fill={HOOD}
            />
            <path d="M160 392 C182 402 246 404 272 390" stroke={INK} strokeOpacity="0.1" strokeWidth="2" fill="none" />

            {/* Head */}
            <motion.g
              style={pivot(222, 356)}
              initial={false}
              animate={{ rotate: p.head, y: p.headY }}
              transition={move}
            >
              <motion.g
                style={pivot(222, 356)}
                initial={false}
                animate={
                  calm
                    ? { rotate: 0 }
                    : writing
                      ? { rotate: [0, 2.6, 0] }
                      : action === "doze"
                        ? { rotate: [0, 1.6, 0] }
                        : { rotate: 0 }
                }
                transition={calm ? rest : writing ? loop(2.4, 0.3) : action === "doze" ? loop(5) : rest}
              >
                <ellipse cx="234" cy="301" rx="44" ry="45" fill={SKIN} />
                <ellipse cx="268" cy="318" rx="5.5" ry="3.5" fill="#EE9C93" opacity="0.45" />
                <path
                  d="M182 306 C178 268 200 246 228 246 C256 246 276 262 275 284 C266 282 258 286 257 294 L255 326 C253 340 246 348 234 352 C216 357 198 352 190 340 C184 330 182 318 182 306 Z"
                  fill={HAIR}
                />
                <path
                  d="M214 250 C204 270 202 300 208 332 M236 249 C241 270 241 302 236 336"
                  stroke={HAIR_DARK}
                  strokeOpacity="0.55"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path d="M222 249 C224 238 238 236 243 246" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M242 246 C260 250 272 264 274 281" stroke={RIM} strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Headphones */}
                <path
                  d="M186 298 C182 262 204 240 230 240 C256 240 272 258 266 294"
                  stroke={CREAM}
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                <rect x="176" y="288" width="15" height="38" rx="7.5" fill={CUP_DARK} />
                <ellipse cx="255" cy="310" rx="11.5" ry="19" fill={CUP} />
                <ellipse cx="254" cy="310" rx="6.5" ry="13" fill={CUP_DARK} />
              </motion.g>
            </motion.g>

            {/* Right arm — writes, props the chin, lifts the mug, stretches */}
            <motion.g style={pivot(296, 412)} initial={false} animate={{ rotate: p.ru }} transition={move}>
              <path d="M296 412 L350 410" stroke={HOODIE_LIT} strokeWidth="38" strokeLinecap="round" />
              <motion.g style={pivot(350, 410)} initial={false} animate={{ rotate: p.rf }} transition={move}>
                <motion.g
                  initial={false}
                  animate={
                    writing && !calm
                      ? { x: [0, 2.5, 5, 7.5, 10, 0], y: [0, -1.2, 0.3, -1.2, 0.3, 0] }
                      : { x: 0, y: 0 }
                  }
                  transition={writing && !calm ? loop(2.2, 0.5) : rest}
                >
                  <path d="M350 410 L393 393.2" stroke={HOODIE_LIT} strokeWidth="28" strokeLinecap="round" />
                  <path d="M389 394.8 L397 391.7" stroke={HOODIE_SHADE} strokeWidth="28" />
                  <motion.g
                    style={pivot(405, 388.5)}
                    initial={false}
                    animate={{
                      rotate: holdingMug ? -(p.ru + p.rf) - (action === "sip" ? 22 : 0) : 0,
                      opacity: holdingMug ? 1 : 0,
                    }}
                    transition={{ rotate: move, opacity: rest }}
                  >
                    <Mug />
                  </motion.g>
                  {writing ? (
                    <>
                      <path d="M401 397 L419 366" stroke="#E8B04B" strokeWidth="4" strokeLinecap="round" />
                      <path d="M401 397 L402.6 394.2" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
                    </>
                  ) : null}
                  <circle cx="405" cy="388.5" r="10" fill={SKIN} />
                </motion.g>
              </motion.g>
            </motion.g>
          </motion.g>
        </motion.g>
      </svg>
    </svg>
  );
}

/** The student's own tea mug, drawn where the resting right hand holds it. */
function Mug() {
  return (
    <g>
      <path d="M422 372 Q432 372 431 380 Q430 387 421 387" stroke={CREAM} strokeWidth="3.5" fill="none" />
      <path d="M398 366 L422 366 L420 392 Q419.5 395 416 395 L404 395 Q400.5 395 400 392 Z" fill={CREAM} />
      <path d="M398.6 374 L421.4 374 L421 379.5 L399 379.5 Z" fill={CUP} />
      <ellipse cx="410" cy="366.5" rx="12" ry="2.6" fill="#6B4F3D" />
    </g>
  );
}
