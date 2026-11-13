"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import Link from "next/link";
import { RoomStage } from "@/components/scene/room-stage";
import { ThemeSoundsButton } from "@/components/scene/theme-sounds-button";
import { RoomArtButton } from "@/components/scene/room-art-picker";
import { TimerPanel } from "@/components/timer/timer-panel";
import { TodayStrip } from "@/components/statistics/today-strip";
import { FocusMode, enterFocusMode } from "@/components/timer/focus-mode";
import { useTimerStore } from "@/lib/timer/timer";
import { useCatMood, useStudyActivity } from "@/hooks/use-cat-mood";
import { usePreferences } from "@/lib/stores/preferences";
import { useUiStore } from "@/lib/stores/ui";
import { quoteOfTheDay } from "@/lib/quotes";
import { useNow } from "@/hooks/use-now";

function greeting(hour: number) {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Late night study";
}

export default function StudyRoomPage() {
  const mode = useTimerStore((s) => s.mode);
  const status = useTimerStore((s) => s.status);
  const mood = useCatMood(mode, status);
  const activity = useStudyActivity(mode, status);
  const catName = usePreferences((p) => p.catName);
  const showQuote = usePreferences((p) => p.showQuote);
  const scene = usePreferences((p) => p.scene);
  const roomArt = usePreferences((p) => p.roomArt);
  const hydrated = useUiStore((s) => s.hydrated);
  const now = useNow(60_000);
  const date = new Date(now);

  return (
    // On desktop, centre the content in the space between the nav (4rem) and the
    // music dock reserve (main's 7rem bottom padding) so tall screens don't leave
    // one big gap above the player.
    <div className="mx-auto flex max-w-6xl flex-col justify-center px-4 pt-2 sm:px-6 lg:min-h-[calc(100dvh-11rem)] lg:py-6 2xl:max-w-7xl">
      <div className="grid items-center gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-1"
          >
            <div>
              <p className="text-sm text-muted" suppressHydrationWarning>
                {hydrated ? greeting(date.getHours()) : "Welcome back"}
              </p>
              <h1 className="font-display text-[clamp(1.6rem,3.2vw,2.2rem)] leading-tight tracking-tight text-ink [font-variation-settings:'SOFT'_100]">
                {catName} saved you a seat by the window.
              </h1>
            </div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
            <RoomArtButton />
            <ThemeSoundsButton theme={roomArt === "classic" ? scene : roomArt} />
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 rounded-full bg-accent/30 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent/45"
            >
              <Users className="size-4" aria-hidden="true" /> Study with friends
            </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <RoomStage mood={mood} activity={activity} art />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="py-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pb-16"
        >
          <TimerPanel onFocusMode={enterFocusMode} />
        </motion.div>

        <div className="self-start">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <TodayStrip />
            {showQuote ? (
              <p className="max-w-xs px-3 font-display text-[15px] italic leading-snug text-muted sm:max-w-[15rem] sm:text-right" suppressHydrationWarning>
                “{quoteOfTheDay(date)}”
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <FocusMode />
    </div>
  );
}
