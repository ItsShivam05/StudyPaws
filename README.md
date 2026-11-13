# 🐾 Study Paws

**A cozy virtual study room.** A cat keeps you company by the window, rain taps on the glass, lofi plays softly — and friends can join you to focus together in real time.

No sign-up. No ads. Just open it and start studying.

---

## ✨ Features

| | |
| --- | --- |
| 🐱 **Study room** | An illustrated, animated room with a companion cat that studies, naps and celebrates with you. Click the cat to pet it. |
| ⏱️ **Pomodoro timer** | Focus, short break, long break or custom. Stays accurate in background tabs and survives page reloads. |
| 🎵 **Music player** | Ten original lofi, piano and ambient tracks — generated live in the browser, so there are no audio files and no licensing issues. |
| 🌧️ **Ambience mixer** | Rain, thunderstorm, fireplace, forest, ocean waves and coffee shop, each with its own volume. |
| 👥 **Study rooms** | Create a public or invite-only room, share a link or 8-character code, and run a **shared timer** with friends. See who's focusing or on a break. |
| 📓 **Journal** | Today's focus time, completed sessions, streaks, a weekly chart, a daily goal and personal notes. |
| 🎨 **Personalise** | Light & dark themes, four window views, full-screen focus mode and reduced-motion support. |

