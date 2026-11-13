# Scene redesign — motion & themes (working plan)

Living document for the "make the study room feel alive" work. If a session
stops midway, start a new one with the prompt in **How to resume** below.

## Goal

Make the room feel like the cozy lofi references (warm lamp vs. cool night
outside, rain on glass, someone studying, depth) — with **original art only**.
Do **not** copy or trace the "Lofi Girl" character/artwork or any watermarked
reference image; we borrow the genre, not the pictures.

## Decisions (defaults — change here if the owner decides otherwise)

| Question | Decision |
| --- | --- |
| Character | Add an original **student** at the desk; the cat moves to the **windowsill** while you focus |
| Art approach | **Vector (SVG) + code-driven effects** (canvas rain, light, parallax). No raster art assets |
| First themes | Rainy Night City, Sunny Hillside Town, Snowy Cabin (Starry night kept as-is for now) |
| Music-reactive motion, auto time-of-day | **Later** (phase 5) |

### Theme ids (no database migration needed)

The DB (`study_rooms.scene` check constraint) and `SceneId` type allow only
`rainy | sunny | night | snowy`. We keep the ids and re-skin them:

| id | Theme name (UI label) |
| --- | --- |
| `rainy` | Rainy Night City |
| `sunny` | Sunny Hillside Town |
| `snowy` | Snowy Cabin |
| `night` | Starry Night (unchanged for now) |

Adding brand-new ids (e.g. `sakura`) requires: `types/index.ts` `SceneId`,
`lib/stores/preferences.ts` sanitize list, `components/scene/scene-picker.tsx`,
`app/rooms/page.tsx` swatches, and a **new migration** altering the
`study_rooms.scene` check constraint.

## Illustrated scenes (added 2026-11-12)

The owner shared reference images (warm lofi rooms) and didn't like the classic
cat + student, so six **original** illustrated scenes were made and the owner
asked for a way to choose between them. They borrow the mood only — two of the
references were the well-known Lofi Girl artwork and a watermarked LofiHeart
image, which we must not copy.

| id (`ArtSceneId`) | Scene | Cat |
| --- | --- | --- |
| `golden-hour` | Late sun, she sips tea | calico sitting on the desk |
| `rainy-night` | Rainy city window, typing on a laptop | ginger curled on the sill |
| `sunday-morning` | Reading in bed, sheer curtains | tuxedo curled at her feet |
| `midnight-journal` | POV desk from above, your hand writing | ginger by the lamp |
| `hillside-town` | Pastel town outside, writing with headphones | grey tabby on the sill |
| `snowy-cabin` | Blanket + cocoa by the fire | calico on her lap |

- Code: `components/scene/art/` — `parts.tsx` (shared side-profile `Head`, `SittingCat`, `CurledCat`, filters, grain, steam), one file per scene, `index.tsx` registry `ART_SCENES` (label, blurb, cat hotspot in %, theme sounds). Animations are `cx-*` classes in `app/globals.css` (stopped by `.low-motion` and inside `.cx-still` previews).
- Preference `roomArt: ArtSceneId | "classic"` (default `rainy-night`). Personal only: `RoomStage` gets `art` on the home page and in focus mode; shared rooms (`scene`/`friends` passed) always use the classic room, so **no migration**.
- Picker: `components/scene/room-art-picker.tsx` — `RoomArtPicker` (Settings → Appearance → Scene; "Classic room" reveals the window-view picker) and `RoomArtButton` ("Scene: …" popover in the home header).
- In an illustrated scene the cat is a tap target (pet → hearts, purr, speech bubble); mood lines and confetti still play. "Use theme sounds" uses the scene's own mix.
- Not yet: the characters don't react to the timer (the classic student does). That's the next step for these scenes — see Phase 2b below.

## Where the scene lives (current architecture)

| File | Role |
| --- | --- |
| `components/scene/study-scene.tsx` | The room: one SVG, `viewBox 0 0 800 500`, colours from CSS vars (`--scene-*`) |
| `components/scene/window-view.tsx` | What's outside the window per scene (sky, skyline, rain/snow/stars). Window glass rect = `WIN {x:208,y:58,w:304,h:234}` |
| `components/scene/room-stage.tsx` | HTML overlays on the scene: the cat, friends on the sill (`SILL_SLOTS`), speech bubbles, hearts, confetti |
| `components/pet/cat.tsx`, `cat-parts.tsx`, `mini-cat.tsx` | Cat artwork + moods (idle/sleeping/studying/happy/celebrating) |
| `hooks/use-cat-mood.ts` | Mood from timer state |
| `app/globals.css` | `--scene-*` palette (light + `.dark`), CSS keyframes (`anim-rain`, `anim-steam`, …) |
| `components/timer/focus-mode.tsx` | Full-screen view (uses `RoomStage`) |

Overlay positioning: overlays use **% of the scene box** (aspect 8:5). To
convert SVG coords: `left% = x/800*100`, `top% = y/500*100`.
Window glass: left 26%, top 11.6%, width 38%, height 46.8%. Desk top ≈ y 384 (76.8%).

