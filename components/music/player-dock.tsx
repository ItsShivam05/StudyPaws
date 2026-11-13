"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMusicStore } from "@/lib/stores/music";
import { useAmbienceStore } from "@/lib/stores/ambience";
import { useUiStore } from "@/lib/stores/ui";
import { musicPlayer } from "@/lib/audio/music";
import { findTrack, trackDurationSeconds } from "@/lib/audio/tracks";
import { IconButton } from "@/components/ui/button";
import { Slider } from "@/components/ui/controls";
import { Popover } from "@/components/ui/popover";
import { Library } from "./library";
import { Vinyl } from "./vinyl";
import { cn } from "@/lib/utils";

export function PlayerDock() {
  const { trackId, playing, volume, muted, repeat, elapsed } = useMusicStore();
  const focusMode = useUiStore((s) => s.focusMode);
  const setMixerOpen = useUiStore((s) => s.setMixerOpen);
  const soundsOn = useAmbienceStore((s) => Object.values(s.enabled).filter(Boolean).length);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const track = findTrack(trackId);
  const progress = Math.min(1, elapsed / trackDurationSeconds(track));

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const nextRepeat = repeat === "all" ? "one" : repeat === "one" ? "off" : "all";
  const repeatLabel = repeat === "all" ? "Repeat all" : repeat === "one" ? "Repeat one" : "Repeat off";

  return (
    <motion.div
      initial={false}
      animate={{ y: focusMode ? 140 : 0, opacity: focusMode ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:pb-5"
      aria-hidden={focusMode || undefined}
    >
      <section
        aria-label="Music player"
        className="pointer-events-auto relative flex w-full max-w-3xl items-center gap-1 rounded-[28px] border border-line bg-raised/90 p-2 pr-3 shadow-float backdrop-blur-xl sm:gap-2"
      >
        {/* progress hairline */}
        <div className="absolute inset-x-6 top-0 h-[2px] overflow-hidden rounded-full" aria-hidden="true">
          <div
            className="h-full rounded-full bg-accent-strong/60 transition-[width] duration-500 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setLibraryOpen((o) => !o)}
            aria-label="Open music library"
            aria-expanded={libraryOpen}
            className="flex min-w-0 items-center gap-3 rounded-2xl p-1 pr-2 text-left transition-colors hover:bg-ink/[0.04]"
          >
            <Vinyl category={track.category} spinning={playing} className="size-11" />
            <span className="min-w-0 max-w-[7.5rem] sm:max-w-[13rem]">
              <span className="block truncate text-sm font-medium text-ink">{track.title}</span>
              <span className="block truncate text-xs text-muted">{track.artist}</span>
            </span>
          </button>
          <Popover open={libraryOpen} onClose={() => setLibraryOpen(false)} side="top" align="start" className="w-[min(92vw,340px)] p-0">
            <Library onPicked={() => setLibraryOpen(false)} />
          </Popover>
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <IconButton label="Previous track" size="sm" onClick={() => musicPlayer.prev()} className="max-sm:hidden">
            <SkipBack />
          </IconButton>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => musicPlayer.toggle()}
            aria-label={playing ? "Pause music" : "Play music"}
            className="flex size-11 items-center justify-center rounded-full bg-ink text-bg shadow-soft transition-colors hover:bg-ink/90"
          >
            {playing ? <Pause className="size-[18px]" fill="currentColor" /> : <Play className="ml-0.5 size-[18px]" fill="currentColor" />}
          </motion.button>
          <IconButton label="Next track" size="sm" onClick={() => musicPlayer.next()}>
            <SkipForward />
          </IconButton>
          <IconButton
            label={repeatLabel}
            size="sm"
            onClick={() => musicPlayer.setRepeat(nextRepeat)}
            className={cn("max-sm:hidden", repeat === "off" && "opacity-50")}
            active={repeat !== "off"}
          >
            <RepeatIcon />
          </IconButton>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-line-strong sm:block" aria-hidden="true" />

        <div className="hidden items-center gap-1 md:flex">
          <IconButton label={muted ? "Unmute music" : "Mute music"} size="sm" onClick={() => musicPlayer.setMuted(!muted)}>
            <VolumeIcon />
          </IconButton>
          <Slider label="Music volume" value={muted ? 0 : volume} onChange={(v) => musicPlayer.setVolume(v)} className="w-24" />
        </div>

        <IconButton label={muted ? "Unmute music" : "Mute music"} size="sm" onClick={() => musicPlayer.setMuted(!muted)} className="max-sm:hidden md:hidden">
          <VolumeIcon />
        </IconButton>

        <button
          type="button"
          onClick={() => setMixerOpen(true)}
          className={cn(
            "relative flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors",
            soundsOn ? "bg-accent/35 text-ink hover:bg-accent/45" : "text-ink/80 hover:bg-ink/[0.06]",
          )}
          aria-label={`Ambient sounds${soundsOn ? ` (${soundsOn} playing)` : ""}`}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span className="hidden lg:inline">Sounds</span>
          {soundsOn ? (
            <span className="tabular flex size-5 items-center justify-center rounded-full bg-accent-strong text-[11px] text-bg">
              {soundsOn}
            </span>
          ) : null}
        </button>

        <IconButton label="Music library" size="sm" onClick={() => setLibraryOpen((o) => !o)} className="max-sm:hidden">
          <ListMusic />
        </IconButton>
      </section>
    </motion.div>
  );
}
