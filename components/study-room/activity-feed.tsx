"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { RoomMessage } from "@/types";
import { postMessage } from "@/lib/rooms";
import { friendlyError } from "@/lib/supabase/client";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REACTIONS = ["Keep going!", "You got this!", "Nice work!", "Stretch break?", "Proud of us"];
const COOLDOWN_MS = 1500;

/** Client-side courtesy throttle (the database also limits message length). */
function throttled(last: { current: number }) {
  const now = Date.now();
  if (now - last.current < COOLDOWN_MS) return true;
  last.current = now;
  return false;
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ActivityFeed({
  roomId,
  meId,
  messages,
  names,
}: {
  roomId: string;
  meId: string | null;
  messages: RoomMessage[];
  names: Map<string, string>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const lastSent = useRef(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async (kind: "message" | "reaction", body: string) => {
    if (!meId || !body.trim()) return;
    if (throttled(lastSent)) {
      toast("Easy there — one note at a time.");
      return;
    }
    setSending(true);
    try {
      await postMessage(roomId, meId, kind, body);
      if (kind === "message") setText("");
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="activity-title" className="flex flex-col">
      <h2 id="activity-title" className="mb-3 font-display text-xl">
        Room notes
      </h2>

      <ol
        ref={listRef}
        className="thin-scroll flex max-h-80 min-h-40 flex-col gap-2 overflow-y-auto rounded-3xl bg-ink/[0.03] p-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <li className="m-auto text-sm text-muted">Quiet so far. Send a little encouragement.</li>
        ) : null}
        {messages.map((m) => {
          const mine = m.user_id === meId;
          const who = m.user_id ? names.get(m.user_id) ?? "Someone" : "";
          if (m.kind === "event") {
            return (
              <li key={m.id} className="px-2 py-0.5 text-center text-xs text-muted">
                {m.body} <span className="opacity-60">· {clock(m.created_at)}</span>
              </li>
            );
          }
          return (
            <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <span className="mb-0.5 px-2 text-[11px] text-muted">
                {mine ? "You" : who} · {clock(m.created_at)}
              </span>
              <span
                className={cn(
                  "max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm",
                  m.kind === "reaction"
                    ? "bg-accent/40 font-medium text-ink"
                    : mine
                      ? "rounded-br-md bg-ink text-bg"
                      : "rounded-bl-md bg-raised text-ink shadow-soft",
                )}
              >
                {m.body}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Quick reactions">
        {REACTIONS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={sending}
            onClick={() => void send("reaction", r)}
            className="rounded-full bg-accent/20 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-accent/40 active:scale-95 disabled:opacity-50"
          >
            {r}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send("message", text);
        }}
      >
        <label htmlFor="room-message" className="sr-only">
          Message the room
        </label>
        <input
          id="room-message"
          value={text}
          maxLength={140}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a short note…"
          autoComplete="off"
          className="h-11 flex-1 rounded-full border border-line-strong bg-raised/70 px-4 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/60 focus:border-accent-strong focus:ring-4 focus:ring-accent/25"
        />
        <IconButton label="Send message" type="submit" disabled={!text.trim() || sending} className="bg-ink text-bg hover:bg-ink/90 hover:text-bg">
          <Send />
        </IconButton>
      </form>
    </section>
  );
}