### Rules that keep it working
- Server and client must render identical SVG: use the seeded `scatter()`
  helper / `mulberry32`, and **round** computed coordinates (hydration).
- Anything animated per-frame goes in **canvas or CSS**, not React state.
- Pause work when `document.hidden`; respect `prefers-reduced-motion` and the
  **low-motion** preference (phase 1).
- Verify every phase: `npx tsc --noEmit`, `npx eslint .`, `npm run build`,
  then look at screenshots (puppeteer-core + installed Chrome, light & dark).

## Phases & status

Legend: ☐ todo · ◐ in progress · ☑ done

### Phase 1 — Atmosphere (biggest visual win, no new character yet)
- ☑ **Rain on glass** — `components/scene/rain-glass.tsx`: canvas over the window glass, beads + drops that slide down leaving trails; only for `rainy` (heavier when thunder is on); DPR-aware; pauses when hidden / low motion
- ☑ **Rain shadows** — soft streaks moving down the lit patch on the wall/desk under the window (SVG, reuses rain layout)
- ☑ **Night contrast** — Rainy Night City sky deep navy, warm glowing city windows; room warmer; dark-mode palette less muddy
- ☑ **Light spill** — bigger warm lamp pool on desk + wall; dust motes floating in the lamp beam
- ☑ **Depth** — window view / room / foreground in separate groups with mouse parallax (CSS vars `--px/--py`, no React re-render) + very slow camera drift
- ☑ **Low-motion preference** — `Preferences.lowMotion` + Settings switch; adds `low-motion` class on `<html>` that stops scene animations and canvases
- ☑ Real-time wall clock hands

### Phase 2 — The student
- ☑ `components/scene/student.tsx`: original character at the desk (three-quarter back view, headphones, hoodie), SVG + Framer Motion
- ☑ States from the timer: focus → writing / page turns / gentle nod; break → stretch, sip tea, look outside; idle → chin on hand; complete → arms-up stretch
- ☑ Cat relocates to the windowsill during focus (curled, sleeping) and returns to the desk on breaks; sill 43.5–55.5% is kept free of friends' slots
- ☑ Setting: "Show study buddy" (student on/off)

### Phase 3 — Themes polish
- ☑ Sunny Hillside Town: rooftops on a hill (+ church tower, round trees), sunbeams through the window onto the desk, birds crossing, curtains swaying
- ☑ Snowy Cabin: frosted glass edges, layered pines + a lit neighbour cabin with chimney smoke, fireplace glow flicker on the walls, snow piling on the pane ledges
- ☑ Per-theme mood: "Use theme sounds" toggle on the home page (rainy → rain + lofi, sunny → forest/café + chill, snowy → fire + piano, night → forest/ocean + ambient)
- ☑ Smooth cross-fade when switching themes

### Phase 2b — Illustrated scenes react to the timer
- ☐ Pass focus / break / idle / done into each art scene: e.g. focus → writing/typing/reading loop, break → sip/stretch/look outside, done → arms-up + confetti, idle long → dozing (eyes closed)
- ☐ The cat changes too (sleeping during focus, awake and watching on breaks)
- ☐ Check each scene with "Reduce motion" on and in dark mode

### Phase 4 — Life details
- ☐ City alive: windows switching on/off, flickering neon sign, tiny car lights, blinking tower light
- ☐ Record player that spins while music plays; fairy lights twinkle; plant/curtain sway refinements
- ☐ Lightning flash lights up the whole room (not only the window)

### Phase 5 — Later
- ☐ Music-reactive motion (beat from `lib/audio/music.ts` bpm/step → CSS var pulse)
- ☐ Auto time-of-day theme variants
- ☐ More themes: Sakura Morning, Seaside Sunset (needs migration, see above)

## Status log

- 2026-11-11 — Plan written. Defaults chosen as above. Starting Phase 1.
- 2026-11-11 — **Phase 1 done.** tsc, eslint, build clean; screenshots checked (dark + light, zoomed window).
  What was added and where:
  - `components/scene/rain-glass.tsx` — canvas drops/beads/trails over the glass (rainy only; `heavy` when thunder is on; `animate=false` draws static beads).
  - `components/scene/window-view.tsx` — rainy sky now navy, rainy uses the lit night skyline (30 windows with halos), mist gradient; everything outside sits in `<g className="parallax-far">`; `scatter()` exported.
  - `components/scene/study-scene.tsx` — inner wrapper `anim-camera` (slow drift; overlays move with it); pointer parallax writes `--px/--py` on the box; `#lamp-pool` warm ellipse (opacity `--scene-lamp-pool`); dust motes; rain-shadow streaks in `#under-sill` clip (rainy only); desk items wrapped in `parallax-near`; `ClockHands` shows real time; new prop `animate`.
  - `app/globals.css` — warmer/less muddy `.dark` scene palette, `--scene-lamp-pool`, keyframes `camera-drift`, `mote`, `shadow-fall`, classes `.parallax-far/.parallax-near`, `.low-motion` overrides.
  - `Preferences.lowMotion` (types, sanitize, Settings → Appearance "Reduce motion", `<html class="low-motion">` toggled in `components/layout/providers.tsx`, `RoomStage` passes `animate={!prefs.lowMotion}`).
  - Theme labels renamed in `scene-picker.tsx` (+ rainy swatch in `app/rooms/page.tsx`).
  - Not yet visually checked: the "Reduce motion" toggle itself (logic only). Next up: **Phase 2 — the student**.
