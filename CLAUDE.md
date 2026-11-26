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

## Conventions
- UI primitives in `src/components/ui.tsx` (Screen, AppText variants, Card, Button). Use tokens/classes, never raw hex in screens.
- Store weights in **kg**; convert with `src/lib/fitness.ts` at the UI edge.
- Every table gets RLS; built-in exercises/programs are readable by all, user rows only by their owner.
- Original design and content: don't copy Strong/Hevy/Pacer UI or named commercial programs.
- Big tap targets (min 52px buttons), dark-first, works one-handed mid-set.
- Repo is **public**: never commit `.env*` (only `.env.example`); only `EXPO_PUBLIC_*` publishable values in the app.

## Don't touch without asking
- `app.json` identifiers (bundle id `com.gymly.app`), Supabase migrations once applied, CI workflow, `vercel.json`.
