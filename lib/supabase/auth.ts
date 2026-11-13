"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import type { AvatarId, Profile } from "@/types";
import { getSupabase } from "./client";
import { AVATAR_IDS } from "@/lib/avatars";

/**
 * Name-only identity. There are no accounts: when someone first creates or
 * joins a room we quietly create an anonymous Supabase user for this browser.
 * That gives Row Level Security a real auth.uid() to protect rooms with,
 * while the visitor only ever types a name.
 */

export interface AuthUser {
  id: string;
}

interface AuthState {
  ready: boolean;
  user: AuthUser | null;
  profile: Profile | null;
  /** Remembered locally so people don't retype their name. */
  guestName: string;
  /** null = not chosen yet (the database picks a random cat). */
  guestAvatar: AvatarId | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (): AuthState => ({
      ready: false,
      user: null,
      profile: null,
      guestName: "",
      guestAvatar: null,
    }),
    {
      name: "sp-identity",
      version: 2,
      skipHydration: true,
      partialize: (s) => ({ guestName: s.guestName, guestAvatar: s.guestAvatar }),
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<AuthState>;
        return { guestName: p.guestName ?? "", guestAvatar: p.guestAvatar ?? null } as AuthState;
      },
    },
  ),
);

function toAuthUser(u: User | null | undefined): AuthUser | null {
  return u ? { id: u.id } : null;
}

export function cleanName(name: string) {
  return name.replace(/\s+/g, " ").trim().slice(0, 32);
}

function validAvatar(a: unknown): AvatarId {
  return (AVATAR_IDS as string[]).includes(a as string) ? (a as AvatarId) : "ginger";
}

/** The cat to show for "me", before and after an identity exists. */
export function myAvatar(s: Pick<AuthState, "profile" | "guestAvatar">): AvatarId {
  return s.profile?.avatar ?? s.guestAvatar ?? "ginger";
}

export async function loadProfile(userId: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from("profiles").select("id, display_name, avatar").eq("id", userId).maybeSingle();
  const profile = data ? ({ ...data, avatar: validAvatar(data.avatar) } as Profile) : null;
  if (useAuthStore.getState().user?.id === userId) {
    useAuthStore.setState(
      profile ? { profile, guestName: profile.display_name, guestAvatar: profile.avatar } : { profile },
    );
  }
  return profile;
}

let started = false;
/** The anonymous sign-in in progress, so concurrent callers share one identity. */
let pendingSignIn: Promise<AuthUser | null> | null = null;

/** Subscribes to the (anonymous) Supabase session once for the app's lifetime. */
export function startAuth() {
  if (started) return;
  started = true;
  const sb = getSupabase();
  if (!sb) {
    useAuthStore.setState({ ready: true, user: null, profile: null });
    return;
  }
  sb.auth.onAuthStateChange((_event, session) => {
    const user = toAuthUser(session?.user);
    const prev = useAuthStore.getState().user;
    useAuthStore.setState({
      ready: true,
      user,
      profile: user && prev?.id === user.id ? useAuthStore.getState().profile : null,
    });
    // Defer: Supabase recommends not awaiting other calls inside this callback.
    if (user) setTimeout(() => void loadProfile(user.id), 0);
  });
}

export const auth = {
  /**
   * Makes sure this browser has an identity (needed for rooms). Only a display
   * name is required; the cat can be chosen later in Settings.
   */
  async ensureIdentity(displayName: string, avatar?: AvatarId | null): Promise<AuthUser | null> {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase is not configured");
    const name = cleanName(displayName) || "Study buddy";
    const chosen = avatar ?? useAuthStore.getState().guestAvatar;
    useAuthStore.setState({ guestName: name, ...(chosen ? { guestAvatar: chosen } : {}) });

    const existing = useAuthStore.getState().user;
    if (existing) {
      const p = useAuthStore.getState().profile;
      if (!p || p.display_name !== name || (chosen && p.avatar !== chosen)) {
        await auth.updateProfile({ display_name: name, ...(chosen ? { avatar: chosen } : {}) });
      }
      return existing;
    }
    // Two callers can race here (e.g. the name dialog and the invite page's
    // auto-join, which fires as soon as the name is saved above). Creating two
    // anonymous users would put the same person in a room twice, so later
    // callers wait for the first sign-in and then take the "existing" path.
    if (pendingSignIn) {
      await pendingSignIn;
      return auth.ensureIdentity(name, chosen);
    }
    pendingSignIn = (async () => {
      const { data, error } = await sb.auth.signInAnonymously({
        // Without an avatar the database assigns a random cat.
        options: { data: chosen ? { display_name: name, avatar: chosen } : { display_name: name } },
      });
      if (error) throw error;
      const user = toAuthUser(data.user);
      useAuthStore.setState({ user, ready: true });
      if (user) await loadProfile(user.id);
      return user;
    })();
    try {
      return await pendingSignIn;
    } finally {
      pendingSignIn = null;
    }
  },

  /** Rename / re-cat yourself. Works before any room too (saved locally). */
  async updateProfile(patch: Partial<Pick<Profile, "display_name" | "avatar">>) {
    const clean: { display_name?: string; avatar?: AvatarId } = {};
    if (patch.display_name !== undefined) clean.display_name = cleanName(patch.display_name) || "Study buddy";
    if (patch.avatar !== undefined) clean.avatar = validAvatar(patch.avatar);
    useAuthStore.setState({
      ...(clean.display_name ? { guestName: clean.display_name } : {}),
      ...(clean.avatar ? { guestAvatar: clean.avatar } : {}),
    });

    const sb = getSupabase();
    const user = useAuthStore.getState().user;
    if (!sb || !user) return; // no identity yet — applied when they first join a room
    const { error } = await sb.from("profiles").update(clean).eq("id", user.id);
    if (error) throw error;
    await loadProfile(user.id);
  },
};
