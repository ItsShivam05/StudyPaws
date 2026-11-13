export type TimerMode = "focus" | "short" | "long" | "custom";
export type TimerStatus = "idle" | "running" | "paused";

export type SceneId = "rainy" | "sunny" | "night" | "snowy";
/** Illustrated personal scenes (home + focus mode). Shared rooms always use a SceneId. */
export type ArtSceneId = "golden-hour" | "rainy-night" | "sunday-morning" | "midnight-journal" | "hillside-town" | "snowy-cabin";
export type RoomArt = ArtSceneId | "classic";
export type ThemePref = "light" | "dark" | "system";

export type AmbienceId = "rain" | "thunder" | "fire" | "forest" | "ocean" | "cafe";

export type MusicCategory = "lofi" | "chill" | "piano" | "ambient" | "instrumental";
export type RepeatMode = "off" | "all" | "one";

export type CatMood = "idle" | "sleeping" | "studying" | "happy" | "celebrating";

export type AvatarId = "ginger" | "grey" | "midnight" | "calico" | "cream" | "snow";

export interface StudySession {
  id: string;
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  completed: boolean;
  roomId?: string | null;
  synced?: boolean;
}

export interface Preferences {
  focusMinutes: number;
  shortMinutes: number;
  longMinutes: number;
  customMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  chimeVolume: number; // 0..1
  notificationsEnabled: boolean;
  theme: ThemePref;
  scene: SceneId;
  dailyGoalMinutes: number;
  catName: string;
  catCoat: AvatarId;
  showQuote: boolean;
  lowMotion: boolean;
  showBuddy: boolean;
  /** Which room you see at home: an illustrated scene, or the classic room with a window view. */
  roomArt: RoomArt;
}

export const DEFAULT_PREFERENCES: Preferences = {
  focusMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
  customMinutes: 45,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  chimeVolume: 0.6,
  notificationsEnabled: false,
  theme: "system",
  scene: "rainy",
  dailyGoalMinutes: 120,
  catName: "Mochi",
  catCoat: "ginger",
  showQuote: true,
  lowMotion: false,
  showBuddy: true,
  roomArt: "rainy-night",
};

export interface Profile {
  id: string;
  display_name: string;
  avatar: AvatarId;
}

/* ---------- Study rooms (mirrors the database rows) ---------- */

export type RoomTimerMode = "focus" | "short" | "long";

export interface StudyRoom {
  id: string;
  code: string;
  name: string;
  is_public: boolean;
  owner_id: string;
  max_members: number;
  scene: SceneId;
  ambience: Partial<Record<AmbienceId, number>>;
  timer_mode: RoomTimerMode;
  timer_status: TimerStatus;
  timer_duration_ms: number;
  timer_remaining_ms: number;
  timer_ends_at: string | null;
  focus_minutes: number;
  short_minutes: number;
  long_minutes: number;
  cycle_count: number;
  timer_updated_by: string | null;
  timer_updated_at: string;
  created_at: string;
  last_active_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  last_seen_at: string;
  profile: Profile | null;
}

export type RoomMessageKind = "message" | "reaction" | "event";

export interface RoomMessage {
  id: number;
  room_id: string;
  user_id: string | null;
  kind: RoomMessageKind;
  body: string;
  created_at: string;
}

export type PresenceStatus = "focusing" | "break" | "idle" | "away";

export interface PresenceState {
  user_id: string;
  display_name: string;
  avatar: AvatarId;
  status: PresenceStatus;
  online_at: string;
}

export interface PublicRoomSummary {
  id: string;
  code: string;
  name: string;
  scene: SceneId;
  member_count: number;
  last_active_at: string;
}
