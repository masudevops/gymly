import { create } from 'zustand';

import type { ExerciseRef } from '@/features/workout/model';

/**
 * Hands picked exercises back to whichever screen opened the picker
 * (active workout or template editor). Not persisted.
 */
type PickerState = {
  onPick: ((refs: ExerciseRef[]) => void) | null;
  open: (onPick: (refs: ExerciseRef[]) => void) => void;
  clear: () => void;
};

export const useExercisePicker = create<PickerState>((set) => ({
  onPick: null,
  open: (onPick) => set({ onPick }),
  clear: () => set({ onPick: null }),
}));
