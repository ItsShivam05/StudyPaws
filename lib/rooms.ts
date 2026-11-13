"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { PublicRoomSummary, RoomMember, RoomMessage, SceneId, StudyRoom, AmbienceId } from "@/types";

export const ROOM_CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

export function normalizeCode(input: string) {
  // Accept a pasted invite link or a code with spaces/dashes.
  const fromUrl = input.match(/rooms\/([A-Za-z0-9]{8})/);
  const raw = fromUrl ? fromUrl[1] : input;
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
}

export function inviteUrl(code: string) {
  return `${window.location.origin}/rooms/${code}`;
}

function sb() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

export async function createRoom(name: string, isPublic: boolean, scene: SceneId) {
  const { data, error } = await sb()
    .rpc("create_room", { p_name: name.trim(), p_is_public: isPublic, p_scene: scene })
    .single();
  if (error) throw error;
  return data as StudyRoom;
}

export async function joinRoom(code: string) {
  const { data, error } = await sb().rpc("join_room", { p_code: code }).single();
  if (error) throw error;
  return data as StudyRoom;
}

export async function leaveRoom(roomId: string) {
  const { error } = await sb().rpc("leave_room", { p_room: roomId });
  if (error) throw error;
}

export async function deleteRoom(roomId: string) {
  const { error } = await sb().from("study_rooms").delete().eq("id", roomId);
  if (error) throw error;
}

export type TimerAction = "start" | "pause" | "reset" | "complete" | "skip" | "set_mode";

export async function roomTimer(roomId: string, action: TimerAction, mode?: "focus" | "short" | "long") {
  const { data, error } = await sb()
    .rpc("room_timer", { p_room: roomId, p_action: action, p_mode: mode ?? null })
    .single();
  if (error) throw error;
  return data as StudyRoom;
}

export async function updateRoomSettings(
  roomId: string,
  patch: Partial<
    Pick<StudyRoom, "name" | "is_public" | "scene" | "focus_minutes" | "short_minutes" | "long_minutes"> & {
      ambience: Partial<Record<AmbienceId, number>>;
    }
  >,
) {
  const { error } = await sb().from("study_rooms").update(patch).eq("id", roomId);
  if (error) throw error;
}

export async function fetchRoom(roomId: string) {
  const { data, error } = await sb().from("study_rooms").select("*").eq("id", roomId).maybeSingle();
  if (error) throw error;
  return data as StudyRoom | null;
}

export async function fetchMembers(roomId: string): Promise<RoomMember[]> {
  const client = sb();
  const { data, error } = await client
    .from("room_members")
    .select("room_id, user_id, role, joined_at, last_seen_at")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  const ids = (data ?? []).map((m) => m.user_id as string);
  const { data: profiles } = ids.length
    ? await client.from("profiles").select("id, display_name, avatar").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  return (data ?? []).map((m) => ({ ...(m as Omit<RoomMember, "profile">), profile: byId.get(m.user_id) ?? null })) as RoomMember[];
}

export async function fetchMessages(roomId: string, limit = 60): Promise<RoomMessage[]> {
  const { data, error } = await sb()
    .from("room_messages")
    .select("id, room_id, user_id, kind, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as RoomMessage[]).reverse();
}

export async function postMessage(roomId: string, userId: string, kind: "message" | "reaction", body: string) {
  const text = body.trim().slice(0, 200);
  if (!text) return;
  const { error } = await sb().from("room_messages").insert({ room_id: roomId, user_id: userId, kind, body: text });
  if (error) throw error;
}

export async function touchMembership(roomId: string, userId: string) {
  await sb().from("room_members").update({ last_seen_at: new Date().toISOString() }).eq("room_id", roomId).eq("user_id", userId);
}

export async function listPublicRooms(): Promise<PublicRoomSummary[]> {
  const { data, error } = await sb().rpc("list_public_rooms");
  if (error) throw error;
  return (data ?? []) as PublicRoomSummary[];
}

export interface MyRoom {
  role: "owner" | "member";
  room: Pick<StudyRoom, "id" | "code" | "name" | "is_public" | "scene" | "last_active_at">;
}

export async function listMyRooms(userId: string): Promise<MyRoom[]> {
  const { data, error } = await sb()
    .from("room_members")
    .select("role, study_rooms(id, code, name, is_public, scene, last_active_at)")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as unknown as { role: MyRoom["role"]; study_rooms: MyRoom["room"] | null }[])
    .filter((r) => r.study_rooms)
    .map((r) => ({ role: r.role, room: r.study_rooms! }))
    .sort((a, b) => b.room.last_active_at.localeCompare(a.room.last_active_at));
}

/** Estimates (server clock − local clock) so every client counts down to the same instant. */
export async function measureClockOffset() {
  const client = sb();
  const samples: number[] = [];
  for (let i = 0; i < 2; i++) {
    const t0 = Date.now();
    const { data, error } = await client.rpc("server_now");
    const t1 = Date.now();
    if (error || !data) continue;
    samples.push(new Date(data as string).getTime() - (t0 + t1) / 2);
  }
  if (!samples.length) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}
