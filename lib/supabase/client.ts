"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

/** Browser Supabase client, or null when the project isn't configured yet. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

/** Turns Supabase / Postgres errors into short, friendly messages. */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = err as { message?: string; code?: string } | null;
  const msg = e?.message ?? "";
  if (msg.includes("room_not_found")) return "We couldn't find a room with that code.";
  if (msg.includes("room_full")) return "That room is full right now.";
  if (msg.includes("not_member")) return "You're not a member of this room.";
  if (msg.includes("too_many_rooms")) return "You've reached the limit of rooms you can own. Delete one first.";
  if (msg.includes("not_authenticated")) return "Please enter your name first.";
  if (msg.includes("invalid_name")) return "Room names need 1–48 characters.";
  if (msg.includes("Anonymous sign-ins are disabled"))
    return "Rooms need anonymous sign-ins enabled in Supabase (see README).";
  if (msg.includes("rate limit")) return "Too many attempts. Please wait a moment.";
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) return "You seem to be offline.";
  return msg && msg.length < 140 ? msg : fallback;
}
