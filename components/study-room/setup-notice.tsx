import { Database } from "lucide-react";

/** Shown instead of multiplayer UI when Supabase env vars are missing. */
export function SetupNotice() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[32px] bg-surface/70 px-8 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/30 text-ink">
        <Database className="size-5" aria-hidden="true" />
      </span>
      <h2 className="font-display text-2xl">Study rooms need a backend</h2>
      <p className="text-sm leading-relaxed text-muted">
        Group rooms sync in real time through Supabase. Add your project URL and publishable key to{" "}
        <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[13px]">.env.local</code>, run the SQL migration in{" "}
        <code className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[13px]">supabase/migrations</code>, and restart the dev
        server. The README walks through it in about five minutes.
      </p>
      <p className="text-sm text-muted">Everything else — the timer, music, sounds and stats — works without it.</p>
    </div>
  );
}
