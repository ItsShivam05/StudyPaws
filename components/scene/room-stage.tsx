"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AvatarId, CatMood, PresenceStatus, SceneId } from "@/types";
import { StudyScene } from "./study-scene";
import { Cat } from "@/components/pet/cat";
import { CurledCat } from "@/components/pet/curled-cat";
import { MiniCat } from "@/components/pet/mini-cat";
import { Student, type StudentPose } from "./student";
import { findArtScene } from "./art";
import type { StudyActivity } from "@/hooks/use-cat-mood";
import { COATS } from "@/lib/avatars";
import { usePreferences } from "@/lib/stores/preferences";
import { useAmbienceStore } from "@/lib/stores/ambience";
import { useUiStore } from "@/lib/stores/ui";
import { playPurr } from "@/lib/audio/chime";
import { cn } from "@/lib/utils";

export interface Friend {
  id: string;
  name: string;
  avatar: AvatarId;
  status: PresenceStatus;
}

// Left edges (% of scene width) of free spots on the windowsill.
// 43.5–55.5% is kept clear: the companion naps there while you focus.
const SILL_SLOTS = [30.5, 24, 61, 37];

const LINES: Record<CatMood, string[]> = {
  idle: ["Ready when you are.", "Shall we start?", "I saved you a spot by the window."],
  studying: ["Let's focus together.", "One page at a time.", "You're doing great."],
  happy: ["Stretch with me!", "Sip some water.", "Rest those eyes."],
  sleeping: ["zz… five more minutes…"],
  celebrating: ["You did it!", "Look at you go!", "That was lovely focus."],
};

// Said from the windowsill when the student takes over the studying.
const NAP_LINES = ["I'll nap right here.", "Wake me at break time.", "Shh… focus time."];

