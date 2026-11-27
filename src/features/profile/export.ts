// Workout export: one CSV row per set, weights in the user's unit. Pure, so it's unit-tested.
// Download is web only for now; native would need expo-file-system + expo-sharing.
import { kgToDisplay, type Unit } from '@/lib/fitness';

export type ExportWorkout = {
  name: string;
  started_at: string;
  finished_at: string;
  workout_exercises: {
    position: number;
    exercise: { name: string } | null;
    workout_sets: { position: number; weight_kg: number | null; reps: number | null; duration_seconds: number | null; rpe: number | null; is_warmup: boolean }[];
  }[];
};

const cell = (v: string | number | null | undefined) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function workoutsToCsv(workouts: ExportWorkout[], unit: Unit): string {
  const header = ['date', 'workout', 'exercise', 'set', 'warmup', `weight_${unit}`, 'reps', 'duration_seconds', 'rpe'];
  const rows = [header.join(',')];
  for (const w of workouts) {
    const exercises = [...w.workout_exercises].sort((a, b) => a.position - b.position);
    for (const we of exercises) {
      const sets = [...we.workout_sets].sort((a, b) => a.position - b.position);
      sets.forEach((s, i) => {
        const weight = s.weight_kg == null ? null : Math.round(kgToDisplay(s.weight_kg, unit) * 100) / 100;
        rows.push(
          [w.started_at, w.name, we.exercise?.name ?? '', i + 1, s.is_warmup ? 'yes' : 'no', weight, s.reps, s.duration_seconds, s.rpe].map(cell).join(','),
        );
      });
    }
  }
  return rows.join('\n') + '\n';
}

/** Triggers a browser download of a text file. */
export function downloadFile(filename: string, contents: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
