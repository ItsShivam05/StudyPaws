"use client";

import { AudioLines } from "lucide-react";
import type { MusicCategory } from "@/types";
import { useMusicStore } from "@/lib/stores/music";
import { musicPlayer } from "@/lib/audio/music";
import { CATEGORY_LABELS, TRACKS, trackDurationSeconds } from "@/lib/audio/tracks";
import { Slider } from "@/components/ui/controls";
import { cn, formatClock } from "@/lib/utils";

const CATEGORIES: (MusicCategory | "all")[] = ["all", "lofi", "chill", "piano", "ambient", "instrumental"];

export function Library({ onPicked }: { onPicked?: () => void }) {
  const { category, trackId, playing, volume, muted } = useMusicStore();
  const list = category === "all" ? TRACKS : TRACKS.filter((t) => t.category === category);

  return (
    <div className="flex max-h-[60vh] flex-col">
      <div className="px-4 pb-2 pt-4">
        <h2 className="font-display text-lg">Music</h2>
        <p className="text-xs text-muted">Original pieces, composed live in your browser.</p>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pb-3" role="radiogroup" aria-label="Music category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={category === c}
            onClick={() => musicPlayer.setCategory(c)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              category === c ? "bg-ink text-bg" : "bg-ink/[0.05] text-muted hover:text-ink",
            )}
          >
            {c === "all" ? "All" : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <ul className="thin-scroll flex-1 overflow-y-auto px-2 pb-2">
        {list.map((t) => {
          const current = t.id === trackId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  if (current) musicPlayer.toggle();
                  else {
                    musicPlayer.select(t.id);
                    if (!useMusicStore.getState().playing) musicPlayer.play();
                  }
                  onPicked?.();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  current ? "bg-accent/25" : "hover:bg-ink/[0.04]",
                )}
                aria-current={current || undefined}
              >
                <span className="flex size-5 items-center justify-center text-muted">
                  {current && playing ? <AudioLines className="size-4 text-accent-strong" aria-label="Playing" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {t.artist} · {CATEGORY_LABELS[t.category]}
                  </span>
                </span>
                <span className="tabular text-xs text-muted">{formatClock(trackDurationSeconds(t) * 1000)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3 border-t border-line px-4 py-3 md:hidden">
        <span className="text-xs text-muted">Volume</span>
        <Slider label="Music volume" value={muted ? 0 : volume} onChange={(v) => musicPlayer.setVolume(v)} />
      </div>
    </div>
  );
}
