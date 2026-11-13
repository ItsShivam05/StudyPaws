"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster, toast } from "sonner";
import { startAuth } from "@/lib/supabase/auth";
import { startSync } from "@/lib/supabase/sync";
import { createTicker } from "@/lib/audio/ticker";
import { onTimerEvent, timer, useTimerStore, remainingOf, MODE_LABELS, isFocusMode } from "@/lib/timer/timer";
import { usePreferences } from "@/lib/stores/preferences";
import { useUiStore } from "@/lib/stores/ui";
import { useAmbienceStore, effectiveLevels } from "@/lib/stores/ambience";
import { ambienceEngine } from "@/lib/audio/ambience";
import { playChime } from "@/lib/audio/chime";
import { formatClock } from "@/lib/utils";
import { useMusicStore } from "@/lib/stores/music";
import { useStatsStore } from "@/lib/stores/stats";
import { useNotesStore } from "@/lib/stores/notes";
import { useAuthStore } from "@/lib/supabase/auth";

/** Restore persisted stores after mount so server and client render the same first frame. */
function rehydrateStores() {
  if (useUiStore.getState().hydrated) return;
  for (const store of [usePreferences, useTimerStore, useMusicStore, useAmbienceStore, useStatsStore, useNotesStore, useAuthStore]) {
    void store.persist.rehydrate();
  }
  useUiStore.setState({ hydrated: true });
}

const BASE_TITLE = "Study Paws";

function applyTheme(theme: "light" | "dark" | "system") {
  const dark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function notify(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/icon.svg", tag: "study-paws-timer" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}

export function Providers({ children }: { children: ReactNode }) {
  // Auth, cloud sync and the background timer ticker — once per app lifetime.
  useEffect(() => {
    rehydrateStores();
    // Preferences and the timer are saved separately (and another tab may have
    // saved an older timer), so make an idle timer match the current settings.
    timer.syncDurations();
    startAuth();
    startSync();
    timer.tick();
    const stop = createTicker(250, () => {
      timer.tick();
      const s = useTimerStore.getState();
      document.title =
        s.status === "running"
          ? `${formatClock(remainingOf(s))} · ${MODE_LABELS[s.mode]} — ${BASE_TITLE}`
          : BASE_TITLE;
    });
    const onVisible = () => timer.tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Session transitions: chime, notification, toast, cat celebration.
  useEffect(
    () =>
      onTimerEvent((e) => {
        if (e.type !== "complete") return;
        const prefs = usePreferences.getState();
        const focus = isFocusMode(e.mode);
        if (focus) useUiStore.getState().celebrate();
        if (e.stale) return;
        if (prefs.soundEnabled) playChime(prefs.chimeVolume, focus ? "focus-done" : "break-done");
        const title = focus ? "Focus session complete" : "Break's over";
        const body = focus
          ? `${prefs.catName} is proud of you. Time for a ${e.next === "long" ? "long" : "short"} break.`
          : "Ready for another focus session?";
        if (prefs.notificationsEnabled && document.hidden) notify(title, body);
        toast(title, { description: body });
      }),
    [],
  );

  // Theme: follow preference and the OS setting when on "system".
  const theme = usePreferences((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Settings → Reduce motion: freeze scene animations app-wide.
  const lowMotion = usePreferences((s) => s.lowMotion);
  useEffect(() => {
    document.documentElement.classList.toggle("low-motion", lowMotion);
  }, [lowMotion]);

  // Durations changed in settings → refresh an idle timer.
  useEffect(
    () =>
      usePreferences.subscribe((s, prev) => {
        if (
          s.focusMinutes !== prev.focusMinutes ||
          s.shortMinutes !== prev.shortMinutes ||
          s.longMinutes !== prev.longMinutes ||
          s.customMinutes !== prev.customMinutes
        ) {
          timer.syncDurations();
        }
      }),
    [],
  );

  // Ambience mixer → audio engine (only creates audio after a user gesture).
  useEffect(
    () =>
      useAmbienceStore.subscribe((s) => {
        const any = Object.values(s.enabled).some(Boolean);
        ambienceEngine.apply(effectiveLevels(s), s.master, any);
      }),
    [],
  );

  // Track activity so the cat can doze off when you wander away.
  useEffect(() => {
    let last = 0;
    const touch = () => {
      const now = Date.now();
      if (now - last > 5000) {
        last = now;
        useUiStore.getState().touch();
      }
    };
    window.addEventListener("pointermove", touch, { passive: true });
    window.addEventListener("keydown", touch);
    window.addEventListener("pointerdown", touch);
    return () => {
      window.removeEventListener("pointermove", touch);
      window.removeEventListener("keydown", touch);
      window.removeEventListener("pointerdown", touch);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster
        position="top-center"
        offset={72}
        toastOptions={{
          className: "!rounded-2xl !border-line !bg-raised !text-ink !shadow-float !font-sans",
          descriptionClassName: "!text-muted",
        }}
      />
    </MotionConfig>
  );
}