> **No accounts.** Solo features work instantly. To create or join a room you just type a name — everything else is saved in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack, React Compiler) · React 19 · TypeScript |
| Styling | Tailwind CSS v4 · Framer Motion · Lucide icons |
| State | Zustand (persisted to `localStorage`) |
| Backend | [Supabase](https://supabase.com) — Postgres with Row Level Security, anonymous Auth, Realtime |
| Audio | Web Audio API (all music and sounds are synthesized in code) |
| Notifications | Sonner toasts · browser notifications |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20 or newer
- A free [Supabase](https://supabase.com) account *(only needed for study rooms)*

### 1. Install and run

```bash
git clone <your-repo-url>
cd study-chill-sessions
npm install
npm run dev
```

Open **http://localhost:3000**.

The timer, music, ambience, journal and settings all work straight away. **Study rooms need Supabase** — continue below to enable them.

### 2. Set up Supabase

1. **Create a project** at [supabase.com](https://supabase.com) → *New project*.
2. **Create the database.** Open *SQL Editor* → *New query*, paste the **contents** of
   [`supabase/migrations/20261110000000_study_paws.sql`](supabase/migrations/20261110000000_study_paws.sql), and click **Run**.
   You should see *"Success. No rows returned"* and seven new tables in the *Table Editor*.
   > Run it only once — running it again gives `relation "profiles" already exists`, which just means it's already done.
3. **Enable anonymous sign-ins.** *Authentication → Sign In / Providers →* turn on **Allow anonymous sign-ins**.
4. **Copy your keys** from *Project Settings → API Keys*: the **Project URL** and the **Publishable key**.

### 3. Add environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Restart `npm run dev`, open **/rooms**, and create a room. Open the invite link in an incognito window to test it with a second person.

> 🔒 The publishable key is **meant to be public** — your data is protected by Row Level Security. Never put the `service_role` / secret key in the app.

<details>
<summary><b>Prefer a local Supabase (Docker)?</b></summary>

```bash
npx supabase start -x studio,imgproxy,storage-api,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit
npx supabase status   # prints the local URL and publishable key
```

[`supabase/config.toml`](supabase/config.toml) already enables anonymous sign-ins. Put the printed URL and key in `.env.local`. Use `npx supabase db reset` to re-apply the migration from scratch.

</details>

---

## 🌐 Deployment

Study Paws works on any Next.js host. With **Vercel**:

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Add the two environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Click **Deploy**.

> Environment variables are baked in at build time — **redeploy** after changing them.

**Production tips**

- **Rate limits:** Supabase allows 30 new anonymous users per hour per IP by default. If a whole class joins from one Wi-Fi network, raise it under *Authentication → Rate Limits*.
- **Free-plan pausing:** free Supabase projects pause after about a week of inactivity. Restore them from the dashboard if rooms stop working.

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build (includes type-checking) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
app/                  Pages: / (study room), /rooms, /rooms/[code], /journal, /settings
components/
  ambience/           Ambience mixer
  layout/             Providers, navigation, account menu
  music/              Player dock, track library, vinyl
  pet/                The cat and avatars
  scene/              Illustrated room, window views, rain effects
  statistics/         Today strip, weekly chart
  study-room/         Live room UI (shared timer, participants, activity feed)
  timer/              Timer panel, ring, focus mode
  ui/                 Buttons, dialogs, popovers, controls
hooks/                React hooks (realtime room, cat mood, stats)
lib/
  audio/              Web Audio engine, tracks, ambience, chime
  stores/             Zustand stores
  supabase/           Supabase client, guest identity, cloud sync
  timer/              Personal timer logic
supabase/
  migrations/         Database schema, security rules, functions, realtime
types/                Shared TypeScript types
```

---

## ⚙️ How It Works

<details>
<summary><b>Accurate timer</b></summary>

The timer stores the moment a block **ends** (`endsAt`) instead of counting down, so `remaining = endsAt − now` is always correct — even in background tabs or after a reload. A Web Worker checks for completion, updates the tab title and plays the chime.

</details>

<details>
<summary><b>Shared room timer</b></summary>

The room's timer lives in the `study_rooms` table and only changes through the `room_timer()` database function, which uses the **database clock**. Each client measures its offset from the server time, so countdowns match across devices. When a block ends every client reports it, but the function is idempotent, so the room advances exactly once.

</details>

<details>
<summary><b>Presence</b></summary>

Each person broadcasts their name, cat and status (*focusing*, *on a break*, *here* or *stepped away*) on a Supabase Realtime Presence channel. Membership and "last seen" come from the `room_members` table.

</details>

<details>
<summary><b>Music & ambience</b></summary>

There are no audio files. Each track is a composition (chords, tempo, instruments) played by a scheduler in [`lib/audio/music.ts`](lib/audio/music.ts), using synthesized pianos, pads, bass and drums from [`instruments.ts`](lib/audio/instruments.ts). Every play is a slightly different take. Ambience layers filtered noise and scheduled events like thunder and birdsong. The audio engine lives at the app root, so music keeps playing as you navigate.

</details>

<details>
<summary><b>Stats</b></summary>

Focus sessions are saved in the browser first. Once you've joined a room, they're also synced to the `study_sessions` table. Ending a session early still counts if you focused for at least a minute. Streaks count consecutive days with any focus time.

</details>

---

## 🔐 Security

- Every table uses **Row Level Security** — people can only read and write their own data.
- **Private rooms** are invisible to non-members. The only way in is the invite code, checked by `join_room()` along with the member limit (12 by default).
- Rooms, membership and the shared timer change only through database functions that verify the caller.
- Messages are limited to 200 characters. System events ("Aiko started a focus session") can only be written by the database.
- Profiles (name + cat) are visible only to you and people who share a room with you.
- Each browser gets an invisible anonymous identity. Clearing site data starts fresh, but rooms can always be rejoined with their link.

---

## 🧯 Troubleshooting

| Problem | Fix |
| --- | --- |
| Rooms page says Supabase isn't set up | Check `.env.local` and restart the dev server (or redeploy) |
| "Anonymous sign-ins are disabled" | Enable them in *Authentication → Sign In / Providers* |
| `relation "study_rooms" does not exist` | Run the migration SQL in the Supabase SQL Editor |
| `relation "profiles" already exists` | The migration already ran — nothing to do |
| Others don't update live | Check that the last line of the migration (realtime publication) ran |
| Rooms suddenly stopped working | Your free Supabase project may be paused — restore it in the dashboard |

---

<p align="center">Made with ☕, 🌧️ and 🐾 for focused study sessions.</p>