function pick(list: string[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function RoomStage({
  mood,
  activity: activityProp,
  scene,
  friends,
  art = false,
  className,
  children,
  rounded = true,
}: {
  /** Show your chosen illustrated scene (home, focus mode). Shared rooms leave this off. */
  art?: boolean;
  mood: CatMood;
  /** What the timer is doing, without temporary moods. Falls back to the mood. */
  activity?: StudyActivity;
  scene?: SceneId;
  friends?: Friend[];
  className?: string;
  children?: ReactNode;
  rounded?: boolean;
}) {
  const prefs = usePreferences();
  const thunder = useAmbienceStore((s) => s.enabled.thunder);
  const celebrateKey = useUiStore((s) => s.celebrateKey);
  const flashMood = useUiStore((s) => s.flashMood);
  const reduce = useReducedMotion();
  const [bubble, setBubble] = useState<{ id: number; text: string } | null>(null);
  const [hearts, setHearts] = useState<number[]>([]);
  const [confetti, setConfetti] = useState(0);
  const activity: StudyActivity =
    activityProp ?? (mood === "studying" ? "focus" : mood === "happy" ? "break" : "idle");
  const artScene = art && !scene && !friends ? findArtScene(prefs.roomArt) : null;
  const buddy = !artScene && prefs.showBuddy;
  const pose: StudentPose =
    mood === "celebrating"
      ? "complete"
      : activity === "focus"
        ? "focus"
        : activity === "break"
          ? "break"
          : mood === "sleeping"
            ? "doze"
            : "idle";
  // With the student at the desk, the cat curls up on the sill during focus.
  const onSill = buddy && activity === "focus" && mood !== "celebrating";
  const prevMood = useRef(mood);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = (text: string, ms = 3600) => {
    setBubble({ id: Date.now(), text });
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  };

  // Speak up (after a natural little pause) when the mood changes.
  useEffect(() => {
    if (prevMood.current === mood) return;
    prevMood.current = mood;
    if (mood === "sleeping") return;
    const t = setTimeout(() => say(pick(mood === "studying" && buddy ? NAP_LINES : LINES[mood])), 350);
    return () => clearTimeout(t);
  }, [mood, buddy]);

  // Confetti burst for celebrations that happen while this stage is on screen.
  const initialCelebrate = useRef(celebrateKey);
  useEffect(() => {
    if (!celebrateKey || reduce || celebrateKey === initialCelebrate.current) return;
    const show = setTimeout(() => setConfetti(celebrateKey), 0);
    const hide = setTimeout(() => setConfetti(0), 3200);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [celebrateKey, reduce]);

  useEffect(() => () => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
  }, []);

  const pet = () => {
    if (!onSill) flashMood("happy", 2600);
    useUiStore.getState().touch();
    const id = Date.now();
    setHearts((h) => [...h.slice(-4), id]);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1600);
    if (prefs.soundEnabled) playPurr(prefs.chimeVolume * 0.8);
    say(onSill ? pick(["Mrrp… shh, studying.", "Purr… zz…"]) : mood === "sleeping" ? "Mrrp? Oh, hi!" : pick(["Purr…", "Mrrrow ♡", "Thank you!", "Hehe, that tickles."]), 2400);
  };

  const reactions = (placement: "desk" | "left" | "right") => (
    <>
      <AnimatePresence>
        {hearts.map((id, i) => (
          <motion.svg
            key={id}
            viewBox="0 0 24 24"
            className={cn(
              "pointer-events-none absolute fill-[#EE9C93]",
              placement === "desk" ? "left-[46%] top-[8%] w-[13%]" : "left-[36%] top-0 w-[28%]",
            )}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], y: -60, x: (i % 2 ? 1 : -1) * 18, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            aria-hidden="true"
          >
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.6 1.1 4.6 2.6l1 1.4 1-1.4C14 6.1 15.6 5 17.6 5 21 5 23.1 8.5 21.6 11.8 19.5 16.4 12 21 12 21z" />
          </motion.svg>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {bubble ? (
          <motion.div
            key={bubble.id}
            role="status"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={cn(
              "pointer-events-none absolute whitespace-nowrap rounded-2xl bg-raised px-3 py-1.5 text-[clamp(10px,1.4vw,13px)] font-medium text-ink shadow-soft",
              placement === "desk" && "bottom-[88%] left-[62%] origin-bottom-left rounded-bl-md",
              placement === "left" && "bottom-[96%] left-[58%] origin-bottom-left rounded-bl-md",
              placement === "right" && "bottom-[96%] right-[42%] origin-bottom-right rounded-br-md",
            )}
          >
            {bubble.text}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );

  if (artScene) {
    const { Scene, cat } = artScene;
    const placement = cat.left + cat.width / 2 > 60 ? "right" : "left";
    return (
      <div className={cn("relative aspect-[8/5] w-full overflow-hidden bg-[var(--scene-wall)]", rounded && "rounded-[32px] shadow-float", className)}>
        {/* cross-fade between scenes */}
        <AnimatePresence initial={false}>
          <motion.div
            key={artScene.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce || prefs.lowMotion ? 0 : 0.8 }}
          >
            <Scene />
          </motion.div>
        </AnimatePresence>

        {/* the cat in the picture: tap to pet */}
        <div
          className="absolute"
          style={{ left: `${cat.left}%`, top: `${cat.top}%`, width: `${cat.width}%`, height: `${cat.height}%` }}
        >
          <button
            type="button"
            onClick={pet}
            aria-label={`Pet ${prefs.catName}`}
            title={`Pet ${prefs.catName}`}
            className="block size-full cursor-pointer rounded-[40%] focus-visible:outline-offset-2"
          />
          {reactions(placement)}
        </div>

        {confetti ? <Confetti key={confetti} /> : null}
        {children}
      </div>
    );
  }

  return (
    <StudyScene
      scene={scene ?? prefs.scene}
      thunder={thunder}
      animate={!prefs.lowMotion}
      notebook={!buddy}
      emptySeat={!buddy}
      className={cn(rounded && "rounded-[32px] shadow-float", className)}
    >
      {/* Friends on the windowsill — fixed slots either side of the companion */}
      {friends && friends.length > 0 ? (
        <div className="pointer-events-none absolute inset-0">
          <AnimatePresence>
            {friends.slice(0, SILL_SLOTS.length).map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: f.status === "away" ? 0.6 : 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="pointer-events-auto absolute bottom-[39.6%] flex w-[6.4%] flex-col items-center"
                style={{ left: `${SILL_SLOTS[i]}%` }}
                title={`${f.name} · ${f.status === "focusing" ? "focusing" : f.status === "break" ? "on a break" : f.status === "away" ? "stepped away" : "here"}`}
              >
                <span className="mb-0.5 max-w-[180%] truncate whitespace-nowrap rounded-full bg-raised/90 px-1.5 py-px text-[clamp(8px,1vw,11px)] font-medium text-ink shadow-soft">
                  {f.name.split(" ")[0]}
                </span>
                <MiniCat avatar={f.avatar} sleepy={f.status === "away" || f.status === "break"} className="w-full drop-shadow-sm" />
              </motion.div>
            ))}
          </AnimatePresence>
          {friends.length > SILL_SLOTS.length ? (
            <span className="absolute bottom-[41%] left-[17.5%] rounded-full bg-raised/90 px-2 py-0.5 text-[11px] font-medium text-ink shadow-soft">
              +{friends.length - SILL_SLOTS.length}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* The companion: on the desk, or curled up on the windowsill while the student focuses */}
      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={onSill ? "sill" : "desk"}
        initial={{ opacity: 0, y: 8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.92 }}
        transition={{ duration: reduce ? 0 : 0.28 }}
        className={cn(
          "absolute",
          onSill ? "bottom-[38.8%] left-[43.5%] w-[12%]" : buddy ? "bottom-[20%] left-[41%] w-[27%]" : "bottom-[20%] left-[36.5%] w-[27%]",
        )}
      >
        {onSill ? (
          <CurledCat coat={COATS[prefs.catCoat] ?? COATS.ginger} name={prefs.catName} onPet={pet} still={prefs.lowMotion} />
        ) : (
          <Cat mood={mood} coat={COATS[prefs.catCoat] ?? COATS.ginger} name={prefs.catName} onPet={pet} />
        )}

        {reactions("desk")}
      </motion.div>
      </AnimatePresence>

      {/* The study buddy sits in front of everything on the desk */}
      {buddy ? <Student pose={pose} still={prefs.lowMotion} /> : null}

      {confetti ? <Confetti key={confetti} /> : null}
      {children}
    </StudyScene>
  );
}

const CONFETTI_COLORS = ["#A3B18A", "#E7A467", "#EE9C93", "#F6C67A", "#E8DCCB", "#7F9068"];

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((i) => {
        const left = (i * 37) % 100;
        const delay = (i % 7) * 0.08;
        const rotate = ((i * 53) % 360) - 180;
        return (
          <motion.span
            key={i}
            className="absolute top-0 block h-2.5 w-1.5 rounded-[2px]"
            style={{ left: `${left}%`, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
            initial={{ top: "-4%", opacity: 0, rotate: 0 }}
            animate={{ top: ["-4%", "104%"], opacity: [0, 1, 1, 0], rotate, x: [(i % 2 ? 1 : -1) * 6, (i % 3 ? -1 : 1) * 14] }}
            transition={{ duration: 2.4 + (i % 5) * 0.15, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
