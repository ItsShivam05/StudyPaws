"use client";

import { useState } from "react";
import type { AvatarId } from "@/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/controls";
import { CatAvatar } from "@/components/pet/cat-avatar";
import { AVATAR_IDS, COATS } from "@/lib/avatars";
import { auth, useAuthStore } from "@/lib/supabase/auth";
import { friendlyError } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AvatarPicker({ value, onChange }: { value: AvatarId; onChange: (a: AvatarId) => void }) {
  return (
    <div role="radiogroup" aria-label="Choose your cat" className="flex flex-wrap gap-2">
      {AVATAR_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          aria-label={COATS[id].label}
          title={COATS[id].label}
          onClick={() => onChange(id)}
          className={cn(
            "rounded-full p-0.5 transition-transform duration-200 hover:scale-105",
            value === id ? "ring-2 ring-accent-strong ring-offset-2 ring-offset-raised" : "opacity-80 hover:opacity-100",
          )}
        >
          <CatAvatar avatar={id} className="size-11" />
        </button>
      ))}
    </div>
  );
}

/** Asks for a display name only, then creates this browser's (anonymous) identity. */
export function IdentityDialog({
  open,
  onClose,
  onReady,
  actionLabel = "Continue",
}: {
  open: boolean;
  onClose: () => void;
  onReady: () => void;
  actionLabel?: string;
}) {
  const storedName = useAuthStore((s) => s.profile?.display_name ?? s.guestName);
  const [name, setName] = useState(storedName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Pick a name your friends will recognise.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await auth.ensureIdentity(name);
      onReady();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="What should we call you?"
      description="Friends in the room will see this name. A little cat comes with it — you can change both in Settings."
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field
          label="Your name"
          value={name}
          maxLength={32}
          autoFocus
          autoComplete="nickname"
          placeholder="e.g. Hana"
          onChange={(e) => setName(e.target.value)}
          error={error}
        />
        <Button type="submit" variant="primary" size="lg" loading={busy} className="self-end">
          {actionLabel}
        </Button>
      </form>
    </Dialog>
  );
}
