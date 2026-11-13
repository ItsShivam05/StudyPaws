"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudLightning, CloudRain, Coffee, Flame, Trees, Waves, X, type LucideIcon } from "lucide-react";
import type { AmbienceId } from "@/types";
import { useAmbienceStore } from "@/lib/stores/ambience";
import { useUiStore } from "@/lib/stores/ui";
import { Slider } from "@/components/ui/controls";
import { Button, IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const SOUNDS: { id: AmbienceId; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "rain", label: "Rain", hint: "Soft rain on the window", icon: CloudRain },
  { id: "thunder", label: "Thunderstorm", hint: "Heavy rain, distant rumbles", icon: CloudLightning },
  { id: "fire", label: "Fireplace", hint: "Crackling logs", icon: Flame },
  { id: "forest", label: "Forest", hint: "Wind in the trees, birdsong", icon: Trees },
  { id: "ocean", label: "Ocean waves", hint: "Slow tide on the shore", icon: Waves },
  { id: "cafe", label: "Coffee shop", hint: "Murmurs and clinking cups", icon: Coffee },
];

export function toggleSound(id: AmbienceId) {
  const s = useAmbienceStore.getState();
  useAmbienceStore.setState({ enabled: { ...s.enabled, [id]: !s.enabled[id] } });
}

export function setSoundLevel(id: AmbienceId, level: number) {
  const s = useAmbienceStore.getState();
  useAmbienceStore.setState({
    levels: { ...s.levels, [id]: level },
    enabled: { ...s.enabled, [id]: level > 0 ? true : s.enabled[id] },
  });
}

/** Apply a whole mix at once (used by rooms to "match room sounds"). */
export function applyMix(mix: Partial<Record<AmbienceId, number>>) {
  const s = useAmbienceStore.getState();
  const enabled = { ...s.enabled };
  const levels = { ...s.levels };
  for (const { id } of SOUNDS) {
    const v = mix[id] ?? 0;
    enabled[id] = v > 0;
    if (v > 0) levels[id] = v;
  }
  useAmbienceStore.setState({ enabled, levels });
}

export function MixerPanel({ compact = false }: { compact?: boolean }) {
  const { levels, enabled, master } = useAmbienceStore();
  const anyOn = Object.values(enabled).some(Boolean);

  return (
    <div className="flex flex-col gap-2">
      <ul className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-1")}>
        {SOUNDS.map(({ id, label, hint, icon: Icon }) => {
          const on = enabled[id];
          return (
            <li
              key={id}
              className={cn(
                "group rounded-3xl p-3 transition-colors duration-300",
                on ? "bg-accent/25" : "bg-ink/[0.035] hover:bg-ink/[0.06]",
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggleSound(id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300",
                      on ? "bg-accent-strong text-bg" : "bg-raised text-muted",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{label}</span>
                    <span className="block truncate text-xs text-muted">{hint}</span>
                  </span>
                </button>
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full transition-colors",
                    on ? "bg-accent-strong" : "bg-ink/15",
                  )}
                  aria-hidden="true"
                />
              </div>
              <div className={cn("pl-[52px] pr-1 pt-1 transition-opacity", on ? "opacity-100" : "opacity-50")}>
                <Slider label={`${label} volume`} value={levels[id]} onChange={(v) => setSoundLevel(id, v)} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-center gap-3 px-1">
        <span className="shrink-0 text-xs font-medium text-muted">All sounds</span>
        <Slider label="Ambience master volume" value={master} onChange={(v) => useAmbienceStore.setState({ master: v })} />
        <Button
          variant="ghost"
          size="sm"
          disabled={!anyOn}
          onClick={() =>
            useAmbienceStore.setState({
              enabled: { rain: false, thunder: false, fire: false, forest: false, ocean: false, cafe: false },
            })
          }
        >
          Stop all
        </Button>
      </div>
    </div>
  );
}

export function MixerSheet() {
  const open = useUiStore((s) => s.mixerOpen);
  const setOpen = useUiStore((s) => s.setMixerOpen);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-50 bg-[#1d1916]/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Ambient sound mixer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className="thin-scroll fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-bg p-5 shadow-float sm:rounded-l-[32px]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl">Ambience</h2>
                <p className="mt-1 text-sm text-muted">Layer sounds to build your own little world.</p>
              </div>
              <IconButton ref={closeRef} label="Close mixer" size="sm" onClick={() => setOpen(false)}>
                <X />
              </IconButton>
            </div>
            <MixerPanel />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
