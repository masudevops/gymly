@AGENTS.md

# Gymly

Premium workout tracker. One Expo codebase: web first (single-page app on Vercel), then iOS/Android via EAS. Started from scratch Nov 2026; the old Next.js/Prisma scaffold was deleted. Free for now (design the data model so a premium tier can be added later).

**v1 scope:** workout logging (exercise library, sets/reps/weight, templates, rest timer, history), progress & stats (PRs via estimated 1RM, charts, body weight, streaks), programs (multi-week plans). Nutrition, AI coach, social and store releases are roadmap items.

## Stack
- Expo SDK 58, Expo Router (routes in `src/app/`), React 19, RN 0.88, TypeScript 6. **AGENTS.md applies: check the SDK 58 docs, don't trust memory for Expo APIs.** Install packages with `npx expo install`.
- NativeWind 4 + Tailwind **3.4** (not v4; NativeWind 4 doesn't support it). Colors/fonts in `src/theme/tokens.js`, used by both classes and JS.
- Supabase (local via `npx supabase`, needs Colima running). TanStack Query; active workout persisted on device.
- Tests: Jest (`jest-expo`). CI: `.github/workflows/ci.yml` (typecheck, lint, test, web build).

## Commands
- `npm run web` | `npm run typecheck` | `npm run lint` | `npm test` | `npx expo export --platform web`
- `npx supabase start | status | migration new <name>`. **Ask first:** `supabase db reset`, `db push`, `link`.

## Architecture (Phase 1)
- Auth gating via `Stack.Protected` in `src/app/_layout.tsx`: signed out → sign-in/up; no `onboarded_at` → onboarding; else app.
- Active workout = pure model (`features/workout/model.ts`, unit-tested) + zustand store persisted to AsyncStorage. Finish moves it to `pendingSaves`; `usePendingSaveSync` pushes via the `save_workout` RPC (idempotent on the client-generated workout id), so offline workouts are never lost or duplicated.
- DB functions: `save_workout`, `save_template`, `last_sets_for_exercises` (security invoker, RLS applies), `delete_account` (security definer). Regenerate types after schema changes: `npx supabase gen types typescript --local > src/lib/database.types.ts`.
- Env: `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (Claude can't read/write `.env.local`; the user fills it). On Vercel, `scripts/build-web.js` maps the Supabase integration's public vars onto these names and refuses secret keys.

## Stats (Phase 2)
- Stats are computed in Postgres (`exercise_history`, `personal_records`, `workout_prs`, `weekly_muscle_sets`, `training_days`), all security invoker. Day/week grouping takes the client's IANA timezone (`lib/dates.ts userTimeZone()`); weeks start Monday.
- `public.e1rm()` must stay in sync with `estimateOneRepMax` in `lib/fitness.ts` (Epley, 1–12 reps).
- All stats queries use `['stats', ...]` keys; saving/deleting a workout invalidates `['stats']`.
- Charts: `components/charts.tsx` (react-native-svg). Keep SVG ids unique (`useId`) because web ids are global.
- React Compiler lint: no `Date.now()`/`new Date()` reads in render bodies that must stay pure; capture once (e.g. `useState(() => Date.now())`).

## Programs (Phase 3)
- Built-in programs + their days/exercises live in migration `..._builtin_programs.sql` (JSON spec; idempotent on slug; unknown exercise names abort). Reference data goes in migrations, not `seed.sql` (seed only runs locally).
- Progress is session-based: `active_program()` derives next day = sessions_done % days_per_week. One active enrollment per user (partial unique index); `start_program` abandons the current one.
- Program sessions are normal workouts with `enrollment_id`/`program_day_id`; `save_workout` only links to the caller's own active enrollment and completes it after the final session.
- Start any workout via `useBeginWorkout()` (handles the "discard in-progress workout?" confirm).

## Deploy & ops
- Hosted DB is linked (`supabase/.temp`). This CLI version targets **local** by default: use `--remote` (`db push --remote --dry-run` first; `db query --remote --read-only` for checks). Never print keys from `supabase status`/`projects api-keys`.
- The CLI may assume agent mode (JSON output, no prompts); the user can pass `--agent no` in their own terminal.
- Vercel env comes from the Supabase integration (Production only). A failed production build keeps the last good deploy live.
- Icons are rendered from `assets/brand/gymly-mark.svg`; regenerate PNGs when the mark changes.

## Gotchas
- Don't run the dev server with `CI=1` (no file watching; you'll test stale code). Use `npx expo start --web`.
- Web: `<input>` has an intrinsic ~20ch width; inputs in flex rows need `min-w-0 basis-0`.
- The `workout` screen must not auto-redirect when there's no active workout: Finish clears it, and a redirect raced the navigation to the summary. Finish uses `router.dismissTo('/')` then `push` (so Back from the summary lands on the tabs).
- NativeWind needs `darkMode: 'class'` (set) or its web runtime throws.
- `Alert` is a no-op on web; use `lib/confirm.ts`.
- Web keeps previous stack screens mounted (hidden). In Playwright tests, target `input[...]:visible` or load the page directly.
- Background dev servers die after their time limit; restart with a long timeout and check `curl localhost:8081` before browser tests.

## Conventions
- UI primitives in `src/components/ui.tsx` (Screen, AppText variants, Card, Button). Use tokens/classes, never raw hex in screens.
- Store weights in **kg**; convert with `src/lib/fitness.ts` at the UI edge.
- Every table gets RLS; built-in exercises/programs are readable by all, user rows only by their owner.
- Original design and content: don't copy Strong/Hevy/Pacer UI or named commercial programs.
- Big tap targets (min 52px buttons), dark-first, works one-handed mid-set.
- Repo is **public**: never commit `.env*` (only `.env.example`); only `EXPO_PUBLIC_*` publishable values in the app.

## Don't touch without asking
- `app.json` identifiers (bundle id `com.gymly.app`), Supabase migrations once applied, CI workflow, `vercel.json`.
