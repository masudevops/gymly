#!/usr/bin/env node
// Production web build (used by Vercel). Expo only inlines EXPO_PUBLIC_* variables, but the
// Supabase <-> Vercel integration provides its own names (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY, ...).
// Map the first available PUBLIC value onto the names the app reads, then run `expo export`.
// Only the project URL and the publishable/anon key are ever mapped: never the service role key.
const { spawnSync } = require('node:child_process');

const env = process.env;
const pick = (...names) => names.map((n) => [n, env[n]]).find(([, v]) => v && v.trim());

const url = pick('EXPO_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
const key = pick(
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
);

if (!url || !key) {
  console.error(
    'build-web: missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
      '(or connect the Supabase Vercel integration).',
  );
  process.exit(1);
}

// Guard against bundling a secret into a public web app.
if (/^sb_secret_/.test(key[1]) || /service_role/.test(key[1])) {
  console.error(`build-web: refusing to bundle ${key[0]}: it looks like a secret key.`);
  process.exit(1);
}

console.log(`build-web: using ${url[0]} and ${key[0]}`);
const result = spawnSync('npx', ['expo', 'export', '--platform', 'web'], {
  stdio: 'inherit',
  env: { ...env, EXPO_PUBLIC_SUPABASE_URL: url[1], EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key[1] },
});
process.exit(result.status ?? 1);
