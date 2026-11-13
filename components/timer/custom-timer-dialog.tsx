"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/controls";
import { usePreferences } from "@/lib/stores/preferences";
import { timer } from "@/lib/timer/timer";
import { cn } from "@/lib/utils";

const PRESETS = [15, 30, 45, 50, 60, 90];

export function CustomTimerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const saved = usePreferences((p) => p.customMinutes);
  const [minutes, setMinutes] = useState(saved);

  return (
    <Dialog open={open} onClose={onClose} title="Custom timer" description="Choose any length for a focus block (1–240 minutes).">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutes(m)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              minutes === m ? "bg-ink text-bg" : "bg-ink/[0.05] text-ink hover:bg-ink/[0.09]",
            )}
          >
            {m} min
          </button>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-3xl bg-ink/[0.04] px-4 py-3">
        <span className="text-sm text-muted">Exact length</span>
        <Stepper label="Custom minutes" value={minutes} onChange={setMinutes} min={1} max={240} />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            timer.setCustomMinutes(minutes);
            onClose();
          }}
        >
          Set {minutes} minutes
        </Button>
      </div>
    </Dialog>
  );
}
