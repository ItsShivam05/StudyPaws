"use client";

import { useState, type ReactNode } from "react";
import { Bell, Monitor, Moon, Sun, Volume2 } from "lucide-react";
import { toast } from "sonner";
import type { AvatarId } from "@/types";
import { usePreferences } from "@/lib/stores/preferences";
import { useUiStore } from "@/lib/stores/ui";
import { auth, useAuthStore, myAvatar } from "@/lib/supabase/auth";
import { friendlyError } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { playChime } from "@/lib/audio/chime";
import { Segmented, Slider, Stepper, Switch, Field } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { RoomArtPicker } from "@/components/scene/room-art-picker";
import { AvatarPicker } from "@/components/study-room/identity-dialog";
import { cn } from "@/lib/utils";

function Section({ id, title, description, children }: { id?: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 grid gap-4 border-t border-line py-10 md:grid-cols-[260px_1fr] md:gap-12">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <div className="text-[15px]">{label}</div>
        {hint ? <div className="mt-0.5 text-[13px] text-muted">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const p = usePreferences();
  const hydrated = useUiStore((s) => s.hydrated);
  const profileName = useAuthStore((s) => s.profile?.display_name ?? s.guestName);

  const toggleNotifications = async (on: boolean) => {
    if (!on) {
      p.set({ notificationsEnabled: false });
      return;
    }
    if (typeof Notification === "undefined") {
      toast.error("This browser doesn't support notifications.");
      return;
    }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") {
      p.set({ notificationsEnabled: true });
      toast("Notifications on", { description: "We'll nudge you when a session ends while you're in another tab." });
    } else {
      toast.error("Notifications are blocked for this site. You can allow them in your browser settings.");
    }
  };

  return (
    <div className={cn("mx-auto max-w-4xl px-4 py-8 transition-opacity duration-500 sm:px-6 sm:py-10", hydrated ? "opacity-100" : "opacity-0")}>
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight [font-variation-settings:'SOFT'_100]">
        Settings
      </h1>
      <p className="mt-1 text-[15px] text-muted">Make the room yours. Changes save automatically.</p>

      <div className="mt-8">
        <Section title="Timer" description="Classic Pomodoro is 25 / 5 / 15. Tune it to your rhythm.">
          <Row label="Focus">
            <Stepper label="Focus minutes" value={p.focusMinutes} min={1} max={180} onChange={(v) => p.set({ focusMinutes: v })} />
          </Row>
          <Row label="Short break">
            <Stepper label="Short break minutes" value={p.shortMinutes} min={1} max={60} onChange={(v) => p.set({ shortMinutes: v })} />
          </Row>
          <Row label="Long break">
            <Stepper label="Long break minutes" value={p.longMinutes} min={1} max={90} onChange={(v) => p.set({ longMinutes: v })} />
          </Row>
          <Row label="Long break after" hint="Focus sessions per round">
            <Stepper label="Sessions before a long break" suffix="" value={p.longBreakInterval} min={2} max={8} onChange={(v) => p.set({ longBreakInterval: v })} />
          </Row>
          <Switch checked={p.autoStartBreaks} onChange={(v) => p.set({ autoStartBreaks: v })} label="Auto-start breaks" description="Roll straight into a break when focus ends." />
          <Switch checked={p.autoStartFocus} onChange={(v) => p.set({ autoStartFocus: v })} label="Auto-start focus" description="Begin the next focus session when a break ends." />
        </Section>

        <Section title="Sound & alerts">
          <Switch checked={p.soundEnabled} onChange={(v) => p.set({ soundEnabled: v })} label="Session chime" description="A soft bell when a session or break ends." />
          <Row label="Chime volume">
            <div className="flex w-48 items-center gap-2">
              <Slider label="Chime volume" value={p.chimeVolume} onChange={(v) => p.set({ chimeVolume: v })} disabled={!p.soundEnabled} />
              <Button size="sm" variant="ghost" disabled={!p.soundEnabled} onClick={() => playChime(p.chimeVolume)} aria-label="Play test chime">
                <Volume2 className="size-4" aria-hidden="true" /> Test
              </Button>
            </div>
          </Row>
          <Switch
            checked={p.notificationsEnabled}
            onChange={(v) => void toggleNotifications(v)}
            label={
              <span className="flex items-center gap-2">
                <Bell className="size-4 text-muted" aria-hidden="true" /> Browser notifications
              </span>
            }
            description="Only when Study Paws is in a background tab."
          />
        </Section>

        <Section title="Appearance">
          <Row label="Theme">
            <Segmented
              label="Theme"
              layoutId="theme"
              size="sm"
              value={p.theme}
              onChange={(v) => p.set({ theme: v })}
              options={[
                { value: "light", label: <span className="flex items-center gap-1.5"><Sun className="size-3.5" />Light</span> },
                { value: "dark", label: <span className="flex items-center gap-1.5"><Moon className="size-3.5" />Dark</span> },
                { value: "system", label: <span className="flex items-center gap-1.5"><Monitor className="size-3.5" />Auto</span> },
              ]}
            />
          </Row>
          <div className="py-3">
            <div className="mb-1 text-[15px]">Scene</div>
            <p className="mb-3 text-sm text-muted">The room you study in at home and in focus mode. Shared study rooms keep the room’s own view.</p>
            <RoomArtPicker />
          </div>
          <Switch checked={p.showQuote} onChange={(v) => p.set({ showQuote: v })} label="Daily quote" description="A small encouragement under the room." />
          <Switch
            checked={p.showBuddy}
            onChange={(v) => p.set({ showBuddy: v })}
            label="Show study buddy"
            description="Classic room only: a student at the desk who writes, stretches and sips tea along with your timer."
          />
          <Switch
            checked={p.lowMotion}
            onChange={(v) => p.set({ lowMotion: v })}
            label="Reduce motion"
            description="Calms the room: no rain on the glass, drifting camera or parallax. Saves battery too."
          />
        </Section>

        <Section title="Your companion" description="Every study room needs a resident cat.">
          <CompanionSettings key={p.catName} name={p.catName} coat={p.catCoat} onChange={(patch) => p.set(patch)} />
        </Section>

        {isSupabaseConfigured ? (
          <Section id="you" title="You" description="How friends see you in study rooms.">
            <YouSettings key={profileName ?? "none"} />
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function CompanionSettings({
  name,
  coat,
  onChange,
}: {
  name: string;
  coat: AvatarId;
  onChange: (patch: { catName?: string; catCoat?: AvatarId }) => void;
}) {
  const [draft, setDraft] = useState(name);
  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Name"
        value={draft}
        maxLength={20}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => (draft.trim() ? onChange({ catName: draft }) : setDraft(name))}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-muted">Coat</span>
        <AvatarPicker value={coat} onChange={(c) => onChange({ catCoat: c })} />
      </div>
    </div>
  );
}

/** Your name and cat as friends see them in rooms. No account — saved in this browser. */
function YouSettings() {
  const storedName = useAuthStore((st) => st.profile?.display_name ?? st.guestName);
  const avatar = useAuthStore((st) => myAvatar(st));
  const [name, setName] = useState(storedName);
  const [saving, setSaving] = useState(false);

  const save = async (patch: { display_name?: string; avatar?: AvatarId }) => {
    setSaving(true);
    try {
      await auth.updateProfile(patch);
      toast(patch.avatar ? "Cat updated" : "Name saved");
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) void save({ display_name: name });
        }}
      >
        <Field
          label="Your name"
          placeholder="e.g. Hana"
          value={name}
          maxLength={32}
          autoComplete="nickname"
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="soft" loading={saving} disabled={!name.trim() || name.trim() === storedName} className="h-11">
          Save
        </Button>
      </form>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium text-muted">Your cat in rooms</span>
        <AvatarPicker value={avatar} onChange={(a) => void save({ avatar: a })} />
      </div>
      <p className="text-xs leading-relaxed text-muted">
        There&apos;s no account to sign up for — your name, stats and rooms are kept in this browser. Clearing your
        browser data starts you fresh.
      </p>
    </div>
  );
}