- 2026-11-12 — **Phase 2 done.** tsc, eslint, build clean; screenshots checked for every pose (dark) and on the home page idle + focusing (light + dark).
  - `components/scene/student.tsx` — `<Student pose still />`. Overlay SVG (scene viewBox) with a nested 800×520 drawing space; joints are `motion.g` with `transformBox: "view-box"` + px origins (`pivot(x, y)`), so rotations use exact shoulder/elbow/neck points. Pose table `POSES`; each joint has an outer group (springs to the pose) and an inner group (loops: nod, writing, breathing). Break routine: stretch → look outside ↔ sip tea. Page turn every 17 s while writing. `still`/reduced motion holds poses without loops.
  - `components/pet/curled-cat.tsx` — the companion asleep on the sill (still pettable).
  - `hooks/use-cat-mood.ts` — new `useStudyActivity(mode, status)` → `focus | break | idle` (timer only, ignores pet/celebrate overrides). Passed as `activity` to `RoomStage` from `app/page.tsx`, `focus-mode.tsx`, `room-view.tsx`.
  - `components/scene/room-stage.tsx` — derives the student pose; with the buddy on, the desk cat sits at left 41% (36.5% without) and swaps to the sill while focusing; nap lines; petting on the sill doesn't flash the mood.
  - `components/scene/study-scene.tsx` — prop `notebook` (hidden when the student brings their own).
  - `Preferences.showBuddy` (default true; types, sanitize, Settings → Appearance "Show study buddy").
  - Not yet visually checked: the low-motion (still) student, the "Show study buddy" switch itself, the student in a shared room with friends on the sill, and the Phase 1 "Reduce motion" toggle. Next up: **Phase 3 — themes polish**.
- 2026-11-12 — **Phase 3 done.** tsc, eslint, build clean; screenshots checked for sunny + snowy (light + dark, zoomed window), a frame mid cross-fade, and the theme-sounds toggle on the home page (on → off).
  - `components/scene/window-view.tsx` — `HillsideTown` (houses placed along a quadratic ridge with `quad()`, church at t=0.42 so the window bar doesn't hide it), `Bird` (`anim-birds` crossing + `anim-flap`), `SnowyWoods` (far treeline from `scatter`, neighbour cabin, framing pines), `Frost` (radial `#frost` per pane + `drift()` snow mounds with `anim-pile`, 4 min grow from 55%). `Pine` takes `fill`/`snow`.
  - `components/scene/scene-fx.tsx` (new) — per-theme room light in three depth slots: `WallFx` (rain shadows moved here; sunbeam shafts), `DeskFx` (sun patches on the desk top), `RoomFx` (fireplace glow from the left, two `anim-fire` layers); `SceneFxDefs` gradients.
  - `components/scene/study-scene.tsx` — cross-fade: state `{scene, prev}` updated during render, `prev` cleared after 950 ms; `fade(render, fadeOut)` renders one copy per visible theme (window view: new fades in over the old; see-through fx and the rain canvas also fade out). Off when `animate` is false. Curtains get `anim-curtain` on sunny.
  - `components/scene/theme-sounds-button.tsx` (new) — `THEME_SOUNDS` map, `playThemeSounds` (`applyMix` + `musicPlayer.select/play`, clears a library filter that would hide the track, toast), `stopThemeSounds`; button shows "Theme sounds on" (pressed) while exactly that mix + track is playing. In the home header (`app/page.tsx`).
  - `app/globals.css` — keyframes `scene-in/out`, `beam`, `bird-cross`, `flap`, `curtain-sway`, `fire-flicker`, `snow-pile`; birds hidden under prefers-reduced-motion.
  - Not yet visually checked: themes with "Reduce motion" on, the button in rooms/focus mode (only on the home page for now), and night-theme sounds by ear (in headless Chrome the toggle state, track and toast were checked, not the audio). Next up: **Phase 4 — life details**.
- 2026-11-12 — **Illustrated scenes + scene picker.** Six original scenes (concepts reviewed by the owner on a temporary `/concepts` page, since removed) are now choosable from the home "Scene" button and Settings; Classic keeps the old room. tsc, eslint, build clean; browser-tested: picker opens with live previews, switching cross-fades, petting shows the bubble beside the cat, Classic restores the old room, Settings shows the picker. Next up: **Phase 2b** (timer reactions in the illustrated scenes), then Phase 4.

## How to resume

Paste this into a new session:

> Continue the Study Paws scene redesign. Read `docs/SCENE_REDESIGN.md` first —
> it has the decisions, architecture notes, rules and the phase checklist.
> Pick up the first unchecked item, keep the doc's status log and checkboxes
> updated as you finish items, and verify with tsc, eslint, build and
> screenshots before marking anything done.
