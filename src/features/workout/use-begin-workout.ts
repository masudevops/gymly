import { router } from 'expo-router';

import { confirm } from '@/lib/confirm';

import type { TemplateSeed } from './model';
import { useWorkoutStore } from './store';

/** Starts a workout (empty, from a template or a program day), confirming before replacing one in progress. */
export function useBeginWorkout() {
  const start = useWorkoutStore((s) => s.start);
  return async (seed?: TemplateSeed) => {
    const active = useWorkoutStore.getState().active;
    if (active) {
      const replace = await confirm('Workout in progress', `Discard "${active.name}" and start a new one?`, 'Discard & start', true);
      if (!replace) return;
    }
    start(seed);
    router.push('/workout');
  };
}
