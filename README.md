# Gymly

A premium workout tracker: log training, follow programs and watch your strength grow. One Expo codebase ships to the web first, then iOS and Android.

## Stack
- **Expo SDK 58** + **Expo Router** (React Native, TypeScript), web output as a single-page app
- **NativeWind 4** (Tailwind 3.4) with design tokens in `src/theme/tokens.js`
- **Supabase** (Postgres + row-level security, Auth) for data, developed locally with the Supabase CLI
- TanStack Query for server data; the active workout is stored on the device so it survives bad gym signal
- Jest (`jest-expo`) for tests, GitHub Actions for CI, Vercel for the web build

## Getting started
```bash
npm install
cp .env.example .env.local      # fill in values from `npx supabase status`
npm run web                     # or: npm run ios / npm run android
```

Local database (needs a Docker runtime, e.g. Colima):
```bash
colima start
npx supabase start
npx supabase status             # shows the local URL and anon key
```

## Scripts
| Command | What it does |
|---|---|
| `npm run web` / `ios` / `android` | Start the dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (`expo lint`) |
| `npm test` | Jest unit tests |
| `npx expo export --platform web` | Production web build to `dist/` |

## Project layout
```
src/app/          routes (Expo Router); (tabs)/ holds the main tab screens
src/components/   shared UI (ui.tsx: Screen, AppText, Card, Button)
src/lib/          logic and helpers (fitness.ts: units, e1RM, volume)
src/theme/        design tokens
supabase/         local Supabase config, migrations and seed data
```

## Roadmap
- **Phase 0** ✅ Project setup, design system, navigation, CI
- **Phase 1** Auth & onboarding, exercise library, workout logging, templates, history
- **Phase 2** Progress & stats: PRs, charts, body weight, streaks
- **Phase 3** Programs: multi-week plans and today's workout
- **Phase 4** Polish, web deploy, hosted Supabase
- Later: iOS/Android store releases, Apple/Google sign-in, HealthKit/Google Fit, nutrition, premium tier
